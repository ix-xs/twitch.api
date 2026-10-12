import type { EventSubDefinition } from "./common.js";

// ---------------------------------------------------------------------------
// automod.message.hold (version 2)
// ---------------------------------------------------------------------------

/** Condition of `automod.message.hold`. */
export interface AutomodMessageHoldCondition {
  /** ID of the broadcaster whose channel is watched. */
  broadcaster_user_id: string;
  /** ID of the moderator who subscribes. Must be the user of the access token. */
  moderator_user_id: string;
}

/** Emote details carried by a fragment of a message held by AutoMod. */
export interface AutomodMessageHoldEmote {
  /** ID of the emote. */
  id: string;
  /** ID of the emote set the emote belongs to. */
  emote_set_id: string;
}

/** Cheermote details carried by a message fragment. */
export interface AutomodMessageHoldCheermote {
  /**
   * Name part of the Cheermote, in lowercase. The text typed in chat is this
   * prefix followed by the number of Bits, for example `cheer100`.
   */
  prefix: string;
  /** Number of Bits cheered with this Cheermote. */
  bits: number;
  /** Tier level of the Cheermote. */
  tier: number;
}

/** Fragment of a held message made of plain text. */
export interface AutomodMessageHoldTextFragment {
  /** Kind of fragment. */
  type: "text";
  /** Text of the fragment. */
  text: string;
  /** Always empty for a text fragment. */
  emote?: null;
  /** Always empty for a text fragment. */
  cheermote?: null;
}

/** Fragment of a held message that is an emote. */
export interface AutomodMessageHoldEmoteFragment {
  /** Kind of fragment. */
  type: "emote";
  /** Text of the fragment, the emote code. */
  text: string;
  /** The emote shown by this fragment. */
  emote: AutomodMessageHoldEmote;
  /** Always empty for an emote fragment. */
  cheermote?: null;
}

/** Fragment of a held message that is a Cheermote. */
export interface AutomodMessageHoldCheermoteFragment {
  /** Kind of fragment. */
  type: "cheermote";
  /** Text of the fragment, the Cheermote as typed. */
  text: string;
  /** Always empty for a Cheermote fragment. */
  emote?: null;
  /** The Cheermote shown by this fragment. */
  cheermote: AutomodMessageHoldCheermote;
}

/** One piece of a held message. Narrow on `type` to reach `emote` or `cheermote`. */
export type AutomodMessageHoldFragment =
  | AutomodMessageHoldTextFragment
  | AutomodMessageHoldEmoteFragment
  | AutomodMessageHoldCheermoteFragment;

/** Body of a message held by AutoMod. */
export interface AutomodMessageHoldMessage {
  /** Full text of the message. */
  text: string;
  /** The message split into ordered fragments. */
  fragments: AutomodMessageHoldFragment[];
}

/** Position of a problematic span inside the message text. */
export interface AutomodMessageHoldBoundary {
  /** Index of the first character of the span (starts at 0, inclusive). */
  start_pos: number;
  /** Index of the last character of the span (starts at 0, inclusive). */
  end_pos: number;
}

/** AutoMod verdict on a held message. */
export interface AutomodMessageHoldAutomod {
  /** AutoMod category the message falls into. */
  category: string;
  /** Severity level, from 1 to 4. */
  level: number;
  /** Spans of the text that triggered AutoMod. */
  boundaries: AutomodMessageHoldBoundary[];
}

/** A blocked term found in a held message. */
export interface AutomodMessageHoldTermFound {
  /** ID of the blocked term. */
  term_id: string;
  /** Span of the text matching the term. */
  boundary: AutomodMessageHoldBoundary;
  /** ID of the broadcaster who owns the blocked term. */
  owner_broadcaster_user_id: string;
  /** Login of the broadcaster who owns the blocked term. */
  owner_broadcaster_user_login: string;
  /** Display name of the broadcaster who owns the blocked term. */
  owner_broadcaster_user_name: string;
}

/** Blocked terms or links found in a held message. */
export interface AutomodMessageHoldBlockedTerm {
  /** Every blocked term found in the message. */
  terms_found: AutomodMessageHoldTermFound[];
}

/** Fields shared by every variant of the `automod.message.hold` event. */
export interface AutomodMessageHoldEventBase {
  /** ID of the broadcaster of the channel. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the channel. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the channel. */
  broadcaster_user_name: string;
  /** ID of the user who sent the message. */
  user_id: string;
  /** Login of the user who sent the message. */
  user_login: string;
  /** Display name of the user who sent the message. */
  user_name: string;
  /** ID of the held message. */
  message_id: string;
  /** Body of the held message. */
  message: AutomodMessageHoldMessage;
  /** RFC 3339 timestamp of when AutoMod held the message. */
  held_at: string;
}

/** `automod.message.hold` event for a message caught by AutoMod itself. */
export interface AutomodMessageHoldAutomodEvent extends AutomodMessageHoldEventBase {
  /** Why the message was held. */
  reason: "automod";
  /** AutoMod category, level and offending spans. */
  automod: AutomodMessageHoldAutomod;
  /** Always empty when the reason is `automod`. */
  blocked_term?: null;
}

/** `automod.message.hold` event for a message caught by a blocked term or a blocked link. */
export interface AutomodMessageHoldBlockedTermEvent extends AutomodMessageHoldEventBase {
  /** Why the message was held. */
  reason: "blocked_term" | "blocked_link";
  /** Always empty when the reason is a blocked term or link. */
  automod?: null;
  /** The blocked terms found in the message. */
  blocked_term: AutomodMessageHoldBlockedTerm;
}

/** Event of `automod.message.hold` version 2. Narrow on `reason`. */
export type AutomodMessageHoldEvent = AutomodMessageHoldAutomodEvent | AutomodMessageHoldBlockedTermEvent;

// ---------------------------------------------------------------------------
// automod.message.hold (version 1)
// ---------------------------------------------------------------------------

/** Condition of `automod.message.hold` version 1. */
export type AutomodMessageHoldV1Condition = AutomodMessageHoldCondition;

/** One piece of a held message, as sent by version 1. */
export interface AutomodMessageHoldV1Fragment {
  /** Text of the fragment. */
  text: string;
  /** Emote details, when the fragment is an emote. */
  emote?: AutomodMessageHoldEmote | null;
  /** Cheermote details, when the fragment is a Cheermote. */
  cheermote?: AutomodMessageHoldCheermote | null;
}

/** Body of a held message, as sent by version 1. */
export interface AutomodMessageHoldV1Message {
  /** Full text of the message. */
  text: string;
  /** The message split into ordered fragments. */
  fragments: AutomodMessageHoldV1Fragment[];
}

/** Event of `automod.message.hold` version 1. */
export interface AutomodMessageHoldV1Event {
  /** ID of the broadcaster of the channel. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the channel. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the channel. */
  broadcaster_user_name: string;
  /** ID of the user who sent the message. */
  user_id: string;
  /** Login of the user who sent the message. */
  user_login: string;
  /** Display name of the user who sent the message. */
  user_name: string;
  /** ID of the held message. */
  message_id: string;
  /** Body of the held message. */
  message: AutomodMessageHoldV1Message;
  /** AutoMod category the message falls into. */
  category: string;
  /** Severity level, from 1 to 4. */
  level: number;
  /** RFC 3339 timestamp of when AutoMod held the message. */
  held_at: string;
}

// ---------------------------------------------------------------------------
// automod.message.update (version 2)
// ---------------------------------------------------------------------------

/** Condition of `automod.message.update`. */
export type AutomodMessageUpdateCondition = AutomodMessageHoldCondition;

/** Outcome of the review of a held message. */
export type AutomodMessageUpdateStatus = "approved" | "denied" | "expired";

