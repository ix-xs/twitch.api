import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** Where a Drops entitlement stands: claimed by the user, or delivered by the game. */
export type DropsFulfillmentStatus = "CLAIMED" | "FULFILLED";

/** A Drops reward a user earned. */
export interface DropsEntitlement {
  /** ID of the entitlement. */
  id: string;
  /** ID of the reward. */
  benefit_id: string;
  /** When the entitlement was granted, as an RFC 3339 timestamp. */
  timestamp: string;
  /** ID of the user who earned the reward. */
  user_id: string;
  /** ID of the game the reward belongs to. */
  game_id: string;
  /** Whether the reward was only claimed or already delivered. */
  fulfillment_status: DropsFulfillmentStatus;
  /** When the entitlement last changed, as an RFC 3339 timestamp. */
  last_updated: string;
}

/** Parameters of {@link EntitlementsApi.drops}. */
export interface GetDropsEntitlementsParams {
  /** Only these entitlements. Up to 100 IDs. */
  id?: string | readonly string[];
  /** Only entitlements of this user. App tokens only: a user token always reads its own user. */
  user_id?: string;
  /** Only entitlements of this game. */
  game_id?: string;
  /** Only entitlements with this status. */
  fulfillment_status?: DropsFulfillmentStatus;
  /** Cursor of the next page. */
  after?: string;
  /** Items per page, 1 to 1000. Twitch defaults to 20. */
  first?: number;
}

/** Parameters of {@link EntitlementsApi.updateDrops}. */
export interface UpdateDropsEntitlementsParams {
  /** IDs of the entitlements to change. Up to 100. */
  entitlement_ids?: readonly string[];
  /** Status to give them. */
  fulfillment_status?: DropsFulfillmentStatus;
}

/** The outcome of an update for a group of entitlements. */
export interface DropsEntitlementUpdate {
  /**
   * What happened to the entitlements listed in `ids`. `"UPDATE_FAILED"` is
   * temporary: try those again later.
   */
  status: "INVALID_ID" | "NOT_FOUND" | "SUCCESS" | "UNAUTHORIZED" | "UPDATE_FAILED";
  /** IDs of the entitlements this status applies to. */
  ids: string[];
}

/** Drops entitlements: list them and mark them fulfilled. */
export class EntitlementsApi extends ApiGroup {
  /**
   * Lists the Drops entitlements of your organization, in no particular
   * order. An app token reads those of every user, a user token only those of
   * its own user. Your client ID must belong to the organization that owns
   * the game.
   *
   * Token: app or user.
   *
   * @example
   * const claimed = twitch.entitlements.drops({ game_id: "33214", fulfillment_status: "CLAIMED" });
   * for await (const entitlement of claimed) console.log(entitlement.user_id, entitlement.benefit_id);
   * @see https://dev.twitch.tv/docs/api/reference/#get-drops-entitlements
   */
  drops(params: GetDropsEntitlementsParams = {}, options?: RequestOptions): Paginator<DropsEntitlement> {
    return this.rest.paginate<DropsEntitlement>({ path: "entitlements/drops", query: params, options }, { max: 1000 });
  }

  /**
   * Sets the status of Drops entitlements, typically to `"FULFILLED"` once
   * the reward was delivered in game. The result groups the IDs by outcome, so
   * check it: a call can succeed for some entitlements only.
   *
   * Token: app or user.
   *
   * @example
   * const results = await twitch.entitlements.updateDrops({
   *   entitlement_ids: ["0b6a2c1e-5d47-4f0a-9c3e-7a1d2e8f4b65"],
   *   fulfillment_status: "FULFILLED",
   * });
   * const failed = results.filter((result) => result.status !== "SUCCESS");
   * @see https://dev.twitch.tv/docs/api/reference/#update-drops-entitlements
   */
  updateDrops(params: UpdateDropsEntitlementsParams = {}, options?: RequestOptions): Promise<DropsEntitlementUpdate[]> {
    return this.rest.data<DropsEntitlementUpdate>({
      method: "PATCH",
      path: "entitlements/drops",
      body: params,
      options,
    });
  }
}
