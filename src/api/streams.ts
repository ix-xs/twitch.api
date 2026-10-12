import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A live broadcast. */
export interface Stream {
  /** ID of the stream. The VOD of the broadcast can be looked up with it later. */
  id: string;
  /** ID of the broadcaster. */
  user_id: string;
  /** Login name of the broadcaster. */
  user_login: string;
  /** Display name of the broadcaster. */
  user_name: string;
  /** ID of the category being streamed. An empty string when none is set. */
  game_id: string;
  /** Name of the category being streamed. An empty string when none is set. */
  game_name: string;
  /** `"live"`, or an empty string when Twitch hit an error. */
  type: "live" | "";
  /** Title of the stream. An empty string when none is set. */
  title: string;
  /** Tags applied to the stream. */
  tags: string[];
  /** Number of viewers right now. */
  viewer_count: number;
  /** When the broadcast started, as an RFC 3339 timestamp. */
  started_at: string;
  /** Language of the stream: an ISO 639-1 code, or `"other"`. */
  language: string;
  /**
   * URL of a recent frame of the stream. Replace `{width}` and `{height}`
   * with the size you want, in pixels.
   */
  thumbnail_url: string;
  /** @deprecated Always empty. Use `tags`. */
  tag_ids: string[];
  /** @deprecated Always `false`. */
  is_mature: boolean;
}

/** Parameters of {@link StreamsApi.get}. */
export interface GetStreamsParams {
  /** Only streams of these users. Up to 100 IDs. */
  user_id?: string | readonly string[];
  /** Only streams of these users. Up to 100 login names. */
  user_login?: string | readonly string[];
  /** Only streams in these categories. Up to 100 IDs. */
  game_id?: string | readonly string[];
  /** Kind of stream. Twitch defaults to `"all"`. */
  type?: "all" | "live";
  /** Only streams in these languages: ISO 639-1 codes, or `"other"`. Up to 100. */
  language?: string | readonly string[];
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the previous page. */
  before?: string;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link StreamsApi.followed}. */
export interface GetFollowedStreamsParams {
  /** User whose followed channels to check. Defaults to the user making the call. */
  user_id?: string;
  /** Items per page, 1 to 100. Twitch defaults to 100. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link StreamsApi.key}. */
export interface GetStreamKeyParams {
  /** Broadcaster who owns the channel. Defaults to the user making the call. */
  broadcaster_id?: string;
}

/** A point marked in a live stream, to come back to when editing highlights. */
export interface StreamMarker {
  /** ID of the marker. */
  id: string;
  /** When the marker was created, as an RFC 3339 timestamp. */
  created_at: string;
  /** Offset of the marker from the start of the stream, in seconds. */
  position_seconds: number;
  /** Note attached to the marker. An empty string when there is none. */
  description: string;
}

/** A marker as listed on a video, with a link to the highlighter. */
export interface VideoStreamMarker extends StreamMarker {
  /** URL that opens the video in the Twitch Highlighter at this marker. */
  url: string;
}

/** Parameters of {@link StreamsApi.createMarker}. */
export interface CreateStreamMarkerParams {
  /** Broadcaster who is live. Defaults to the user making the call. */
  user_id?: string;
  /** Note to attach to the marker, 140 characters at most. */
  description?: string;
}

/** The markers of one video, grouped under the user who created them. */
export interface StreamMarkerGroup {
  /** ID of the user who created the markers. */
  user_id: string;
  /** Display name of that user. */
  user_name: string;
  /** Login name of that user. */
  user_login: string;
  /** Videos that contain markers. Holds a single video. */
  videos: {
    /** ID of the video. */
    video_id: string;
    /** Markers of the video, oldest first. */
    markers: VideoStreamMarker[];
  }[];
}

/** Parameters of {@link StreamsApi.markers}. Give either `user_id` or `video_id`. */
export interface GetStreamMarkersParams {
  /** Reads the markers of this user's most recent video. */
  user_id?: string;
  /** Reads the markers of this video. */
  video_id?: string;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the previous page. */
  before?: string;
  /** Cursor of the next page. */
  after?: string;
}

/** Streams: who is live, stream keys and markers. */
export class StreamsApi extends ApiGroup {
  /**
   * Lists live streams, most viewers first. Without filters this is every
   * stream on Twitch. Viewer counts move while you page, so a stream can show
   * up twice or be skipped.
   *
   * Token: app or user.
   *
   * @example
   * const live = await twitch.streams.get({ user_login: ["twitchdev"] });
   * for await (const stream of twitch.streams.get({ language: "fr" })) {
   *   console.log(stream.user_name, stream.viewer_count);
   * }
   * @see https://dev.twitch.tv/docs/api/reference/#get-streams
   */
  get(params: GetStreamsParams = {}, options?: RequestOptions): Paginator<Stream> {
    return this.rest.paginate<Stream>({ path: "streams", query: params, options });
  }

  /**
   * Lists the live streams of the channels a user follows, most viewers first.
   *
   * Token: user, scope `user:read:follows`.
   *
   * @example
   * const streams = await twitch.streams.followed().all();
   * @see https://dev.twitch.tv/docs/api/reference/#get-followed-streams
   */
  followed(params: GetFollowedStreamsParams = {}, options?: RequestOptions): Paginator<Stream> {
    return this.rest.paginate<Stream>({
      path: "streams/followed",
      query: params,
      auth: "user",
      scopes: ["user:read:follows"],
      context: "user_id",
      options,
    });
  }

  /**
   * Gets the stream key of a channel. Treat it like a password.
   *
   * Token: user, scope `channel:read:stream_key`.
   *
   * @example
   * const key = await twitch.streams.key();
   * @see https://dev.twitch.tv/docs/api/reference/#get-stream-key
   */
  async key(params: GetStreamKeyParams = {}, options?: RequestOptions): Promise<string> {
    const { stream_key } = await this.rest.one<{ stream_key: string }>({
      path: "streams/key",
      query: params,
      auth: "user",
      scopes: ["channel:read:stream_key"],
      context: "broadcaster_id",
      options,
    });
    return stream_key;
  }

  /**
   * Marks the current position of a live stream. Fails when the channel is
   * offline, has VODs disabled or is airing a rerun.
   *
   * Token: user, scope `channel:manage:broadcast`.
   *
   * @example
   * const marker = await twitch.streams.createMarker({ description: "Boss fight" });
   * @see https://dev.twitch.tv/docs/api/reference/#create-stream-marker
   */
  createMarker(params: CreateStreamMarkerParams = {}, options?: RequestOptions): Promise<StreamMarker> {
    return this.rest.one<StreamMarker>({
      method: "POST",
      path: "streams/markers",
      body: params,
      auth: "user",
      scopes: ["channel:manage:broadcast"],
      context: { body: "user_id" },
      options,
    });
  }

  /**
   * Lists the markers of a user's most recent video, or of a given video.
   *
   * Token: user, scope `user:read:broadcast` or `channel:manage:broadcast`.
   *
   * @example
   * const [group] = (await twitch.streams.markers({ video_id: "1234567890" })).data;
   * @see https://dev.twitch.tv/docs/api/reference/#get-stream-markers
   */
  markers(params: GetStreamMarkersParams, options?: RequestOptions): Paginator<StreamMarkerGroup> {
    return this.rest.paginate<StreamMarkerGroup>({
      path: "streams/markers",
      query: params,
      auth: "user",
      scopes: ["user:read:broadcast", "channel:manage:broadcast"],
      options,
    });
  }
}
