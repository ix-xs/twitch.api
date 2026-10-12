import { TwitchApiError } from "../errors.js";
import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** Subscription level: `"1000"` is Tier 1, `"2000"` Tier 2 and `"3000"` Tier 3. */
export type SubscriptionTier = "1000" | "2000" | "3000";

/** A subscription to a channel, as its broadcaster sees it. */
export interface BroadcasterSubscription {
  /** ID of the broadcaster. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** ID of the user who offered the subscription. An empty string when it is not a gift. */
  gifter_id: string;
  /** Login name of that user. An empty string when it is not a gift. */
  gifter_login: string;
  /** Display name of that user. An empty string when it is not a gift. */
  gifter_name: string;
  /** Whether the subscription was offered by someone else. */
  is_gift: boolean;
  /** Name of the subscription plan. */
  plan_name: string;
  /** Level of the subscription. */
  tier: SubscriptionTier;
  /** ID of the subscriber. */
  user_id: string;
  /** Display name of the subscriber. */
  user_name: string;
  /** Login name of the subscriber. */
  user_login: string;
}

/** The response body behind one page of {@link SubscriptionsApi.get}. */
export interface BroadcasterSubscriptionsBody {
  /** Subscriptions of this page. */
  data: BroadcasterSubscription[];
  /** Holds the cursor of the following page. Empty on the last one. */
  pagination: {
    /** Cursor to pass as `after` or `before`. */
    cursor?: string;
  };
  /**
   * Subscriber points of the channel: 1 per Tier 1, 2 per Tier 2 and 6 per
   * Tier 3. They decide how many emote slots the broadcaster gets. `null`
   * when the list is filtered with `user_id`.
   */
  points: number | null;
  /** Number of subscribers of the channel. `null` when the list is filtered with `user_id`. */
  total: number | null;
}

/** Parameters of {@link SubscriptionsApi.get}. */
export interface GetBroadcasterSubscriptionsParams {
  /** Broadcaster whose subscribers to list. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Only these subscribers. Up to 100 IDs. Cannot be combined with a cursor. */
  user_id?: string | readonly string[];
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
  /** Cursor of the previous page. */
  before?: string;
}

/** The subscription of one user to one channel. */
export interface UserSubscription {
  /** ID of the broadcaster. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** ID of the user who offered the subscription. Only present on a gift. */
  gifter_id?: string;
  /** Login name of that user. Only present on a gift. */
  gifter_login?: string;
  /** Display name of that user. Only present on a gift. */
  gifter_name?: string;
  /** Whether the subscription was offered by someone else. */
  is_gift: boolean;
  /** Level of the subscription. */
  tier: SubscriptionTier;
}

/** Parameters of {@link SubscriptionsApi.check}. */
export interface CheckUserSubscriptionParams {
  /** Broadcaster the user may be subscribed to. Must be a partner or an affiliate. */
  broadcaster_id: string;
  /** User to check. Defaults to the user making the call. */
  user_id?: string;
}

/** Subscriptions: the subscribers of a channel, and whether a user is one. */
export class SubscriptionsApi extends ApiGroup {
  /**
   * Lists the subscribers of a channel. Each page also carries the subscriber
   * points of the channel, in `page.raw.points`.
   *
   * Token: user, scope `channel:read:subscriptions`.
   *
   * @example
   * const page = await twitch.subscriptions.get();
   * console.log(page.total, page.raw.points);
   * for await (const sub of twitch.subscriptions.get()) console.log(sub.user_name, sub.tier);
   * @see https://dev.twitch.tv/docs/api/reference/#get-broadcaster-subscriptions
   */
  get(
    params: GetBroadcasterSubscriptionsParams = {},
    options?: RequestOptions,
  ): Paginator<BroadcasterSubscription, BroadcasterSubscriptionsBody> {
    return this.rest.paginate<BroadcasterSubscription, BroadcasterSubscriptionsBody>({
      path: "subscriptions",
      query: params,
      auth: "user",
      scopes: ["channel:read:subscriptions"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Gets the subscription of a user to a channel, or `null` when the user is
   * not subscribed.
   *
   * Token: user, scope `user:read:subscriptions`.
   *
   * @example
   * const sub = await twitch.subscriptions.check({ broadcaster_id: "141981764" });
   * if (sub) console.log(`Subscribed at tier ${sub.tier}`);
   * @see https://dev.twitch.tv/docs/api/reference/#check-user-subscription
   */
  async check(params: CheckUserSubscriptionParams, options?: RequestOptions): Promise<UserSubscription | null> {
    try {
      return await this.rest.first<UserSubscription>({
        path: "subscriptions/user",
        query: params,
        auth: "user",
        scopes: ["user:read:subscriptions"],
        context: "user_id",
        options,
      });
    } catch (error) {
      if (error instanceof TwitchApiError && error.status === 404) return null;
      throw error;
    }
  }
}
