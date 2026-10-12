import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** What a channel is set up to broadcast: title, category, language and tags. */
export interface ChannelInformation {
  /** ID of the broadcaster. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** Language of the channel: an ISO 639-1 code, or `"other"`. */
  broadcaster_language: string;
  /** Name of the current or last category. An empty string when the channel never had one. */
  game_name: string;
  /** ID of the current or last category. An empty string when the channel never had one. */
  game_id: string;
  /** Title of the current or last stream. An empty string when the channel never streamed. */
  title: string;
  /**
   * Stream delay in seconds. Stays at `0` unless the call is made with the
   * token of this broadcaster, who must be a partner with a delay set.
   */
  delay: number;
  /** Tags applied to the channel. */
  tags: string[];
  /** IDs of the content classification labels applied to the channel. */
  content_classification_labels: string[];
  /** Whether the channel is flagged as showing branded content. */
  is_branded_content: boolean;
}

/** Parameters of {@link ChannelsApi.get}. */
export interface GetChannelInformationParams {
  /** IDs of the broadcasters to get. Any number: long lists are split for you. */
  broadcaster_id: string | readonly string[];
}

/** The content classification labels a broadcaster can turn on or off. */
export type ChannelContentLabelId =
  | "DebatedSocialIssuesAndPolitics"
  | "DrugsIntoxication"
  | "SexualThemes"
  | "ViolentGraphic"
  | "Gambling"
  | "ProfanityVulgarity";

/** One content classification label to switch on or off. */
export interface ChannelContentLabel {
  /** ID of the label. */
  id: ChannelContentLabelId;
  /** `true` adds the label to the channel, `false` removes it. */
  is_enabled: boolean;
}

/** Parameters of {@link ChannelsApi.update}. Set at least one field besides `broadcaster_id`. */
export interface ModifyChannelInformationParams {
  /** Broadcaster whose channel to update. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the category to set. `"0"` or an empty string clears it. */
  game_id?: string;
  /** Language of the channel: an ISO 639-1 code, or `"other"`. */
  broadcaster_language?: string;
  /** Stream title, 140 characters at most. Cannot be empty. */
  title?: string;
  /** Stream delay in seconds, 900 at most. Partners only. */
  delay?: number;
  /**
   * Tags to apply, replacing the current ones. Up to 10, each 25 characters at
   * most, without spaces or special characters. An empty array removes them all.
   */
  tags?: readonly string[];
  /** Labels to switch on or off. Labels you leave out keep their current state. */
  content_classification_labels?: readonly ChannelContentLabel[];
  /** Whether the channel shows branded content. */
  is_branded_content?: boolean;
}

/** A user allowed to edit a channel on behalf of its broadcaster. */
export interface ChannelEditor {
  /** ID of the editor. */
  user_id: string;
  /** Display name of the editor. */
  user_name: string;
  /** When the user was made an editor, as an RFC 3339 timestamp. */
  created_at: string;
}

/** Parameters of {@link ChannelsApi.editors}. */
export interface GetChannelEditorsParams {
  /** Broadcaster who owns the channel. Defaults to the user making the call. */
  broadcaster_id?: string;
}

/** A channel that a user follows. */
export interface FollowedChannel {
  /** ID of the followed broadcaster. */
  broadcaster_id: string;
  /** Login name of the followed broadcaster. */
  broadcaster_login: string;
  /** Display name of the followed broadcaster. */
  broadcaster_name: string;
  /** When the user started following, as an RFC 3339 timestamp. */
  followed_at: string;
}