/** Fields shared by every variant of the `automod.message.update` event. */
export interface AutomodMessageUpdateEventBase {
  /** ID of the broadcaster of the channel. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the channel. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the channel. */
  broadcaster_user_name: string;
  /** ID of the user who sent the message. */
  user_id: string;
  /** Login of the user who sent the message. */
  user_login: string;
  /** Display name of the user who sent the message. */
  user_name: string;
  /** ID of the moderator who reviewed the message. */
  moderator_user_id: string;
  /** Login of the moderator who reviewed the message. */
  moderator_user_login: string;
  /** Display name of the moderator who reviewed the message. */
  moderator_user_name: string;
  /** ID of the held message. */
  message_id: string;
  /** Body of the held message. */
  message: AutomodMessageHoldMessage;
  /** New status of the message. */
  status: AutomodMessageUpdateStatus;
  /** RFC 3339 timestamp of when AutoMod held the message. */
  held_at: string;
}

/** `automod.message.update` event for a message caught by AutoMod itself. */
export interface AutomodMessageUpdateAutomodEvent extends AutomodMessageUpdateEventBase {
  /** Why the message was held. */
  reason: "automod";
  /** AutoMod category, level and offending spans. */
  automod: AutomodMessageHoldAutomod;
  /** Always empty when the reason is `automod`. */
  blocked_term?: null;
}

/** `automod.message.update` event for a message caught by a blocked term or a blocked link. */
export interface AutomodMessageUpdateBlockedTermEvent extends AutomodMessageUpdateEventBase {
  /** Why the message was held. */
  reason: "blocked_term" | "blocked_link";
  /** Always empty when the reason is a blocked term or link. */
  automod?: null;
  /** The blocked terms found in the message. */
  blocked_term: AutomodMessageHoldBlockedTerm;
}

/** Event of `automod.message.update` version 2. Narrow on `reason`. */
export type AutomodMessageUpdateEvent = AutomodMessageUpdateAutomodEvent | AutomodMessageUpdateBlockedTermEvent;

// ---------------------------------------------------------------------------
// automod.message.update (version 1)
// ---------------------------------------------------------------------------

/** Condition of `automod.message.update` version 1. */
export type AutomodMessageUpdateV1Condition = AutomodMessageHoldCondition;

/** Event of `automod.message.update` version 1. */
export interface AutomodMessageUpdateV1Event {
  /** ID of the broadcaster of the channel. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the channel. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the channel. */
  broadcaster_user_name: string;
  /** ID of the user who sent the message. */
  user_id: string;
  /** Login of the user who sent the message. */
  user_login: string;
  /** Display name of the user who sent the message. */
  user_name: string;
  /** ID of the moderator who reviewed the message. */
  moderator_user_id: string;
  /** Login of the moderator who reviewed the message. */
  moderator_user_login: string;
  /** Display name of the moderator who reviewed the message. */
  moderator_user_name: string;
  /** ID of the held message. */
  message_id: string;
  /** Body of the held message. */
  message: AutomodMessageHoldV1Message;
  /** AutoMod category the message falls into. */
  category: string;
  /** Severity level, from 1 to 4. */
  level: number;
  /** New status of the message. */
  status: AutomodMessageUpdateStatus;
  /** RFC 3339 timestamp of when AutoMod held the message. */
  held_at: string;
}

// ---------------------------------------------------------------------------
// automod.settings.update
// ---------------------------------------------------------------------------

/** Condition of `automod.settings.update`. */
export type AutomodSettingsUpdateCondition = AutomodMessageHoldCondition;

/** Event of `automod.settings.update`: the AutoMod levels now applied to the channel. */
export interface AutomodSettingsUpdateEvent {
  /** ID of the broadcaster of the channel. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the channel. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the channel. */
  broadcaster_user_name: string;
  /** ID of the moderator who changed the settings. */
  moderator_user_id: string;
  /** Login of the moderator who changed the settings. */
  moderator_user_login: string;
  /** Display name of the moderator who changed the settings. */
  moderator_user_name: string;
  /** Level for hostility through name calling or insults. */
  bullying: number;
  /** Default AutoMod level of the channel, or null when individual levels are set. */
  overall_level: number | null;
  /** Level for discrimination based on disability. */
  disability: number;
  /** Level for discrimination based on race, ethnicity or religion. */
  race_ethnicity_or_religion: number;
  /** Level for discrimination against women. */
  misogyny: number;
  /** Level for discrimination based on sexuality, sex or gender. */
  sexuality_sex_or_gender: number;
  /** Level for hostility through aggression. */
  aggression: number;
  /** Level for sexual content. */
  sex_based_terms: number;
  /** Level for profanity. */
  swearing: number;
}

// ---------------------------------------------------------------------------
// automod.terms.update
// ---------------------------------------------------------------------------

/** Condition of `automod.terms.update`. */
export type AutomodTermsUpdateCondition = AutomodMessageHoldCondition;

/** Event of `automod.terms.update`. */
export interface AutomodTermsUpdateEvent {
  /** ID of the broadcaster of the channel. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the channel. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the channel. */
  broadcaster_user_name: string;
  /** ID of the moderator who changed the terms. */
  moderator_user_id: string;
  /** Login of the moderator who changed the terms. */
  moderator_user_login: string;
  /** Display name of the moderator who changed the terms. */
  moderator_user_name: string;
  /** What happened to the terms: added to or removed from the permitted or blocked list. */
  action: "add_permitted" | "remove_permitted" | "add_blocked" | "remove_blocked";
  /** True when the change comes from approving or denying a message held by AutoMod. */
  from_automod: boolean;
  /** The terms concerned by the change. */
  terms: string[];
}

// ---------------------------------------------------------------------------
// channel.bits.use
// ---------------------------------------------------------------------------

/** Condition of `channel.bits.use`. */
export interface ChannelBitsUseCondition {
  /** ID of the broadcaster whose channel is watched. */
  broadcaster_user_id: string;
}

/** Cheermote details of a fragment, same shape as in AutoMod messages. */
export type ChannelBitsUseCheermote = AutomodMessageHoldCheermote;

/** Emote details carried by a message fragment. */
export interface ChannelBitsUseEmote {
  /** ID of the emote. */
  id: string;
  /** ID of the emote set the emote belongs to. */
  emote_set_id: string;
  /** ID of the broadcaster who owns the emote. */
  owner_id: string;
  /** Formats the emote exists in: `static` for a PNG, `animated` for a GIF. */
  format: ("animated" | "static")[];
}

/** Fragment of a Bits message made of plain text. */
export interface ChannelBitsUseTextFragment {
  /** Kind of fragment. */
  type: "text";
  /** Text of the fragment. */
  text: string;
  /** Always empty for a text fragment. */
  cheermote?: null;
  /** Always empty for a text fragment. */
  emote?: null;
}

/** Fragment of a Bits message that is a Cheermote. */
export interface ChannelBitsUseCheermoteFragment {
  /** Kind of fragment. */
  type: "cheermote";
  /** Text of the fragment, the Cheermote as typed. */
  text: string;
  /** The Cheermote shown by this fragment. */
  cheermote: ChannelBitsUseCheermote;
  /** Always empty for a Cheermote fragment. */
  emote?: null;
}

/** Fragment of a Bits message that is an emote. */
export interface ChannelBitsUseEmoteFragment {
  /** Kind of fragment. */
  type: "emote";
  /** Text of the fragment, the emote code. */
  text: string;
  /** Always empty for an emote fragment. */
  cheermote?: null;
  /** The emote shown by this fragment. */
  emote: ChannelBitsUseEmote;
}

/** One piece of a Bits message. Narrow on `type` to reach `cheermote` or `emote`. */
export type ChannelBitsUseFragment =
  | ChannelBitsUseTextFragment
  | ChannelBitsUseCheermoteFragment
  | ChannelBitsUseEmoteFragment;

/** Chat message sent along with the Bits. */
export interface ChannelBitsUseMessage {
  /** Full text of the message. */
  text: string;
  /** The message split into ordered fragments. */
  fragments: ChannelBitsUseFragment[];
}

