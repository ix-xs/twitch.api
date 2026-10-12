import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** One rank of the Bits leaderboard. */
export interface BitsLeaderboardEntry {
  /** ID of the user. */
  user_id: string;
  /** Login name of the user. */
  user_login: string;
  /** Display name of the user. */
  user_name: string;
  /** Position on the leaderboard, starting at 1. */
  rank: number;
  /** Number of Bits the user cheered over the period. */
  score: number;
}

/** The Bits leaderboard of a channel over one period. */
export interface BitsLeaderboard {
  /** Ranked users, biggest cheerer first. Empty when nobody cheered. */
  data: BitsLeaderboardEntry[];
  /** The period the ranking covers. Both fields are empty strings when `started_at` was not given. */
  date_range: {
    /** Start of the period, as an RFC 3339 timestamp. */
    started_at: string;
    /** End of the period, as an RFC 3339 timestamp. */
    ended_at: string;
  };
  /** Number of entries in `data`. */
  total: number;
}

/** Parameters of {@link BitsApi.leaderboard}. */
export interface GetBitsLeaderboardParams {
  /** Number of entries to return, 1 to 100. Twitch defaults to 10. */
  count?: number;
  /** Length of the period to rank, counted in Pacific time. Twitch defaults to `"all"`, the whole life of the channel. */
  period?: "day" | "week" | "month" | "year" | "all";
  /**
   * A moment inside the period to rank. Needed for every `period` except
   * `"all"`. Twitch converts it to Pacific time before picking the day, week,
   * month or year it falls in.
   */
  started_at?: string | Date;
  /** Centers the result on this user, with the ranks just above and below when `count` allows. */
  user_id?: string;
}

/** The bit amounts at which a Cheermote changes look. */
export type CheermoteTierId = "1" | "100" | "500" | "1000" | "5000" | "10000" | "100000";

/** Image URLs of one Cheermote tier: by theme, then by format, then by scale. */
export type CheermoteImages = Record<
  "dark" | "light",
  Record<"animated" | "static", Record<"1" | "1.5" | "2" | "3" | "4", string>>
>;

/** One level of a Cheermote, used from `min_bits` up to the next level. */
export interface CheermoteTier {
  /** Smallest number of Bits cheered at this level. */
  min_bits: number;
  /** Name of the level. */
  id: CheermoteTierId;
  /** Hex color of the level, such as `#979797`. */
  color: string;
  /** Images of the level. */
  images: CheermoteImages;
  /** Whether users can cheer at this level. */
  can_cheer: boolean;
  /** Whether the level appears in the Bits card. */
  show_in_bits_card: boolean;
}

/** An animated emote that carries Bits when typed in chat with an amount, such as `Cheer100`. */
export interface Cheermote {
  /** Text typed before the amount. `Cheer` gives `Cheer100`. */
  prefix: string;
  /** Levels of the Cheermote, each with its own images. */
  tiers: CheermoteTier[];
  /**
   * Where the Cheermote comes from: Twitch (`global_first_party` in the Bits
   * card, `global_third_party` outside of it), a broadcaster
   * (`channel_custom`) or a sponsor who adds Bits on top (`sponsored`).
   * `display_only` is internal to Twitch.
   */
  type: "global_first_party" | "global_third_party" | "channel_custom" | "display_only" | "sponsored";
  /** Position in the Bits card. Unique within one `type` only, and not always consecutive. */
  order: number;
  /** When the Cheermote was last changed, as an RFC 3339 timestamp. */
  last_updated: string;
  /** Whether cheering with it is matched by a contribution during charity campaigns. */
  is_charitable: boolean;
}

/** Parameters of {@link BitsApi.cheermotes}. */
export interface GetCheermotesParams {
  /** Also include the custom Cheermotes of this broadcaster. Without it only the global ones are returned. */
  broadcaster_id?: string;
}

/** One image in three sizes. */
export interface CustomPowerUpImage {
  /** URL of the small version. */
  url_1x: string;
  /** URL of the medium version. */
  url_2x: string;
  /** URL of the large version. */
  url_4x: string;
}

/** A Power-up created by a broadcaster, which viewers redeem with Bits. */
export interface CustomPowerUp {
  /** ID of the broadcaster. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** ID of the Power-up. */
  id: string;
  /** Title of the Power-up. */
  title: string;
  /** Question shown to the viewer when `is_user_input_required` is `true`. */
  prompt: string;
  /** Price in Bits. */
  bits: number;
  /** Images uploaded by the broadcaster, or `null` when there are none. */
  image: CustomPowerUpImage | null;
  /** Images Twitch falls back to. */
  default_image: CustomPowerUpImage;
  /** Background color as a hex code, such as `#00E5CB`. */
  background_color: string;
  /** Whether the Power-up is enabled. Disabled ones are hidden from viewers. */
  is_enabled: boolean;
  /** Whether the viewer has to type something when redeeming. */
  is_user_input_required: boolean;
  /** Cap on redemptions per live stream. */
  max_per_stream_setting: {
    /** Whether the cap applies. */
    is_enabled: boolean;
    /** Largest number of redemptions in one stream. */
    max_per_stream: number;
  };
  /** Cap on redemptions per viewer per live stream. */
  max_per_user_per_stream_setting: {
    /** Whether the cap applies. */
    is_enabled: boolean;
    /** Largest number of redemptions by one viewer in one stream. */
    max_per_user_per_stream: number;
  };
  /** Pause imposed between two redemptions. */
  global_cooldown_setting: {
    /** Whether the cooldown applies. */
    is_enabled: boolean;
    /** Length of the cooldown, in seconds. */
    global_cooldown_seconds: number;
  };
  /** Whether the Power-up is paused. Paused ones cannot be redeemed. */
  is_paused: boolean;
  /** Whether the Power-up is in stock. Out of stock ones cannot be redeemed. */
  is_in_stock: boolean;
  /**
   * Redemptions counted against the per stream cap so far, or `null` when the
   * channel is offline or the cap is off.
   */
  redemptions_redeemed_current_stream: number | null;
  /** When the cooldown ends, as an RFC 3339 timestamp, or `null` when none is running. */
  cooldown_expires_at: string | null;
}

