import { TwitchEventSubError } from "../errors.js";
import { type Awaitable, Emitter } from "../util.js";
import {
  type EventSubCondition,
  type EventSubEvent,
  type EventSubSubscription,
  type EventSubType,
  resolveEventSubType,
} from "./types/index.js";

/** Context passed to an event handler along with the event. */
export interface EventSubMeta {
  /** Unique ID of the notification. Redeliveries of the same notification are filtered out for you. */
  messageId: string;
  /** When Twitch sent the notification, as an RFC 3339 timestamp. */
  timestamp: string;
  /** Subscription type, such as `channel.follow`. */
  type: string;
  /** Version of the subscription type. */
  version: string;
  /** The subscription the event belongs to. */
  subscription: EventSubSubscription;
}

/** Function called for every event of a subscription. */
export type EventSubHandler<T extends EventSubType> = (event: EventSubEvent<T>, meta: EventSubMeta) => Awaitable<unknown>;

/** What `on()` returns: a way to wait for the subscription and to cancel it. */
export interface EventSubHandle {
  /** Subscription type. */
  readonly type: string;
  /** Version of the subscription type. */
  readonly version: string;
  /** Condition the subscription was created with. */
  readonly condition: Readonly<Record<string, string>>;
  /**
   * Resolves once Twitch has accepted the subscription, rejects if it refused
   * (missing scope, unknown user...). You do not have to await it: failures are
   * also reported to `onError` listeners.
   */
  readonly ready: Promise<void>;
  /** Removes this handler. The subscription itself is deleted when its last handler goes. */
  stop(): Promise<void>;
}

/** One subscription and the handlers attached to it. Internal. */
export interface Entry {
  /** Identity of the subscription: type, version and condition. */
  key: string;
  /** Subscription type, without its version. */
  type: string;
  /** Version of the subscription type. */
  version: string;
  /** Condition the subscription is created with. */
  condition: Record<string, string>;
  /** Functions to call for each event. */
  handlers: Set<(event: unknown, meta: EventSubMeta) => Awaitable<unknown>>;
  /** The subscription as Twitch reported it, once known. */
  subscription: EventSubSubscription | undefined;
  /** Settles when Twitch accepts or refuses the subscription. */
  ready: Promise<void>;
  /** The two ends of `ready`. */
  settle: { resolve: () => void; reject: (error: unknown) => void };
  /** Whether `ready` has been resolved or rejected. */
  settled: boolean;
}

interface ListenerEvents {
  error: [error: Error];
  revocation: [subscription: EventSubSubscription];
}

/** Builds the identity of a subscription: its type, version and the non-empty fields of its condition. */
export function subscriptionKey(type: string, version: string, condition: object): string {
  const fields = Object.entries(condition)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([name, value]) => `${name}=${String(value)}`)
    .sort();
  return `${type}@${version}?${fields.join("&")}`;
}

/**
 * What the WebSocket, webhook and conduit listeners have in common:
 * registering typed handlers and routing notifications to them.
 */
export abstract class EventSubListener {
  /** @internal */
  protected readonly entries = new Map<string, Entry>();
  readonly #byId = new Map<string, Entry>();
  readonly #events = new Emitter<ListenerEvents>();

  /**
   * Subscribes to an event type and calls `handler` for each event. The type
   * name autocompletes, and the condition and the event are typed from it.
   *
   * Subscribing twice with the same type and condition reuses one
   * subscription on Twitch's side.
   *
   * @example
   * events.on("channel.follow", { broadcaster_user_id: id, moderator_user_id: id }, (event) => {
   *   console.log(`${event.user_name} followed`);
   * });
   */
  on<T extends EventSubType>(type: T, condition: EventSubCondition<T>, handler: EventSubHandler<T>): EventSubHandle;
  /**
   * Subscribes to a type this version of the library does not know yet.
   * Write the version after an `@`: `"some.new.type@1"`.
   */
  on(
    type: `${string}@${string}`,
    condition: Record<string, string>,
    handler: (event: unknown, meta: EventSubMeta) => Awaitable<unknown>,
  ): EventSubHandle;
  on(type: string, condition: object, handler: (event: never, meta: EventSubMeta) => Awaitable<unknown>): EventSubHandle {
    const resolved = resolveEventSubType(type);
    const cleaned: Record<string, string> = {};
    for (const [name, value] of Object.entries(condition)) {
      if (value !== undefined && value !== null) cleaned[name] = String(value);
    }
    const key = subscriptionKey(resolved.type, resolved.version, cleaned);
    const callback = handler as (event: unknown, meta: EventSubMeta) => Awaitable<unknown>;

    let entry = this.entries.get(key);
    if (entry) {
      entry.handlers.add(callback);
    } else {
      let settle!: Entry["settle"];
      const ready = new Promise<void>((resolve, reject) => (settle = { resolve, reject }));
      // Failures are reported through onError as well, so an unobserved `ready` must not crash the process.
      ready.catch(() => {});
      entry = {
        key,
        type: resolved.type,
        version: resolved.version,
        condition: cleaned,
        handlers: new Set([callback]),
        subscription: undefined,
        ready,
        settle,
        settled: false,
      };
      this.entries.set(key, entry);
      const created = entry;
      this.attach(created).catch((error) => this.reject(created, error));
    }

    const target = entry;
    return {
      type: target.type,
      version: target.version,
      condition: target.condition,
      ready: target.ready,
      stop: async () => {
        target.handlers.delete(callback);
        if (target.handlers.size > 0 || this.entries.get(target.key) !== target) return;
        this.forget(target);
        await this.detach(target);
      },
    };
  }