/** Emote attached to a built-in Power-up. */
export interface ChannelBitsUsePowerUpEmote {
  /** ID of the emote. */
  id: string;
  /** Readable code of the emote. */
  name: string;
}

/** Details of a built-in Power-up bought with Bits. */
export interface ChannelBitsUsePowerUp {
  /** Which Power-up was used. */
  type: "message_effect" | "celebration" | "gigantify_an_emote";
  /** Emote tied to the Power-up, when there is one. */
  emote?: ChannelBitsUsePowerUpEmote | null;
  /** ID of the message effect, when the Power-up is a message effect. */
  message_effect_id?: string | null;
}

/** Details of a custom Power-up bought with Bits. */
export interface ChannelBitsUseCustomPowerUp {
  /** Title of the custom Power-up. */
  title: string;
  /** ID of the custom Power-up. */
  reward_id: string;
}

/** Fields shared by every variant of the `channel.bits.use` event. */
export interface ChannelBitsUseEventBase {
  /** ID of the broadcaster of the channel where the Bits were used. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the channel where the Bits were used. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the channel where the Bits were used. */
  broadcaster_user_name: string;
  /** ID of the user who used the Bits. */
  user_id: string;
  /** Login of the user who used the Bits. */
  user_login: string;
  /** Display name of the user who used the Bits. */
  user_name: string;
  /** Number of Bits used. */
  bits: number;
  /** Chat message sent with the Bits, when there is one. */
  message?: ChannelBitsUseMessage | null;
}

/** `channel.bits.use` event for a cheer. */
export interface ChannelBitsUseCheerEvent extends ChannelBitsUseEventBase {
  /** How the Bits were used. */
  type: "cheer";
  /** Always empty for a cheer. */
  power_up?: null;
  /** Always empty for a cheer. */
  custom_power_up?: null;
}

/** `channel.bits.use` event for a built-in Power-up. */
export interface ChannelBitsUsePowerUpEvent extends ChannelBitsUseEventBase {
  /** How the Bits were used. */
  type: "power_up";
  /** The built-in Power-up that was bought. */
  power_up: ChannelBitsUsePowerUp;
  /** Always empty for a built-in Power-up. */
  custom_power_up?: null;
}

/** `channel.bits.use` event for a custom Power-up. */
export interface ChannelBitsUseCustomPowerUpEvent extends ChannelBitsUseEventBase {
  /** How the Bits were used. */
  type: "custom_power_up";
  /** Always empty for a custom Power-up. */
  power_up?: null;
  /** The custom Power-up that was bought. */
  custom_power_up: ChannelBitsUseCustomPowerUp;
}

/** Event of `channel.bits.use`. Narrow on `type`. */
export type ChannelBitsUseEvent =
  | ChannelBitsUseCheerEvent
  | ChannelBitsUsePowerUpEvent
  | ChannelBitsUseCustomPowerUpEvent;

// ---------------------------------------------------------------------------
// channel.chat.clear
// ---------------------------------------------------------------------------

/** Condition of `channel.chat.clear`. */
export interface ChannelChatClearCondition {
  /** ID of the broadcaster whose chat room is watched. */
  broadcaster_user_id: string;
  /** ID of the user to read chat as. */
  user_id: string;
}

/** Event of `channel.chat.clear`. */
export interface ChannelChatClearEvent {
  /** ID of the broadcaster of the cleared chat room. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster of the cleared chat room. */
  broadcaster_user_name: string;
  /** Login of the broadcaster of the cleared chat room. */
  broadcaster_user_login: string;
}

// ---------------------------------------------------------------------------
// channel.chat.clear_user_messages
// ---------------------------------------------------------------------------

/** Condition of `channel.chat.clear_user_messages`. */
export type ChannelChatClearUserMessagesCondition = ChannelChatClearCondition;

/** Event of `channel.chat.clear_user_messages`. */
export interface ChannelChatClearUserMessagesEvent {
  /** ID of the broadcaster of the chat room. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster of the chat room. */
  broadcaster_user_name: string;
  /** Login of the broadcaster of the chat room. */
  broadcaster_user_login: string;
  /** ID of the banned or timed out user whose messages were removed. */
  target_user_id: string;
  /** Display name of the banned or timed out user. */
  target_user_name: string;
  /** Login of the banned or timed out user. */
  target_user_login: string;
}

// ---------------------------------------------------------------------------
// channel.chat.message
// ---------------------------------------------------------------------------

/** Condition of `channel.chat.message`. */
export type ChannelChatMessageCondition = ChannelChatClearCondition;

/** Cheermote details of a fragment, same shape as in AutoMod messages. */
export type ChannelChatMessageCheermote = AutomodMessageHoldCheermote;

/** Emote details of a fragment, same shape as in `channel.bits.use`. */
export type ChannelChatMessageEmote = ChannelBitsUseEmote;

/** User mentioned by a message fragment. */
export interface ChannelChatMessageMention {
  /** ID of the mentioned user. */
  user_id: string;
  /** Display name of the mentioned user. */
  user_name: string;
  /** Login of the mentioned user. */
  user_login: string;
}

/** GIF carried by a message fragment. */
export interface ChannelChatMessageGif {
  /** ID of the GIF. */
  id: string;
  /** URL of the GIF asset. Use it as is, without changing it. */
  url: string;
}

/** Fragment of a chat message made of plain text. */
export interface ChannelChatMessageTextFragment {
  /** Kind of fragment. */
  type: "text";
  /** Text of the fragment. */
  text: string;
  /** Always empty for a text fragment. */
  cheermote?: null;
  /** Always empty for a text fragment. */
  emote?: null;
  /** Always empty for a text fragment. */
  mention?: null;
  /** Always empty for a text fragment. */
  gif?: null;
}

/** Fragment of a chat message that is a Cheermote. */
export interface ChannelChatMessageCheermoteFragment {
  /** Kind of fragment. */
  type: "cheermote";
  /** Text of the fragment, the Cheermote as typed. */
  text: string;
  /** The Cheermote shown by this fragment. */
  cheermote: ChannelChatMessageCheermote;
  /** Always empty for a Cheermote fragment. */
  emote?: null;
  /** Always empty for a Cheermote fragment. */
  mention?: null;
  /** Always empty for a Cheermote fragment. */
  gif?: null;
}

/** Fragment of a chat message that is an emote. */
export interface ChannelChatMessageEmoteFragment {
  /** Kind of fragment. */
  type: "emote";
  /** Text of the fragment, the emote code. */
  text: string;
  /** Always empty for an emote fragment. */
  cheermote?: null;
  /** The emote shown by this fragment. */
  emote: ChannelChatMessageEmote;
  /** Always empty for an emote fragment. */
  mention?: null;
  /** Always empty for an emote fragment. */
  gif?: null;
}

/** Fragment of a chat message that mentions a user. */
export interface ChannelChatMessageMentionFragment {
  /** Kind of fragment. */
  type: "mention";
  /** Text of the fragment, the mention as typed. */
  text: string;
  /** Always empty for a mention fragment. */
  cheermote?: null;
  /** Always empty for a mention fragment. */
  emote?: null;
  /** The user mentioned by this fragment. */
  mention: ChannelChatMessageMention;
  /** Always empty for a mention fragment. */
  gif?: null;
}

/** Fragment of a chat message that is a GIF. */
export interface ChannelChatMessageGifFragment {
  /** Kind of fragment. */
  type: "gif";
  /** Text of the fragment. */
  text: string;
  /** Always empty for a GIF fragment. */
  cheermote?: null;
  /** Always empty for a GIF fragment. */
  emote?: null;
  /** Always empty for a GIF fragment. */
  mention?: null;
  /** The GIF shown by this fragment. */
  gif: ChannelChatMessageGif;
}

/** One piece of a chat message. Narrow on `type` to reach the matching details. */
export type ChannelChatMessageFragment =
  | ChannelChatMessageTextFragment
  | ChannelChatMessageCheermoteFragment
  | ChannelChatMessageEmoteFragment
  | ChannelChatMessageMentionFragment
  | ChannelChatMessageGifFragment;

