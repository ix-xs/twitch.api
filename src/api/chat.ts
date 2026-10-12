import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { chunk } from "../util.js";
import { ApiGroup } from "./base.js";

/** A user connected to a channel's chat. */
export interface Chatter {
  /** ID of the user. */
  user_id: string;
  /** Login name of the user. */
  user_login: string;
  /** Display name of the user. */
  user_name: string;
}

/** Parameters of {@link ChatApi.chatters}. */
export interface GetChattersParams {
  /** Broadcaster whose chat to read. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** Items per page, 1 to 1000. Twitch defaults to 100. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** File formats an emote can be served in: an animated GIF or a static PNG. */
export type ChatEmoteFormat = "animated" | "static";

/** Sizes an emote can be served in: 28, 56 and 112 pixels. */
export type ChatEmoteScale = "1.0" | "2.0" | "3.0";

/** Backgrounds an emote can be served for. */
export type ChatEmoteThemeMode = "dark" | "light";

/** Ready made URLs of an emote. They always point to the static image on a light background. */
export interface ChatEmoteImages {
  /** URL of the 28 pixel image. */
  url_1x: string;
  /** URL of the 56 pixel image. */
  url_2x: string;
  /** URL of the 112 pixel image. */
  url_4x: string;
}

/** An emote. This is the shape of a global emote, and the base of the channel and emote set ones. */
export interface ChatEmote {
  /** ID of the emote. */
  id: string;
  /** Name of the emote, which is what viewers type in chat to post it. */
  name: string;
  /** Ready made image URLs. Prefer the `template` of the list, which covers every variant. */
  images: ChatEmoteImages;
  /** Formats the emote exists in. */
  format: ChatEmoteFormat[];
  /** Sizes the emote exists in. */
  scale: ChatEmoteScale[];
  /** Backgrounds the emote exists for. */
  theme_mode: ChatEmoteThemeMode[];
}

/** A custom emote of a channel. */
export interface ChatChannelEmote extends ChatEmote {
  /** Subscription tier that unlocks the emote. An empty string unless `emote_type` is `"subscriptions"`. */
  tier: string;
  /** How viewers unlock the emote: with Bits, by following or by subscribing. */
  emote_type: "bitstier" | "follower" | "subscriptions";
  /** ID of the emote set the emote belongs to. */
  emote_set_id: string;
}

/** An emote as listed in an emote set. */
export interface ChatSetEmote extends ChatEmote {
  /** How viewers unlock the emote: with Bits, by following or by subscribing. */
  emote_type: "bitstier" | "follower" | "subscriptions";
  /** ID of the emote set the emote belongs to. */
  emote_set_id: string;
  /** ID of the broadcaster who owns the emote. */
  owner_id: string;
}

/** A list of emotes, with the URL template to build their image URLs from. */
export interface ChatEmoteList<T> {
  /** The emotes. */
  data: T[];
  /**
   * Image URL with the placeholders `{{id}}`, `{{format}}`, `{{theme_mode}}` and
   * `{{scale}}`. Fill them with the values of an emote to get its CDN URL.
   */
  template: string;
}

/** Parameters of {@link ChatApi.channelEmotes}. */
export interface GetChannelEmotesParams {
  /** Broadcaster whose custom emotes to get. */
  broadcaster_id: string;
}

/** Parameters of {@link ChatApi.emoteSets}. */
export interface GetEmoteSetsParams {
  /** IDs of the emote sets to get. Any number: long lists are split for you. */
  emote_set_id: string | readonly string[];
}

/** One version of a chat badge. */
export interface ChatBadgeVersion {
  /** ID of the version within its set. For Bits badges this is the tier, for example. */
  id: string;
  /** URL of the 18 pixel image. */
  image_url_1x: string;
  /** URL of the 36 pixel image. */
  image_url_2x: string;
  /** URL of the 72 pixel image. */
  image_url_4x: string;
  /** Title of the badge. */
  title: string;
  /** Description of the badge. */
  description: string;
  /** What a click on the badge does, or `null` when it does nothing. */
  click_action: string | null;
  /** Page a click on the badge opens, or `null` when there is none. */
  click_url: string | null;
}

/** A set of chat badges, such as `"subscriber"` or `"bits"`, with all its versions. */
export interface ChatBadgeSet {
  /** ID of the set. */
  set_id: string;
  /** Badges of the set, sorted by ID. */
  versions: ChatBadgeVersion[];
}

/** Parameters of {@link ChatApi.channelBadges}. */
export interface GetChannelChatBadgesParams {
  /** Broadcaster whose custom badges to get. */
  broadcaster_id: string;
}

/** The chat settings of a channel. */
export interface ChatSettings {
  /** ID of the broadcaster. */
  broadcaster_id: string;
  /** Whether messages may only contain emotes. */
  emote_mode: boolean;
  /** Whether only followers may chat. */
  follower_mode: boolean;
  /** Minutes a user must have followed the channel before chatting. `null` when `follower_mode` is off. */
  follower_mode_duration: number | null;
  /** ID of the moderator the call was made for. Only present with a user token that has the `moderator:read:chat_settings` scope. */
  moderator_id?: string;
  /**
   * Whether messages are held back for a moment so moderators can remove them
   * first. Only present when the call names a moderator and uses their token
   * with the `moderator:read:chat_settings` scope.
   */
  non_moderator_chat_delay?: boolean;
  /** Length of that delay, in seconds. `null` when the delay is off. Present under the same conditions. */
  non_moderator_chat_delay_duration?: number | null;
  /** Whether users must wait between two messages. */
  slow_mode: boolean;
  /** Seconds a user must wait between two messages. `null` when `slow_mode` is off. */
  slow_mode_wait_time: number | null;
  /** Whether only subscribers may chat. */
  subscriber_mode: boolean;
  /** Whether a user may not post the same message twice. */
  unique_chat_mode: boolean;
}

/** Parameters of {@link ChatApi.settings}. */
export interface GetChatSettingsParams {
  /** Broadcaster whose chat settings to get. */
  broadcaster_id: string;
  /**
   * The broadcaster or one of their moderators. Only needed to read the chat
   * delay settings, and the call must then be made with that user's token.
   */
  moderator_id?: string;
}

/** A shared chat session, where several channels have their chats merged. */
export interface SharedChatSession {
  /** ID of the session. */
  session_id: string;
  /** ID of the broadcaster who hosts the session. */
  host_broadcaster_id: string;
  /** Channels taking part in the session, host included. */
  participants: SharedChatParticipant[];
  /** When the session started, as an RFC 3339 timestamp. */
  created_at: string;
  /** When the session last changed, as an RFC 3339 timestamp. */
  updated_at: string;
}

/** A channel taking part in a shared chat session. */
export interface SharedChatParticipant {
  /** ID of the broadcaster. */
  broadcaster_id: string;
}

/** Parameters of {@link ChatApi.sharedSession}. */
export interface GetSharedChatSessionParams {
  /** Broadcaster whose shared chat session to get. */
  broadcaster_id: string;
}

/** How a user obtained an emote. */
export type ChatUserEmoteType =
  | "none"
  | "bitstier"
  | "follower"
  | "subscriptions"
  | "channelpoints"
  | "rewards"
  | "hypetrain"
  | "prime"
  | "turbo"
  | "smilies"
  | "globals"
  | "owl2019"
  | "twofactor"
  | "limitedtime";

/** An emote a user can post. */
export interface ChatUserEmote {
  /** ID of the emote. */
  id: string;
  /** Name of the emote, which is what the user types in chat to post it. Case sensitive. */
  name: string;
  /** How the user obtained the emote. */
  emote_type: ChatUserEmoteType;
  /** ID of the emote set the emote belongs to. An empty string when it belongs to none. */
  emote_set_id: string;
  /** ID of the broadcaster who owns the emote. An empty string when it has no owner. */
  owner_id: string;
  /** Formats the emote exists in. */
  format: ChatEmoteFormat[];
  /** Sizes the emote exists in. */
  scale: ChatEmoteScale[];
  /** Backgrounds the emote exists for. */
  theme_mode: ChatEmoteThemeMode[];
}

/** Raw body of one page of {@link ChatApi.userEmotes}, reachable through `page.raw`. */
export interface ChatUserEmotePage extends ChatEmoteList<ChatUserEmote> {
  /** Holds the cursor of the next page. Empty on the last one. */
  pagination: { cursor?: string };
}

/** Parameters of {@link ChatApi.userEmotes}. */
export interface GetUserEmotesParams {
  /** User whose emotes to list. Defaults to the user making the call. */
  user_id?: string;
  /** Makes sure the follower emotes of this broadcaster are part of the result. */
  broadcaster_id?: string;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link ChatApi.updateSettings}. Settings you leave out are untouched. */
export interface UpdateChatSettingsParams {
  /** Broadcaster whose chat settings to change. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** Whether messages may only contain emotes. */
  emote_mode?: boolean;
  /** Whether only followers may chat. */
  follower_mode?: boolean;
  /** Minutes a user must have followed the channel before chatting, 0 to 129600. Send it with `follower_mode: true`. */
  follower_mode_duration?: number;
  /** Whether messages are held back for a moment so moderators can remove them first. */
  non_moderator_chat_delay?: boolean;
  /** Length of that delay, in seconds. Send it with `non_moderator_chat_delay: true`. */
  non_moderator_chat_delay_duration?: 2 | 4 | 6;
  /** Whether users must wait between two messages. */
  slow_mode?: boolean;
  /** Seconds a user must wait between two messages, 3 to 120. Send it with `slow_mode: true`. */
  slow_mode_wait_time?: number;
  /** Whether only subscribers may chat. */
  subscriber_mode?: boolean;
  /** Whether a user may not post the same message twice. */
  unique_chat_mode?: boolean;
}

/** Highlight colors of a chat announcement. `"primary"` is the accent color of the channel. */
export type ChatAnnouncementColor = "blue" | "green" | "orange" | "purple" | "primary";

/** Parameters of {@link ChatApi.announce}. */
export interface SendChatAnnouncementParams {
  /** Broadcaster whose chat receives the announcement. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** Text of the announcement. Anything past 500 characters is cut. */
  message: string;
  /** Highlight color. Twitch defaults to `"primary"`. */
  color?: ChatAnnouncementColor;
  /**
   * During a shared chat session, whether only this channel gets the
   * announcement. App tokens only, where it defaults to `true`. Twitch rejects
   * it with a user token.
   */
  for_source_only?: boolean;
}

/** Parameters of {@link ChatApi.shoutout}. */
export interface SendShoutoutParams {
  /** Broadcaster who gives the shoutout. */
  from_broadcaster_id: string;
  /** Broadcaster who receives the shoutout. */
  to_broadcaster_id: string;
  /** The broadcaster giving the shoutout or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
}

/** Parameters of {@link ChatApi.send}. */
export interface SendChatMessageParams {
  /** Broadcaster whose chat receives the message. */
  broadcaster_id: string;
  /** User who sends the message. Defaults to the user making the call. */
  sender_id?: string;
  /** Text of the message, 500 characters at most. Emote names are turned into emotes. */
  message: string;
  /** ID of the message this one replies to. */
  reply_parent_message_id?: string;
  /**
   * During a shared chat session, whether only this channel gets the message.
   * App tokens only. Twitch rejects it with a user token.
   */
  for_source_only?: boolean;
  /**
   * Pins the message for 20 minutes as it is sent. The sender must be the
   * broadcaster or a moderator and also needs the
   * `moderator:manage:chat_messages` scope. Cannot be used together with
   * `reply_parent_message_id` or `for_source_only`.
   */
  pin?: boolean;
}

/** Why Twitch refused to deliver a chat message. */
export interface ChatMessageDropReason {
  /** Machine readable code of the reason. */
  code: string;
  /** Explanation of the reason. */
  message: string;
}

/** The outcome of {@link ChatApi.send}. */
export interface SentChatMessage {
  /** ID of the message. */
  message_id: string;
  /** Whether the message passed every check and reached the chat. */
  is_sent: boolean;
  /** Why the message was not delivered. Absent or `null` when it was. */
  drop_reason?: ChatMessageDropReason | null;
}

/** One piece of a pinned chat message: plain text, an emote, a cheermote or a mention. */
export interface PinnedChatMessageFragment {
  /** Kind of fragment. */
  type: "text" | "emote" | "cheermote" | "mention";
  /** Text of the fragment. */
  text: string;
  /** Details of the cheermote, or `null` for any other kind of fragment. */
  cheermote: {
    /** Prefix of the cheermote, the part before the amount. */
    prefix: string;
    /** Number of Bits cheered. */
    bits: number;
    /** Tier of the cheermote. */
    tier: number;
  } | null;
  /** Details of the emote, or `null` for any other kind of fragment. */
  emote: {
    /** ID of the emote. */
    id: string;
    /** ID of the emote set the emote belongs to. */
    emote_set_id: string;
    /** ID of the broadcaster who owns the emote. */
    owner_id: string;
    /** Formats the emote exists in. */
    format: ChatEmoteFormat[];
  } | null;
  /** Details of the mentioned user, or `null` for any other kind of fragment. */
  mention: {
    /** ID of the mentioned user. */
    user_id: string;
    /** Login name of the mentioned user. */
    user_login: string;
    /** Display name of the mentioned user. */
    user_name: string;
  } | null;
}

/** The message pinned at the top of a chat by the broadcaster or a moderator. */
export interface PinnedChatMessage {
  /** ID of the pinned message. */
  message_id: string;
  /** ID of the broadcaster who owns the chat. */
  broadcaster_id: string;
  /** ID of the user who wrote the message. */
  sender_user_id: string;
  /** Login name of the user who wrote the message. */
  sender_user_login: string;
  /** Display name of the user who wrote the message. */
  sender_user_name: string;
  /** ID of the user who pinned the message. */
  pinned_by_user_id: string;
  /** Login name of the user who pinned the message. */
  pinned_by_user_login: string;
  /** Display name of the user who pinned the message. */
  pinned_by_user_name: string;
  /** Content of the message. */
  message: {
    /** The whole message as plain text. */
    text: string;
    /** The message cut into its parts, in order. */
    fragments: PinnedChatMessageFragment[];
  };
  /** When the message was pinned, as an RFC 3339 timestamp. */
  starts_at: string;
  /** When the pin expires, as an RFC 3339 timestamp. `null` when it lasts until the stream ends. */
  ends_at: string | null;
  /** When the pin was last changed, as an RFC 3339 timestamp. */
  updated_at: string;
}

/** Parameters of {@link ChatApi.pinnedMessage}. */
export interface GetPinnedChatMessageParams {
  /** Broadcaster who owns the chat. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
}

/** Parameters of {@link ChatApi.pin}. */
export interface PinChatMessageParams {
  /** Broadcaster who owns the chat. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the message to pin. */
  message_id: string;
  /** Seconds the message stays pinned, 30 to 1800. Without it the pin lasts until the stream ends. */
  duration_seconds?: number;
}

/** Parameters of {@link ChatApi.updatePin}. */
export interface UpdatePinnedChatMessageParams {
  /** Broadcaster who owns the chat. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the pinned message. */
  message_id: string;
  /** Seconds the message stays pinned counting from now, 30 to 1800. Without it the pin lasts until the stream ends. */
  duration_seconds?: number;
}

/** Parameters of {@link ChatApi.unpin}. */
export interface UnpinChatMessageParams {
  /** Broadcaster who owns the chat. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the message to unpin. */
  message_id: string;
}

/** The color of a user's name in chat. */
export interface UserChatColor {
  /** ID of the user. */
  user_id: string;
  /** Login name of the user. */
  user_login: string;
  /** Display name of the user. */
  user_name: string;
  /** Hex code of the color, such as `"#9146FF"`. An empty string when the user never picked one. */
  color: string;
}

/** Parameters of {@link ChatApi.colors}. */
export interface GetUserChatColorParams {
  /** IDs of the users to look up. Any number: long lists are split for you. */
  user_id: string | readonly string[];
}

/** The name colors every user can pick. */
export type ChatColorName =
  | "blue"
  | "blue_violet"
  | "cadet_blue"
  | "chocolate"
  | "coral"
  | "dodger_blue"
  | "firebrick"
  | "golden_rod"
  | "green"
  | "hot_pink"
  | "orange_red"
  | "red"
  | "sea_green"
  | "spring_green"
  | "yellow_green";

/** Parameters of {@link ChatApi.setColor}. */
export interface UpdateUserChatColorParams {
  /** User whose color to change. Defaults to the user making the call. */
  user_id?: string;
  /** A named color, or a hex code such as `"#9146FF"` for Turbo and Prime users. */
  color: ChatColorName | (string & {});
}

/** Chat: send messages and announcements, chatters, emotes, badges, settings, colors, pins and shoutouts. */
export class ChatApi extends ApiGroup {
  /**
   * Lists the users connected to a channel's chat. Twitch refreshes the list
   * with a delay, so recent joins and departures can be missing.
   *
   * Token: app or user, scope `moderator:read:chatters`.
   *
   * @example
   * const count = await twitch.chat.chatters({ broadcaster_id: "141981764" }).total();
   * for await (const chatter of twitch.chat.chatters({ broadcaster_id: "141981764" })) {
   *   console.log(chatter.user_login);
   * }
   * @see https://dev.twitch.tv/docs/api/reference/#get-chatters
   */
  chatters(params: GetChattersParams, options?: RequestOptions): Paginator<Chatter> {
    return this.rest.paginate<Chatter>(
      {
        path: "chat/chatters",
        query: params,
        scopes: ["moderator:read:chatters"],
        context: "moderator_id",
        options,
      },
      { max: 1000 },
    );
  }

