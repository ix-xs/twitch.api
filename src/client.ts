import { AdsApi } from "./api/ads.js";
import { AnalyticsApi } from "./api/analytics.js";
import { BitsApi } from "./api/bits.js";
import { ChannelsApi } from "./api/channels.js";
import { ChannelPointsApi } from "./api/channel-points.js";
import { CharityApi } from "./api/charity.js";
import { ChatApi } from "./api/chat.js";
import { ClipsApi } from "./api/clips.js";
import { ConduitsApi } from "./api/conduits.js";
import { ContentLabelsApi } from "./api/content-labels.js";
import { EntitlementsApi } from "./api/entitlements.js";
import { ExtensionsApi } from "./api/extensions.js";
import { EventSubApi } from "./api/eventsub.js";
import { GamesApi } from "./api/games.js";
import { GoalsApi } from "./api/goals.js";
import { GuestStarApi } from "./api/guest-star.js";
import { HypeTrainApi } from "./api/hype-train.js";
import { ModerationApi } from "./api/moderation.js";
import { PollsApi } from "./api/polls.js";
import { PredictionsApi } from "./api/predictions.js";
import { RaidsApi } from "./api/raids.js";
import { ScheduleApi } from "./api/schedule.js";
import { SearchApi } from "./api/search.js";
import { StreamsApi } from "./api/streams.js";
import { SubscriptionsApi } from "./api/subscriptions.js";
import { TagsApi } from "./api/tags.js";
import { TeamsApi } from "./api/teams.js";
import { UsersApi } from "./api/users.js";
import { VideosApi } from "./api/videos.js";
import { WhispersApi } from "./api/whispers.js";
import { Auth } from "./auth/manager.js";
import type { TokenStore } from "./auth/tokens.js";
import { TwitchError } from "./errors.js";
import type { TwitchEvents } from "./events.js";
import type { Paginator } from "./http/pagination.js";
import { RateLimiter } from "./http/rate-limit.js";
import { type Endpoint, type KnownEndpoint, type PageConfig, Rest, type RestConfig } from "./http/rest.js";
import { Emitter } from "./util.js";

/** Options of the {@link Twitch} client. Only `clientId` is mandatory. */
export interface TwitchOptions {
  /** Client ID of your application, from the Twitch developer console. */
  clientId: string;
  /**
   * Client secret of your application. Needed for app access tokens and for
   * the authorization code flow. Leave it out in public clients (browser,
   * desktop, CLI) and use the device code flow instead.
   */
  clientSecret?: string;
  /**
   * Where user tokens are persisted. Tokens are restored from it on first use
   * and written back after every refresh. Defaults to memory only.
   */
  tokens?: TokenStore;
  /** Milliseconds before one HTTP attempt is abandoned. Defaults to 15000. */
  timeout?: number;
  /** Retries after a network failure, a 5xx or a 429. Defaults to 3. */
  retries?: number;
  /**
   * What to do when the rate limit bucket is empty: `"wait"` (default) holds
   * the request until it refills, `"throw"` fails with a `TwitchRateLimitError`.
   */
  rateLimit?: "wait" | "throw";
  /**
   * Validates user tokens every hour, as Twitch requires from apps that keep
   * user sessions. Defaults to `true`. The timer never keeps the process alive.
   */
  validateTokens?: boolean;
  /** Sent as the `User-Agent` header on runtimes that allow setting it. */
  userAgent?: string;
  /** Custom `fetch`, for proxies, instrumentation or tests. Defaults to the global one. */
  fetch?: typeof fetch;
  /** Base URL of the Helix API. Point it at the Twitch CLI mock server for local testing. */
  baseUrl?: string;
  /** Base URL of the OAuth server. */
  authUrl?: string;
}

/** State shared between a client and the views created by {@link Twitch.as}. */
interface Shared {
  auth: Auth;
  events: Emitter<TwitchEvents>;
  limiter: RateLimiter;
  config: RestConfig;
}

type GroupClass<T> = new (rest: Rest) => T;

/**
 * The Twitch client. One instance covers the whole Helix API, the OAuth flows
 * and EventSub.
 *
 * @example
 * import { Twitch } from "@ix-xs/twitch.api";
 *
 * const twitch = new Twitch({ clientId, clientSecret });
 * const user = await twitch.users.getByLogin("twitchdev");
 * for await (const stream of twitch.streams.get({ language: "fr" })) {
 *   console.log(stream.user_name, stream.viewer_count);
 * }
 */
export class Twitch {
  readonly #shared: Shared;
  readonly #rest: Rest;
  readonly #groups = new Map<GroupClass<unknown>, unknown>();
  /** ID of the user this view acts as, when it was created by {@link Twitch.as}. */
  readonly userId: string | undefined;