  /**
   * Called when something goes wrong: a refused subscription, a handler that
   * throws, a connection that cannot be restored. Without any listener,
   * errors are printed with `console.error` so they never go unnoticed.
   */
  onError(listener: (error: Error) => void): () => void {
    return this.#events.on("error", listener);
  }

  /**
   * Called when Twitch revokes a subscription: the user removed your app, was
   * banned or deleted, or the subscription type was retired. The subscription
   * is dropped and its handlers no longer run.
   */
  onRevocation(listener: (subscription: EventSubSubscription) => void): () => void {
    return this.#events.on("revocation", listener);
  }

  /** Number of active subscriptions. */
  get size(): number {
    return this.entries.size;
  }

  /** @internal Creates the subscription on Twitch's side. */
  protected abstract attach(entry: Entry): Promise<void>;

  /** @internal Deletes the subscription on Twitch's side. */
  protected abstract detach(entry: Entry): Promise<void>;

  /** @internal Marks a subscription as accepted by Twitch. */
  protected accept(entry: Entry, subscription?: EventSubSubscription): void {
    if (subscription) {
      if (entry.subscription) this.#byId.delete(entry.subscription.id);
      entry.subscription = subscription;
      this.#byId.set(subscription.id, entry);
    }
    if (!entry.settled) {
      entry.settled = true;
      entry.settle.resolve();
    }
  }

  /** @internal Drops a subscription Twitch refused and reports why. */
  protected reject(entry: Entry, cause: unknown): void {
    const reason = cause instanceof Error ? cause.message : String(cause);
    const error = new TwitchEventSubError(`Could not subscribe to ${entry.type} (version ${entry.version}): ${reason}`, {
      cause,
    });
    this.expire(entry, error);
    this.forget(entry);
  }

  /** @internal Fails `ready` and reports the error, without dropping the subscription. */
  protected expire(entry: Entry, error: Error): void {
    if (!entry.settled) {
      entry.settled = true;
      entry.settle.reject(error);
    }
    this.fail(error);
  }

  /** @internal Whether a subscription is still wanted: it was not stopped, revoked or refused. */
  protected active(entry: Entry): boolean {
    return this.entries.get(entry.key) === entry;
  }

  /** @internal Removes a subscription from the registry. A `ready` still pending is rejected, never left hanging. */
  protected forget(entry: Entry): void {
    if (this.entries.get(entry.key) === entry) this.entries.delete(entry.key);
    if (entry.subscription) this.#byId.delete(entry.subscription.id);
    if (!entry.settled) {
      entry.settled = true;
      entry.settle.reject(
        new TwitchEventSubError(`The subscription to ${entry.type} was removed before Twitch confirmed it.`),
      );
    }
  }

  /** @internal Finds the subscription a notification belongs to. */
  protected find(subscription: Pick<EventSubSubscription, "id" | "type" | "version" | "condition">): Entry | undefined {
    return (
      this.#byId.get(subscription.id) ??
      this.entries.get(subscriptionKey(subscription.type, subscription.version, subscription.condition ?? {}))
    );
  }

  /**
   * @internal Routes one notification to its handlers. The returned promise
   * settles once every handler is done, and never rejects.
   */
  protected dispatch(
    subscription: EventSubSubscription,
    event: unknown,
    meta: Omit<EventSubMeta, "subscription" | "type" | "version">,
  ): Promise<void> {
    const entry = this.find(subscription);
    if (!entry) return Promise.resolve();
    // A subscription that already existed (409 on create) has no known ID until it speaks.
    if (!entry.subscription) this.accept(entry, subscription);
    const full: EventSubMeta = { ...meta, type: subscription.type, version: subscription.version, subscription };
    const running: PromiseLike<unknown>[] = [];
    for (const handler of [...entry.handlers]) {
      try {
        const result = handler(event, full);
        if (result && typeof (result as PromiseLike<unknown>).then === "function") {
          running.push((result as PromiseLike<unknown>).then(undefined, (error) => this.fail(error)));
        }
      } catch (error) {
        this.fail(error);
      }
    }
    return Promise.all(running).then(() => undefined);
  }

  /** @internal Handles a revocation message. */
  protected revoked(subscription: EventSubSubscription): void {
    const entry = this.find(subscription);
    if (entry) this.forget(entry);
    this.#events.emit("revocation", subscription);
  }

  /** @internal Reports an error to the listeners, or to the console when there are none. */
  protected fail(cause: unknown): void {
    const error = cause instanceof Error ? cause : new TwitchEventSubError(String(cause));
    if (!this.#events.emit("error", error)) {
      console.error("[twitch.api] EventSub error (add an onError listener to handle it yourself):", error);
    }
  }
}