/** Parameters of {@link ChannelsApi.followed}. */
export interface GetFollowedChannelsParams {
  /** User whose follows to list. Defaults to the user making the call. */
  user_id?: string;
  /** Only this broadcaster: the list holds one item when the user follows them, none otherwise. */
  broadcaster_id?: string;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** A user who follows a channel. */
export interface ChannelFollower {
  /** ID of the follower. */
  user_id: string;
  /** Login name of the follower. */
  user_login: string;
  /** Display name of the follower. */
  user_name: string;
  /** When the user started following, as an RFC 3339 timestamp. */
  followed_at: string;
}

/** Parameters of {@link ChannelsApi.followers}. */
export interface GetChannelFollowersParams {
  /** Broadcaster whose followers to list. */
  broadcaster_id: string;
  /** Only this user: the list holds one item when they follow the broadcaster, none otherwise. */
  user_id?: string;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Channels: title, category and tags, editors, follows and followers. */
export class ChannelsApi extends ApiGroup {
  /**
   * Gets the title, category, language and tags of one or more channels.
   * Channels that do not exist are left out of the result.
   *
   * Token: app or user.
   *
   * @example
   * const [channel] = await twitch.channels.get({ broadcaster_id: "141981764" });
   * console.log(channel?.title, channel?.game_name);
   * @see https://dev.twitch.tv/docs/api/reference/#get-channel-information
   */
  get(params: GetChannelInformationParams, options?: RequestOptions): Promise<ChannelInformation[]> {
    return this.rest.chunked<ChannelInformation>({ path: "channels", query: params, options }, ["broadcaster_id"]);
  }

  /**
   * Changes the title, category, language, tags, delay or content labels of a
   * channel. Only the fields you set are touched.
   *
   * Token: user, scope `channel:manage:broadcast`.
   *
   * @example
   * await twitch.channels.update({ title: "Speedrun practice", game_id: "33214", tags: ["Speedrun"] });
   * @see https://dev.twitch.tv/docs/api/reference/#modify-channel-information
   */
  update(params: ModifyChannelInformationParams = {}, options?: RequestOptions): Promise<void> {
    const { broadcaster_id, ...body } = params;
    return this.rest.send({
      method: "PATCH",
      path: "channels",
      query: { broadcaster_id },
      body,
      auth: "user",
      scopes: ["channel:manage:broadcast"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Lists the editors of a channel.
   *
   * Token: user, scope `channel:read:editors`.
   *
   * @example
   * const editors = await twitch.channels.editors();
   * @see https://dev.twitch.tv/docs/api/reference/#get-channel-editors
   */
  editors(params: GetChannelEditorsParams = {}, options?: RequestOptions): Promise<ChannelEditor[]> {
    return this.rest.data<ChannelEditor>({
      path: "channels/editors",
      query: params,
      auth: "user",
      scopes: ["channel:read:editors"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Lists the channels a user follows, most recent follow first. With
   * `broadcaster_id` it tells whether the user follows that one channel.
   *
   * Token: user, scope `user:read:follows`.
   *
   * @example
   * for await (const follow of twitch.channels.followed()) console.log(follow.broadcaster_name);
   * const count = await twitch.channels.followed().total();
   * const follows = (await twitch.channels.followed({ broadcaster_id: "141981764" })).data.length > 0;
   * @see https://dev.twitch.tv/docs/api/reference/#get-followed-channels
   */
  followed(params: GetFollowedChannelsParams = {}, options?: RequestOptions): Paginator<FollowedChannel> {
    return this.rest.paginate<FollowedChannel>({
      path: "channels/followed",
      query: params,
      auth: "user",
      scopes: ["user:read:follows"],
      context: "user_id",
      options,
    });
  }

  /**
   * Lists the followers of a channel, most recent first. The list itself is
   * only returned to the broadcaster or one of their moderators, with the
   * `moderator:read:followers` scope. Any other token gets an empty list but
   * still gets the follower count, which is what `total()` reads. With
   * `user_id` it tells whether that one user follows the channel.
   *
   * Token: app or user. Scope `moderator:read:followers` to get the list.
   *
   * @example
   * const latest = await twitch.channels.followers({ broadcaster_id: "141981764" }).take(10);
   * const count = await twitch.channels.followers({ broadcaster_id: "141981764" }).total();
   * @see https://dev.twitch.tv/docs/api/reference/#get-channel-followers
   */
  followers(params: GetChannelFollowersParams, options?: RequestOptions): Paginator<ChannelFollower> {
    return this.rest.paginate<ChannelFollower>({ path: "channels/followers", query: params, prefer: "user", options });
  }
}
