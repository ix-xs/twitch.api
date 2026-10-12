import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A clip that was just requested. It takes a few seconds to become available. */
export interface CreatedClip {
  /** ID of the clip. */
  id: string;
  /** URL of the page where the clip can be trimmed, renamed and published. */
  edit_url: string;
}

/** Parameters of {@link ClipsApi.create}. */
export interface CreateClipParams {
  /** Broadcaster whose live stream to clip. */
  broadcaster_id: string;
  /** Title of the clip. Twitch picks one when left out. */
  title?: string;
  /** Length of the clip in seconds, 5 to 60 with one decimal. Twitch defaults to 30. */
  duration?: number;
}

/** Parameters of {@link ClipsApi.createFromVod}. */
export interface CreateClipFromVodParams {
  /**
   * Editor of the channel who creates the clip, or the broadcaster.
   * Defaults to the user making the call.
   */
  editor_id?: string;
  /** Broadcaster who owns the video. */
  broadcaster_id: string;
  /** ID of the video to clip. */
  vod_id: string;
  /**
   * Where the clip ends, in seconds from the start of the video. The clip
   * covers the `duration` seconds before this point, so it cannot be smaller
   * than `duration`.
   */
  vod_offset: number;
  /** Length of the clip in seconds, 5 to 60 with one decimal. Twitch defaults to 30. */
  duration?: number;
  /** Title of the clip. */
  title: string;
}

/** A clip: a short extract of a stream. */
export interface Clip {
  /** ID of the clip. */
  id: string;
  /** URL of the clip page. */
  url: string;
  /** URL to put in an iframe to embed the clip. */
  embed_url: string;
  /** ID of the broadcaster the clip was taken from. */
  broadcaster_id: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** ID of the user who made the clip. */
  creator_id: string;
  /** Display name of the user who made the clip. */
  creator_name: string;
  /** ID of the video the clip comes from. An empty string when the video is gone. */
  video_id: string;
  /** ID of the category that was being streamed. */
  game_id: string;
  /** Language of the broadcaster: an ISO 639-1 code, or `"other"`. */
  language: string;
  /** Title of the clip. */
  title: string;
  /** Number of views. */
  view_count: number;
  /** When the clip was created, as an RFC 3339 timestamp. */
  created_at: string;
  /** URL of a preview image. */
  thumbnail_url: string;
  /** Length of the clip in seconds, with one decimal. */
  duration: number;
  /**
   * Where the clip starts in the video, in seconds. `null` when the video is
   * not available, and for the first minutes after a clip is made live.
   */
  vod_offset: number | null;
  /** Whether the broadcaster featured the clip. */
  is_featured: boolean;
}

/** Parameters of {@link ClipsApi.get}. Give exactly one of `broadcaster_id`, `game_id` and `id`. */
export interface GetClipsParams {
  /** Clips taken from the streams of this broadcaster. */
  broadcaster_id?: string;
  /** Clips taken from streams in this category. */
  game_id?: string;
  /** These clips. Up to 100 IDs. */
  id?: string | readonly string[];
  /** Only clips created from this moment on. */
  started_at?: string | Date;
  /** Only clips created before this moment. Twitch defaults to one week after `started_at`. */
  ended_at?: string | Date;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the previous page. */
  before?: string;
  /** Cursor of the next page. */
  after?: string;
  /** `true` for featured clips only, `false` for the others only. Both kinds when left out. */
  is_featured?: boolean;
}

/** Temporary links to the video files of a clip. */
export interface ClipDownload {
  /** ID of the clip. */
  clip_id: string;
  /** URL of the landscape video file, or `null` when there is none. */
  landscape_download_url: string | null;
  /** URL of the portrait video file, or `null` when there is none. */
  portrait_download_url: string | null;
}

/** Parameters of {@link ClipsApi.downloads}. */
export interface GetClipsDownloadParams {
  /**
   * Editor of the channel who asks for the files, or the broadcaster.
   * Defaults to the user making the call.
   */
  editor_id?: string;
  /** Broadcaster who owns the clips. */
  broadcaster_id: string;
  /** IDs of the clips to download. Any number: long lists are split for you. */
  clip_id: string | readonly string[];
}

/** Clips: create, look up and download clips. */
export class ClipsApi extends ApiGroup {
  /**
   * Clips the last seconds of a live stream. The clip is made in the
   * background: look it up with {@link ClipsApi.get} to know when it is ready,
   * and consider it failed when it is still missing after 60 seconds.
   *
   * Token: user, scope `clips:edit`.
   *
   * @example
   * const clip = await twitch.clips.create({ broadcaster_id: "141981764", title: "What a save" });
   * console.log(clip.edit_url);
   * @see https://dev.twitch.tv/docs/api/reference/#create-clip
   */
  create(params: CreateClipParams, options?: RequestOptions): Promise<CreatedClip> {
    return this.rest.one<CreatedClip>({
      method: "POST",
      path: "clips",
      query: params,
      auth: "user",
      scopes: ["clips:edit"],
      options,
    });
  }

  /**
   * Clips a passage of a video, as the broadcaster or one of the channel's
   * editors. It also works on the video of a stream that is still live.
   *
   * Token: app or user, scope `editor:manage:clips` or `channel:manage:clips`.
   *
   * @example
   * const clip = await twitch.clips.createFromVod({
   *   editor_id: "141981764",
   *   broadcaster_id: "141981764",
   *   vod_id: "2301456789",
   *   vod_offset: 600,
   *   title: "Opening",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#create-clip-from-vod
   */
  createFromVod(params: CreateClipFromVodParams, options?: RequestOptions): Promise<CreatedClip> {
    return this.rest.one<CreatedClip>({
      method: "POST",
      path: "videos/clips",
      query: params,
      scopes: ["editor:manage:clips", "channel:manage:clips"],
      context: "editor_id",
      options,
    });
  }

  /**
   * Lists the clips of a broadcaster or of a category, most viewed first, or
   * gets clips by ID. Twitch stops paging after about 1000 results: narrow the
   * dates to reach more.
   *
   * Token: app or user.
   *
   * @example
   * const top = await twitch.clips.get({ broadcaster_id: "141981764" }).take(10);
   * const [clip] = (await twitch.clips.get({ id: "BraveQuietHeronPogChamp" })).data;
   * @see https://dev.twitch.tv/docs/api/reference/#get-clips
   */
  get(params: GetClipsParams, options?: RequestOptions): Paginator<Clip> {
    return this.rest.paginate<Clip>({ path: "clips", query: params, options });
  }

  /**
   * Gets temporary links to the video files of clips, as the broadcaster or
   * one of the channel's editors.
   *
   * Token: app or user, scope `editor:manage:clips` or `channel:manage:clips`.
   *
   * @example
   * const [file] = await twitch.clips.downloads({
   *   editor_id: "141981764",
   *   broadcaster_id: "141981764",
   *   clip_id: "BraveQuietHeronPogChamp",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#get-clips-download
   */
  downloads(params: GetClipsDownloadParams, options?: RequestOptions): Promise<ClipDownload[]> {
    return this.rest.chunked<ClipDownload>(
      {
        path: "clips/downloads",
        query: params,
        scopes: ["editor:manage:clips", "channel:manage:clips"],
        context: "editor_id",
        options,
      },
      ["clip_id"],
      10,
    );
  }
}