  constructor(options: TwitchOptions);
  /** @internal */
  constructor(options: TwitchOptions, shared: Shared, userId: string);
  constructor(options: TwitchOptions, shared?: Shared, userId?: string) {
    if (shared) {
      this.#shared = shared;
      this.#rest = new Rest(shared.config, userId);
      this.userId = userId;
      return;
    }
    if (!options || typeof options.clientId !== "string" || options.clientId === "") {
      throw new TwitchError("A clientId is required: new Twitch({ clientId, clientSecret }).");
    }
    if (typeof (options.fetch ?? globalThis.fetch) !== "function") {
      throw new TwitchError("No fetch implementation found. Pass one with the `fetch` option.");
    }
    const doFetch: typeof fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    const events = new Emitter<TwitchEvents>();
    const auth = new Auth({
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      store: options.tokens,
      fetch: doFetch,
      authUrl: options.authUrl ?? "https://id.twitch.tv/oauth2",
      events,
      validate: options.validateTokens ?? true,
      timeout: options.timeout ?? 15_000,
      retries: options.retries ?? 3,
    });
    const limiter = new RateLimiter(events);
    const config: RestConfig = {
      auth,
      limiter,
      events,
      fetch: doFetch,
      baseUrl: (options.baseUrl ?? "https://api.twitch.tv/helix").replace(/\/+$/, ""),
      timeout: options.timeout ?? 15_000,
      retries: options.retries ?? 3,
      rateLimit: options.rateLimit ?? "wait",
      userAgent: options.userAgent,
      closers: new Set(),
    };
    this.#shared = { auth, events, limiter, config };
    this.#rest = new Rest(config);
    this.userId = undefined;
  }

  /** Tokens and OAuth: register users, run the authorization flows, refresh, validate, revoke. */
  get auth(): Auth {
    return this.#shared.auth;
  }

  /** Ads: run commercials, read the ad schedule, snooze the next ad. */
  get ads(): AdsApi {
    return this.#group(AdsApi);
  }

  /** Analytics: downloadable reports for your extensions and games. */
  get analytics(): AnalyticsApi {
    return this.#group(AnalyticsApi);
  }

  /** Bits: leaderboard, Cheermotes, custom Power-ups and extension transactions. */
  get bits(): BitsApi {
    return this.#group(BitsApi);
  }

  /** Channels: title, category and tags, editors, follows and followers. */
  get channels(): ChannelsApi {
    return this.#group(ChannelsApi);
  }

  /** Channel Points: custom rewards and their redemptions. */
  get channelPoints(): ChannelPointsApi {
    return this.#group(ChannelPointsApi);
  }

  /** Charity: the active campaign and its donations. */
  get charity(): CharityApi {
    return this.#group(CharityApi);
  }

  /** Chat: send messages and announcements, chatters, emotes, badges, settings, colors, pins and shoutouts. */
  get chat(): ChatApi {
    return this.#group(ChatApi);
  }

  /** Clips: create, look up and download clips. */
  get clips(): ClipsApi {
    return this.#group(ClipsApi);
  }

  /** Conduits: the EventSub transport that spreads events over several shards. */
  get conduits(): ConduitsApi {
    return this.#group(ConduitsApi);
  }

  /** Content classification labels and their localized names. */
  get contentLabels(): ContentLabelsApi {
    return this.#group(ContentLabelsApi);
  }

  /** Drops entitlements: list them and mark them fulfilled. */
  get entitlements(): EntitlementsApi {
    return this.#group(EntitlementsApi);
  }

  /** Extensions: configuration, secrets, PubSub and chat messages, Bits products. */
  get extensions(): ExtensionsApi {
    return this.#group(ExtensionsApi);
  }

  /** EventSub: subscriptions, and the WebSocket, webhook and conduit listeners. */
  get eventsub(): EventSubApi {
    return this.#group(EventSubApi);
  }

  /** Games and categories: look them up, list the most watched. */
  get games(): GamesApi {
    return this.#group(GamesApi);
  }

  /** Creator goals of a channel. */
  get goals(): GoalsApi {
    return this.#group(GoalsApi);
  }

  /** Guest Star (beta): sessions, invites and slots. */
  get guestStar(): GuestStarApi {
    return this.#group(GuestStarApi);
  }

  /** Hype Train: the current train and the channel records. */
  get hypeTrain(): HypeTrainApi {
    return this.#group(HypeTrainApi);
  }

  /** Moderation: bans, timeouts, warnings, AutoMod, blocked terms, moderators, VIPs and Shield Mode. */
  get moderation(): ModerationApi {
    return this.#group(ModerationApi);
  }

  /** Polls: create, read and end them. */
  get polls(): PollsApi {
    return this.#group(PollsApi);
  }

  /** Predictions: create, read, lock and resolve them. */
  get predictions(): PredictionsApi {
    return this.#group(PredictionsApi);
  }