/** Parameters of {@link BitsApi.customPowerUps}. */
export interface GetCustomPowerUpsParams {
  /** Broadcaster who created the Power-ups. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Only these Power-ups. Any number: long lists are split for you. */
  id?: string | readonly string[];
}

/** A purchase of a digital product inside an extension. */
export interface ExtensionTransaction {
  /** ID of the transaction. */
  id: string;
  /** When the purchase was made, as an RFC 3339 timestamp. */
  timestamp: string;
  /** ID of the broadcaster on whose channel the purchase was made. */
  broadcaster_id: string;
  /** Login name of that broadcaster. */
  broadcaster_login: string;
  /** Display name of that broadcaster. */
  broadcaster_name: string;
  /** ID of the buyer. */
  user_id: string;
  /** Login name of the buyer. */
  user_login: string;
  /** Display name of the buyer. */
  user_name: string;
  /** Kind of transaction. */
  product_type: "BITS_IN_EXTENSION";
  /** The product that was bought. */
  product_data: {
    /** SKU of the product. */
    sku: string;
    /** `twitch.ext.` followed by the ID of the extension. */
    domain: string;
    /** What the buyer paid. */
    cost: {
      /** Amount paid. */
      amount: number;
      /** Currency of the amount. */
      type: "bits";
    };
    /** Whether the product is still in development, in which case it cannot be bought for real. */
    inDevelopment: boolean;
    /** Name of the product. */
    displayName: string;
    /** Always an empty string: only products that have not expired can be bought. */
    expiration: string;
    /** Whether the purchase was announced to every instance of the extension. */
    broadcast: boolean;
  };
}

/** Parameters of {@link BitsApi.extensionTransactions}. */
export interface GetExtensionTransactionsParams {
  /** ID of the extension. It must be the client ID the app token was issued for. */
  extension_id: string;
  /** Only these transactions. Up to 100 IDs. */
  id?: string | readonly string[];
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Bits: leaderboard, Cheermotes, custom Power-ups and extension transactions. */
export class BitsApi extends ApiGroup {
  /**
   * Gets the Bits leaderboard of the channel of the user making the call,
   * over its whole life or over a given day, week, month or year.
   *
   * Token: user, scope `bits:read`.
   *
   * @example
   * const top = await twitch.bits.leaderboard({ count: 5 });
   * for (const entry of top.data) console.log(entry.rank, entry.user_name, entry.score);
   * const week = await twitch.bits.leaderboard({ period: "week", started_at: new Date() });
   * @see https://dev.twitch.tv/docs/api/reference/#get-bits-leaderboard
   */
  async leaderboard(params: GetBitsLeaderboardParams = {}, options?: RequestOptions): Promise<BitsLeaderboard> {
    const body = await this.rest.request<BitsLeaderboard>({
      path: "bits/leaderboard",
      query: params,
      auth: "user",
      scopes: ["bits:read"],
      options,
    });
    return { data: body.data, date_range: body.date_range, total: body.total };
  }

  /**
   * Lists the Cheermotes usable in every channel, plus the custom ones of a
   * broadcaster when you name one.
   *
   * Token: app or user.
   *
   * @example
   * const cheermotes = await twitch.bits.cheermotes({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-cheermotes
   */
  cheermotes(params: GetCheermotesParams = {}, options?: RequestOptions): Promise<Cheermote[]> {
    return this.rest.data<Cheermote>({ path: "bits/cheermotes", query: params, options });
  }

  /**
   * Lists the custom Power-ups a broadcaster created, enabled or not. Asking
   * for IDs of which none exists fails with a 404.
   *
   * Token: user, scope `bits:read`.
   *
   * @example
   * const powerUps = await twitch.bits.customPowerUps();
   * @see https://dev.twitch.tv/docs/api/reference/#get-custom-power-up
   */
  customPowerUps(params: GetCustomPowerUpsParams = {}, options?: RequestOptions): Promise<CustomPowerUp[]> {
    return this.rest.chunked<CustomPowerUp>(
      {
        path: "bits/custom_power_ups",
        query: params,
        auth: "user",
        scopes: ["bits:read"],
        context: "broadcaster_id",
        options,
      },
      ["id"],
      50,
    );
  }

  /**
   * Lists the purchases made with Bits inside an extension. Only works with
   * the app token of the extension itself.
   *
   * Token: app.
   *
   * @example
   * for await (const transaction of twitch.bits.extensionTransactions({ extension_id: "uo6dggojyb8d6soh92zknwmi5ej1q2" })) {
   *   console.log(transaction.user_name, transaction.product_data.sku);
   * }
   * @see https://dev.twitch.tv/docs/api/reference/#get-extension-transactions
   */
  extensionTransactions(
    params: GetExtensionTransactionsParams,
    options?: RequestOptions,
  ): Paginator<ExtensionTransaction> {
    return this.rest.paginate<ExtensionTransaction>({
      path: "extensions/transactions",
      query: params,
      auth: "app",
      options,
    });
  }
}