  /**
   * Gets the custom emotes of a channel: subscriber, follower and Bits tier emotes.
   *
   * Token: app or user.
   *
   * @example
   * const { data, template } = await twitch.chat.channelEmotes({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-channel-emotes
   */
  async channelEmotes(params: GetChannelEmotesParams, options?: RequestOptions): Promise<ChatEmoteList<ChatChannelEmote>> {
    const { data, template } = await this.rest.request<ChatEmoteList<ChatChannelEmote>>({
      path: "chat/emotes",
      query: params,
      options,
    });
    return { data, template };
  }

  /**
   * Gets the emotes made by Twitch that work in every chat.
   *
   * Token: app or user.
   *
   * @example
   * const { data, template } = await twitch.chat.globalEmotes();
   * @see https://dev.twitch.tv/docs/api/reference/#get-global-emotes
   */
  async globalEmotes(options?: RequestOptions): Promise<ChatEmoteList<ChatEmote>> {
    const { data, template } = await this.rest.request<ChatEmoteList<ChatEmote>>({
      path: "chat/emotes/global",
      options,
    });
    return { data, template };
  }

  /**
   * Gets the emotes of one or more emote sets. Sets that do not exist are
   * left out of the result.
   *
   * Token: app or user.
   *
   * @example
   * const { data, template } = await twitch.chat.emoteSets({ emote_set_id: ["301590448", "318939165"] });
   * @see https://dev.twitch.tv/docs/api/reference/#get-emote-sets
   */
  async emoteSets(params: GetEmoteSetsParams, options?: RequestOptions): Promise<ChatEmoteList<ChatSetEmote>> {
    const ids = typeof params.emote_set_id === "string" ? [params.emote_set_id] : params.emote_set_id;
    const bodies = await Promise.all(
      chunk(ids, 25).map((emote_set_id) =>
        this.rest.request<ChatEmoteList<ChatSetEmote>>({ path: "chat/emotes/set", query: { emote_set_id }, options }),
      ),
    );
    return { data: bodies.flatMap((body) => body.data), template: bodies[0]?.template ?? "" };
  }

