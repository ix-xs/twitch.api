import { TwitchEventSubError } from "../errors.js";
import {
  type EventSubCondition,
  type EventSubSubscription,
  type EventSubSubscriptionStatus,
  type EventSubTotals,
  type EventSubTransportInput,
  type EventSubType,
  resolveEventSubType,
} from "../eventsub/types/index.js";
import { EventSubWebhook, type EventSubWebhookOptions } from "../eventsub/webhook.js";
import {
  EventSubWebSocket,
  type EventSubWebSocketOptions,
  type SubscriptionBackend,
} from "../eventsub/websocket.js";
import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** Parameters of {@link EventSubApi.subscribe}. */
export interface CreateEventSubSubscriptionParams<T extends EventSubType = EventSubType> {
  /** Subscription type, such as `channel.follow`. */
  type: T;
  /** What to listen to: which channel, which user... Its shape depends on the type. */
  condition: EventSubCondition<T>;
  /** Where Twitch delivers the events. */
  transport: EventSubTransportInput;
}

/** Parameters of {@link EventSubApi.subscriptions}. Use at most one filter. */
export interface GetEventSubSubscriptionsParams {
  /** Only subscriptions in this state. */
  status?: EventSubSubscriptionStatus;
  /** Only subscriptions of this type. */
  type?: EventSubType | (string & {});
  /** Only subscriptions whose condition mentions this user. */
  user_id?: string;
  /** Only the subscription with this ID. */
  subscription_id?: string;
  /** Only subscriptions delivered through this conduit. */
  conduit_id?: string;
  /** Cursor of the next page. */
  after?: string;
}

/** Raw body of the subscription list, which also carries your totals. */
export interface GetEventSubSubscriptionsBody extends EventSubTotals {
  /** Subscriptions of this page. */
  data: EventSubSubscription[];
  /** Holds the cursor of the next page. Empty on the last one. */
  pagination?: { cursor?: string };
}

/** Options of {@link EventSubApi.conduit}. */
export interface EventSubConduitOptions extends Omit<EventSubWebSocketOptions, "user"> {
  /**
   * ID of the conduit to join. When omitted, the first conduit of your
   * application is used, and one is created if you have none.
   */
  conduitId?: string;
  /** ID of the shard this process takes over. Defaults to `"0"`. */
  shardId?: string;
}

/** Adds what some types need on top of the usual fields. */
function subscriptionBody<T extends { type: string }>(body: T): T & { is_batching_enabled?: true } {
  // Drops entitlements are only delivered in batches, and Twitch wants that spelled out.
  return body.type === "drop.entitlement.grant" ? { ...body, is_batching_enabled: true } : body;
}

/** EventSub: subscriptions, and the WebSocket, webhook and conduit listeners. */
export class EventSubApi extends ApiGroup {
  /**
   * Creates a subscription by hand. You rarely need it: the listeners returned
   * by {@link EventSubApi.websocket}, {@link EventSubApi.webhook} and
   * {@link EventSubApi.conduit} subscribe for you.
   *
   * Token: user for the WebSocket transport, app for webhooks and conduits.
   * The scopes depend on the subscription type.
   *
   * @example
   * await twitch.eventsub.subscribe({
   *   type: "stream.online",
   *   condition: { broadcaster_user_id: "141981764" },
   *   transport: { method: "webhook", callback: "https://example.com/twitch", secret },
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription
   */
  subscribe<T extends EventSubType>(
    params: CreateEventSubSubscriptionParams<T>,
    options?: RequestOptions,
  ): Promise<EventSubSubscription<string, EventSubCondition<T>>>;
  /** Creates a subscription to a type this version does not know yet: `"some.new.type@1"`. */
  subscribe(
    params: { type: `${string}@${string}`; condition: Record<string, string>; transport: EventSubTransportInput },
    options?: RequestOptions,
  ): Promise<EventSubSubscription>;
  subscribe(
    params: { type: string; condition: object; transport: EventSubTransportInput },
    options?: RequestOptions,
  ): Promise<EventSubSubscription> {
    const { type, version } = resolveEventSubType(params.type);
    return this.rest.one<EventSubSubscription>({
      method: "POST",
      path: "eventsub/subscriptions",
      body: subscriptionBody({ type, version, condition: params.condition, transport: params.transport }),
      auth: params.transport.method === "websocket" ? "user" : "app",
      options,
    });
  }

  /**
   * Deletes a subscription. The app token is used unless you say otherwise:
   * for a subscription created over WebSocket, pass `{ as: userId }` with the
   * user whose token created it.
   *
   * Token: user for a WebSocket subscription, app otherwise.
   *
   * @example
   * await twitch.eventsub.unsubscribe(subscription.id);
   * @see https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription
   */
  unsubscribe(id: string, options?: RequestOptions): Promise<void> {
    return this.rest.send({ method: "DELETE", path: "eventsub/subscriptions", query: { id }, options });
  }

