import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** What Twitch answered to a request to run a commercial. */
export interface CommercialStatus {
  /** Length of the commercial that was requested, in seconds. Capped at 180. */
  length: number;
  /** Tells whether Twitch could serve an ad. Often an empty string. */
  message: string;
  /** Seconds to wait before another commercial can be started. */
  retry_after: number;
}

/** Parameters of {@link AdsApi.startCommercial}. */
export interface StartCommercialParams {
  /** Broadcaster who runs the commercial. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Wanted length in seconds, 180 at most. The ad that is served can be a little shorter or longer. */
  length: number;
}

/**
 * A point in time as the ad endpoints send it. Twitch documents an RFC 3339
 * string, but these endpoints have also been seen answering with Unix seconds
 * as a number, so handle both: `typeof value === "number" ? new Date(value * 1000) : new Date(value)`.
 */
export type AdTimestamp = string | number;

/** The ad schedule of a channel. */
export interface AdSchedule {
  /** Number of snoozes the broadcaster has left. */
  snooze_count: number;
  /** When the broadcaster gets one more snooze. See {@link AdTimestamp}. */
  snooze_refresh_at: AdTimestamp;
  /** When the next ad is due. Empty or `0` when none is scheduled or the channel is offline. See {@link AdTimestamp}. */
  next_ad_at: AdTimestamp;
  /** Length of the next ad break, in seconds. */
  duration: number;
  /** When the last ad break ran. Empty or `0` when there was none or the channel is offline. See {@link AdTimestamp}. */
  last_ad_at: AdTimestamp;
  /** Seconds left without pre-roll ads. `0` when pre-rolls are being shown. */
  preroll_free_time: number;
}

/** Parameters of {@link AdsApi.schedule}. */
export interface GetAdScheduleParams {
  /** Broadcaster whose schedule to read. Defaults to the user making the call. */
  broadcaster_id?: string;
}

/** The state of the schedule right after an ad was snoozed. */
export interface AdSnooze {
  /** Number of snoozes the broadcaster has left. */
  snooze_count: number;
  /** When the broadcaster gets one more snooze. See {@link AdTimestamp}. */
  snooze_refresh_at: AdTimestamp;
  /** New time of the next ad. See {@link AdTimestamp}. */
  next_ad_at: AdTimestamp;
}

/** Parameters of {@link AdsApi.snooze}. */
export interface SnoozeNextAdParams {
  /** Broadcaster whose ad to push back. Defaults to the user making the call. */
  broadcaster_id?: string;
}

/** Ads: run commercials, read the ad schedule, snooze the next ad. */
export class AdsApi extends ApiGroup {
  /**
   * Starts a commercial break on a channel. The broadcaster must be a partner
   * or an affiliate and must be live. With an app token, the broadcaster must
   * have granted the scope to your application.
   *
   * Token: app or user, scope `channel:edit:commercial`.
   *
   * @example
   * const { retry_after } = await twitch.ads.startCommercial({ broadcaster_id: "141981764", length: 60 });
   * @see https://dev.twitch.tv/docs/api/reference/#start-commercial
   */
  startCommercial(params: StartCommercialParams, options?: RequestOptions): Promise<CommercialStatus> {
    return this.rest.one<CommercialStatus>({
      method: "POST",
      path: "channels/commercial",
      body: params,
      scopes: ["channel:edit:commercial"],
      context: { body: "broadcaster_id" },
      options,
    });
  }

  /**
   * Gets the ad schedule of a channel: next and last ad, snoozes left and
   * remaining time without pre-rolls. With an app token, the broadcaster must
   * have granted the scope to your application.
   *
   * Token: app or user, scope `channel:read:ads`.
   *
   * @example
   * const schedule = await twitch.ads.schedule({ broadcaster_id: "141981764" });
   * console.log(schedule.next_ad_at, schedule.snooze_count);
   * @see https://dev.twitch.tv/docs/api/reference/#get-ad-schedule
   */
  schedule(params: GetAdScheduleParams = {}, options?: RequestOptions): Promise<AdSchedule> {
    return this.rest.one<AdSchedule>({
      path: "channels/ads",
      query: params,
      scopes: ["channel:read:ads"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Pushes the next automatic mid-roll ad back by five minutes, at the cost
   * of one snooze. With an app token, the broadcaster must have granted the
   * scope to your application.
   *
   * Token: app or user, scope `channel:manage:ads`.
   *
   * @example
   * const { next_ad_at } = await twitch.ads.snooze({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#snooze-next-ad
   */
  snooze(params: SnoozeNextAdParams = {}, options?: RequestOptions): Promise<AdSnooze> {
    return this.rest.one<AdSnooze>({
      method: "POST",
      path: "channels/ads/schedule/snooze",
      query: params,
      scopes: ["channel:manage:ads"],
      context: "broadcaster_id",
      options,
    });
  }
}