  /**
   * Gets the custom chat badges of a channel, such as its subscriber and Bits
   * badges. The list is empty when the channel has none.
   *
   * Token: app or user.
   *
   * @example
   * const sets = await twitch.chat.channelBadges({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-channel-chat-badges
   */
  channelBadges(params: GetChannelChatBadgesParams, options?: RequestOptions): Promise<ChatBadgeSet[]> {
    return this.rest.data<ChatBadgeSet>({ path: "chat/badges", query: params, options });
  }

  /**
   * Gets the chat badges made by Twitch that can show up in every chat.
   *
   * Token: app or user.
   *
   * @example
   * const sets = await twitch.chat.globalBadges();
   * @see https://dev.twitch.tv/docs/api/reference/#get-global-chat-badges
   */
  globalBadges(options?: RequestOptions): Promise<ChatBadgeSet[]> {
    return this.rest.data<ChatBadgeSet>({ path: "chat/badges/global", options });
  }

  /**
   * Gets the chat settings of a channel. The chat delay settings are only
   * included when `moderator_id` is given and the call is made as that user
   * with the `moderator:read:chat_settings` scope.
   *
   * Token: app or user.
   *
   * @example
   * const settings = await twitch.chat.settings({ broadcaster_id: "141981764" });
   * if (settings.slow_mode) console.log(settings.slow_mode_wait_time);
   * @see https://dev.twitch.tv/docs/api/reference/#get-chat-settings
   */
  settings(params: GetChatSettingsParams, options?: RequestOptions): Promise<ChatSettings> {
    return this.rest.one<ChatSettings>({ path: "chat/settings", query: params, options });
  }