/** Structured body of a chat message. */
export interface ChannelChatMessageMessage {
  /** Full text of the message. */
  text: string;
  /** The message split into ordered fragments. */
  fragments: ChannelChatMessageFragment[];
}

/** A chat badge shown next to a user name. */
export interface ChannelChatMessageBadge {
  /** ID of the badge set, for example `subscriber` or `bits`. */
  set_id: string;
  /** ID of the badge version inside the set. Its meaning depends on the set. */
  id: string;
  /** Extra data of the badge. Only subscriber badges fill it, with the number of subscribed months. */
  info: string;
}

/** Cheer data of a chat message. */
export interface ChannelChatMessageCheer {
  /** Number of Bits cheered in the message. */
  bits: number;
}

/** Data about the message a chat message replies to. */
export interface ChannelChatMessageReply {
  /** ID of the message being answered. */
  parent_message_id: string;
  /** Text of the message being answered. */
  parent_message_body: string;
  /** ID of the author of the message being answered. */
  parent_user_id: string;
  /** Display name of the author of the message being answered. */
  parent_user_name: string;
  /** Login of the author of the message being answered. */
  parent_user_login: string;
  /** ID of the first message of the reply thread. */
  thread_message_id: string;
  /** ID of the author of the first message of the thread. */
  thread_user_id: string;
  /** Display name of the author of the first message of the thread. */
  thread_user_name: string;
  /** Login of the author of the first message of the thread. */
  thread_user_login: string;
}

/** Event of `channel.chat.message`. */
export interface ChannelChatMessageEvent {
  /** ID of the broadcaster of the chat room. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster of the chat room. */
  broadcaster_user_name: string;
  /** Login of the broadcaster of the chat room. */
  broadcaster_user_login: string;
  /** ID of the user who sent the message. */
  chatter_user_id: string;
  /** Display name of the user who sent the message. */
  chatter_user_name: string;
  /** Login of the user who sent the message. */
  chatter_user_login: string;
  /** UUID of the message. */
  message_id: string;
  /** Structured body of the message. */
  message: ChannelChatMessageMessage;
  /** Kind of message, for example a plain one or one sent through a channel points or Power-up feature. */
  message_type:
    | "text"
    | "channel_points_highlighted"
    | "channel_points_sub_only"
    | "user_intro"
    | "power_ups_message_effect"
    | "power_ups_gigantified_emote";
  /** Chat badges of the sender. */
  badges: ChannelChatMessageBadge[];
  /** Cheer data, when the message contains Bits. */
  cheer?: ChannelChatMessageCheer | null;
  /** Color of the sender's name as `#RRGGBB`. Empty when the user never set one. */
  color: string;
  /** Reply data, when the message answers another one. */
  reply?: ChannelChatMessageReply | null;
  /** ID of the channel points custom reward redeemed with the message, if any. */
  channel_points_custom_reward_id?: string | null;
  /** ID of the broadcaster of the channel the message comes from. Null outside of a shared chat session or for a message of this channel. */
  source_broadcaster_user_id?: string | null;
  /** Display name of the broadcaster of the source channel. Null outside of a shared chat session or for a message of this channel. */
  source_broadcaster_user_name?: string | null;
  /** Login of the broadcaster of the source channel. Null outside of a shared chat session or for a message of this channel. */
  source_broadcaster_user_login?: string | null;
  /** UUID of the message in the source channel. Null outside of a shared chat session or for a message of this channel. */
  source_message_id?: string | null;
  /** Chat badges of the sender in the source channel. Null outside of a shared chat session or for a message of this channel. */
  source_badges?: ChannelChatMessageBadge[] | null;
  /** Whether a shared chat message is only delivered to its source channel. Meaningless outside of a shared chat session. */
  is_source_only?: boolean | null;
}

// ---------------------------------------------------------------------------
// channel.chat.message_delete
// ---------------------------------------------------------------------------

/** Condition of `channel.chat.message_delete`. */
export type ChannelChatMessageDeleteCondition = ChannelChatClearCondition;

/** Event of `channel.chat.message_delete`. */
export interface ChannelChatMessageDeleteEvent {
  /** ID of the broadcaster of the chat room. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster of the chat room. */
  broadcaster_user_name: string;
  /** Login of the broadcaster of the chat room. */
  broadcaster_user_login: string;
  /** ID of the author of the removed message. */
  target_user_id: string;
  /** Display name of the author of the removed message. */
  target_user_name: string;
  /** Login of the author of the removed message. */
  target_user_login: string;
  /** UUID of the removed message. */
  message_id: string;
}

// ---------------------------------------------------------------------------
// channel.chat.notification
// ---------------------------------------------------------------------------

/** Condition of `channel.chat.notification`. */
export type ChannelChatNotificationCondition = ChannelChatClearCondition;

/** One piece of the message of a chat notification. Narrow on `type` to reach the matching details. */
export type ChannelChatNotificationFragment =
  | ChannelChatMessageTextFragment
  | ChannelChatMessageCheermoteFragment
  | ChannelChatMessageEmoteFragment
  | ChannelChatMessageMentionFragment;

/** Structured body of the message attached to a chat notification. */
export interface ChannelChatNotificationMessage {
  /** Full text of the message. */
  text: string;
  /** The message split into ordered fragments. */
  fragments: ChannelChatNotificationFragment[];
}

/** Subscription tier: `1000` is tier 1 (or Prime), `2000` is tier 2, `3000` is tier 3. */
export type ChannelChatNotificationSubTier = "1000" | "2000" | "3000";

/** Details of a `sub` notice: a new subscription. */
export interface ChannelChatNotificationSub {
  /** Tier of the subscription. */
  sub_tier: ChannelChatNotificationSubTier;
  /** True when the subscription comes from Amazon Prime. */
  is_prime: boolean;
  /** Number of months the subscription covers. */
  duration_months: number;
}

/** Details of a `resub` notice: a renewed subscription announced in chat. */
export interface ChannelChatNotificationResub {
  /** Total number of months the user has been subscribed. */
  cumulative_months: number;
  /** Number of months the subscription covers. */
  duration_months: number;
  /** Number of consecutive subscribed months. Can be null. */
  streak_months: number | null;
  /** Tier of the subscription. */
  sub_tier: ChannelChatNotificationSubTier;
  /** True when the subscription comes from Amazon Prime. */
  is_prime?: boolean;
  /** True when the renewal comes from a gifted subscription. */
  is_gift: boolean;
  /** Whether the gifter chose to stay anonymous. Null when the renewal is not a gift. */
  gifter_is_anonymous?: boolean | null;
  /** ID of the gifter. Null when anonymous or when the renewal is not a gift. */
  gifter_user_id: string | null;
  /** Display name of the gifter. Null when anonymous or when the renewal is not a gift. */
  gifter_user_name: string | null;
  /** Login of the gifter. Null when anonymous or when the renewal is not a gift. */
  gifter_user_login?: string | null;
}

/** Details of a `sub_gift` notice: one subscription gifted to one user. */
export interface ChannelChatNotificationSubGift {
  /** Number of months the gifted subscription covers. */
  duration_months: number;
  /** Total number of subscriptions the gifter has given in this channel. Null when anonymous. */
  cumulative_total?: number | null;
  /** ID of the user who receives the subscription. */
  recipient_user_id: string;
  /** Display name of the user who receives the subscription. */
  recipient_user_name: string;
  /** Login of the user who receives the subscription. */
  recipient_user_login: string;
  /** Tier of the gifted subscription. */
  sub_tier: ChannelChatNotificationSubTier;
  /** ID of the community gift this subscription is part of. Null for a standalone gift. */
  community_gift_id?: string | null;
}

