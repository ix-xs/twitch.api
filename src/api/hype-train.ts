import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A top contributor of a Hype Train, for one way of contributing. */
export interface HypeTrainContribution {
  /** ID of the contributor. */
  user_id: string;
  /** Login name of the contributor. */
  user_login: string;
  /** Display name of the contributor. */
  user_name: string;
  /** How the points were earned: cheering Bits, subscribing or gifting subscriptions, or anything else. */
  type: "bits" | "subscription" | "other";
  /** Points the user contributed this way. */
  total: number;
}

/** A channel taking part in a shared Hype Train. */
export interface HypeTrainParticipant {
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
}

/** A Hype Train in progress. */
export interface HypeTrain {
  /** ID of the Hype Train. */
  id: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Level the train is at. */
  level: number;
  /** Points contributed since the train started. */
  total: number;
  /** Points contributed within the current level. */
  progress: number;
  /** Points the current level needs to be completed. */
  goal: number;
  /** The biggest contributors. */
  top_contributions: HypeTrainContribution[];
  /** Channels that share the train, or `null` when it is not shared. */
  shared_train_participants: HypeTrainParticipant[] | null;
  /** When the train started, as an RFC 3339 timestamp. */
  started_at: string;
  /** When the train ends unless a new level pushes it back, as an RFC 3339 timestamp. */
  expires_at: string;
  /** Kind of train. */
  type: "treasure" | "golden_kappa" | "regular";
  /** Whether the train runs across several channels at once. */
  is_shared_train: boolean;
}

/** The best Hype Train a channel ever had. */
export interface HypeTrainRecord {
  /** Level the train reached. */
  level: number;
  /** Points contributed to that train. */
  total: number;
  /** When the record was set, as an RFC 3339 timestamp. */
  achieved_at: string;
}

/** The Hype Train of a channel right now, and its records. */
export interface HypeTrainStatus {
  /** The train in progress, or `null` when none is running. */
  current: HypeTrain | null;
  /** Record of the channel on its own trains, or `null` when it never had one. */
  all_time_high: HypeTrainRecord | null;
  /** Record of the channel on shared trains, or `null` when it never had one. */
  shared_all_time_high: HypeTrainRecord | null;
}

/** Parameters of {@link HypeTrainApi.status}. */
export interface GetHypeTrainStatusParams {
  /** Broadcaster whose Hype Train to read. Defaults to the user making the call. */
  broadcaster_id?: string;
}

/** Hype Train: the current train and the channel records. */
export class HypeTrainApi extends ApiGroup {
  /**
   * Gets the Hype Train running on a channel, if any, along with the records
   * of the channel.
   *
   * Token: user, scope `channel:read:hype_train`.
   *
   * @example
   * const { current, all_time_high } = await twitch.hypeTrain.status();
   * if (current) console.log(`Level ${current.level}: ${current.progress} / ${current.goal}`);
   * @see https://dev.twitch.tv/docs/api/reference/#get-hype-train-status
   */
  status(params: GetHypeTrainStatusParams = {}, options?: RequestOptions): Promise<HypeTrainStatus> {
    return this.rest.one<HypeTrainStatus>({
      path: "hypetrain/status",
      query: params,
      auth: "user",
      scopes: ["channel:read:hype_train"],
      context: "broadcaster_id",
      options,
    });
  }
}
