import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { chunk, toArray } from "../util.js";
import { ApiGroup } from "./base.js";

/** A passage of a video whose sound was removed by Twitch's audio recognition. */
export interface VideoMutedSegment {
  /** Length of the muted passage, in seconds. */
  duration: number;
  /** Where the muted passage starts, in seconds from the start of the video. */
  offset: number;
}

/** A published video: a past broadcast, a highlight or an upload. */
export interface Video {
  /** ID of the video. */
  id: string;
  /** ID of the stream the video was recorded from. `null` unless `type` is `"archive"`. */
  stream_id: string | null;
  /** ID of the broadcaster who owns the video. */
  user_id: string;
  /** Login name of the broadcaster. */
  user_login: string;
  /** Display name of the broadcaster. */
  user_name: string;
  /** Title of the video. */
  title: string;
  /** Description of the video. */
  description: string;
  /** When the video was created, as an RFC 3339 timestamp. */
  created_at: string;
  /** When the video was published, as an RFC 3339 timestamp. */
  published_at: string;
  /** URL of the video page. */
  url: string;
  /**
   * URL of a preview image. Replace `%{width}` and `%{height}` with the size
   * you want, in pixels. Twitch currently only serves 320 by 180.
   */
  thumbnail_url: string;
  /** Who can watch the video. Always `"public"`. */
  viewable: "public";
  /** Number of views. */
  view_count: number;
  /** Language of the video: an ISO 639-1 code, or `"other"`. */
  language: string;
  /** Kind of video: a past broadcast, a highlight or an upload. */
  type: "archive" | "highlight" | "upload";
  /** Length of the video, written like `"3m21s"`. */
  duration: string;
  /** Passages muted by Twitch, or `null` when there are none. */
  muted_segments: VideoMutedSegment[] | null;
}

/** Parameters of {@link VideosApi.get}. Give exactly one of `id`, `user_id` and `game_id`. */
export interface GetVideosParams {
  /** These videos. Up to 100 IDs. */
  id?: string | readonly string[];
  /** Videos of this user. */
  user_id?: string;
  /** Videos in this category. Twitch returns 500 of them at most. */
  game_id?: string;
  /** Only videos in this language: an ISO 639-1 code, or `"other"`. Only with `game_id`. */
  language?: string;
  /** Only videos published within this period. Twitch defaults to `"all"`. Only with `game_id` or `user_id`. */
  period?: "all" | "day" | "month" | "week";
  /**
   * Order of the results: newest first, fastest growing first or most viewed
   * first. Twitch defaults to `"time"`. Only with `game_id` or `user_id`.
   */
  sort?: "time" | "trending" | "views";
  /** Only videos of this kind. Twitch defaults to `"all"`. Only with `game_id` or `user_id`. */
  type?: "all" | "archive" | "highlight" | "upload";
  /** Items per page, 1 to 100. Twitch defaults to 20. Only with `game_id` or `user_id`. */
  first?: number;
  /** Cursor of the next page. Only with `user_id`. */
  after?: string;
  /** Cursor of the previous page. Only with `user_id`. */
  before?: string;
}

/** Parameters of {@link VideosApi.delete}. */
export interface DeleteVideosParams {
  /** IDs of the videos to delete. Any number: long lists are split for you. */
  id: string | readonly string[];
}

/** Videos: VODs, highlights and uploads. */
export class VideosApi extends ApiGroup {
  /**
   * Gets videos by ID, or lists the videos of a user or of a category. The
   * filters only apply when listing by user or by category.
   *
   * Token: app or user.
   *
   * @example
   * const [video] = (await twitch.videos.get({ id: "1234567890" })).data;
   * for await (const vod of twitch.videos.get({ user_id: "141981764", type: "archive" })) {
   *   console.log(vod.title, vod.duration);
   * }
   * @see https://dev.twitch.tv/docs/api/reference/#get-videos
   */
  get(params: GetVideosParams, options?: RequestOptions): Paginator<Video> {
    return this.rest.paginate<Video>({ path: "videos", query: params, options });
  }

  /**
   * Deletes videos and resolves with the IDs that were deleted. Twitch takes
   * 5 IDs per request, so longer lists go out as several requests, one after
   * the other. Within one request, a single video the user may not delete
   * keeps all 5 from being deleted.
   *
   * Token: user, scope `channel:manage:videos`.
   *
   * @example
   * const deleted = await twitch.videos.delete({ id: ["1234567890", "1234567891"] });
   * @see https://dev.twitch.tv/docs/api/reference/#delete-videos
   */
  async delete(params: DeleteVideosParams, options?: RequestOptions): Promise<string[]> {
    const deleted: string[] = [];
    for (const id of chunk(toArray(params.id), 5)) {
      const ids = await this.rest.data<string>({
        method: "DELETE",
        path: "videos",
        query: { id },
        auth: "user",
        scopes: ["channel:manage:videos"],
        options,
      });
      deleted.push(...ids);
    }
    return deleted;
  }
}