/** Details of a `community_sub_gift` notice: several subscriptions gifted to the community. */
export interface ChannelChatNotificationCommunitySubGift {
  /** ID of the community gift. */
  id: string;
  /** Number of subscriptions gifted. */
  total: number;
  /** Tier of the gifted subscriptions. */
  sub_tier: ChannelChatNotificationSubTier;
  /** Total number of subscriptions the gifter has given in this channel. Null when anonymous. */
  cumulative_total?: number | null;
}

/** Details of a `gift_paid_upgrade` notice: a gifted subscription turned into a paid one. */
export interface ChannelChatNotificationGiftPaidUpgrade {
  /** True when the original gift was anonymous. */
  gifter_is_anonymous: boolean;
  /** ID of the user who gifted the subscription. Null when anonymous. */
  gifter_user_id?: string | null;
  /** Display name of the user who gifted the subscription. Null when anonymous. */
  gifter_user_name?: string | null;
}

/** Details of a `prime_paid_upgrade` notice: a Prime subscription turned into a paid one. */
export interface ChannelChatNotificationPrimePaidUpgrade {
  /** Tier of the new subscription. */
  sub_tier: ChannelChatNotificationSubTier;
}

/** Details of a `pay_it_forward` notice: a gift recipient gifting a subscription in turn. */
export interface ChannelChatNotificationPayItForward {
  /** True when the original gift was anonymous. */
  gifter_is_anonymous: boolean;
  /** ID of the user who gifted the original subscription. Null when anonymous. */
  gifter_user_id: string | null;
  /** Display name of the user who gifted the original subscription. Null when anonymous. */
  gifter_user_name?: string | null;
  /** Login of the user who gifted the original subscription. Null when anonymous. */
  gifter_user_login: string | null;
}

/** Details of a `raid` notice. */
export interface ChannelChatNotificationRaid {
  /** ID of the broadcaster who raids the channel. */
  user_id: string;
  /** Display name of the broadcaster who raids the channel. */
  user_name: string;
  /** Login of the broadcaster who raids the channel. */
  user_login: string;
  /** Number of viewers brought by the raid. */
  viewer_count: number;
  /** URL of the profile image of the raiding broadcaster. */
  profile_image_url: string;
}

/** Details of an `unraid` notice. The object carries no field. */
export type ChannelChatNotificationUnraid = Record<string, never>;

/** Details of an `announcement` notice. */
export interface ChannelChatNotificationAnnouncement {
  /** Color of the announcement. */
  color: string;
}

/** Details of a `bits_badge_tier` notice: the user earned a new Bits badge. */
export interface ChannelChatNotificationBitsBadgeTier {
  /** Tier of the Bits badge just earned, for example 100, 1000 or 10000. */
  tier: number;
}

/** Amount of money given in a charity donation. */
export interface ChannelChatNotificationCharityDonationAmount {
  /** Amount in the minor unit of the currency, for example 550 for 5.50 USD. */
  value: number;
  /** Number of decimal places of the currency, for example 2 for USD. */
  decimal_place: number;
  /** ISO 4217 three-letter code of the currency. */
  currency: string;
}

/** Details of a `charity_donation` notice. */
export interface ChannelChatNotificationCharityDonation {
  /** Name of the charity. */
  charity_name: string;
  /** Amount donated. */
  amount: ChannelChatNotificationCharityDonationAmount;
}

/** Details of a `watch_streak` notice. */
export interface ChannelChatNotificationWatchStreak {
  /** Number of consecutive streams the user has watched. */
  streak_count: number;
  /** Channel points granted for reaching this streak. */
  channel_points_awarded: number;
}

/** Details of a `modiversary` notice. */
export interface ChannelChatNotificationModiversary {
  /** Number of months the user has been a moderator of the channel. */
  months: number;
}

/** Details of a `gifted_drops_summary` notice. */
export interface ChannelChatNotificationGiftedDropsSummary {
  /** Number of users who received a gifted Drop. */
  recipient_count: number;
}

/** Fields shared by every variant of the `channel.chat.notification` event. */
export interface ChannelChatNotificationEventBase {
  /** ID of the broadcaster of the chat room. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster of the chat room. */
  broadcaster_user_name: string;
  /** Login of the broadcaster of the chat room. */
  broadcaster_user_login: string;
  /** ID of the user the notice is about. */
  chatter_user_id: string;
  /** Display name of the user the notice is about. */
  chatter_user_name: string;
  /** Login of the user the notice is about. */
  chatter_user_login: string;
  /** True when the user is anonymous. */
  chatter_is_anonymous: boolean;
  /** Color of the user's name in chat. Empty when the user never set one. */
  color: string;
  /** Chat badges of the user. */
  badges: ChannelChatMessageBadge[];
  /** Text Twitch displays in chat for this notice. */
  system_message: string;
  /** UUID of the message. */
  message_id: string;
  /** Message the user attached to the notice. Its text is empty when there is none. */
  message: ChannelChatNotificationMessage;
  /** ID of the broadcaster of the channel the notice comes from. Null outside of a shared chat session or for a notice of this channel. */
  source_broadcaster_user_id?: string | null;
  /** Display name of the broadcaster of the source channel. Null outside of a shared chat session or for a notice of this channel. */
  source_broadcaster_user_name?: string | null;
  /** Login of the broadcaster of the source channel. Null outside of a shared chat session or for a notice of this channel. */
  source_broadcaster_user_login?: string | null;
  /** UUID of the message in the source channel. Null outside of a shared chat session or for a notice of this channel. */
  source_message_id?: string | null;
  /** Chat badges of the user in the source channel. Null outside of a shared chat session or for a notice of this channel. */
  source_badges?: ChannelChatMessageBadge[] | null;
  /** Whether the notice is only delivered to its source channel. Null outside of a shared chat session. */
  is_source_only?: boolean | null;
}

/**
 * Every per-notice object of `channel.chat.notification`, all empty. Each
 * variant of the event replaces the one matching its `notice_type`.
 */
export interface ChannelChatNotificationNullDetails {
  /** Filled only when `notice_type` is `sub`. */
  sub: null;
  /** Filled only when `notice_type` is `resub`. */
  resub: null;
  /** Filled only when `notice_type` is `sub_gift`. */
  sub_gift: null;
  /** Filled only when `notice_type` is `community_sub_gift`. */
  community_sub_gift: null;
  /** Filled only when `notice_type` is `gift_paid_upgrade`. */
  gift_paid_upgrade: null;
  /** Filled only when `notice_type` is `prime_paid_upgrade`. */
  prime_paid_upgrade: null;
  /** Filled only when `notice_type` is `pay_it_forward`. */
  pay_it_forward: null;
  /** Filled only when `notice_type` is `raid`. */
  raid: null;
  /** Filled only when `notice_type` is `unraid`. */
  unraid: null;
  /** Filled only when `notice_type` is `announcement`. */
  announcement: null;
  /** Filled only when `notice_type` is `bits_badge_tier`. */
  bits_badge_tier: null;
  /** Filled only when `notice_type` is `charity_donation`. */
  charity_donation: null;
  /** Filled only when `notice_type` is `watch_streak`. */
  watch_streak: null;
  /** Filled only when `notice_type` is `modiversary`. */
  modiversary: null;
  /** Filled only when `notice_type` is `gifted_drops_summary`. */
  gifted_drops_summary: null;
  /** Filled only when `notice_type` is `shared_chat_sub`. */
  shared_chat_sub?: null;
  /** Filled only when `notice_type` is `shared_chat_resub`. */
  shared_chat_resub?: null;
  /** Filled only when `notice_type` is `shared_chat_sub_gift`. */
  shared_chat_sub_gift?: null;
  /** Filled only when `notice_type` is `shared_chat_community_sub_gift`. */
  shared_chat_community_sub_gift?: null;
  /** Filled only when `notice_type` is `shared_chat_gift_paid_upgrade`. */
  shared_chat_gift_paid_upgrade?: null;
  /** Filled only when `notice_type` is `shared_chat_prime_paid_upgrade`. */
  shared_chat_prime_paid_upgrade?: null;
  /** Filled only when `notice_type` is `shared_chat_pay_it_forward`. */
  shared_chat_pay_it_forward?: null;
  /** Filled only when `notice_type` is `shared_chat_raid`. */
  shared_chat_raid?: null;
  /** Filled only when `notice_type` is `shared_chat_announcement`. */
  shared_chat_announcement?: null;
  /** Filled only when `notice_type` is `shared_chat_modiversary`. */
  shared_chat_modiversary?: null;
  /** Filled only when `notice_type` is `shared_chat_gifted_drops_summary`. */
  shared_chat_gifted_drops_summary?: null;
}

