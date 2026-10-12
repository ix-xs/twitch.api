import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/**
 * What a creator goal counts.
 *
 * - `follower`: followers of the channel.
 * - `subscription`: subscription points, up and down as people subscribe and leave.
 * - `subscription_count`: number of subscriptions, up and down.
 * - `new_subscription`: subscription points gained since the goal started, never going down.
 * - `new_subscription_count`: subscriptions gained since the goal started, never going down.
 * - `new_bit`: Bits used on the channel.
 * - `new_cheerer`: distinct users who cheered on the channel.
 */
export type CreatorGoalType =
  | "follower"
  | "subscription"
  | "subscription_count"
  | "new_subscription"
  | "new_subscription_count"
  | "new_bit"
  | "new_cheerer";

/** A target a broadcaster set for their channel, with its progress. */
export interface CreatorGoal {
  /** ID of the goal. */
  id: string;
  /** ID of the broadcaster who created the goal. */
  broadcaster_id: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** What the goal counts. */
  type: CreatorGoalType;
  /** Text of the goal. An empty string when the broadcaster wrote none. */
  description: string;
  /** Where the count stands now. For `follower` this is the whole follower count of the channel. */
  current_amount: number;
  /** Value the broadcaster wants to reach. */
  target_amount: number;
  /** When the goal was created, as an RFC 3339 timestamp. */
  created_at: string;
}

/** Parameters of {@link GoalsApi.get}. */
export interface GetCreatorGoalsParams {
  /** Broadcaster who created the goals. Defaults to the user making the call. */
  broadcaster_id?: string;
}

/** Creator goals of a channel. */
export class GoalsApi extends ApiGroup {
  /**
   * Lists the active goals of a broadcaster with their current progress.
   *
   * Token: user, scope `channel:read:goals`.
   *
   * @example
   * const goals = await twitch.goals.get();
   * for (const goal of goals) console.log(goal.type, goal.current_amount, goal.target_amount);
   * @see https://dev.twitch.tv/docs/api/reference/#get-creator-goals
   */
  get(params: GetCreatorGoalsParams = {}, options?: RequestOptions): Promise<CreatorGoal[]> {
    return this.rest.data<CreatorGoal>({
      path: "goals",
      query: params,
      auth: "user",
      scopes: ["channel:read:goals"],
      context: "broadcaster_id",
      options,
    });
  }
}
