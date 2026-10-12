import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A raid that was requested and has not left yet. */
export interface PendingRaid {
  /** When the raid was requested, as an RFC 3339 timestamp. */
  created_at: string;
  /** @deprecated Always `false`. */
  is_mature: boolean;
}

/** Parameters of {@link RaidsApi.start}. */
export interface StartRaidParams {
  /** Broadcaster who sends their viewers. Defaults to the user making the call. */
  from_broadcaster_id?: string;
  /** ID of the broadcaster to raid. */
  to_broadcaster_id: string;
}

/** Parameters of {@link RaidsApi.cancel}. */
export interface CancelRaidParams {
  /** Broadcaster who started the raid. Defaults to the user making the call. */
  broadcaster_id?: string;
}

/** Raids: start one, cancel a pending one. */
export class RaidsApi extends ApiGroup {
  /**
   * Prepares a raid on another channel. The viewers only leave once the
   * broadcaster confirms in the Twitch interface or after a 90 second
   * countdown, so listen to the channel raid event to know that it happened.
   * Limited to 10 calls per 10 minutes.
   *
   * Token: user, scope `channel:manage:raids`.
   *
   * @example
   * const raid = await twitch.raids.start({ to_broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#start-a-raid
   */
  start(params: StartRaidParams, options?: RequestOptions): Promise<PendingRaid> {
    return this.rest.one<PendingRaid>({
      method: "POST",
      path: "raids",
      query: params,
      auth: "user",
      scopes: ["channel:manage:raids"],
      context: "from_broadcaster_id",
      options,
    });
  }

  /**
   * Cancels a raid that has not left yet. Limited to 10 calls per 10 minutes.
   *
   * Token: user, scope `channel:manage:raids`.
   *
   * @example
   * await twitch.raids.cancel();
   * @see https://dev.twitch.tv/docs/api/reference/#cancel-a-raid
   */
  cancel(params: CancelRaidParams = {}, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "raids",
      query: params,
      auth: "user",
      scopes: ["channel:manage:raids"],
      context: "broadcaster_id",
      options,
    });
  }
}
