import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A category found by a search. */
export interface CategorySearchResult {
  /** ID of the category. */
  id: string;
  /** Name of the category. */
  name: string;
  /** URL of the box art. */
  box_art_url: string;
}

/** Parameters of {@link SearchApi.categories}. */
export interface SearchCategoriesParams {
  /** Text to look for. Pass it as is, it is URL encoded for you. */
  query: string;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** A channel found by a search. */
export interface ChannelSearchResult {
  /** Language of the broadcaster: an ISO 639-1 code, or `"other"`. */
  broadcaster_language: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  display_name: string;
  /** ID of the category being streamed, or of the last one that was. */
  game_id: string;
  /** Name of the category being streamed, or of the last one that was. */
  game_name: string;
  /** ID of the broadcaster. */
  id: string;
  /** Whether the channel is live right now. */
  is_live: boolean;
  /** @deprecated Always empty. Use `tags`. */
  tag_ids: string[];
  /** Tags applied to the channel. */
  tags: string[];
  /** URL of the broadcaster's profile picture. */
  thumbnail_url: string;
  /** Title of the stream. An empty string when none is set. */
  title: string;
  /** When the stream started, as an RFC 3339 timestamp. An empty string when the channel is offline. */
  started_at: string;
}

/** Parameters of {@link SearchApi.channels}. */
export interface SearchChannelsParams {
  /** Text to look for. Pass it as is, it is URL encoded for you. */
  query: string;
  /** `true` to keep only channels that are live. Twitch defaults to `false`. */
  live_only?: boolean;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Search for categories and channels. */
export class SearchApi extends ApiGroup {
  /**
   * Finds the categories whose name contains every word of the query, in any
   * order and whatever the case.
   *
   * Token: app or user.
   *
   * @example
   * const categories = await twitch.search.categories({ query: "fort" }).take(5);
   * @see https://dev.twitch.tv/docs/api/reference/#search-categories
   */
  categories(params: SearchCategoriesParams, options?: RequestOptions): Paginator<CategorySearchResult> {
    return this.rest.paginate<CategorySearchResult>({ path: "search/categories", query: params, options });
  }

  /**
   * Finds channels that streamed in the last six months. The query is matched
   * against the start of the login name, or with `live_only` against the start
   * of the broadcaster's name and of the category name.
   *
   * Token: app or user.
   *
   * @example
   * for await (const channel of twitch.search.channels({ query: "speedrun", live_only: true })) {
   *   console.log(channel.display_name, channel.title);
   * }
   * @see https://dev.twitch.tv/docs/api/reference/#search-channels
   */
  channels(params: SearchChannelsParams, options?: RequestOptions): Paginator<ChannelSearchResult> {
    return this.rest.paginate<ChannelSearchResult>({ path: "search/channels", query: params, options });
  }
}
