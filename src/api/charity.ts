import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** An amount of money, kept as an integer to avoid rounding. */
export interface CharityAmount {
  /** Amount in the smallest unit of the currency. `550` is 5.50 USD. */
  value: number;
  /** Number of decimals of the currency. Divide `value` by 10 to this power to get the usual amount. */
  decimal_places: number;
  /** ISO 4217 code of the currency, such as `USD`. */
  currency: string;
}

/** A fundraiser a broadcaster is running for a charity. */
export interface CharityCampaign {
  /** ID of the campaign. */
  id: string;
  /** ID of the broadcaster running the campaign. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** Name of the charity. */
  charity_name: string;
  /** What the charity does. */
  charity_description: string;
  /** URL of the logo of the charity, a 100 by 100 pixels PNG. */
  charity_logo: string;
  /** URL of the website of the charity. */
  charity_website: string;
  /** Money raised so far. */
  current_amount: CharityAmount;
  /** Money the broadcaster aims to raise, or `null` when no goal is set. */
  target_amount: CharityAmount | null;
}

/** Parameters of {@link CharityApi.campaign}. */
export interface GetCharityCampaignParams {
  /** Broadcaster running the campaign. Defaults to the user making the call. */
  broadcaster_id?: string;
}

/** One donation to a charity campaign. */
export interface CharityDonation {
  /** ID of the donation, unique across campaigns. */
  id: string;
  /** ID of the campaign the money went to. */
  campaign_id: string;
  /** ID of the donor. */
  user_id: string;
  /** Login name of the donor. */
  user_login: string;
  /** Display name of the donor. */
  user_name: string;
  /** Money given. */
  amount: CharityAmount;
}

/** Parameters of {@link CharityApi.donations}. */
export interface GetCharityDonationsParams {
  /** Broadcaster running the campaign. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Charity: the active campaign and its donations. */
export class CharityApi extends ApiGroup {
  /**
   * Gets the charity campaign a broadcaster is running, or `null` when there
   * is none. A campaign can no longer be read once it has ended.
   *
   * Token: user, scope `channel:read:charity`.
   *
   * @example
   * const campaign = await twitch.charity.campaign();
   * if (campaign) console.log(campaign.charity_name, campaign.current_amount.value);
   * @see https://dev.twitch.tv/docs/api/reference/#get-charity-campaign
   */
  campaign(params: GetCharityCampaignParams = {}, options?: RequestOptions): Promise<CharityCampaign | null> {
    return this.rest.first<CharityCampaign>({
      path: "charity/campaigns",
      query: params,
      auth: "user",
      scopes: ["channel:read:charity"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Lists the donations made to the campaign a broadcaster is running. The
   * list is empty when no campaign is active.
   *
   * Token: user, scope `channel:read:charity`.
   *
   * @example
   * for await (const donation of twitch.charity.donations()) {
   *   console.log(donation.user_name, donation.amount.value / 10 ** donation.amount.decimal_places);
   * }
   * @see https://dev.twitch.tv/docs/api/reference/#get-charity-campaign-donations
   */
  donations(params: GetCharityDonationsParams = {}, options?: RequestOptions): Paginator<CharityDonation> {
    return this.rest.paginate<CharityDonation>({
      path: "charity/donations",
      query: params,
      auth: "user",
      scopes: ["channel:read:charity"],
      context: "broadcaster_id",
      options,
    });
  }
}