  /**
   * Gets the shared chat session a channel is part of, or `null` when it is
   * not in one.
   *
   * Token: app or user.
   *
   * @example
   * const session = await twitch.chat.sharedSession({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-shared-chat-session
   */
  sharedSession(params: GetSharedChatSessionParams, options?: RequestOptions): Promise<SharedChatSession | null> {
    return this.rest.first<SharedChatSession>({ path: "shared_chat/session", query: params, options });
  }

  /**
   * Lists every emote a user can post, across all channels. The URL template
   * comes with each page, as `page.raw.template`.
   *
   * Token: user, scope `user:read:emotes`.
   *
   * @example
   * const page = await twitch.chat.userEmotes();
   * console.log(page.data.length, page.raw.template);
   * @see https://dev.twitch.tv/docs/api/reference/#get-user-emotes
   */
  userEmotes(params: GetUserEmotesParams = {}, options?: RequestOptions): Paginator<ChatUserEmote, ChatUserEmotePage> {
    return this.rest.paginate<ChatUserEmote, ChatUserEmotePage>(
      {
        path: "chat/emotes/user",
        query: params,
        auth: "user",
        scopes: ["user:read:emotes"],
        context: "user_id",
        options,
      },
      // The endpoint has no page size parameter.
      { sizeParam: null },
    );
  }