  /**
   * Lists your subscriptions, oldest first. With the app token you get the
   * webhook and conduit ones. Pass `{ as: userId }` to get the WebSocket
   * subscriptions created with that user's token.
   *
   * Token: app or user, see above.
   *
   * @example
   * const page = await twitch.eventsub.subscriptions({ status: "enabled" });
   * console.log(page.raw.total_cost, "of", page.raw.max_total_cost);
   * @see https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions
   */
  subscriptions(
    params: GetEventSubSubscriptionsParams = {},
    options?: RequestOptions,
  ): Paginator<EventSubSubscription, GetEventSubSubscriptionsBody> {
    return this.rest.paginate<EventSubSubscription, GetEventSubSubscriptionsBody>(
      { path: "eventsub/subscriptions", query: params, options },
      { sizeParam: null },
    );
  }

  /**
   * Opens a WebSocket listener: the simplest way to receive events, with
   * nothing to host. Subscriptions are created with a user token.
   *
   * @example
   * const events = twitch.eventsub.websocket();
   * events.on("channel.follow", { broadcaster_user_id: id, moderator_user_id: id }, (event) => {
   *   console.log(`${event.user_name} followed`);
   * });
   * @see https://dev.twitch.tv/docs/eventsub/handling-websocket-events/
   */
  websocket(options: EventSubWebSocketOptions = {}): EventSubWebSocket {
    const requestOptions: RequestOptions = options.user ? { as: options.user } : {};
    return this.#track(new EventSubWebSocket(
      this.#backend(),
      {
        capacity: 300,
        maxSockets: 3,
        persistent: false,
        auth: "user",
        options: requestOptions,
        transport: (sessionId) => ({ method: "websocket", session_id: sessionId }),
      },
      options,
    ));
  }

  /**
   * Creates a webhook listener, for servers reachable from the internet.
   * Subscriptions are created with the app token and survive restarts.
   *
   * @example
   * const hooks = twitch.eventsub.webhook({ callback: "https://example.com/twitch", secret });
   * hooks.on("stream.online", { broadcaster_user_id: "141981764" }, (event) => {
   *   console.log(`${event.broadcaster_user_name} went live`);
   * });
   * export default { fetch: (request: Request) => hooks.handle(request) };
   * @see https://dev.twitch.tv/docs/eventsub/handling-webhook-events/
   */
  webhook(options: EventSubWebhookOptions): EventSubWebhook {
    return new EventSubWebhook(this.#backend(), options);
  }

  /**
   * Opens a WebSocket that serves one shard of a conduit. Subscriptions are
   * created with the app token, so one process can follow any number of
   * channels without holding a connection per user, and they survive
   * restarts. Run one process per shard to spread the load.
   *
   * @example
   * const events = twitch.eventsub.conduit();
   * events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
   *   console.log(event.message.text);
   * });
   * @see https://dev.twitch.tv/docs/eventsub/handling-conduit-events/
   */
  conduit(options: EventSubConduitOptions = {}): EventSubWebSocket {
    const shardId = options.shardId ?? "0";
    let conduitId: Promise<string> | undefined;
    const resolveConduit = (): Promise<string> =>
      (conduitId ??= (async () => {
        if (options.conduitId) return options.conduitId;
        const existing = await this.rest.data<{ id: string }>({ path: "eventsub/conduits", auth: "app" });
        if (existing[0]) return existing[0].id;
        const created = await this.rest.one<{ id: string }>({
          method: "POST",
          path: "eventsub/conduits",
          body: { shard_count: Number(shardId) + 1 },
          auth: "app",
        });
        return created.id;
      })().catch((error: unknown) => {
        // Look again next time instead of repeating an old failure forever.
        conduitId = undefined;
        throw error;
      }));
    let boundTo: string | undefined;

    return this.#track(new EventSubWebSocket(
      this.#backend(),
      {
        capacity: Infinity,
        maxSockets: 1,
        persistent: true,
        auth: "app",
        options: {},
        transport: () => {
          if (!boundTo) throw new TwitchEventSubError("The conduit is not bound to a session yet.");
          return { method: "conduit", conduit_id: boundTo };
        },
        onSession: async (sessionId) => {
          const id = await resolveConduit();
          const body = await this.rest.request<{ errors?: { message: string }[] } | undefined>({
            method: "PATCH",
            path: "eventsub/conduits/shards",
            body: {
              conduit_id: id,
              shards: [{ id: shardId, transport: { method: "websocket", session_id: sessionId } }],
            },
            auth: "app",
          });
          const failure = body?.errors?.[0];
          if (failure) throw new TwitchEventSubError(`Shard ${shardId} of conduit ${id}: ${failure.message}`);
          boundTo = id;
        },
      },
      options,
    ));
  }

  /** Makes `twitch.close()` close the listener too. */
  #track(listener: EventSubWebSocket): EventSubWebSocket {
    this.rest.onClose(() => listener.close());
    return listener;
  }

  #backend(): SubscriptionBackend {
    return {
      create: (params, options) =>
        this.rest.one<EventSubSubscription>({
          method: "POST",
          path: "eventsub/subscriptions",
          body: subscriptionBody(params),
          auth: params.transport.method === "websocket" ? "user" : "app",
          options,
        }),
      remove: (id, auth, options) =>
        this.rest.send({ method: "DELETE", path: "eventsub/subscriptions", query: { id }, auth, options }),
    };
  }
}
