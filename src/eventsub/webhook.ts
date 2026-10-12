import { TwitchApiError, TwitchEventSubError } from "../errors.js";
import { unref } from "../util.js";
import { type Entry, EventSubListener } from "./listener.js";
import type { EventSubSubscription } from "./types/index.js";
import type { SubscriptionBackend } from "./websocket.js";

/** Options of `twitch.eventsub.webhook()`. */
export interface EventSubWebhookOptions {
  /** Public HTTPS URL, on port 443, that Twitch calls. It must reach `handle()` or `nodeHandler()`. */
  callback: string;
  /** Secret used to sign and verify notifications: 10 to 100 ASCII characters. Keep it private. */
  secret: string;
  /**
   * Whether `on()` creates the subscription on Twitch's side. Defaults to
   * `true`. Set it to `false` when subscriptions are created elsewhere (a
   * deploy script, another instance) and this process only receives. That is
   * the setting for Cloudflare Workers and other platforms where a module
   * cannot make requests while it loads.
   */
  subscribe?: boolean;
  /**
   * Oldest notification accepted, in seconds. Older ones are rejected as
   * possible replays. Defaults to 600, the window Twitch recommends.
   */
  maxAge?: number;
}

/** The headers and body of one delivery, whatever the HTTP framework. */
export interface EventSubWebhookRequest {
  /** Header lookup, case insensitive. */
  header(name: string): string | null | undefined;
  /** The exact bytes of the body, as text. Do not parse and re-serialise it. */
  body: string;
}

/** What to answer to Twitch. */
export interface EventSubWebhookResponse {
  /** HTTP status to answer with. */
  status: number;
  /** Body to send as `text/plain`, when there is one. */
  body?: string;
}

/** What the platform offers to keep work alive after the response is sent. */
export interface EventSubWebhookContext {
  /**
   * Called with a promise that settles once the handlers of the notification
   * are done. On Cloudflare Workers pass `ctx.waitUntil`, on Vercel
   * `waitUntil` from `@vercel/functions`: without it those platforms may stop
   * a handler as soon as the response is out.
   */
  waitUntil?(promise: Promise<unknown>): void;
}

/** The part of a Node.js request the adapter reads. */
export interface NodeRequestLike extends AsyncIterable<unknown> {
  /** Request headers, with lowercase names. */
  headers: Record<string, string | string[] | undefined>;
  /** Set by body parsing middleware. A `Buffer` or a string is used as is. */
  body?: unknown;
}

/** The part of a Node.js response the adapter writes. */
export interface NodeResponseLike {
  /** Sends the status line and the headers. */
  writeHead(status: number, headers?: Record<string, string>): unknown;
  /** Sends the body, if any, and ends the response. */
  end(body?: string): unknown;
}

const encoder = new TextEncoder();
/** How long Twitch gets to send its verification challenge before `ready` gives up. */
const VERIFICATION_TIMEOUT = 60_000;
/** Upper bound on remembered message IDs, whatever the traffic. */
const MAX_REMEMBERED = 500_000;

/**
 * Checks the signature of an EventSub webhook delivery. Uses the Web Crypto
 * API, so it runs on Node.js, Bun, Deno, Workers and browsers alike. The
 * comparison takes the same time whether the signature matches or not.
 *
 * @example
 * const valid = await verifyEventSubSignature({
 *   secret,
 *   messageId: request.headers.get("Twitch-Eventsub-Message-Id"),
 *   timestamp: request.headers.get("Twitch-Eventsub-Message-Timestamp"),
 *   signature: request.headers.get("Twitch-Eventsub-Message-Signature"),
 *   body: await request.text(),
 * });
 */
export async function verifyEventSubSignature(input: {
  secret: string;
  messageId: string | null | undefined;
  timestamp: string | null | undefined;
  signature: string | null | undefined;
  body: string;
}): Promise<boolean> {
  const { secret, messageId, timestamp, signature, body } = input;
  if (!messageId || !timestamp || !signature) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(messageId + timestamp + body)));
  let expected = "sha256=";
  for (const byte of digest) expected += byte.toString(16).padStart(2, "0");
  const given = signature.toLowerCase();
  let diff = expected.length ^ given.length;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (given.charCodeAt(i) || 0);
  return diff === 0;
}

