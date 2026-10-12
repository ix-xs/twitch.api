import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** The icon of a custom reward, in three sizes. */
export interface CustomRewardImage {
  /** URL of the small image. */
  url_1x: string;
  /** URL of the medium image. */
  url_2x: string;
  /** URL of the large image. */
  url_4x: string;
}

/** A reward viewers can buy with Channel Points. */
export interface CustomReward {
  /** ID of the broadcaster who owns the reward. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** ID of the reward. */
  id: string;
  /** Title of the reward. */
  title: string;
  /** Text shown to the viewer when the reward asks for input. */
  prompt: string;
  /** Price in Channel Points. */
  cost: number;
  /** Icon uploaded by the broadcaster, or `null` when the default one is used. */
  image: CustomRewardImage | null;
  /** Icon Twitch falls back to. */
  default_image: CustomRewardImage;
  /** Background colour as a hex code, for example `"#00E5CB"`. */
  background_color: string;
  /** Whether viewers can see the reward. */
  is_enabled: boolean;
  /** Whether the viewer has to type something when redeeming. */
  is_user_input_required: boolean;
  /** Cap on redemptions during one stream. */
  max_per_stream_setting: {
    /** Whether the cap applies. */
    is_enabled: boolean;
    /** Redemptions allowed per stream. */
    max_per_stream: number;
  };
  /** Cap on redemptions by one viewer during one stream. */
  max_per_user_per_stream_setting: {
    /** Whether the cap applies. */
    is_enabled: boolean;
    /** Redemptions allowed per viewer per stream. */
    max_per_user_per_stream: number;
  };
  /** Waiting time imposed between two redemptions. */
  global_cooldown_setting: {
    /** Whether the cooldown applies. */
    is_enabled: boolean;
    /** Length of the cooldown, in seconds. */
    global_cooldown_seconds: number;
  };
  /** Whether the reward is paused. A paused reward cannot be redeemed. */
  is_paused: boolean;
  /** Whether the reward can still be redeemed, given its caps. */
  is_in_stock: boolean;
  /** Whether redemptions are marked `FULFILLED` right away instead of waiting in the queue. */
  should_redemptions_skip_request_queue: boolean;
  /**
   * Redemptions made during the current stream. `null` when the channel is
   * offline or the per stream cap is off.
   */
  redemptions_redeemed_current_stream: number | null;
  /** When the running cooldown ends, as an RFC 3339 timestamp. `null` when there is none. */
  cooldown_expires_at: string | null;
}

/** Parameters of {@link ChannelPointsApi.createReward}. */
export interface CreateCustomRewardParams {
  /** Broadcaster who gets the reward. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Title, 45 characters at most. Must be unique among the rewards of the channel. */
  title: string;
  /** Price in Channel Points, 1 or more. */
  cost: number;
  /** Text shown to the viewer when redeeming, 200 characters at most. Goes with `is_user_input_required`. */
  prompt?: string;
  /** Whether viewers can see the reward. Twitch defaults to `true`. */
  is_enabled?: boolean;
  /** Background colour as a hex code, for example `"#9147FF"`. */
  background_color?: string;
  /** Whether the viewer has to type something when redeeming. Twitch defaults to `false`. */
  is_user_input_required?: boolean;
  /** Turns on the cap set by `max_per_stream`. Twitch defaults to `false`. */
  is_max_per_stream_enabled?: boolean;
  /** Redemptions allowed per stream, 1 or more. */
  max_per_stream?: number;
  /** Turns on the cap set by `max_per_user_per_stream`. Twitch defaults to `false`. */
  is_max_per_user_per_stream_enabled?: boolean;
  /** Redemptions allowed per viewer per stream, 1 or more. */
  max_per_user_per_stream?: number;
  /** Turns on the cooldown set by `global_cooldown_seconds`. Twitch defaults to `false`. */
  is_global_cooldown_enabled?: boolean;
  /** Seconds between two redemptions, 1 or more. Viewers only see it from 60 up. */
  global_cooldown_seconds?: number;
  /** Marks redemptions `FULFILLED` right away instead of queueing them. Twitch defaults to `false`. */
  should_redemptions_skip_request_queue?: boolean;
}

/** Parameters of {@link ChannelPointsApi.deleteReward}. */
export interface DeleteCustomRewardParams {
  /** Broadcaster who owns the reward. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the reward to delete. */
  id: string;
}