/** `channel.chat.notification` event for a new subscription. */
export interface ChannelChatNotificationSubEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "sub"> {
  /** Kind of notice. */
  notice_type: "sub";
  /** Details of the subscription. */
  sub: ChannelChatNotificationSub;
}

/** `channel.chat.notification` event for a renewed subscription. */
export interface ChannelChatNotificationResubEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "resub"> {
  /** Kind of notice. */
  notice_type: "resub";
  /** Details of the renewal. */
  resub: ChannelChatNotificationResub;
}

/** `channel.chat.notification` event for a subscription gifted to one user. */
export interface ChannelChatNotificationSubGiftEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "sub_gift"> {
  /** Kind of notice. */
  notice_type: "sub_gift";
  /** Details of the gifted subscription. */
  sub_gift: ChannelChatNotificationSubGift;
}

/** `channel.chat.notification` event for subscriptions gifted to the community. */
export interface ChannelChatNotificationCommunitySubGiftEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "community_sub_gift"> {
  /** Kind of notice. */
  notice_type: "community_sub_gift";
  /** Details of the community gift. */
  community_sub_gift: ChannelChatNotificationCommunitySubGift;
}

/** `channel.chat.notification` event for a gifted subscription turned into a paid one. */
export interface ChannelChatNotificationGiftPaidUpgradeEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "gift_paid_upgrade"> {
  /** Kind of notice. */
  notice_type: "gift_paid_upgrade";
  /** Details of the upgrade. */
  gift_paid_upgrade: ChannelChatNotificationGiftPaidUpgrade;
}

/** `channel.chat.notification` event for a Prime subscription turned into a paid one. */
export interface ChannelChatNotificationPrimePaidUpgradeEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "prime_paid_upgrade"> {
  /** Kind of notice. */
  notice_type: "prime_paid_upgrade";
  /** Details of the upgrade. */
  prime_paid_upgrade: ChannelChatNotificationPrimePaidUpgrade;
}

/** `channel.chat.notification` event for a gift recipient gifting in turn. */
export interface ChannelChatNotificationPayItForwardEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "pay_it_forward"> {
  /** Kind of notice. */
  notice_type: "pay_it_forward";
  /** Details about the original gift. */
  pay_it_forward: ChannelChatNotificationPayItForward;
}

/** `channel.chat.notification` event for an incoming raid. */
export interface ChannelChatNotificationRaidEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "raid"> {
  /** Kind of notice. */
  notice_type: "raid";
  /** Details of the raid. */
  raid: ChannelChatNotificationRaid;
}

/** `channel.chat.notification` event for a cancelled raid. */
export interface ChannelChatNotificationUnraidEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "unraid"> {
  /** Kind of notice. */
  notice_type: "unraid";
  /** Empty object marking the cancelled raid. */
  unraid: ChannelChatNotificationUnraid;
}

/** `channel.chat.notification` event for an announcement. */
export interface ChannelChatNotificationAnnouncementEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "announcement"> {
  /** Kind of notice. */
  notice_type: "announcement";
  /** Details of the announcement. */
  announcement: ChannelChatNotificationAnnouncement;
}

/** `channel.chat.notification` event for a newly earned Bits badge. */
export interface ChannelChatNotificationBitsBadgeTierEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "bits_badge_tier"> {
  /** Kind of notice. */
  notice_type: "bits_badge_tier";
  /** Details of the Bits badge. */
  bits_badge_tier: ChannelChatNotificationBitsBadgeTier;
}

/** `channel.chat.notification` event for a charity donation. */
export interface ChannelChatNotificationCharityDonationEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "charity_donation"> {
  /** Kind of notice. */
  notice_type: "charity_donation";
  /** Details of the donation. */
  charity_donation: ChannelChatNotificationCharityDonation;
}

/** `channel.chat.notification` event for a watch streak milestone. */
export interface ChannelChatNotificationWatchStreakEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "watch_streak"> {
  /** Kind of notice. */
  notice_type: "watch_streak";
  /** Details of the watch streak. */
  watch_streak: ChannelChatNotificationWatchStreak;
}

/** `channel.chat.notification` event for a moderator anniversary. */
export interface ChannelChatNotificationModiversaryEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "modiversary"> {
  /** Kind of notice. */
  notice_type: "modiversary";
  /** Details of the anniversary. */
  modiversary: ChannelChatNotificationModiversary;
}

/** `channel.chat.notification` event for a summary of gifted Drops. */
export interface ChannelChatNotificationGiftedDropsSummaryEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "gifted_drops_summary"> {
  /** Kind of notice. */
  notice_type: "gifted_drops_summary";
  /** Details of the gifted Drops. */
  gifted_drops_summary: ChannelChatNotificationGiftedDropsSummary;
}

/** `channel.chat.notification` event for a new subscription in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatSubEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_sub"> {
  /** Kind of notice. */
  notice_type: "shared_chat_sub";
  /** Details of the subscription. */
  shared_chat_sub: ChannelChatNotificationSub;
}

/** `channel.chat.notification` event for a renewed subscription in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatResubEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_resub"> {
  /** Kind of notice. */
  notice_type: "shared_chat_resub";
  /** Details of the renewal. */
  shared_chat_resub: ChannelChatNotificationResub;
}

/** `channel.chat.notification` event for a subscription gifted in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatSubGiftEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_sub_gift"> {
  /** Kind of notice. */
  notice_type: "shared_chat_sub_gift";
  /** Details of the gifted subscription. */
  shared_chat_sub_gift: ChannelChatNotificationSubGift;
}

/** `channel.chat.notification` event for a community gift in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatCommunitySubGiftEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_community_sub_gift"> {
  /** Kind of notice. */
  notice_type: "shared_chat_community_sub_gift";
  /** Details of the community gift. */
  shared_chat_community_sub_gift: ChannelChatNotificationCommunitySubGift;
}

/** `channel.chat.notification` event for a gift upgrade in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatGiftPaidUpgradeEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_gift_paid_upgrade"> {
  /** Kind of notice. */
  notice_type: "shared_chat_gift_paid_upgrade";
  /** Details of the upgrade. */
  shared_chat_gift_paid_upgrade: ChannelChatNotificationGiftPaidUpgrade;
}

/** `channel.chat.notification` event for a Prime upgrade in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatPrimePaidUpgradeEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_prime_paid_upgrade"> {
  /** Kind of notice. */
  notice_type: "shared_chat_prime_paid_upgrade";
  /** Details of the upgrade. */
  shared_chat_prime_paid_upgrade: ChannelChatNotificationPrimePaidUpgrade;
}

/** `channel.chat.notification` event for a pay it forward gift in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatPayItForwardEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_pay_it_forward"> {
  /** Kind of notice. */
  notice_type: "shared_chat_pay_it_forward";
  /** Details about the original gift. */
  shared_chat_pay_it_forward: ChannelChatNotificationPayItForward;
}

/** `channel.chat.notification` event for a raid on another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatRaidEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_raid"> {
  /** Kind of notice. */
  notice_type: "shared_chat_raid";
  /** Details of the raid. */
  shared_chat_raid: ChannelChatNotificationRaid;
}

/** `channel.chat.notification` event for an announcement in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatAnnouncementEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_announcement"> {
  /** Kind of notice. */
  notice_type: "shared_chat_announcement";
  /** Details of the announcement. */
  shared_chat_announcement: ChannelChatNotificationAnnouncement;
}

