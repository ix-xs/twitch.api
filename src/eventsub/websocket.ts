import { TwitchApiError, TwitchEventSubError, TwitchNetworkError, TwitchTimeoutError } from "../errors.js";
import type { RequestOptions } from "../http/rest.js";
import { backoff, BoundedMap, Emitter, sleep, unref } from "../util.js";
import { type Entry, EventSubListener } from "./listener.js";
import type { EventSubSubscription, EventSubTransportInput } from "./types/index.js";

/** The part of a WebSocket the listener relies on. The global `WebSocket` and the `ws` package both fit. */
export interface WebSocketLike {
  /** Called when the connection opens. */
  onopen: ((event: never) => void) | null;
  /** Called for each message. `data` is the text of the frame. */
  onmessage: ((event: { data: unknown }) => void) | null;
  /** Called when the connection closes, with the close code and reason. */
  onclose: ((event: { code?: number; reason?: string }) => void) | null;
  /** Called when the connection fails. */
  onerror: ((event: never) => void) | null;
  /** Closes the connection. */
  close(code?: number, reason?: string): void;
}

/** A WebSocket class: `new WebSocket(url)`. */
export type WebSocketConstructor = new (url: string) => WebSocketLike;

/** Options of `twitch.eventsub.websocket()`. */
export interface EventSubWebSocketOptions {
  /**
   * User whose token creates the subscriptions. Optional when a single user
   * is registered or when the client is a `twitch.as(userId)` view.
   */
  user?: string;
  /**
   * Seconds without any message after which Twitch sends a keepalive, 10 to
   * 600. A lower value detects a dead connection sooner. Twitch defaults to 10.
   */
  keepalive?: number;
  /** WebSocket class to use. Defaults to the global `WebSocket`. */
  webSocket?: WebSocketConstructor;
  /** EventSub WebSocket URL. Point it at the Twitch CLI for local testing. */
  url?: string;
}

/** What the listener needs from the rest of the client. Internal. */
export interface SubscriptionBackend {
  /** Creates a subscription and resolves with it. */
  create(
    params: { type: string; version: string; condition: Record<string, string>; transport: EventSubTransportInput },
    options?: RequestOptions,
  ): Promise<EventSubSubscription>;
  /** Deletes a subscription, with the kind of token that created it. */
  remove(id: string, auth: "user" | "app", options?: RequestOptions): Promise<void>;
}

/** How subscriptions relate to sessions. WebSocket and conduit shards differ only here. Internal. */
export interface SessionStrategy {
  /** Largest number of subscriptions one socket carries. */
  capacity: number;
  /** Largest number of sockets. */
  maxSockets: number;
  /** Whether subscriptions outlive the socket (conduit) or die with it (plain WebSocket). */
  persistent: boolean;
  /** Kind of token the subscriptions are managed with. */
  auth: "user" | "app";
  /** Request options for subscription calls. */
  options: RequestOptions;
  /** Transport to subscribe with, for a given session. */
  transport(sessionId: string): EventSubTransportInput;
  /** Runs once a session is established, before subscriptions are created. */
  onSession?(sessionId: string): Promise<void>;
}

interface SocketEvents {
  connect: [sessionId: string];
  disconnect: [info: { code: number | undefined; reason: string | undefined; willReconnect: boolean }];
}

interface Frame {
  metadata: {
    message_id: string;
    message_type: "session_welcome" | "session_keepalive" | "notification" | "session_reconnect" | "revocation";
    message_timestamp: string;
  };
  payload: {
    session?: { id: string; keepalive_timeout_seconds: number | null; reconnect_url: string | null };
    subscription?: EventSubSubscription;
    event?: unknown;
    /** Batched types such as `drop.entitlement.grant` use the plural. */
    events?: unknown;
  };
}