/** Parameters of {@link ChannelPointsApi.rewards}. */
export interface GetCustomRewardsParams {
  /** Broadcaster whose rewards to list. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Only these rewards. Any number: long lists are split for you. */
  id?: string | readonly string[];
  /** Only the rewards your application created and can therefore manage. Twitch defaults to `false`. */
  only_manageable_rewards?: boolean;
}

/** Where a redemption stands in the request queue. */
export type CustomRewardRedemptionStatus = "CANCELED" | "FULFILLED" | "UNFULFILLED";

/** One purchase of a custom reward by a viewer. */
export interface CustomRewardRedemption {
  /** ID of the broadcaster who owns the reward. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** ID of the redemption. */
  id: string;
  /** ID of the viewer who redeemed the reward. */
  user_id: string;
  /** Login name of the viewer. */
  user_login: string;
  /** Display name of the viewer. */
  user_name: string;
  /** What the viewer typed. An empty string when the reward asks for no input. */
  user_input: string;
  /** Current status of the redemption. */
  status: CustomRewardRedemptionStatus;
  /** When the reward was redeemed, as an RFC 3339 timestamp. */
  redeemed_at: string;
  /** The reward that was redeemed. */
  reward: {
    /** ID of the reward. */
    id: string;
    /** Title of the reward. */
    title: string;
    /** Text shown to the viewer when the reward asks for input. */
    prompt: string;
    /** Price in Channel Points. */
    cost: number;
  };
}