/** `channel.chat.notification` event for a moderator anniversary in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatModiversaryEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_modiversary"> {
  /** Kind of notice. */
  notice_type: "shared_chat_modiversary";
  /** Details of the anniversary. */
  shared_chat_modiversary: ChannelChatNotificationModiversary;
}

/** `channel.chat.notification` event for gifted Drops in another channel of the shared chat session. */
export interface ChannelChatNotificationSharedChatGiftedDropsSummaryEvent
  extends ChannelChatNotificationEventBase,
    Omit<ChannelChatNotificationNullDetails, "shared_chat_gifted_drops_summary"> {
  /** Kind of notice. */
  notice_type: "shared_chat_gifted_drops_summary";
  /** Details of the gifted Drops. */
  shared_chat_gifted_drops_summary: ChannelChatNotificationGiftedDropsSummary;
}

/** `channel.chat.notification` event for a notice Twitch does not describe. Every detail object is empty. */
export interface ChannelChatNotificationUnknownEvent
  extends ChannelChatNotificationEventBase,
    ChannelChatNotificationNullDetails {
  /** Kind of notice. */
  notice_type: "unknown";
}

/** Event of `channel.chat.notification`. Narrow on `notice_type` to reach the matching details. */
export type ChannelChatNotificationEvent =
  | ChannelChatNotificationSubEvent
  | ChannelChatNotificationResubEvent
  | ChannelChatNotificationSubGiftEvent
  | ChannelChatNotificationCommunitySubGiftEvent
  | ChannelChatNotificationGiftPaidUpgradeEvent
  | ChannelChatNotificationPrimePaidUpgradeEvent
  | ChannelChatNotificationPayItForwardEvent
  | ChannelChatNotificationRaidEvent
  | ChannelChatNotificationUnraidEvent
  | ChannelChatNotificationAnnouncementEvent
  | ChannelChatNotificationBitsBadgeTierEvent
  | ChannelChatNotificationCharityDonationEvent
  | ChannelChatNotificationWatchStreakEvent
  | ChannelChatNotificationModiversaryEvent
  | ChannelChatNotificationGiftedDropsSummaryEvent
  | ChannelChatNotificationSharedChatSubEvent
  | ChannelChatNotificationSharedChatResubEvent
  | ChannelChatNotificationSharedChatSubGiftEvent
  | ChannelChatNotificationSharedChatCommunitySubGiftEvent
  | ChannelChatNotificationSharedChatGiftPaidUpgradeEvent
  | ChannelChatNotificationSharedChatPrimePaidUpgradeEvent
  | ChannelChatNotificationSharedChatPayItForwardEvent
  | ChannelChatNotificationSharedChatRaidEvent
  | ChannelChatNotificationSharedChatAnnouncementEvent
  | ChannelChatNotificationSharedChatModiversaryEvent
  | ChannelChatNotificationSharedChatGiftedDropsSummaryEvent
  | ChannelChatNotificationUnknownEvent;

// ---------------------------------------------------------------------------
// channel.chat_settings.update
// ---------------------------------------------------------------------------

/** Condition of `channel.chat_settings.update`. */
export type ChannelChatSettingsUpdateCondition = ChannelChatClearCondition;

/** Event of `channel.chat_settings.update`: the chat settings now in effect. */
export interface ChannelChatSettingsUpdateEvent {
  /** ID of the broadcaster of the chat room. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the chat room. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the chat room. */
  broadcaster_user_name: string;
  /** True when messages may only contain emotes. */
  emote_mode: boolean;
  /** True when only followers may chat. */
  follower_mode: boolean;
  /** Minutes a user must have followed the channel before chatting. Null when `follower_mode` is false. */
  follower_mode_duration_minutes: number | null;
  /** True when users must wait between two messages. */
  slow_mode: boolean;
  /** Seconds a user must wait between two messages. Null when `slow_mode` is false. */
  slow_mode_wait_time_seconds: number | null;
  /** True when only subscribers may chat. */
  subscriber_mode: boolean;
  /** True when users may only post messages that are unique. */
  unique_chat_mode: boolean;
}

// ---------------------------------------------------------------------------
// channel.chat.user_message_hold
// ---------------------------------------------------------------------------

/** Condition of `channel.chat.user_message_hold`. */
export type ChannelChatUserMessageHoldCondition = ChannelChatClearCondition;

/** Body of the user's held message, same shape as in `automod.message.hold`. */
export type ChannelChatUserMessageHoldMessage = AutomodMessageHoldMessage;

/** Event of `channel.chat.user_message_hold`. */
export interface ChannelChatUserMessageHoldEvent {
  /** ID of the broadcaster of the chat room. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the chat room. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the chat room. */
  broadcaster_user_name: string;
  /** ID of the user who sent the message. */
  user_id: string;
  /** Login of the user who sent the message. */
  user_login: string;
  /** Display name of the user who sent the message. */
  user_name: string;
  /** ID of the held message. */
  message_id: string;
  /** Body of the held message. */
  message: ChannelChatUserMessageHoldMessage;
}

// ---------------------------------------------------------------------------
// channel.chat.user_message_update
// ---------------------------------------------------------------------------

/** Condition of `channel.chat.user_message_update`. */
export type ChannelChatUserMessageUpdateCondition = ChannelChatClearCondition;

/** Event of `channel.chat.user_message_update`. */
export interface ChannelChatUserMessageUpdateEvent {
  /** ID of the broadcaster of the chat room. */
  broadcaster_user_id: string;
  /** Login of the broadcaster of the chat room. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster of the chat room. */
  broadcaster_user_name: string;
  /** ID of the user who sent the message. */
  user_id: string;
  /** Login of the user who sent the message. */
  user_login: string;
  /** Display name of the user who sent the message. */
  user_name: string;
  /** Outcome of the review of the message. */
  status: "approved" | "denied" | "invalid";
  /** ID of the held message. */
  message_id: string;
  /** Body of the held message. */
  message: ChannelChatUserMessageHoldMessage;
}

// ---------------------------------------------------------------------------
// channel.shared_chat.begin
// ---------------------------------------------------------------------------

/** Condition of `channel.shared_chat.begin`. */
export interface ChannelSharedChatBeginCondition {
  /** ID of the broadcaster whose channel is watched. */
  broadcaster_user_id: string;
}

/** A channel taking part in a shared chat session. */
export interface ChannelSharedChatParticipant {
  /** ID of the broadcaster of the participating channel. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster of the participating channel. */
  broadcaster_user_name: string;
  /** Login of the broadcaster of the participating channel. */
  broadcaster_user_login: string;
}

/** Event of `channel.shared_chat.begin`. */
export interface ChannelSharedChatBeginEvent {
  /** ID of the shared chat session. */
  session_id: string;
  /** ID of the broadcaster from the condition, now active in the session. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster from the condition. */
  broadcaster_user_name: string;
  /** Login of the broadcaster from the condition. */
  broadcaster_user_login: string;
  /** ID of the broadcaster hosting the session. */
  host_broadcaster_user_id: string;
  /** Display name of the broadcaster hosting the session. */
  host_broadcaster_user_name: string;
  /** Login of the broadcaster hosting the session. */
  host_broadcaster_user_login: string;
  /** Channels taking part in the session. */
  participants: ChannelSharedChatParticipant[];
}

// ---------------------------------------------------------------------------
// channel.shared_chat.update
// ---------------------------------------------------------------------------

/** Condition of `channel.shared_chat.update`. */
export type ChannelSharedChatUpdateCondition = ChannelSharedChatBeginCondition;