  /**
   * Changes the chat settings of a channel and returns the new ones. To set a
   * duration, send its mode as `true` in the same call, even when the mode is
   * already on.
   *
   * Token: app or user, scope `moderator:manage:chat_settings`.
   *
   * @example
   * await twitch.chat.updateSettings({ broadcaster_id: "141981764", slow_mode: true, slow_mode_wait_time: 10 });
   * @see https://dev.twitch.tv/docs/api/reference/#update-chat-settings
   */
  updateSettings(params: UpdateChatSettingsParams, options?: RequestOptions): Promise<ChatSettings> {
    const { broadcaster_id, moderator_id, ...body } = params;
    return this.rest.one<ChatSettings>({
      method: "PATCH",
      path: "chat/settings",
      query: { broadcaster_id, moderator_id },
      body,
      scopes: ["moderator:manage:chat_settings"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Posts a highlighted announcement in a channel's chat. Limited to one
   * announcement every 2 seconds.
   *
   * Token: app or user, scope `moderator:manage:announcements`.
   *
   * @example
   * await twitch.chat.announce({ broadcaster_id: "141981764", message: "Giveaway in 5 minutes", color: "purple" });
   * @see https://dev.twitch.tv/docs/api/reference/#send-chat-announcement
   */
  announce(params: SendChatAnnouncementParams, options?: RequestOptions): Promise<void> {
    const { broadcaster_id, moderator_id, ...body } = params;
    return this.rest.send({
      method: "POST",
      path: "chat/announcements",
      query: { broadcaster_id, moderator_id },
      body,
      scopes: ["moderator:manage:announcements"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Gives a shoutout to another broadcaster, which shows their channel with a
   * follow button in chat. The sending channel must be live. Limited to one
   * shoutout every 2 minutes, and one per hour to the same broadcaster.
   *
   * Token: app or user, scope `moderator:manage:shoutouts`.
   *
   * @example
   * await twitch.chat.shoutout({ from_broadcaster_id: "141981764", to_broadcaster_id: "12826" });
   * @see https://dev.twitch.tv/docs/api/reference/#send-a-shoutout
   */
  shoutout(params: SendShoutoutParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "POST",
      path: "chat/shoutouts",
      query: params,
      scopes: ["moderator:manage:shoutouts"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Sends a message to a channel's chat. Check `is_sent` on the result: a
   * message Twitch refuses comes back with a `drop_reason` instead of an error.
   *
   * Token: app or user, scope `user:write:chat`.
   *
   * @example
   * const sent = await twitch.chat.send({ broadcaster_id: "141981764", message: "Hello chat" });
   * if (!sent.is_sent) console.log(sent.drop_reason?.message);
   * @see https://dev.twitch.tv/docs/api/reference/#send-chat-message
   */
  send(params: SendChatMessageParams, options?: RequestOptions): Promise<SentChatMessage> {
    return this.rest.one<SentChatMessage>({
      method: "POST",
      path: "chat/messages",
      body: params,
      scopes: ["user:write:chat"],
      context: { body: "sender_id" },
      options,
    });
  }

  /**
   * Gets the message pinned in a channel's chat, or `null` when nothing is
   * pinned.
   *
   * Token: app or user, scope `moderator:manage:chat_messages` or `moderator:read:chat_messages`.
   *
   * @example
   * const pinned = await twitch.chat.pinnedMessage({ broadcaster_id: "141981764" });
   * if (pinned) console.log(pinned.message.text);
   * @see https://dev.twitch.tv/docs/api/reference/#get-pinned-chat-message
   */
  pinnedMessage(params: GetPinnedChatMessageParams, options?: RequestOptions): Promise<PinnedChatMessage | null> {
    return this.rest.first<PinnedChatMessage>({
      path: "chat/pins",
      query: params,
      scopes: ["moderator:manage:chat_messages", "moderator:read:chat_messages"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Pins a message at the top of a channel's chat. A chat holds one pinned
   * message, so this replaces the current one.
   *
   * Token: app or user, scope `moderator:manage:chat_messages`.
   *
   * @example
   * await twitch.chat.pin({ broadcaster_id: "141981764", message_id: sent.message_id, duration_seconds: 300 });
   * @see https://dev.twitch.tv/docs/api/reference/#pin-chat-message
   */
  pin(params: PinChatMessageParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "PUT",
      path: "chat/pins",
      query: params,
      scopes: ["moderator:manage:chat_messages"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Changes how long a pinned message stays pinned. The new duration counts
   * from the moment of the call.
   *
   * Token: app or user, scope `moderator:manage:chat_messages`.
   *
   * @example
   * await twitch.chat.updatePin({ broadcaster_id: "141981764", message_id: pinned.message_id, duration_seconds: 600 });
   * @see https://dev.twitch.tv/docs/api/reference/#update-pinned-chat-message
   */
  updatePin(params: UpdatePinnedChatMessageParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "PATCH",
      path: "chat/pins",
      query: params,
      scopes: ["moderator:manage:chat_messages"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Removes a pinned message from the top of a channel's chat.
   *
   * Token: app or user, scope `moderator:manage:chat_messages`.
   *
   * @example
   * await twitch.chat.unpin({ broadcaster_id: "141981764", message_id: pinned.message_id });
   * @see https://dev.twitch.tv/docs/api/reference/#unpin-chat-message
   */
  unpin(params: UnpinChatMessageParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "chat/pins",
      query: params,
      scopes: ["moderator:manage:chat_messages"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Gets the color users have for their name in chat. Users that do not exist
   * are left out of the result.
   *
   * Token: app or user.
   *
   * @example
   * const [entry] = await twitch.chat.colors({ user_id: "141981764" });
   * console.log(entry?.color);
   * @see https://dev.twitch.tv/docs/api/reference/#get-user-chat-color
   */
  colors(params: GetUserChatColorParams, options?: RequestOptions): Promise<UserChatColor[]> {
    return this.rest.chunked<UserChatColor>({ path: "chat/color", query: params, options }, ["user_id"]);
  }

  /**
   * Changes the color of a user's name in chat. Hex codes are reserved to
   * Turbo and Prime users, everyone else picks a named color.
   *
   * Token: user, scope `user:manage:chat_color`.
   *
   * @example
   * await twitch.chat.setColor({ color: "blue_violet" });
   * await twitch.chat.setColor({ color: "#9146FF" });
   * @see https://dev.twitch.tv/docs/api/reference/#update-user-chat-color
   */
  setColor(params: UpdateUserChatColorParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "PUT",
      path: "chat/color",
      query: params,
      auth: "user",
      scopes: ["user:manage:chat_color"],
      context: "user_id",
      options,
    });
  }
}