  /** Raids: start one, cancel a pending one. */
  get raids(): RaidsApi {
    return this.#group(RaidsApi);
  }

  /** Stream schedule: segments, vacation and the iCalendar feed. */
  get schedule(): ScheduleApi {
    return this.#group(ScheduleApi);
  }

  /** Search for categories and channels. */
  get search(): SearchApi {
    return this.#group(SearchApi);
  }

  /** Streams: who is live, stream keys and markers. */
  get streams(): StreamsApi {
    return this.#group(StreamsApi);
  }

  /** Subscriptions: the subscribers of a channel, and whether a user is one. */
  get subscriptions(): SubscriptionsApi {
    return this.#group(SubscriptionsApi);
  }

  /** Stream tags (deprecated by Twitch, kept for completeness). */
  get tags(): TagsApi {
    return this.#group(TagsApi);
  }

  /** Teams: look one up, list the teams of a channel. */
  get teams(): TeamsApi {
    return this.#group(TeamsApi);
  }

  /** Users: profiles, block list and installed extensions. */
  get users(): UsersApi {
    return this.#group(UsersApi);
  }

  /** Videos: VODs, highlights and uploads. */
  get videos(): VideosApi {
    return this.#group(VideosApi);
  }

  /** Whispers: send a private message to a user. */
  get whispers(): WhispersApi {
    return this.#group(WhispersApi);
  }

  /**
   * Returns a view of the client that makes every call as `userId`. Use it
   * when several users are registered and you want to be explicit about who
   * is acting. The view shares tokens, rate limits and listeners with the
   * client it comes from.
   *
   * @example
   * const asBot = twitch.as(botId);
   * await asBot.chat.send({ broadcaster_id: channelId, message: "Hello" });
   */
  as(userId: string): Twitch {
    return new Twitch({ clientId: this.#shared.auth.clientId }, this.#shared, userId);
  }

  /**
   * Sends any Helix request through the same pipeline as the built-in
   * methods: token choice, rate limit, retries, typed errors. Use it for an
   * endpoint that is newer than your version of the library.
   *
   * @example
   * const body = await twitch.request<{ data: unknown[] }>({
   *   path: "some/new/endpoint",
   *   query: { broadcaster_id: "141981764" },
   * });
   */
  request<T = unknown>(endpoint: Endpoint): Promise<T> {
    return this.#rest.request<T>(endpoint as KnownEndpoint);
  }

  /** Same as {@link Twitch.request} for an endpoint that returns pages. */
  paginate<T, R = unknown>(endpoint: Endpoint, config?: PageConfig<T, R>): Paginator<T, R> {
    return this.#rest.paginate<T, R>(endpoint as KnownEndpoint, config);
  }

  /**
   * Listens to what the client does: HTTP traffic, rate limit waits, token
   * renewals. Returns a function that removes the listener.
   *
   * @example
   * twitch.on("tokenRefresh", (token) => saveSomewhere(token));
   * twitch.on("response", ({ method, url, status, duration }) => {
   *   console.log(method, url, status, `${duration} ms`);
   * });
   */
  on<K extends keyof TwitchEvents>(event: K, listener: (...args: TwitchEvents[K]) => void): () => void {
    return this.#shared.events.on(event, listener);
  }

  /** Like {@link Twitch.on}, for a listener that runs once. */
  once<K extends keyof TwitchEvents>(event: K, listener: (...args: TwitchEvents[K]) => void): () => void {
    return this.#shared.events.once(event, listener);
  }

  /** Removes a listener added with {@link Twitch.on}. */
  off<K extends keyof TwitchEvents>(event: K, listener: (...args: TwitchEvents[K]) => void): void {
    this.#shared.events.off(event, listener);
  }

  /**
   * What is known about a rate limit bucket: the app token's by default, a
   * user's when you pass their ID. `undefined` until Twitch has reported it.
   */
  rateLimitOf(userId?: string): { limit: number; remaining: number; resetAt: number } | undefined {
    const state = this.#shared.limiter.get(userId ? `user:${userId}` : "app");
    // A window that is over says nothing about the next one.
    return state && state.resetAt > Date.now() ? { ...state } : undefined;
  }

  /**
   * Stops the token validation timer and closes the EventSub WebSocket and
   * conduit listeners created from this client. Call it when you are done:
   * an open WebSocket keeps the process alive.
   */
  close(): void {
    this.#shared.auth.close();
    for (const close of this.#shared.config.closers) close();
    this.#shared.config.closers.clear();
  }

  #group<T>(Group: GroupClass<T>): T {
    let group = this.#groups.get(Group) as T | undefined;
    if (!group) this.#groups.set(Group, (group = new Group(this.#rest)));
    return group;
  }
}