/**
 * Receives EventSub events over webhooks. It creates the subscriptions,
 * answers Twitch's verification challenge, checks every signature, rejects
 * replays and duplicates, and routes events to your typed handlers.
 *
 * Plug it into any server: `handle()` speaks the Fetch API (Bun, Deno,
 * Workers, Hono, Next.js route handlers) and `nodeHandler()` speaks Node.js
 * (`node:http`, Express, Fastify raw mode).
 *
 * @example
 * const hooks = twitch.eventsub.webhook({ callback: "https://example.com/twitch", secret });
 * hooks.on("stream.online", { broadcaster_user_id: "141981764" }, (event) => {
 *   console.log(`${event.broadcaster_user_name} went live`);
 * });
 *
 * // Bun, Deno:
 * export default { fetch: (request: Request) => hooks.handle(request) };
 *
 * // Node.js:
 * createServer(hooks.nodeHandler()).listen(3000);
 */
export class EventSubWebhook extends EventSubListener {
  readonly #backend: SubscriptionBackend;
  readonly #callback: string;
  readonly #secret: string;
  readonly #subscribe: boolean;
  readonly #maxAge: number;
  /** Message IDs already handled, with the time each one was seen. Oldest first. */
  readonly #seen = new Map<string, number>();

  /** @internal */
  constructor(backend: SubscriptionBackend, options: EventSubWebhookOptions) {
    super();
    if (!options?.callback || !options.secret) {
      throw new TwitchEventSubError("A webhook listener needs a `callback` URL and a `secret`.");
    }
    if (options.secret.length < 10 || options.secret.length > 100) {
      throw new TwitchEventSubError("The webhook secret must be 10 to 100 characters long.");
    }
    this.#backend = backend;
    this.#callback = options.callback;
    this.#secret = options.secret;
    this.#subscribe = options.subscribe ?? true;
    this.#maxAge = (options.maxAge ?? 600) * 1000;
  }

  /**
   * Handles a delivery on Fetch API runtimes and returns the response to send
   * back. Give it the untouched request. On platforms that stop work once the
   * response is sent, pass their `waitUntil`.
   *
   * @example
   * // Cloudflare Workers
   * export default {
   *   fetch: (request, env, ctx) => hooks.handle(request, { waitUntil: (work) => ctx.waitUntil(work) }),
   * };
   */
  async handle(request: Request, context?: EventSubWebhookContext): Promise<Response> {
    const result = await this.process({ header: (name) => request.headers.get(name), body: await request.text() }, context);
    return new Response(result.body ?? null, {
      status: result.status,
      headers: result.body === undefined ? {} : { "Content-Type": "text/plain" },
    });
  }

  /**
   * Returns a `(req, res)` handler for Node.js servers. Mount it before any
   * JSON body parser: the signature covers the raw bytes of the body. With
   * Express, `express.raw({ type: "application/json" })` on the route works.
   */
  nodeHandler(): (req: NodeRequestLike, res: NodeResponseLike) => Promise<void> {
    return async (req, res) => {
      let result: EventSubWebhookResponse;
      try {
        const body = await readNodeBody(req);
        result = await this.process({
          header: (name) => {
            const value = req.headers[name.toLowerCase()];
            return Array.isArray(value) ? value[0] : value;
          },
          body,
        });
      } catch (error) {
        this.fail(error);
        result = { status: 500 };
      }
      if (result.body === undefined) res.writeHead(result.status);
      else res.writeHead(result.status, { "Content-Type": "text/plain" });
      res.end(result.body);
    };
  }