/** Parameters of {@link ChannelPointsApi.redemptions}. */
export interface GetCustomRewardRedemptionsParams {
  /** Broadcaster who owns the reward. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the reward whose redemptions to list. */
  reward_id: string;
  /**
   * Only redemptions with this status. Required unless you pass `id`. Canceled
   * and fulfilled redemptions stay listed for a few days only.
   */
  status?: CustomRewardRedemptionStatus;
  /** Only these redemptions. Up to 50 IDs. */
  id?: string | readonly string[];
  /** Sort order. Twitch defaults to `"OLDEST"`. */
  sort?: "OLDEST" | "NEWEST";
  /** Items per page, 1 to 50. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link ChannelPointsApi.updateReward}. Only the fields you set are changed. */
export interface UpdateCustomRewardParams {
  /** Broadcaster who owns the reward. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the reward to update. */
  id: string;
  /** New title, 45 characters at most. Must be unique among the rewards of the channel. */
  title?: string;
  /** Text shown to the viewer when redeeming, 200 characters at most. Goes with `is_user_input_required`. */
  prompt?: string;
  /** New price in Channel Points, 1 or more. */
  cost?: number;
  /** Background colour as a hex code, for example `"#00E5CB"`. */
  background_color?: string;
  /** Whether viewers can see the reward. */
  is_enabled?: boolean;
  /** Whether the viewer has to type something when redeeming. */
  is_user_input_required?: boolean;
  /** Turns the cap set by `max_per_stream` on or off. */
  is_max_per_stream_enabled?: boolean;
  /** Redemptions allowed per stream, 1 or more. */
  max_per_stream?: number;
  /** Turns the cap set by `max_per_user_per_stream` on or off. */
  is_max_per_user_per_stream_enabled?: boolean;
  /** Redemptions allowed per viewer per stream, 1 or more. */
  max_per_user_per_stream?: number;
  /** Turns the cooldown set by `global_cooldown_seconds` on or off. */
  is_global_cooldown_enabled?: boolean;
  /** Seconds between two redemptions, 1 to 604800. Viewers only see it from 60 up. */
  global_cooldown_seconds?: number;
  /** Pauses or resumes the reward. A paused reward cannot be redeemed. */
  is_paused?: boolean;
  /** Marks redemptions `FULFILLED` right away instead of queueing them. */
  should_redemptions_skip_request_queue?: boolean;
}

/** Parameters of {@link ChannelPointsApi.updateRedemptions}. */
export interface UpdateRedemptionStatusParams {
  /** Broadcaster who owns the reward. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the reward that was redeemed. */
  reward_id: string;
  /** Redemptions to update. Up to 50 IDs. */
  id: string | readonly string[];
  /** New status. `"CANCELED"` gives the viewer their points back. */
  status: "CANCELED" | "FULFILLED";
}

/** Channel Points: custom rewards and their redemptions. */
export class ChannelPointsApi extends ApiGroup {
  /**
   * Adds a custom reward to a channel. A channel holds 50 rewards at most,
   * disabled ones included.
   *
   * Token: user, scope `channel:manage:redemptions`.
   *
   * @example
   * const reward = await twitch.channelPoints.createReward({ title: "Hydrate", cost: 500 });
   * @see https://dev.twitch.tv/docs/api/reference/#create-custom-rewards
   */
  createReward(params: CreateCustomRewardParams, options?: RequestOptions): Promise<CustomReward> {
    const { broadcaster_id, ...body } = params;
    return this.rest.one<CustomReward>({
      method: "POST",
      path: "channel_points/custom_rewards",
      query: { broadcaster_id },
      body,
      auth: "user",
      scopes: ["channel:manage:redemptions"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Deletes a custom reward. Only the application that created the reward can
   * do it. Redemptions still waiting in the queue are marked as fulfilled.
   *
   * Token: user, scope `channel:manage:redemptions`.
   *
   * @example
   * await twitch.channelPoints.deleteReward({ id: "b045196d-9ce7-4a27-a9b9-279ed341ab28" });
   * @see https://dev.twitch.tv/docs/api/reference/#delete-custom-reward
   */
  deleteReward(params: DeleteCustomRewardParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "channel_points/custom_rewards",
      query: params,
      auth: "user",
      scopes: ["channel:manage:redemptions"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Lists the custom rewards of a channel, sorted by ID. Asking for IDs that
   * all turn out to be unknown fails with a 404.
   *
   * Token: user, scope `channel:read:redemptions` or `channel:manage:redemptions`.
   *
   * @example
   * const rewards = await twitch.channelPoints.rewards();
   * const mine = await twitch.channelPoints.rewards({ only_manageable_rewards: true });
   * @see https://dev.twitch.tv/docs/api/reference/#get-custom-reward
   */
  rewards(params: GetCustomRewardsParams = {}, options?: RequestOptions): Promise<CustomReward[]> {
    return this.rest.chunked<CustomReward>(
      {
        path: "channel_points/custom_rewards",
        query: params,
        auth: "user",
        scopes: ["channel:read:redemptions", "channel:manage:redemptions"],
        context: "broadcaster_id",
        options,
      },
      ["id"],
      50,
    );
  }

  /**
   * Lists the redemptions of a custom reward. Only the application that
   * created the reward can read them.
   *
   * Token: user, scope `channel:read:redemptions` or `channel:manage:redemptions`.
   *
   * @example
   * const pending = twitch.channelPoints.redemptions({ reward_id: rewardId, status: "UNFULFILLED" });
   * for await (const redemption of pending) console.log(redemption.user_name, redemption.user_input);
   * @see https://dev.twitch.tv/docs/api/reference/#get-custom-reward-redemption
   */
  redemptions(params: GetCustomRewardRedemptionsParams, options?: RequestOptions): Paginator<CustomRewardRedemption> {
    return this.rest.paginate<CustomRewardRedemption>(
      {
        path: "channel_points/custom_rewards/redemptions",
        query: params,
        auth: "user",
        scopes: ["channel:read:redemptions", "channel:manage:redemptions"],
        context: "broadcaster_id",
        options,
      },
      { max: 50 },
    );
  }

  /**
   * Changes a custom reward. Only the application that created the reward can
   * do it.
   *
   * Token: user, scope `channel:manage:redemptions`.
   *
   * @example
   * const reward = await twitch.channelPoints.updateReward({ id: rewardId, is_paused: true });
   * @see https://dev.twitch.tv/docs/api/reference/#update-custom-reward
   */
  updateReward(params: UpdateCustomRewardParams, options?: RequestOptions): Promise<CustomReward> {
    const { broadcaster_id, id, ...body } = params;
    return this.rest.one<CustomReward>({
      method: "PATCH",
      path: "channel_points/custom_rewards",
      query: { broadcaster_id, id },
      body,
      auth: "user",
      scopes: ["channel:manage:redemptions"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Fulfills or cancels redemptions that are still waiting in the queue, and
   * returns them. Only the application that created the reward can do it.
   *
   * Token: user, scope `channel:manage:redemptions`.
   *
   * @example
   * await twitch.channelPoints.updateRedemptions({
   *   reward_id: redemption.reward.id,
   *   id: redemption.id,
   *   status: "FULFILLED",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#update-redemption-status
   */
  updateRedemptions(params: UpdateRedemptionStatusParams, options?: RequestOptions): Promise<CustomRewardRedemption[]> {
    const { status, ...query } = params;
    return this.rest.data<CustomRewardRedemption>({
      method: "PATCH",
      path: "channel_points/custom_rewards/redemptions",
      query,
      body: { status },
      auth: "user",
      scopes: ["channel:manage:redemptions"],
      context: "broadcaster_id",
      options,
    });
  }
}