/** Event of `channel.shared_chat.update`. */
export interface ChannelSharedChatUpdateEvent {
  /** ID of the shared chat session. */
  session_id: string;
  /** ID of the broadcaster from the condition. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster from the condition. */
  broadcaster_user_name: string;
  /** Login of the broadcaster from the condition. */
  broadcaster_user_login: string;
  /** ID of the broadcaster hosting the session. */
  host_broadcaster_user_id: string;
  /** Display name of the broadcaster hosting the session. */
  host_broadcaster_user_name: string;
  /** Login of the broadcaster hosting the session. */
  host_broadcaster_user_login: string;
  /** Channels taking part in the session after the change. */
  participants: ChannelSharedChatParticipant[];
}

// ---------------------------------------------------------------------------
// channel.shared_chat.end
// ---------------------------------------------------------------------------

/** Condition of `channel.shared_chat.end`. */
export type ChannelSharedChatEndCondition = ChannelSharedChatBeginCondition;

/** Event of `channel.shared_chat.end`. */
export interface ChannelSharedChatEndEvent {
  /** ID of the shared chat session. */
  session_id: string;
  /** ID of the broadcaster from the condition, no longer active in the session. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster from the condition. */
  broadcaster_user_name: string;
  /** Login of the broadcaster from the condition. */
  broadcaster_user_login: string;
  /** ID of the broadcaster hosting the session. */
  host_broadcaster_user_id: string;
  /** Display name of the broadcaster hosting the session. */
  host_broadcaster_user_name: string;
  /** Login of the broadcaster hosting the session. */
  host_broadcaster_user_login: string;
}

// ---------------------------------------------------------------------------
// Map and versions
// ---------------------------------------------------------------------------

/** AutoMod, Bits, chat and shared chat subscription types. */
export interface ChatEventSubTypes {
  /**
   * AutoMod held a message for review. Only public blocked terms trigger it, not private ones.
   *
   * Scope: `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be
   * the broadcaster or one of their moderators.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessagehold-v2
   */
  "automod.message.hold": EventSubDefinition<"2", AutomodMessageHoldCondition, AutomodMessageHoldEvent>;
  /**
   * AutoMod held a message for review (older payload, without the reason).
   *
   * Scope: `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be
   * the broadcaster or one of their moderators.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessagehold
   */
  "automod.message.hold@1": EventSubDefinition<"1", AutomodMessageHoldV1Condition, AutomodMessageHoldV1Event>;
  /**
   * A message waiting in the AutoMod queue was approved, denied or expired. Only public blocked
   * terms trigger it, not private ones.
   *
   * Scope: `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be
   * the broadcaster or one of their moderators.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate-v2
   */
  "automod.message.update": EventSubDefinition<"2", AutomodMessageUpdateCondition, AutomodMessageUpdateEvent>;
  /**
   * A message waiting in the AutoMod queue was approved, denied or expired (older payload, without the reason).
   *
   * Scope: `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be
   * the broadcaster or one of their moderators.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate
   */
  "automod.message.update@1": EventSubDefinition<"1", AutomodMessageUpdateV1Condition, AutomodMessageUpdateV1Event>;
  /**
   * The AutoMod settings of the channel changed.
   *
   * Scope: `moderator:read:automod_settings`, granted by the moderator in `moderator_user_id`, who
   * must be the broadcaster or one of their moderators.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodsettingsupdate
   */
  "automod.settings.update": EventSubDefinition<"1", AutomodSettingsUpdateCondition, AutomodSettingsUpdateEvent>;
  /**
   * Permitted or blocked terms of the channel changed. Changes to private terms are not sent.
   *
   * Scope: `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be
   * the broadcaster or one of their moderators.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodtermsupdate
   */
  "automod.terms.update": EventSubDefinition<"1", AutomodTermsUpdateCondition, AutomodTermsUpdateEvent>;
  /**
   * Bits were used in the channel, through a cheer or a Power-up. Bits spent in Extensions are not included.
   *
   * Scope: `bits:read`, with a user access token.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelbitsuse
   */
  "channel.bits.use": EventSubDefinition<"1", ChannelBitsUseCondition, ChannelBitsUseEvent>;
  /**
   * A moderator or a bot cleared every message of the chat room.
   *
   * Scope: `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot`
   * from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear
   */
  "channel.chat.clear": EventSubDefinition<"1", ChannelChatClearCondition, ChannelChatClearEvent>;
  /**
   * A moderator or a bot cleared every message of one user, after a ban or a timeout.
   *
   * Scope: `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot`
   * from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear_user_messages
   */
  "channel.chat.clear_user_messages": EventSubDefinition<
    "1",
    ChannelChatClearUserMessagesCondition,
    ChannelChatClearUserMessagesEvent
  >;
  /**
   * A user sent a message in the chat room.
   *
   * Scope: `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot`
   * from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage
   */
  "channel.chat.message": EventSubDefinition<"1", ChannelChatMessageCondition, ChannelChatMessageEvent>;
  /**
   * A moderator removed one message from the chat room.
   *
   * Scope: `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot`
   * from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage_delete
   */
  "channel.chat.message_delete": EventSubDefinition<
    "1",
    ChannelChatMessageDeleteCondition,
    ChannelChatMessageDeleteEvent
  >;
  /**
   * Something shown as a notice in chat happened, such as a subscription, a gift, a raid or an announcement.
   *
   * Scope: `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot`
   * from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatnotification
   */
  "channel.chat.notification": EventSubDefinition<
    "1",
    ChannelChatNotificationCondition,
    ChannelChatNotificationEvent
  >;
  /**
   * The chat settings of the channel changed (emote, follower, slow, subscriber or unique chat mode).
   *
   * Scope: `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot`
   * from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchat_settingsupdate
   */
  "channel.chat_settings.update": EventSubDefinition<
    "1",
    ChannelChatSettingsUpdateCondition,
    ChannelChatSettingsUpdateEvent
  >;
  /**
   * A message of the user in `user_id` was held by AutoMod.
   *
   * Scope: `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot`
   * from that user.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_hold
   */
  "channel.chat.user_message_hold": EventSubDefinition<
    "1",
    ChannelChatUserMessageHoldCondition,
    ChannelChatUserMessageHoldEvent
  >;
  /**
   * The AutoMod status of a held message of the user in `user_id` changed.
   *
   * Scope: `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot`
   * from that user.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_update
   */
  "channel.chat.user_message_update": EventSubDefinition<
    "1",
    ChannelChatUserMessageUpdateCondition,
    ChannelChatUserMessageUpdateEvent
  >;
  /**
   * The channel became active in a shared chat session.
   *
   * Scope: none.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatbegin
   */
  "channel.shared_chat.begin": EventSubDefinition<"1", ChannelSharedChatBeginCondition, ChannelSharedChatBeginEvent>;
  /**
   * The shared chat session the channel is in changed, for example its participants.
   *
   * Scope: none.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatupdate
   */
  "channel.shared_chat.update": EventSubDefinition<
    "1",
    ChannelSharedChatUpdateCondition,
    ChannelSharedChatUpdateEvent
  >;
  /**
   * The channel left a shared chat session, or the session ended.
   *
   * Scope: none.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatend
   */
  "channel.shared_chat.end": EventSubDefinition<"1", ChannelSharedChatEndCondition, ChannelSharedChatEndEvent>;
}

/** Version of each subscription type of {@link ChatEventSubTypes}. */
export const chatVersions = {
  "automod.message.hold": "2",
  "automod.message.hold@1": "1",
  "automod.message.update": "2",
  "automod.message.update@1": "1",
  "automod.settings.update": "1",
  "automod.terms.update": "1",
  "channel.bits.use": "1",
  "channel.chat.clear": "1",
  "channel.chat.clear_user_messages": "1",
  "channel.chat.message": "1",
  "channel.chat.message_delete": "1",
  "channel.chat.notification": "1",
  "channel.chat_settings.update": "1",
  "channel.chat.user_message_hold": "1",
  "channel.chat.user_message_update": "1",
  "channel.shared_chat.begin": "1",
  "channel.shared_chat.update": "1",
  "channel.shared_chat.end": "1",
} as const satisfies { [K in keyof ChatEventSubTypes]: ChatEventSubTypes[K]["version"] };
