import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A stream tag from the old list of tags defined by Twitch. */
export interface StreamTag {
  /** ID of the tag. */
  tag_id: string;
  /** Whether Twitch applies the tag by itself. Broadcasters cannot add such a tag. */
  is_auto: boolean;
  /** Name of the tag in each language. Keys are locales such as `"en-us"`. */
  localization_names: Record<string, string>;
  /** Description of the tag in each language. Keys are locales such as `"en-us"`. */
  localization_descriptions: Record<string, string>;
}

/** Parameters of {@link TagsApi.all}. */
export interface GetAllStreamTagsParams {
  /** Only these tags. Up to 100 IDs. */
  tag_id?: string | readonly string[];
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link TagsApi.ofChannel}. */
export interface GetStreamTagsParams {
  /** Broadcaster whose tags to list. */
  broadcaster_id: string;
}

/** Stream tags (deprecated by Twitch, kept for completeness). */
export class TagsApi extends ApiGroup {
  /**
   * Lists the stream tags defined by Twitch.
   *
   * Token: app or user.
   *
   * @deprecated Twitch replaced these tags with free text ones in 2023 and
   * this endpoint no longer returns any.
   * @example
   * const tags = await twitch.tags.all().all();
   * @see https://dev.twitch.tv/docs/api/reference/#get-all-stream-tags
   */
  all(params: GetAllStreamTagsParams = {}, options?: RequestOptions): Paginator<StreamTag> {
    return this.rest.paginate<StreamTag>({ path: "tags/streams", query: params, options });
  }

  /**
   * Lists the Twitch defined tags applied to a channel.
   *
   * Token: app or user.
   *
   * @deprecated Twitch replaced these tags with free text ones in 2023. Read
   * the `tags` field of the channel information instead.
   * @example
   * const tags = await twitch.tags.ofChannel({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-stream-tags
   */
  ofChannel(params: GetStreamTagsParams, options?: RequestOptions): Promise<StreamTag[]> {
    return this.rest.data<StreamTag>({ path: "streams/tags", query: params, options });
  }
}
