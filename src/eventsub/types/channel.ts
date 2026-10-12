import type { EventSubDefinition } from "./common.js";

// channel.update

/** Condition of `channel.update`. */
export interface ChannelUpdateCondition {
  /** ID of the broadcaster whose channel settings to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.update`: the channel settings after the change. */
export interface ChannelUpdateEvent {
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Stream title. */
  title: string;
  /** Broadcast language code, for example `en`. */
  language: string;
  /** ID of the category (game). */
  category_id: string;
  /** Name of the category (game). */
  category_name: string;
  /** IDs of the content classification labels applied to the channel. */
  content_classification_labels: string[];
}

// channel.follow

/** Condition of `channel.follow`. */
export interface ChannelFollowCondition {
  /** ID of the broadcaster whose new followers to watch. */
  broadcaster_user_id: string;
  /**
   * ID of a moderator of the channel, or of the broadcaster when the
   * authorization comes from the broadcaster.
   */
  moderator_user_id: string;
}

/** Event of `channel.follow`. */
export interface ChannelFollowEvent {
  /** ID of the new follower. */
  user_id: string;
  /** Login name of the new follower. */
  user_login: string;
  /** Display name of the new follower. */
  user_name: string;
  /** ID of the followed broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the followed broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the followed broadcaster. */
  broadcaster_user_name: string;
  /** RFC 3339 timestamp of the follow. */
  followed_at: string;
}

// channel.ad_break.begin

/** Condition of `channel.ad_break.begin`. */
export interface ChannelAdBreakBeginCondition {
  /** ID of the broadcaster whose ad breaks to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.ad_break.begin`. */
export interface ChannelAdBreakBeginEvent {
  /** Requested length of the ad break, in seconds. */
  duration_seconds: number;
  /**
   * RFC 3339 timestamp of the start of the ad break. Viewers may see the ads
   * a little later.
   */
  started_at: string;
  /** Whether the ad break was scheduled by Ads Manager rather than run by hand. */
  is_automatic: boolean;
  /** ID of the broadcaster whose channel runs the ads. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the user who requested the ad break. The broadcaster for automatic ads. */
  requester_user_id: string;
  /** Login name of the requester. */
  requester_user_login: string;
  /** Display name of the requester. */
  requester_user_name: string;
}

// channel.subscribe

/** Subscription tier: `1000` is tier 1, `2000` is tier 2, `3000` is tier 3. */
export type ChannelSubscribeTier = "1000" | "2000" | "3000";

/** Condition of `channel.subscribe`. */
export interface ChannelSubscribeCondition {
  /** ID of the broadcaster whose new subscribers to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.subscribe`. */
export interface ChannelSubscribeEvent {
  /** ID of the new subscriber. */
  user_id: string;
  /** Login name of the new subscriber. */
  user_login: string;
  /** Display name of the new subscriber. */
  user_name: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Tier of the subscription. */
  tier: ChannelSubscribeTier;
  /** Whether the subscription was received as a gift. */
  is_gift: boolean;
}

// channel.subscription.end

/** Condition of `channel.subscription.end`. */
export interface ChannelSubscriptionEndCondition {
  /** ID of the broadcaster whose ending subscriptions to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.subscription.end`. */
export interface ChannelSubscriptionEndEvent {
  /** ID of the user whose subscription ended. */
  user_id: string;
  /** Login name of the user whose subscription ended. */
  user_login: string;
  /** Display name of the user whose subscription ended. */
  user_name: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Tier of the subscription that ended. */
  tier: ChannelSubscribeTier;
  /** Whether the subscription had been received as a gift. */
  is_gift: boolean;
}

// channel.subscription.gift

/** Condition of `channel.subscription.gift`. */
export interface ChannelSubscriptionGiftCondition {
  /** ID of the broadcaster whose gifted subscriptions to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.subscription.gift`. */
export interface ChannelSubscriptionGiftEvent {
  /** ID of the gifter. Null for an anonymous gift. */
  user_id: string | null;
  /** Login name of the gifter. Null for an anonymous gift. */
  user_login: string | null;
  /** Display name of the gifter. Null for an anonymous gift. */
  user_name: string | null;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Number of subscriptions in this gift. */
  total: number;
  /** Tier of the gifted subscriptions. */
  tier: ChannelSubscribeTier;
  /**
   * Number of subscriptions this user has gifted in the channel overall. Null
   * for an anonymous gift or when the gifter does not share it.
   */
  cumulative_total: number | null;
  /** Whether the gift is anonymous. */
  is_anonymous: boolean;
}

// channel.subscription.message

/** Condition of `channel.subscription.message`. */
export interface ChannelSubscriptionMessageCondition {
  /** ID of the broadcaster whose resubscription messages to watch. */
  broadcaster_user_id: string;
}

/** Position of one emote inside a resubscription message. */
export interface ChannelSubscriptionMessageEmote {
  /** Index in the text where the emote starts. */
  begin: number;
  /** Index in the text where the emote ends. */
  end: number;
  /** ID of the emote. */
  id: string;
}

/** Text of a resubscription message with the emotes it contains. */
export interface ChannelSubscriptionMessageContent {
  /** Text of the message. */
  text: string;
  /** Emotes found in the text. Null when the message has none. */
  emotes: ChannelSubscriptionMessageEmote[] | null;
}

/** Event of `channel.subscription.message`. */
export interface ChannelSubscriptionMessageEvent {
  /** ID of the user who sent the resubscription message. */
  user_id: string;
  /** Login name of the user who sent the resubscription message. */
  user_login: string;
  /** Display name of the user who sent the resubscription message. */
  user_name: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Tier of the subscription. */
  tier: ChannelSubscribeTier;
  /** The message and its emotes. */
  message: ChannelSubscriptionMessageContent;
  /** Total number of months the user has been subscribed. */
  cumulative_months: number;
  /**
   * Number of months in a row of the current subscription. Null when the user
   * does not share it.
   */
  streak_months: number | null;
  /** Length of the subscription that was bought, in months. */
  duration_months: number;
}

// channel.cheer

/** Condition of `channel.cheer`. */
export interface ChannelCheerCondition {
  /** ID of the broadcaster whose cheers to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.cheer`. */
export interface ChannelCheerEvent {
  /** Whether the cheer is anonymous. */
  is_anonymous: boolean;
  /** ID of the user who cheered. Null for an anonymous cheer. */
  user_id: string | null;
  /** Login name of the user who cheered. Null for an anonymous cheer. */
  user_login: string | null;
  /** Display name of the user who cheered. Null for an anonymous cheer. */
  user_name: string | null;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Message sent along with the cheer. */
  message: string;
  /** Number of Bits cheered. */
  bits: number;
}

// channel.raid

/**
 * Condition of `channel.raid`. Set at least one of the two fields: the first to
 * follow raids sent by a channel, the second to follow raids it receives.
 */
export interface ChannelRaidCondition {
  /** ID of the broadcaster whose outgoing raids to watch. */
  from_broadcaster_user_id?: string;
  /** ID of the broadcaster whose incoming raids to watch. */
  to_broadcaster_user_id?: string;
}

/** Event of `channel.raid`. */
export interface ChannelRaidEvent {
  /** ID of the broadcaster who started the raid. */
  from_broadcaster_user_id: string;
  /** Login name of the broadcaster who started the raid. */
  from_broadcaster_user_login: string;
  /** Display name of the broadcaster who started the raid. */
  from_broadcaster_user_name: string;
  /** ID of the raided broadcaster. */
  to_broadcaster_user_id: string;
  /** Login name of the raided broadcaster. */
  to_broadcaster_user_login: string;
  /** Display name of the raided broadcaster. */
  to_broadcaster_user_name: string;
  /** Number of viewers brought by the raid. */
  viewers: number;
}

// channel.ban

/** Condition of `channel.ban`. */
export interface ChannelBanCondition {
  /** ID of the broadcaster whose bans and timeouts to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.ban`: a permanent ban or a timeout. */
export interface ChannelBanEvent {
  /** ID of the banned user. */
  user_id: string;
  /** Login name of the banned user. */
  user_login: string;
  /** Display name of the banned user. */
  user_name: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the moderator who issued the ban. */
  moderator_user_id: string;
  /** Login name of the moderator who issued the ban. */
  moderator_user_login: string;
  /** Display name of the moderator who issued the ban. */
  moderator_user_name: string;
  /** Reason given for the ban. */
  reason: string;
  /** RFC 3339 timestamp of the ban or timeout. */
  banned_at: string;
  /** RFC 3339 timestamp of the end of the timeout. Null for a permanent ban. */
  ends_at: string | null;
  /** True for a permanent ban, false for a timeout. */
  is_permanent: boolean;
}

// channel.unban

/** Condition of `channel.unban`. */
export interface ChannelUnbanCondition {
  /** ID of the broadcaster whose unbans to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.unban`. */
export interface ChannelUnbanEvent {
  /** ID of the unbanned user. */
  user_id: string;
  /** Login name of the unbanned user. */
  user_login: string;
  /** Display name of the unbanned user. */
  user_name: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the moderator who lifted the ban. */
  moderator_user_id: string;
  /** Login name of the moderator who lifted the ban. */
  moderator_user_login: string;
  /** Display name of the moderator who lifted the ban. */
  moderator_user_name: string;
}

// channel.unban_request.create

/** Condition of `channel.unban_request.create`. */
export interface ChannelUnbanRequestCreateCondition {
  /** ID of the broadcaster whose unban requests to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Event of `channel.unban_request.create`. */
export interface ChannelUnbanRequestCreateEvent {
  /** ID of the unban request. */
  id: string;
  /** ID of the broadcaster whose channel the request targets. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the banned user asking to be unbanned. */
  user_id: string;
  /** Login name of the banned user. */
  user_login: string;
  /** Display name of the banned user. */
  user_name: string;
  /** Message written by the user in the request. */
  text: string;
  /** RFC 3339 timestamp of the creation of the request. */
  created_at: string;
}

// channel.unban_request.resolve

/** Condition of `channel.unban_request.resolve`. */
export interface ChannelUnbanRequestResolveCondition {
  /** ID of the broadcaster whose resolved unban requests to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Event of `channel.unban_request.resolve`. */
export interface ChannelUnbanRequestResolveEvent {
  /** ID of the unban request. */
  id: string;
  /** ID of the broadcaster whose channel the request targets. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the moderator who approved or denied the request, when there is one. */
  moderator_user_id?: string | null;
  /** Login name of that moderator, when there is one. */
  moderator_user_login?: string | null;
  /** Display name of that moderator, when there is one. */
  moderator_user_name?: string | null;
  /** ID of the user who asked to be unbanned. */
  user_id: string;
  /** Login name of the user who asked to be unbanned. */
  user_login: string;
  /** Display name of the user who asked to be unbanned. */
  user_name: string;
  /** Answer written by the moderator or broadcaster, when there is one. */
  resolution_text?: string | null;
  /** Outcome of the request. */
  status: "approved" | "canceled" | "denied";
}

// channel.moderate (version 2)

/** Condition of `channel.moderate` (version 2). */
export interface ChannelModerateCondition {
  /** ID of the broadcaster whose moderation actions to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scopes. */
  moderator_user_id: string;
}

/** Followers-only mode settings in a `channel.moderate` event. */
export interface ChannelModerateFollowers {
  /** Minutes a user must have followed the channel before being allowed to chat. */
  follow_duration_minutes: number;
}

/** Slow mode settings in a `channel.moderate` event. */
export interface ChannelModerateSlow {
  /** Seconds a user must wait between two messages. */
  wait_time_seconds: number;
}

/** User targeted by a `channel.moderate` action. */
export interface ChannelModerateUser {
  /** ID of the targeted user. */
  user_id: string;
  /** Login name of the targeted user. */
  user_login: string;
  /** Display name of the targeted user. */
  user_name: string;
}

/** Ban details in a `channel.moderate` event. */
export interface ChannelModerateBan extends ChannelModerateUser {
  /** Reason given for the ban, when there is one. */
  reason?: string | null;
}

/** Timeout details in a `channel.moderate` event. */
export interface ChannelModerateTimeout extends ChannelModerateUser {
  /** Reason given for the timeout, when there is one. */
  reason?: string | null;
  /** RFC 3339 timestamp of the end of the timeout. */
  expires_at: string;
}

/** Raid details in a `channel.moderate` event. The user is the raided channel. */
export interface ChannelModerateRaid extends ChannelModerateUser {
  /** Number of viewers sent with the raid. */
  viewer_count: number;
}

/** Deleted message details in a `channel.moderate` event. The user is its author. */
export interface ChannelModerateDelete extends ChannelModerateUser {
  /** ID of the deleted message. */
  message_id: string;
  /** Text of the deleted message. */
  message_body: string;
}

/** AutoMod term change in a `channel.moderate` event. */
export interface ChannelModerateAutomodTerms {
  /** Whether the terms were added or removed. */
  action: "add" | "remove";
  /** List the terms belong to. */
  list: "blocked" | "permitted";
  /** The terms that were added or removed. */
  terms: string[];
  /** Whether the change comes from approving or denying a message held by AutoMod. */
  from_automod: boolean;
}

/** Unban request outcome in a `channel.moderate` event. The user is the banned user. */
export interface ChannelModerateUnbanRequest extends ChannelModerateUser {
  /** True when the request was approved, false when it was denied. */
  is_approved: boolean;
  /** Message written by the moderator to explain the decision. */
  moderator_message: string;
}

/** Warning details in a `channel.moderate` event. */
export interface ChannelModerateWarn extends ChannelModerateUser {
  /** Reason given for the warning, when there is one. */
  reason?: string | null;
  /** Chat rules cited in the warning, when there are any. */
  chat_rules_cited?: string[] | null;
}

/** Fields present in every `channel.moderate` event, whatever the action. */
export interface ChannelModerateBase {
  /** ID of the broadcaster named in the subscription condition. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /**
   * ID of the channel where the action was taken. Differs from
   * `broadcaster_user_id` only during a shared chat session; may be null or
   * absent otherwise.
   */
  source_broadcaster_user_id?: string | null;
  /** Login name of the channel where the action was taken. Same rule as its ID. */
  source_broadcaster_user_login?: string | null;
  /** Display name of the channel where the action was taken. Same rule as its ID. */
  source_broadcaster_user_name?: string | null;
  /** ID of the moderator who took the action. */
  moderator_user_id: string;
  /** Login name of the moderator. */
  moderator_user_login: string;
  /** Display name of the moderator. */
  moderator_user_name: string;
}

/**
 * Every action object of a `channel.moderate` event, all null. Each variant of
 * the event starts from this shape and replaces the one object that matches
 * its action.
 */
export interface ChannelModerateEmptyActionObjects {
  /** Null unless `action` is `followers`. */
  followers: null;
  /** Null unless `action` is `slow`. */
  slow: null;
  /** Null unless `action` is `vip`. */
  vip: null;
  /** Null unless `action` is `unvip`. */
  unvip: null;
  /** Null unless `action` is `mod`. */
  mod: null;
  /** Null unless `action` is `unmod`. */
  unmod: null;
  /** Null unless `action` is `ban`. */
  ban: null;
  /** Null unless `action` is `unban`. */
  unban: null;
  /** Null unless `action` is `timeout`. */
  timeout: null;
  /** Null unless `action` is `untimeout`. */
  untimeout: null;
  /** Null unless `action` is `raid`. */
  raid: null;
  /** Null unless `action` is `unraid`. */
  unraid: null;
  /** Null unless `action` is `delete`. */
  delete: null;
  /** Null unless `action` adds or removes a blocked or permitted term. */
  automod_terms: null;
  /** Null unless `action` is `approve_unban_request` or `deny_unban_request`. */
  unban_request: null;
  /** Null unless `action` is `warn`. */
  warn: null;
  /** Null unless `action` is `shared_chat_ban`. */
  shared_chat_ban: null;
  /** Null unless `action` is `shared_chat_unban`. */
  shared_chat_unban: null;
  /** Null unless `action` is `shared_chat_timeout`. */
  shared_chat_timeout: null;
  /** Null unless `action` is `shared_chat_untimeout`. */
  shared_chat_untimeout: null;
  /** Null unless `action` is `shared_chat_delete`. */
  shared_chat_delete: null;
}

/** `channel.moderate` event: followers-only mode was turned on. */
export interface ChannelModerateFollowersEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "followers"> {
  /** Action taken by the moderator. */
  action: "followers";
  /** Followers-only mode settings. */
  followers: ChannelModerateFollowers;
}

/** `channel.moderate` event: slow mode was turned on. */
export interface ChannelModerateSlowEvent extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "slow"> {
  /** Action taken by the moderator. */
  action: "slow";
  /** Slow mode settings. */
  slow: ChannelModerateSlow;
}

/** `channel.moderate` event: a user was made VIP. */
export interface ChannelModerateVipEvent extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "vip"> {
  /** Action taken by the moderator. */
  action: "vip";
  /** User who became VIP. */
  vip: ChannelModerateUser;
}

/** `channel.moderate` event: a user lost VIP status. */
export interface ChannelModerateUnvipEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "unvip"> {
  /** Action taken by the moderator. */
  action: "unvip";
  /** User who lost VIP status. */
  unvip: ChannelModerateUser;
}

/** `channel.moderate` event: a user was made moderator. */
export interface ChannelModerateModEvent extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "mod"> {
  /** Action taken by the moderator. */
  action: "mod";
  /** User who became moderator. */
  mod: ChannelModerateUser;
}

/** `channel.moderate` event: a user lost moderator status. */
export interface ChannelModerateUnmodEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "unmod"> {
  /** Action taken by the moderator. */
  action: "unmod";
  /** User who lost moderator status. */
  unmod: ChannelModerateUser;
}

/** `channel.moderate` event: a user was banned. */
export interface ChannelModerateBanEvent extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "ban"> {
  /** Action taken by the moderator. */
  action: "ban";
  /** Banned user and reason. */
  ban: ChannelModerateBan;
}

/** `channel.moderate` event: a user was unbanned. */
export interface ChannelModerateUnbanEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "unban"> {
  /** Action taken by the moderator. */
  action: "unban";
  /** User who was unbanned. */
  unban: ChannelModerateUser;
}

/** `channel.moderate` event: a user was timed out. */
export interface ChannelModerateTimeoutEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "timeout"> {
  /** Action taken by the moderator. */
  action: "timeout";
  /** Timed out user, reason and end of the timeout. */
  timeout: ChannelModerateTimeout;
}

/** `channel.moderate` event: a timeout was lifted. */
export interface ChannelModerateUntimeoutEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "untimeout"> {
  /** Action taken by the moderator. */
  action: "untimeout";
  /** User whose timeout was lifted. */
  untimeout: ChannelModerateUser;
}

/** `channel.moderate` event: a raid was started. */
export interface ChannelModerateRaidEvent extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "raid"> {
  /** Action taken by the moderator. */
  action: "raid";
  /** Raided channel and viewer count. */
  raid: ChannelModerateRaid;
}

/** `channel.moderate` event: a raid was canceled. */
export interface ChannelModerateUnraidEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "unraid"> {
  /** Action taken by the moderator. */
  action: "unraid";
  /** Channel that is no longer being raided. */
  unraid: ChannelModerateUser;
}

/** `channel.moderate` event: a chat message was deleted. */
export interface ChannelModerateDeleteEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "delete"> {
  /** Action taken by the moderator. */
  action: "delete";
  /** Deleted message and its author. */
  delete: ChannelModerateDelete;
}

/** `channel.moderate` event: blocked or permitted terms were added or removed. */
export interface ChannelModerateAutomodTermsEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "automod_terms"> {
  /** Action taken by the moderator. */
  action: "add_blocked_term" | "add_permitted_term" | "remove_blocked_term" | "remove_permitted_term";
  /** Terms that changed and the list they belong to. */
  automod_terms: ChannelModerateAutomodTerms;
}

/** `channel.moderate` event: an unban request was approved or denied. */
export interface ChannelModerateUnbanRequestEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "unban_request"> {
  /** Action taken by the moderator. */
  action: "approve_unban_request" | "deny_unban_request";
  /** Unban request and the decision taken. */
  unban_request: ChannelModerateUnbanRequest;
}

/** `channel.moderate` event: a user was warned. */
export interface ChannelModerateWarnEvent extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "warn"> {
  /** Action taken by the moderator. */
  action: "warn";
  /** Warned user, reason and rules cited. */
  warn: ChannelModerateWarn;
}

/** `channel.moderate` event: a user was banned in another channel of the shared chat session. */
export interface ChannelModerateSharedChatBanEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "shared_chat_ban"> {
  /** Action taken by the moderator. */
  action: "shared_chat_ban";
  /** Banned user and reason. */
  shared_chat_ban: ChannelModerateBan;
}

/** `channel.moderate` event: a user was unbanned in another channel of the shared chat session. */
export interface ChannelModerateSharedChatUnbanEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "shared_chat_unban"> {
  /** Action taken by the moderator. */
  action: "shared_chat_unban";
  /** User who was unbanned. */
  shared_chat_unban: ChannelModerateUser;
}

/** `channel.moderate` event: a user was timed out in another channel of the shared chat session. */
export interface ChannelModerateSharedChatTimeoutEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "shared_chat_timeout"> {
  /** Action taken by the moderator. */
  action: "shared_chat_timeout";
  /** Timed out user, reason and end of the timeout. */
  shared_chat_timeout: ChannelModerateTimeout;
}

/** `channel.moderate` event: a timeout was lifted in another channel of the shared chat session. */
export interface ChannelModerateSharedChatUntimeoutEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "shared_chat_untimeout"> {
  /** Action taken by the moderator. */
  action: "shared_chat_untimeout";
  /** User whose timeout was lifted. */
  shared_chat_untimeout: ChannelModerateUser;
}

/** `channel.moderate` event: a chat message was deleted in another channel of the shared chat session. */
export interface ChannelModerateSharedChatDeleteEvent
  extends ChannelModerateBase, Omit<ChannelModerateEmptyActionObjects, "shared_chat_delete"> {
  /** Action taken by the moderator. */
  action: "shared_chat_delete";
  /** Deleted message and its author. */
  shared_chat_delete: ChannelModerateDelete;
}

/**
 * `channel.moderate` event for the actions that carry no details: clearing the chat and
 * switching a chat mode. Every action object is null.
 */
export interface ChannelModeratePlainEvent extends ChannelModerateBase, ChannelModerateEmptyActionObjects {
  /** Action taken by the moderator. */
  action:
    | "clear"
    | "emoteonly"
    | "emoteonlyoff"
    | "followersoff"
    | "uniquechat"
    | "uniquechatoff"
    | "slowoff"
    | "subscribers"
    | "subscribersoff";
}

/**
 * Event of `channel.moderate` (version 2). Narrow on `action` to get the object
 * that describes it: after `event.action === "timeout"`, `event.timeout` is set.
 */
export type ChannelModerateEvent =
  | ChannelModerateFollowersEvent
  | ChannelModerateSlowEvent
  | ChannelModerateVipEvent
  | ChannelModerateUnvipEvent
  | ChannelModerateModEvent
  | ChannelModerateUnmodEvent
  | ChannelModerateBanEvent
  | ChannelModerateUnbanEvent
  | ChannelModerateTimeoutEvent
  | ChannelModerateUntimeoutEvent
  | ChannelModerateRaidEvent
  | ChannelModerateUnraidEvent
  | ChannelModerateDeleteEvent
  | ChannelModerateAutomodTermsEvent
  | ChannelModerateUnbanRequestEvent
  | ChannelModerateWarnEvent
  | ChannelModerateSharedChatBanEvent
  | ChannelModerateSharedChatUnbanEvent
  | ChannelModerateSharedChatTimeoutEvent
  | ChannelModerateSharedChatUntimeoutEvent
  | ChannelModerateSharedChatDeleteEvent
  | ChannelModeratePlainEvent;

/** Every value `action` can take in a `channel.moderate` event. */
export type ChannelModerateAction = ChannelModerateEvent["action"];

// channel.moderate (version 1)

/** Condition of `channel.moderate` version 1. */
export type ChannelModerateV1Condition = ChannelModerateCondition;

/**
 * Every action object of a version 1 `channel.moderate` event, all null.
 * Version 1 has no `warn` object.
 */
export type ChannelModerateV1EmptyActionObjects = Omit<ChannelModerateEmptyActionObjects, "warn">;

/** Version 1 `channel.moderate` event: followers-only mode was turned on. */
export interface ChannelModerateV1FollowersEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "followers"> {
  /** Action taken by the moderator. */
  action: "followers";
  /** Followers-only mode settings. */
  followers: ChannelModerateFollowers;
}

/** Version 1 `channel.moderate` event: slow mode was turned on. */
export interface ChannelModerateV1SlowEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "slow"> {
  /** Action taken by the moderator. */
  action: "slow";
  /** Slow mode settings. */
  slow: ChannelModerateSlow;
}

/** Version 1 `channel.moderate` event: a user was made VIP. */
export interface ChannelModerateV1VipEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "vip"> {
  /** Action taken by the moderator. */
  action: "vip";
  /** User who became VIP. */
  vip: ChannelModerateUser;
}

/** Version 1 `channel.moderate` event: a user lost VIP status. */
export interface ChannelModerateV1UnvipEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "unvip"> {
  /** Action taken by the moderator. */
  action: "unvip";
  /** User who lost VIP status. */
  unvip: ChannelModerateUser;
}

/** Version 1 `channel.moderate` event: a user was made moderator. */
export interface ChannelModerateV1ModEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "mod"> {
  /** Action taken by the moderator. */
  action: "mod";
  /** User who became moderator. */
  mod: ChannelModerateUser;
}

/** Version 1 `channel.moderate` event: a user lost moderator status. */
export interface ChannelModerateV1UnmodEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "unmod"> {
  /** Action taken by the moderator. */
  action: "unmod";
  /** User who lost moderator status. */
  unmod: ChannelModerateUser;
}

/** Version 1 `channel.moderate` event: a user was banned. */
export interface ChannelModerateV1BanEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "ban"> {
  /** Action taken by the moderator. */
  action: "ban";
  /** Banned user and reason. */
  ban: ChannelModerateBan;
}

/** Version 1 `channel.moderate` event: a user was unbanned. */
export interface ChannelModerateV1UnbanEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "unban"> {
  /** Action taken by the moderator. */
  action: "unban";
  /** User who was unbanned. */
  unban: ChannelModerateUser;
}

/** Version 1 `channel.moderate` event: a user was timed out. */
export interface ChannelModerateV1TimeoutEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "timeout"> {
  /** Action taken by the moderator. */
  action: "timeout";
  /** Timed out user, reason and end of the timeout. */
  timeout: ChannelModerateTimeout;
}

/** Version 1 `channel.moderate` event: a timeout was lifted. */
export interface ChannelModerateV1UntimeoutEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "untimeout"> {
  /** Action taken by the moderator. */
  action: "untimeout";
  /** User whose timeout was lifted. */
  untimeout: ChannelModerateUser;
}

/** Version 1 `channel.moderate` event: a raid was started. */
export interface ChannelModerateV1RaidEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "raid"> {
  /** Action taken by the moderator. */
  action: "raid";
  /** Raided channel and viewer count. */
  raid: ChannelModerateRaid;
}

/** Version 1 `channel.moderate` event: a raid was canceled. */
export interface ChannelModerateV1UnraidEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "unraid"> {
  /** Action taken by the moderator. */
  action: "unraid";
  /** Channel that is no longer being raided. */
  unraid: ChannelModerateUser;
}

/** Version 1 `channel.moderate` event: a chat message was deleted. */
export interface ChannelModerateV1DeleteEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "delete"> {
  /** Action taken by the moderator. */
  action: "delete";
  /** Deleted message and its author. */
  delete: ChannelModerateDelete;
}

/** Version 1 `channel.moderate` event: blocked or permitted terms were added or removed. */
export interface ChannelModerateV1AutomodTermsEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "automod_terms"> {
  /** Action taken by the moderator. */
  action: "add_blocked_term" | "add_permitted_term" | "remove_blocked_term" | "remove_permitted_term";
  /** Terms that changed and the list they belong to. */
  automod_terms: ChannelModerateAutomodTerms;
}

/** Version 1 `channel.moderate` event: an unban request was approved or denied. */
export interface ChannelModerateV1UnbanRequestEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "unban_request"> {
  /** Action taken by the moderator. */
  action: "approve_unban_request" | "deny_unban_request";
  /** Unban request and the decision taken. */
  unban_request: ChannelModerateUnbanRequest;
}

/** Version 1 `channel.moderate` event: a user was banned in another channel of the shared chat session. */
export interface ChannelModerateV1SharedChatBanEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "shared_chat_ban"> {
  /** Action taken by the moderator. */
  action: "shared_chat_ban";
  /** Banned user and reason. */
  shared_chat_ban: ChannelModerateBan;
}

/** Version 1 `channel.moderate` event: a user was unbanned in another channel of the shared chat session. */
export interface ChannelModerateV1SharedChatUnbanEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "shared_chat_unban"> {
  /** Action taken by the moderator. */
  action: "shared_chat_unban";
  /** User who was unbanned. */
  shared_chat_unban: ChannelModerateUser;
}

/** Version 1 `channel.moderate` event: a user was timed out in another channel of the shared chat session. */
export interface ChannelModerateV1SharedChatTimeoutEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "shared_chat_timeout"> {
  /** Action taken by the moderator. */
  action: "shared_chat_timeout";
  /** Timed out user, reason and end of the timeout. */
  shared_chat_timeout: ChannelModerateTimeout;
}

/** Version 1 `channel.moderate` event: a timeout was lifted in another channel of the shared chat session. */
export interface ChannelModerateV1SharedChatUntimeoutEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "shared_chat_untimeout"> {
  /** Action taken by the moderator. */
  action: "shared_chat_untimeout";
  /** User whose timeout was lifted. */
  shared_chat_untimeout: ChannelModerateUser;
}

/** Version 1 `channel.moderate` event: a chat message was deleted in another channel of the shared chat session. */
export interface ChannelModerateV1SharedChatDeleteEvent
  extends ChannelModerateBase, Omit<ChannelModerateV1EmptyActionObjects, "shared_chat_delete"> {
  /** Action taken by the moderator. */
  action: "shared_chat_delete";
  /** Deleted message and its author. */
  shared_chat_delete: ChannelModerateDelete;
}

/**
 * Version 1 `channel.moderate` event for the actions that carry no details: clearing the chat and
 * switching a chat mode. Every action object is null.
 */
export interface ChannelModerateV1PlainEvent extends ChannelModerateBase, ChannelModerateV1EmptyActionObjects {
  /** Action taken by the moderator. */
  action:
    | "clear"
    | "emoteonly"
    | "emoteonlyoff"
    | "followersoff"
    | "uniquechat"
    | "uniquechatoff"
    | "slowoff"
    | "subscribers"
    | "subscribersoff";
}

/**
 * Event of `channel.moderate` version 1. Narrow on `action` to get the object
 * that describes it: after `event.action === "timeout"`, `event.timeout` is set.
 */
export type ChannelModerateV1Event =
  | ChannelModerateV1FollowersEvent
  | ChannelModerateV1SlowEvent
  | ChannelModerateV1VipEvent
  | ChannelModerateV1UnvipEvent
  | ChannelModerateV1ModEvent
  | ChannelModerateV1UnmodEvent
  | ChannelModerateV1BanEvent
  | ChannelModerateV1UnbanEvent
  | ChannelModerateV1TimeoutEvent
  | ChannelModerateV1UntimeoutEvent
  | ChannelModerateV1RaidEvent
  | ChannelModerateV1UnraidEvent
  | ChannelModerateV1DeleteEvent
  | ChannelModerateV1AutomodTermsEvent
  | ChannelModerateV1UnbanRequestEvent
  | ChannelModerateV1SharedChatBanEvent
  | ChannelModerateV1SharedChatUnbanEvent
  | ChannelModerateV1SharedChatTimeoutEvent
  | ChannelModerateV1SharedChatUntimeoutEvent
  | ChannelModerateV1SharedChatDeleteEvent
  | ChannelModerateV1PlainEvent;

/** Every value `action` can take in a version 1 `channel.moderate` event. */
export type ChannelModerateV1Action = ChannelModerateV1Event["action"];

// channel.moderator.add

/** Condition of `channel.moderator.add`. */
export interface ChannelModeratorAddCondition {
  /** ID of the broadcaster whose new moderators to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.moderator.add`. */
export interface ChannelModeratorAddEvent {
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the new moderator. */
  user_id: string;
  /** Login name of the new moderator. */
  user_login: string;
  /** Display name of the new moderator. */
  user_name: string;
}

// channel.moderator.remove

/** Condition of `channel.moderator.remove`. */
export interface ChannelModeratorRemoveCondition {
  /** ID of the broadcaster whose removed moderators to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.moderator.remove`. */
export interface ChannelModeratorRemoveEvent {
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the user who is no longer a moderator. */
  user_id: string;
  /** Login name of the user who is no longer a moderator. */
  user_login: string;
  /** Display name of the user who is no longer a moderator. */
  user_name: string;
}

// channel.suspicious_user.message

/** Treatment applied to a suspicious user. */
export type ChannelSuspiciousUserStatus = "none" | "active_monitoring" | "restricted";

/** Condition of `channel.suspicious_user.message`. */
export interface ChannelSuspiciousUserMessageCondition {
  /** ID of the broadcaster whose chat to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Cheermote data of a message fragment. */
export interface ChannelSuspiciousUserMessageCheermote {
  /** Name part of the Cheermote: `Cheer` in `Cheer100`. */
  prefix: string;
  /** Number of Bits cheered. */
  bits: number;
  /** Tier of the Cheermote. */
  tier: number;
}

/** Emote data of a message fragment. */
export interface ChannelSuspiciousUserMessageEmote {
  /** ID of the emote. */
  id: string;
  /** ID of the emote set the emote belongs to. */
  emote_set_id: string;
}

/** Fields shared by every fragment of a suspicious user's message. */
export interface ChannelSuspiciousUserMessageFragmentBase {
  /** Text of this part of the message. */
  text: string;
}

/** Plain text fragment. */
export interface ChannelSuspiciousUserMessageTextFragment extends ChannelSuspiciousUserMessageFragmentBase {
  /** Kind of fragment. */
  type: "text";
  /** Null for a text fragment. */
  cheermote: null;
  /** Null for a text fragment. */
  emote: null;
}

/** Cheermote fragment. */
export interface ChannelSuspiciousUserMessageCheermoteFragment extends ChannelSuspiciousUserMessageFragmentBase {
  /** Kind of fragment. */
  type: "cheermote";
  /** The Cheermote used. */
  cheermote: ChannelSuspiciousUserMessageCheermote;
  /** Null for a Cheermote fragment. */
  emote: null;
}

/** Emote fragment. */
export interface ChannelSuspiciousUserMessageEmoteFragment extends ChannelSuspiciousUserMessageFragmentBase {
  /** Kind of fragment. */
  type: "emote";
  /** Null for an emote fragment. */
  cheermote: null;
  /** The emote used. */
  emote: ChannelSuspiciousUserMessageEmote;
}

/** One part of a suspicious user's message. Narrow on `type`. */
export type ChannelSuspiciousUserMessageFragment =
  | ChannelSuspiciousUserMessageTextFragment
  | ChannelSuspiciousUserMessageCheermoteFragment
  | ChannelSuspiciousUserMessageEmoteFragment;

/** Chat message sent by a suspicious user. */
export interface ChannelSuspiciousUserMessageContent {
  /** ID of the message (a UUID). */
  message_id: string;
  /** Whole message as plain text. */
  text: string;
  /** The message split into ordered fragments. */
  fragments: ChannelSuspiciousUserMessageFragment[];
}

/** Event of `channel.suspicious_user.message`. */
export interface ChannelSuspiciousUserMessageEvent {
  /** ID of the broadcaster whose chat received the message. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** ID of the user who sent the message. */
  user_id: string;
  /** Display name of the user who sent the message. */
  user_name: string;
  /** Login name of the user who sent the message. */
  user_login: string;
  /** Treatment currently applied to the user. */
  low_trust_status: ChannelSuspiciousUserStatus;
  /** IDs of the channels sharing their ban list where the user is also banned. */
  shared_ban_channel_ids: string[];
  /** Why the user is considered suspicious. May be empty. */
  types: Array<"manually_added" | "ban_evader" | "banned_in_shared_channel">;
  /** Likelihood, estimated by Twitch, that the user is evading a ban. */
  ban_evasion_evaluation: "unknown" | "possible" | "likely";
  /** The chat message. */
  message: ChannelSuspiciousUserMessageContent;
}

// channel.suspicious_user.update

/** Condition of `channel.suspicious_user.update`. */
export interface ChannelSuspiciousUserUpdateCondition {
  /** ID of the broadcaster whose suspicious users to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Event of `channel.suspicious_user.update`. */
export interface ChannelSuspiciousUserUpdateEvent {
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** ID of the moderator who changed the treatment. */
  moderator_user_id: string;
  /** Display name of the moderator who changed the treatment. */
  moderator_user_name: string;
  /** Login name of the moderator who changed the treatment. */
  moderator_user_login: string;
  /** ID of the suspicious user. */
  user_id: string;
  /** Display name of the suspicious user. */
  user_name: string;
  /** Login name of the suspicious user. */
  user_login: string;
  /** Treatment now applied to the user. */
  low_trust_status: ChannelSuspiciousUserStatus;
}

// channel.vip.add

/** Condition of `channel.vip.add`. */
export interface ChannelVipAddCondition {
  /** ID of the broadcaster whose new VIPs to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.vip.add`. */
export interface ChannelVipAddEvent {
  /** ID of the new VIP. */
  user_id: string;
  /** Login name of the new VIP. */
  user_login: string;
  /** Display name of the new VIP. */
  user_name: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
}

// channel.vip.remove

/** Condition of `channel.vip.remove`. */
export interface ChannelVipRemoveCondition {
  /** ID of the broadcaster whose removed VIPs to watch. */
  broadcaster_user_id: string;
}

/** Event of `channel.vip.remove`. */
export interface ChannelVipRemoveEvent {
  /** ID of the user who is no longer a VIP. */
  user_id: string;
  /** Login name of the user who is no longer a VIP. */
  user_login: string;
  /** Display name of the user who is no longer a VIP. */
  user_name: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
}

// channel.warning.acknowledge

/** Condition of `channel.warning.acknowledge`. */
export interface ChannelWarningAcknowledgeCondition {
  /** ID of the broadcaster whose warnings to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Event of `channel.warning.acknowledge`. */
export interface ChannelWarningAcknowledgeEvent {
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the user who acknowledged the warning. */
  user_id: string;
  /** Login name of the user who acknowledged the warning. */
  user_login: string;
  /** Display name of the user who acknowledged the warning. */
  user_name: string;
}

// channel.warning.send

/** Condition of `channel.warning.send`. */
export interface ChannelWarningSendCondition {
  /** ID of the broadcaster whose warnings to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Event of `channel.warning.send`. */
export interface ChannelWarningSendEvent {
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the moderator who sent the warning. */
  moderator_user_id: string;
  /** Login name of the moderator who sent the warning. */
  moderator_user_login: string;
  /** Display name of the moderator who sent the warning. */
  moderator_user_name: string;
  /** ID of the warned user. */
  user_id: string;
  /** Login name of the warned user. */
  user_login: string;
  /** Display name of the warned user. */
  user_name: string;
  /** Reason given for the warning, when there is one. */
  reason?: string | null;
  /** Chat rules cited in the warning, when there are any. */
  chat_rules_cited?: string[] | null;
}

// channel.shield_mode.begin

/** Condition of `channel.shield_mode.begin`. */
export interface ChannelShieldModeBeginCondition {
  /** ID of the broadcaster whose Shield Mode to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Event of `channel.shield_mode.begin`. */
export interface ChannelShieldModeBeginEvent {
  /** ID of the broadcaster whose Shield Mode was turned on. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the moderator who turned Shield Mode on. The broadcaster's ID when they did it. */
  moderator_user_id: string;
  /** Login name of that moderator. */
  moderator_user_login: string;
  /** Display name of that moderator. */
  moderator_user_name: string;
  /** RFC 3339 timestamp of the activation. */
  started_at: string;
}

// channel.shield_mode.end

/** Condition of `channel.shield_mode.end`. */
export interface ChannelShieldModeEndCondition {
  /** ID of the broadcaster whose Shield Mode to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Event of `channel.shield_mode.end`. */
export interface ChannelShieldModeEndEvent {
  /** ID of the broadcaster whose Shield Mode was turned off. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** ID of the moderator who turned Shield Mode off. The broadcaster's ID when they did it. */
  moderator_user_id: string;
  /** Login name of that moderator. */
  moderator_user_login: string;
  /** Display name of that moderator. */
  moderator_user_name: string;
  /** RFC 3339 timestamp of the deactivation. */
  ended_at: string;
}

// channel.shoutout.create

/** Condition of `channel.shoutout.create`. */
export interface ChannelShoutoutCreateCondition {
  /** ID of the broadcaster whose sent Shoutouts to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Event of `channel.shoutout.create`. */
export interface ChannelShoutoutCreateEvent {
  /** ID of the broadcaster who sent the Shoutout. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster who sent the Shoutout. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster who sent the Shoutout. */
  broadcaster_user_name: string;
  /** ID of the broadcaster who received the Shoutout. */
  to_broadcaster_user_id: string;
  /** Login name of the broadcaster who received the Shoutout. */
  to_broadcaster_user_login: string;
  /** Display name of the broadcaster who received the Shoutout. */
  to_broadcaster_user_name: string;
  /** ID of the moderator who sent the Shoutout. The broadcaster's ID when they did it. */
  moderator_user_id: string;
  /** Login name of that moderator. */
  moderator_user_login: string;
  /** Display name of that moderator. */
  moderator_user_name: string;
  /** Number of viewers watching the sending channel at that moment. */
  viewer_count: number;
  /** RFC 3339 timestamp of the Shoutout. */
  started_at: string;
  /** RFC 3339 timestamp from which the broadcaster may send a Shoutout to another channel. */
  cooldown_ends_at: string;
  /** RFC 3339 timestamp from which the broadcaster may send a Shoutout to the same channel again. */
  target_cooldown_ends_at: string;
}

// channel.shoutout.receive

/** Condition of `channel.shoutout.receive`. */
export interface ChannelShoutoutReceiveCondition {
  /** ID of the broadcaster whose received Shoutouts to watch. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of a moderator of the channel, who granted the scope. */
  moderator_user_id: string;
}

/** Event of `channel.shoutout.receive`. */
export interface ChannelShoutoutReceiveEvent {
  /** ID of the broadcaster who received the Shoutout. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster who received the Shoutout. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster who received the Shoutout. */
  broadcaster_user_name: string;
  /** ID of the broadcaster who sent the Shoutout. */
  from_broadcaster_user_id: string;
  /** Login name of the broadcaster who sent the Shoutout. */
  from_broadcaster_user_login: string;
  /** Display name of the broadcaster who sent the Shoutout. */
  from_broadcaster_user_name: string;
  /** Number of viewers watching the sending channel at that moment. */
  viewer_count: number;
  /** RFC 3339 timestamp of the Shoutout. */
  started_at: string;
}

// stream.online

/** Condition of `stream.online`. */
export interface StreamOnlineCondition {
  /** ID of the broadcaster whose stream starts to watch. */
  broadcaster_user_id: string;
}

/** Event of `stream.online`. */
export interface StreamOnlineEvent {
  /** ID of the stream. */
  id: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Kind of stream. */
  type: "live" | "playlist" | "watch_party" | "premiere" | "rerun";
  /** RFC 3339 timestamp of the start of the stream. */
  started_at: string;
}

// stream.offline

/** Condition of `stream.offline`. */
export interface StreamOfflineCondition {
  /** ID of the broadcaster whose stream ends to watch. */
  broadcaster_user_id: string;
}

/** Event of `stream.offline`. */
export interface StreamOfflineEvent {
  /** ID of the stream. */
  id: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Login name of the broadcaster. */
  broadcaster_user_login: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
}

/** Channel, moderation and stream subscription types. */
export interface ChannelEventSubTypes {
  /**
   * The broadcaster changed the title, category, language or content
   * classification labels of the channel.
   *
   * Scope: none.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate
   */
  "channel.update": EventSubDefinition<"2", ChannelUpdateCondition, ChannelUpdateEvent>;
  /**
   * Someone followed the channel.
   *
   * Scope: `moderator:read:followers`, granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelfollow
   */
  "channel.follow": EventSubDefinition<"2", ChannelFollowCondition, ChannelFollowEvent>;
  /**
   * A midroll ad break started, run by hand or scheduled by Ads Manager.
   *
   * Scope: `channel:read:ads`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelad_breakbegin
   */
  "channel.ad_break.begin": EventSubDefinition<"1", ChannelAdBreakBeginCondition, ChannelAdBreakBeginEvent>;
  /**
   * A user subscribed to the channel. Resubscriptions are not included.
   *
   * Scope: `channel:read:subscriptions`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe
   */
  "channel.subscribe": EventSubDefinition<"1", ChannelSubscribeCondition, ChannelSubscribeEvent>;
  /**
   * A subscription to the channel ended.
   *
   * Scope: `channel:read:subscriptions`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionend
   */
  "channel.subscription.end": EventSubDefinition<"1", ChannelSubscriptionEndCondition, ChannelSubscriptionEndEvent>;
  /**
   * A viewer gifted one or more subscriptions in the channel.
   *
   * Scope: `channel:read:subscriptions`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptiongift
   */
  "channel.subscription.gift": EventSubDefinition<"1", ChannelSubscriptionGiftCondition, ChannelSubscriptionGiftEvent>;
  /**
   * A subscriber shared a resubscription message in chat.
   *
   * Scope: `channel:read:subscriptions`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionmessage
   */
  "channel.subscription.message": EventSubDefinition<
    "1",
    ChannelSubscriptionMessageCondition,
    ChannelSubscriptionMessageEvent
  >;
  /**
   * A user cheered Bits in the channel.
   *
   * Scope: `bits:read`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer
   */
  "channel.cheer": EventSubDefinition<"1", ChannelCheerCondition, ChannelCheerEvent>;
  /**
   * A broadcaster raided another channel.
   *
   * Scope: none.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid
   */
  "channel.raid": EventSubDefinition<"1", ChannelRaidCondition, ChannelRaidEvent>;
  /**
   * A viewer was banned or timed out in the channel.
   *
   * Scope: `channel:moderate`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelban
   */
  "channel.ban": EventSubDefinition<"1", ChannelBanCondition, ChannelBanEvent>;
  /**
   * A viewer was unbanned in the channel.
   *
   * Scope: `channel:moderate`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban
   */
  "channel.unban": EventSubDefinition<"1", ChannelUnbanCondition, ChannelUnbanEvent>;
  /**
   * A banned user created an unban request.
   *
   * Scope: one of `moderator:read:unban_requests`, `moderator:manage:unban_requests`,
   * granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestcreate
   */
  "channel.unban_request.create": EventSubDefinition<
    "1",
    ChannelUnbanRequestCreateCondition,
    ChannelUnbanRequestCreateEvent
  >;
  /**
   * An unban request was approved, denied or canceled.
   *
   * Scope: one of `moderator:read:unban_requests`, `moderator:manage:unban_requests`,
   * granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestresolve
   */
  "channel.unban_request.resolve": EventSubDefinition<
    "1",
    ChannelUnbanRequestResolveCondition,
    ChannelUnbanRequestResolveEvent
  >;
  /**
   * A moderator took a moderation action in the channel, warnings included.
   * Narrow the event on `action` to read the matching details.
   *
   * Scope: all of the following, granted by the user set as `moderator_user_id`:
   * one of `moderator:read:blocked_terms`, `moderator:manage:blocked_terms`;
   * one of `moderator:read:chat_settings`, `moderator:manage:chat_settings`;
   * one of `moderator:read:unban_requests`, `moderator:manage:unban_requests`;
   * one of `moderator:read:banned_users`, `moderator:manage:banned_users`;
   * one of `moderator:read:chat_messages`, `moderator:manage:chat_messages`;
   * one of `moderator:read:warnings`, `moderator:manage:warnings`;
   * `moderator:read:moderators`; `moderator:read:vips`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate-v2
   */
  "channel.moderate": EventSubDefinition<"2", ChannelModerateCondition, ChannelModerateEvent>;
  /**
   * A moderator took a moderation action in the channel. Version 1 does not
   * report warnings. Narrow the event on `action` to read the matching details.
   *
   * Scope: all of the following, granted by the user set as `moderator_user_id`:
   * one of `moderator:read:blocked_terms`, `moderator:manage:blocked_terms`;
   * one of `moderator:read:chat_settings`, `moderator:manage:chat_settings`;
   * one of `moderator:read:unban_requests`, `moderator:manage:unban_requests`;
   * one of `moderator:read:banned_users`, `moderator:manage:banned_users`;
   * one of `moderator:read:chat_messages`, `moderator:manage:chat_messages`;
   * `moderator:read:moderators`; `moderator:read:vips`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate
   */
  "channel.moderate@1": EventSubDefinition<"1", ChannelModerateV1Condition, ChannelModerateV1Event>;
  /**
   * A user was made moderator of the channel.
   *
   * Scope: `moderation:read`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatoradd
   */
  "channel.moderator.add": EventSubDefinition<"1", ChannelModeratorAddCondition, ChannelModeratorAddEvent>;
  /**
   * A user lost moderator status in the channel.
   *
   * Scope: `moderation:read`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatorremove
   */
  "channel.moderator.remove": EventSubDefinition<"1", ChannelModeratorRemoveCondition, ChannelModeratorRemoveEvent>;
  /**
   * A user flagged as suspicious sent a chat message.
   *
   * Scope: `moderator:read:suspicious_users`, granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_usermessage
   */
  "channel.suspicious_user.message": EventSubDefinition<
    "1",
    ChannelSuspiciousUserMessageCondition,
    ChannelSuspiciousUserMessageEvent
  >;
  /**
   * A moderator changed the treatment applied to a suspicious user.
   *
   * Scope: `moderator:read:suspicious_users`, granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_userupdate
   */
  "channel.suspicious_user.update": EventSubDefinition<
    "1",
    ChannelSuspiciousUserUpdateCondition,
    ChannelSuspiciousUserUpdateEvent
  >;
  /**
   * A user was made VIP of the channel.
   *
   * Scope: one of `channel:read:vips`, `channel:manage:vips`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipadd
   */
  "channel.vip.add": EventSubDefinition<"1", ChannelVipAddCondition, ChannelVipAddEvent>;
  /**
   * A user lost VIP status in the channel.
   *
   * Scope: one of `channel:read:vips`, `channel:manage:vips`, granted by the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipremove
   */
  "channel.vip.remove": EventSubDefinition<"1", ChannelVipRemoveCondition, ChannelVipRemoveEvent>;
  /**
   * A user acknowledged a warning they received in the channel.
   *
   * Scope: one of `moderator:read:warnings`, `moderator:manage:warnings`,
   * granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningacknowledge
   */
  "channel.warning.acknowledge": EventSubDefinition<
    "1",
    ChannelWarningAcknowledgeCondition,
    ChannelWarningAcknowledgeEvent
  >;
  /**
   * A warning was sent to a user in the channel.
   *
   * Scope: one of `moderator:read:warnings`, `moderator:manage:warnings`,
   * granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningsend
   */
  "channel.warning.send": EventSubDefinition<"1", ChannelWarningSendCondition, ChannelWarningSendEvent>;
  /**
   * Shield Mode was turned on in the channel.
   *
   * Scope: one of `moderator:read:shield_mode`, `moderator:manage:shield_mode`,
   * granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modebegin
   */
  "channel.shield_mode.begin": EventSubDefinition<"1", ChannelShieldModeBeginCondition, ChannelShieldModeBeginEvent>;
  /**
   * Shield Mode was turned off in the channel.
   *
   * Scope: one of `moderator:read:shield_mode`, `moderator:manage:shield_mode`,
   * granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modeend
   */
  "channel.shield_mode.end": EventSubDefinition<"1", ChannelShieldModeEndCondition, ChannelShieldModeEndEvent>;
  /**
   * The broadcaster sent a Shoutout to another channel.
   *
   * Scope: one of `moderator:read:shoutouts`, `moderator:manage:shoutouts`,
   * granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutcreate
   */
  "channel.shoutout.create": EventSubDefinition<"1", ChannelShoutoutCreateCondition, ChannelShoutoutCreateEvent>;
  /**
   * The broadcaster received a Shoutout from another channel. Fires only when
   * Twitch posts the Shoutout to the activity feed of the broadcaster.
   *
   * Scope: one of `moderator:read:shoutouts`, `moderator:manage:shoutouts`,
   * granted by the user set as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutreceive
   */
  "channel.shoutout.receive": EventSubDefinition<"1", ChannelShoutoutReceiveCondition, ChannelShoutoutReceiveEvent>;
  /**
   * The broadcaster started a stream.
   *
   * Scope: none.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamonline
   */
  "stream.online": EventSubDefinition<"1", StreamOnlineCondition, StreamOnlineEvent>;
  /**
   * The broadcaster stopped streaming.
   *
   * Scope: none.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamoffline
   */
  "stream.offline": EventSubDefinition<"1", StreamOfflineCondition, StreamOfflineEvent>;
}

/** Version to send when subscribing to each entry of {@link ChannelEventSubTypes}. */
export const channelVersions = {
  "channel.update": "2",
  "channel.follow": "2",
  "channel.ad_break.begin": "1",
  "channel.subscribe": "1",
  "channel.subscription.end": "1",
  "channel.subscription.gift": "1",
  "channel.subscription.message": "1",
  "channel.cheer": "1",
  "channel.raid": "1",
  "channel.ban": "1",
  "channel.unban": "1",
  "channel.unban_request.create": "1",
  "channel.unban_request.resolve": "1",
  "channel.moderate": "2",
  "channel.moderate@1": "1",
  "channel.moderator.add": "1",
  "channel.moderator.remove": "1",
  "channel.suspicious_user.message": "1",
  "channel.suspicious_user.update": "1",
  "channel.vip.add": "1",
  "channel.vip.remove": "1",
  "channel.warning.acknowledge": "1",
  "channel.warning.send": "1",
  "channel.shield_mode.begin": "1",
  "channel.shield_mode.end": "1",
  "channel.shoutout.create": "1",
  "channel.shoutout.receive": "1",
  "stream.online": "1",
  "stream.offline": "1",
} as const satisfies { [K in keyof ChannelEventSubTypes]: ChannelEventSubTypes[K]["version"] };