  /**
   * Framework agnostic entry point: give it the headers and the raw body,
   * send back the status and body it returns. Use it when neither `handle()`
   * nor `nodeHandler()` fits your server.
   */
  async process(request: EventSubWebhookRequest, context?: EventSubWebhookContext): Promise<EventSubWebhookResponse> {
    const messageId = request.header("Twitch-Eventsub-Message-Id");
    const timestamp = request.header("Twitch-Eventsub-Message-Timestamp");
    const signature = request.header("Twitch-Eventsub-Message-Signature");
    const messageType = request.header("Twitch-Eventsub-Message-Type");
    if (!messageId || !timestamp || !signature || !messageType) return { status: 400 };

    const now = Date.now();
    const sentAt = Date.parse(timestamp);
    if (Number.isNaN(sentAt) || Math.abs(now - sentAt) > this.#maxAge) return { status: 403 };
    const valid = await verifyEventSubSignature({ secret: this.#secret, messageId, timestamp, signature, body: request.body });
    if (!valid) return { status: 403 };

    let payload: { challenge?: string; subscription: EventSubSubscription; event?: unknown; events?: unknown };
    try {
      payload = JSON.parse(request.body);
    } catch {
      return { status: 400 };
    }
    if (typeof payload !== "object" || payload === null || typeof payload.subscription !== "object" || payload.subscription === null) {
      return { status: 400 };
    }

    if (messageType === "webhook_callback_verification") {
      const entry = this.find(payload.subscription);
      if (entry) this.accept(entry, payload.subscription);
      return { status: 200, body: payload.challenge ?? "" };
    }

    if (this.#remember(messageId, now)) return { status: 204 };

    if (messageType === "notification") {
      // Handlers run in the background: Twitch expects an answer within a couple of seconds.
      const work = this.dispatch(payload.subscription, payload.event ?? payload.events, { messageId, timestamp });
      context?.waitUntil?.(work);
    } else if (messageType === "revocation") {
      this.revoked(payload.subscription);
    }
    return { status: 204 };
  }

  protected override async attach(entry: Entry): Promise<void> {
    if (!this.#subscribe) {
      this.accept(entry);
      return;
    }
    let subscription: EventSubSubscription;
    try {
      subscription = await this.#backend.create({
        type: entry.type,
        version: entry.version,
        condition: entry.condition,
        transport: { method: "webhook", callback: this.#callback, secret: this.#secret },
      });
    } catch (error) {
      // 409: this subscription already exists from a previous run. Its ID is learned from its first notification.
      if (error instanceof TwitchApiError && error.status === 409) return this.accept(entry);
      throw error;
    }
    if (!this.active(entry)) {
      // Stopped while the request was in flight: do not leave the subscription behind.
      await this.#backend.remove(subscription.id, "app").catch(() => {});
      return;
    }
    if (subscription.status === "enabled") {
      this.accept(entry, subscription);
      return;
    }
    // Twitch verifies the callback first: `ready` waits for the challenge, but not forever.
    entry.subscription = subscription;
    unref(
      setTimeout(() => {
        if (entry.settled || !this.active(entry)) return;
        this.expire(
          entry,
          new TwitchEventSubError(
            `Twitch did not verify the callback for ${entry.type} within ${VERIFICATION_TIMEOUT / 1000} seconds. Check that ${this.#callback} is public, uses HTTPS on port 443 and reaches this listener.`,
          ),
        );
      }, VERIFICATION_TIMEOUT),
    );
  }

  protected override async detach(entry: Entry): Promise<void> {
    if (!this.#subscribe || !entry.subscription) return;
    await this.#backend.remove(entry.subscription.id, "app").catch((error) => {
      if (!(error instanceof TwitchApiError) || error.status !== 404) throw error;
    });
  }

  /**
   * Records a message ID. Returns `true` when it was already seen. IDs are
   * kept for as long as a delivery with that ID could still pass the age
   * check, so a replay inside the window is always caught.
   */
  #remember(messageId: string, now: number): boolean {
    for (const [id, seenAt] of this.#seen) {
      if (now - seenAt <= this.#maxAge && this.#seen.size <= MAX_REMEMBERED) break;
      this.#seen.delete(id);
    }
    if (this.#seen.has(messageId)) return true;
    this.#seen.set(messageId, now);
    return false;
  }
}

async function readNodeBody(req: NodeRequestLike): Promise<string> {
  const parsed = req.body;
  if (typeof parsed === "string") return parsed;
  if (parsed instanceof Uint8Array) return new TextDecoder().decode(parsed);
  if (parsed !== undefined && parsed !== null && typeof parsed === "object" && Object.keys(parsed).length > 0) {
    throw new TwitchEventSubError(
      "The request body was already parsed by a middleware, so its signature cannot be verified. Mount the EventSub handler before JSON body parsers, or use a raw body parser on its route.",
    );
  }
  const chunks: Uint8Array[] = [];
  let length = 0;
  for await (const chunk of req) {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : (chunk as Uint8Array);
    chunks.push(bytes);
    length += bytes.length;
  }
  const all = new Uint8Array(length);
  let offset = 0;
  for (const bytes of chunks) {
    all.set(bytes, offset);
    offset += bytes.length;
  }
  return new TextDecoder().decode(all);
}