const DEFAULT_URL = "wss://eventsub.wss.twitch.tv/ws";
/** Extra time granted on top of the keepalive window before a connection is declared dead. */
const KEEPALIVE_GRACE = 5000;
const SUBSCRIBE_BATCH = 20;
/** How many times a subscription is attempted on one session before it is given up. */
const SUBSCRIBE_ATTEMPTS = 6;

/** One socket and the subscriptions that live on it. */
class Connection {
  readonly entries = new Set<Entry>();
  sessionId: string | undefined;
  /** Set once the session is bound and its waiting subscriptions were picked up. */
  ready = false;
  #socket: WebSocketLike | undefined;
  #pending: WebSocketLike | undefined;
  #watchdog: ReturnType<typeof setTimeout> | undefined;
  #retry: ReturnType<typeof setTimeout> | undefined;
  #keepaliveMs = 10_000;
  #attempts = 0;
  #closed = false;
  #opened = false;
  readonly #owner: EventSubWebSocket;

  constructor(owner: EventSubWebSocket) {
    this.#owner = owner;
  }

  /** Opens the socket unless that already happened. */
  ensureOpen(): void {
    if (this.#opened || this.#closed) return;
    this.#opened = true;
    this.#open(this.#owner.url, false);
  }

  /** Closes for good. */
  close(): void {
    this.#closed = true;
    this.sessionId = undefined;
    this.ready = false;
    clearTimeout(this.#watchdog);
    clearTimeout(this.#retry);
    for (const socket of [this.#socket, this.#pending]) if (socket) this.#release(socket);
    this.#socket = this.#pending = undefined;
  }

  #open(url: string, handover: boolean): void {
    let socket: WebSocketLike;
    try {
      socket = new this.#owner.WebSocket(url);
    } catch (error) {
      this.#owner.report(new TwitchEventSubError(`Could not open the EventSub WebSocket: ${(error as Error).message}`, { cause: error }));
      this.#scheduleReconnect();
      return;
    }
    if (handover) this.#pending = socket;
    else this.#socket = socket;
    socket.onmessage = (event) => this.#message(socket, event.data);
    socket.onclose = (event) => this.#lost(socket, event?.code, event?.reason);
    socket.onerror = () => {};
    // The welcome message must arrive quickly: treat silence as a failed connection.
    if (!handover) this.#arm(15_000);
  }

  #release(socket: WebSocketLike): void {
    socket.onmessage = socket.onclose = socket.onerror = socket.onopen = null;
    try {
      socket.close();
    } catch {
      // Already closed.
    }
  }

  #arm(ms = this.#keepaliveMs + KEEPALIVE_GRACE): void {
    clearTimeout(this.#watchdog);
    this.#watchdog = unref(
      setTimeout(() => {
        const socket = this.#socket;
        if (socket) this.#lost(socket, undefined, "keepalive timeout");
      }, ms),
    );
  }

  #message(socket: WebSocketLike, data: unknown): void {
    let frame: Frame;
    try {
      frame = JSON.parse(typeof data === "string" ? data : String(data)) as Frame;
    } catch {
      return;
    }
    const { metadata, payload } = frame;
    switch (metadata?.message_type) {
      case "session_welcome": {
        const session = payload.session!;
        this.#keepaliveMs = (session.keepalive_timeout_seconds ?? 10) * 1000;
        this.#attempts = 0;
        if (socket === this.#pending) {
          // Handover requested by Twitch: the new socket inherits every subscription.
          const old = this.#socket;
          this.#socket = socket;
          this.#pending = undefined;
          this.sessionId = session.id;
          if (old) this.#release(old);
          this.#arm();
          this.#owner.handedOver(this, session.id);
          return;
        }
        this.sessionId = session.id;
        this.#arm();
        this.#owner.established(this, session.id);
        return;
      }
      case "session_keepalive":
        if (socket === this.#socket) this.#arm();
        return;
      case "notification":
        if (socket === this.#socket) this.#arm();
        if (payload.subscription) this.#owner.notify(metadata, payload.subscription, payload.event ?? payload.events);
        return;
      case "session_reconnect":
        if (payload.session?.reconnect_url && !this.#pending) this.#open(payload.session.reconnect_url, true);
        return;
      case "revocation":
        if (socket === this.#socket) this.#arm();
        if (payload.subscription) this.#owner.revoke(this, payload.subscription);
        return;
    }
  }

  #lost(socket: WebSocketLike, code: number | undefined, reason: string | undefined): void {
    if (this.#closed) return;
    if (socket === this.#pending) {
      // The replacement socket failed: stay on the current one until it closes.
      this.#pending = undefined;
      this.#release(socket);
      return;
    }
    if (socket !== this.#socket) return;
    clearTimeout(this.#watchdog);
    this.#release(socket);
    if (this.#pending) this.#release(this.#pending);
    this.#socket = this.#pending = undefined;
    this.sessionId = undefined;
    this.ready = false;
    const willReconnect = this.entries.size > 0;
    this.#owner.dropped(this, { code, reason, willReconnect });
    if (willReconnect) this.#scheduleReconnect();
    else this.#opened = false;
  }

  #scheduleReconnect(): void {
    if (this.#closed) return;
    const delay = backoff(this.#attempts++, 500, 30_000);
    // Not unref'd on purpose: a listener waiting to reconnect is work in progress,
    // and the process must stay up for it. close() clears the timer.
    this.#retry = setTimeout(() => {
      if (!this.#closed) this.#open(this.#owner.url, false);
    }, delay);
  }
}

/**
 * Receives EventSub events over WebSocket. It connects when you add the
 * first handler, keeps the connection alive, follows Twitch's reconnect
 * requests without losing events, and after a real disconnection reconnects
 * and subscribes again by itself. Past 300 subscriptions it opens more
 * connections, up to the 3 Twitch allows.
 *
 * @example
 * const events = twitch.eventsub.websocket();
 *
 * events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
 *   console.log(`${event.chatter_user_name}: ${event.message.text}`);
 * });
 * events.onError(console.error);
 */
export class EventSubWebSocket extends EventSubListener {
  /** @internal */
  readonly url: string;
  /** @internal */
  readonly WebSocket: WebSocketConstructor;
  readonly #backend: SubscriptionBackend;
  readonly #strategy: SessionStrategy;
  readonly #connections: Connection[] = [];
  readonly #where = new Map<Entry, Connection>();
  readonly #seen = new BoundedMap<string, true>(1000);
  readonly #lifecycle = new Emitter<SocketEvents>();

  /** @internal */
  constructor(backend: SubscriptionBackend, strategy: SessionStrategy, options: EventSubWebSocketOptions = {}) {
    super();
    const WebSocketClass = options.webSocket ?? (globalThis as { WebSocket?: WebSocketConstructor }).WebSocket;
    if (!WebSocketClass) {
      throw new TwitchEventSubError(
        "This runtime has no global WebSocket. Pass one with the `webSocket` option (for example the `ws` package).",
      );
    }
    this.WebSocket = WebSocketClass;
    const url = new URL(options.url ?? DEFAULT_URL);
    if (options.keepalive !== undefined) url.searchParams.set("keepalive_timeout_seconds", String(options.keepalive));
    this.url = url.toString();
    this.#backend = backend;
    this.#strategy = strategy;
  }

  /** IDs of the sessions currently established. Empty while disconnected. */
  get sessionIds(): string[] {
    return this.#connections.flatMap((connection) => (connection.sessionId ? [connection.sessionId] : []));
  }

  /** Whether at least one session is established. */
  get connected(): boolean {
    return this.sessionIds.length > 0;
  }

  /** Called each time a session is established, including after a reconnection. */
  onConnect(listener: (sessionId: string) => unknown): () => void {
    return this.#lifecycle.on("connect", (sessionId) => this.#guard(() => listener(sessionId)));
  }

  /** Called when a connection drops. `willReconnect` tells whether a new attempt follows. */
  onDisconnect(
    listener: (info: { code: number | undefined; reason: string | undefined; willReconnect: boolean }) => unknown,
  ): () => void {
    return this.#lifecycle.on("disconnect", (info) => this.#guard(() => listener(info)));
  }

  /** Runs a lifecycle listener. Whatever it throws or rejects with goes to the error listeners. */
  #guard(run: () => unknown): void {
    try {
      const result = run();
      if (result && typeof (result as PromiseLike<unknown>).then === "function") {
        (result as PromiseLike<unknown>).then(undefined, (error) => this.fail(error));
      }
    } catch (error) {
      this.fail(error);
    }
  }

  /** Closes every connection and forgets every subscription. Twitch disables them on its side. */
  close(): void {
    for (const connection of this.#connections) connection.close();
    this.#connections.length = 0;
    this.#where.clear();
    for (const entry of [...this.entries.values()]) this.forget(entry);
  }

  protected override async attach(entry: Entry): Promise<void> {
    let connection = this.#connections.find((candidate) => candidate.entries.size < this.#strategy.capacity);
    if (!connection) {
      if (this.#connections.length >= this.#strategy.maxSockets) {
        throw new TwitchEventSubError(
          `Subscription limit reached: ${this.#strategy.maxSockets} connections of ${this.#strategy.capacity} subscriptions.`,
        );
      }
      connection = new Connection(this);
      this.#connections.push(connection);
    }
    connection.entries.add(entry);
    this.#where.set(entry, connection);
    // Until the session is ready, established() picks the entry up with the others.
    if (connection.ready && connection.sessionId) await this.#subscribe(entry, connection, connection.sessionId);
    else connection.ensureOpen();
  }

  protected override async detach(entry: Entry): Promise<void> {
    const connection = this.#where.get(entry);
    this.#where.delete(entry);
    if (!connection) return;
    connection.entries.delete(entry);
    const subscription = entry.subscription;
    const alive = connection.sessionId !== undefined;
    if (connection.entries.size === 0) {
      connection.close();
      this.#connections.splice(this.#connections.indexOf(connection), 1);
    }
    if (subscription && (alive || this.#strategy.persistent)) {
      await this.#backend.remove(subscription.id, this.#strategy.auth, this.#strategy.options).catch((error) => {
        if (!(error instanceof TwitchApiError) || error.status !== 404) throw error;
      });
    }
  }

  /**
   * Creates the subscription of `entry` on a session. Temporary failures are
   * retried a few times with backoff. Throws when Twitch refuses the
   * subscription, or keeps failing.
   */
  async #subscribe(entry: Entry, connection: Connection, sessionId: string): Promise<void> {
    // False once the entry was stopped, or once the session died (the next one starts over).
    const current = () => this.#where.get(entry) === connection && connection.sessionId === sessionId;
    for (let attempt = 0; current(); attempt++) {
      try {
        const subscription = await this.#backend.create(
          {
            type: entry.type,
            version: entry.version,
            condition: entry.condition,
            transport: this.#strategy.transport(sessionId),
          },
          this.#strategy.options,
        );
        if (this.#where.get(entry) !== connection) {
          // Stopped while the request was in flight: do not leave the subscription behind.
          await this.#backend.remove(subscription.id, this.#strategy.auth, this.#strategy.options).catch(() => {});
          return;
        }
        this.accept(entry, subscription);
        return;
      } catch (error) {
        if (!current()) return;
        // 409: the subscription already exists, which is what we want on a persistent transport.
        if (error instanceof TwitchApiError && error.status === 409 && this.#strategy.persistent) {
          this.accept(entry);
          return;
        }
        // Twitch saying the session is gone means the socket is about to drop: the next session subscribes again.
        if (error instanceof TwitchApiError && error.status === 400 && /session/i.test(error.message)) return;
        // A limit Twitch will not lift (too many subscriptions, cost) also answers 429: do not wait on it forever.
        if (!isTemporary(error) || attempt + 1 >= SUBSCRIBE_ATTEMPTS) {
          connection.entries.delete(entry);
          this.#where.delete(entry);
          // Only when the session is ready: before that, established() is still handing entries out.
          if (connection.ready) this.#retire(connection);
          throw error;
        }
        await sleep(backoff(attempt, 500, 30_000));
      }
    }
  }

  /** @internal A fresh session is up: bind it, then create its subscriptions. */
  established(connection: Connection, sessionId: string): void {
    void (async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          await this.#strategy.onSession?.(sessionId);
          break;
        } catch (error) {
          if (connection.sessionId !== sessionId) return;
          const problem = new TwitchEventSubError(`Could not bind the WebSocket session: ${(error as Error).message}`, {
            cause: error,
          });
          if (!isTemporary(error)) {
            // Waiting will not fix this: the subscriptions still pending fail with the reason.
            const waiting = [...connection.entries].filter((entry) => !entry.settled);
            if (waiting.length === 0) this.fail(problem);
            for (const entry of waiting) {
              connection.entries.delete(entry);
              this.#where.delete(entry);
              this.reject(entry, problem);
            }
            this.#retire(connection);
            return;
          }
          if (attempt === 0) this.fail(problem);
          await sleep(backoff(attempt, 500, 30_000));
        }
      }
      if (connection.sessionId !== sessionId) return;
      // Take the waiting entries first, then open the door: an on() made from
      // here on (including inside an onConnect listener) subscribes by itself.
      const pending = [...connection.entries].filter((entry) => !(this.#strategy.persistent && entry.settled));
      connection.ready = true;
      this.#lifecycle.emit("connect", sessionId);
      for (let start = 0; start < pending.length; start += SUBSCRIBE_BATCH) {
        if (connection.sessionId !== sessionId) return;
        await Promise.all(
          pending.slice(start, start + SUBSCRIBE_BATCH).map((entry) =>
            this.#subscribe(entry, connection, sessionId).catch((error) => this.reject(entry, error)),
          ),
        );
      }
      this.#retire(connection);
    })();
  }

  /** Closes a connection that has nothing left to carry, instead of leaving it open for Twitch to time out. */
  #retire(connection: Connection): void {
    if (connection.entries.size > 0) return;
    connection.close();
    const index = this.#connections.indexOf(connection);
    if (index >= 0) this.#connections.splice(index, 1);
  }

  /** @internal Twitch moved us to another server: subscriptions came along. */
  handedOver(_connection: Connection, sessionId: string): void {
    void (async () => {
      try {
        await this.#strategy.onSession?.(sessionId);
      } catch (error) {
        this.fail(error);
      }
      this.#lifecycle.emit("connect", sessionId);
    })();
  }

  /** @internal */
  dropped(connection: Connection, info: SocketEvents["disconnect"][0]): void {
    this.#lifecycle.emit("disconnect", info);
    if (!info.willReconnect) {
      const index = this.#connections.indexOf(connection);
      if (index >= 0 && connection.entries.size === 0) this.#connections.splice(index, 1);
    }
  }

  /** @internal */
  notify(metadata: Frame["metadata"], subscription: EventSubSubscription, event: unknown): void {
    if (this.#seen.has(metadata.message_id)) return;
    this.#seen.set(metadata.message_id, true);
    void this.dispatch(subscription, event, { messageId: metadata.message_id, timestamp: metadata.message_timestamp });
  }

  /** @internal */
  revoke(connection: Connection, subscription: EventSubSubscription): void {
    const entry = this.find(subscription);
    if (entry) {
      connection.entries.delete(entry);
      this.#where.delete(entry);
    }
    this.revoked(subscription);
  }

  /** @internal */
  report(error: Error): void {
    this.fail(error);
  }
}

/** Whether a failed subscription request is worth sending again. */
function isTemporary(error: unknown): boolean {
  if (error instanceof TwitchApiError) return error.status >= 500 || error.status === 429;
  return error instanceof TwitchNetworkError || error instanceof TwitchTimeoutError;
}
