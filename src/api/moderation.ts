import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A message to run through AutoMod with {@link ModerationApi.checkAutoMod}. */
export interface AutoModCheckMessage {
  /** ID of your choice. It comes back in the result so you can pair the two. */
  msg_id: string;
  /** Text of the message. */
  msg_text: string;
}

/** What AutoMod would do with one checked message. */
export interface AutoModCheckResult {
  /** The ID you gave to the message. */
  msg_id: string;
  /** `true` when the message would go straight to chat, `false` when it would be held or blocked. */
  is_permitted: boolean;
}

/** Parameters of {@link ModerationApi.checkAutoMod}. */
export interface CheckAutoModParams {
  /** Broadcaster whose AutoMod settings and blocked terms apply. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Messages to check, 1 to 100. */
  data: readonly AutoModCheckMessage[];
}

/** Parameters of {@link ModerationApi.manageAutoModMessage}. */
export interface ManageAutoModMessageParams {
  /** Moderator who takes the decision. Defaults to the user making the call. */
  user_id?: string;
  /** ID of the held message. */
  msg_id: string;
  /** `"ALLOW"` releases the message to chat, `"DENY"` discards it. */
  action: "ALLOW" | "DENY";
}

/** AutoMod levels per category, each from 0 (no filtering) to 4 (strictest). */
export interface AutoModLevels {
  /** Level for discrimination against disability. */
  disability: number;
  /** Level for aggressive hostility. */
  aggression: number;
  /** Level for discrimination based on sexuality, sex or gender. */
  sexuality_sex_or_gender: number;
  /** Level for discrimination against women. */
  misogyny: number;
  /** Level for name calling and insults. */
  bullying: number;
  /** Level for profanity. */
  swearing: number;
  /** Level for racial, ethnic or religious discrimination. */
  race_ethnicity_or_religion: number;
  /** Level for sexual content. */
  sex_based_terms: number;
}

/** The AutoMod configuration of a channel. */
export interface AutoModSettings extends AutoModLevels {
  /** ID of the broadcaster. */
  broadcaster_id: string;
  /** ID of the moderator who made the call. */
  moderator_id: string;
  /** Overall level, 0 to 4. `null` when the categories were set one by one. */
  overall_level: number | null;
}

/** Parameters of {@link ModerationApi.autoModSettings}. */
export interface GetAutoModSettingsParams {
  /** Broadcaster whose settings to read. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
}

/**
 * Parameters of {@link ModerationApi.updateAutoModSettings}. Give either
 * `overall_level` or category levels, never both.
 */
export interface UpdateAutoModSettingsParams extends Partial<AutoModLevels> {
  /** Broadcaster whose settings to change. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** Overall level, 0 to 4. Twitch derives every category level from it. */
  overall_level?: number;
}

/** A user who is banned or timed out in a channel. */
export interface BannedUser {
  /** ID of the banned user. */
  user_id: string;
  /** Login name of the banned user. */
  user_login: string;
  /** Display name of the banned user. */
  user_name: string;
  /** When the timeout ends, as an RFC 3339 timestamp. An empty string for a permanent ban. */
  expires_at: string;
  /** When the ban or timeout was set, as an RFC 3339 timestamp. */
  created_at: string;
  /** Reason given by the moderator. An empty string when there is none. */
  reason: string;
  /** ID of the moderator who set the ban or timeout. */
  moderator_id: string;
  /** Login name of that moderator. */
  moderator_login: string;
  /** Display name of that moderator. */
  moderator_name: string;
}

/** Parameters of {@link ModerationApi.bans}. */
export interface GetBannedUsersParams {
  /** Broadcaster whose bans to list. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Only these users, when they are banned or timed out. Up to 100 IDs. */
  user_id?: string | readonly string[];
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
  /** Cursor of the previous page. */
  before?: string;
}

/** Parameters of {@link ModerationApi.ban}. */
export interface BanUserParams {
  /** Broadcaster whose chat the user is removed from. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the user to ban or time out. */
  user_id: string;
  /**
   * Length of the timeout in seconds, 1 to 1209600 (two weeks). Leave it out
   * for a permanent ban.
   */
  duration?: number;
  /** Reason shown to the user and the other moderators, 500 characters at most. */
  reason?: string;
}

/** A ban or timeout that was just set. */
export interface UserBan {
  /** ID of the broadcaster whose chat the user was removed from. */
  broadcaster_id: string;
  /** ID of the moderator who set it. */
  moderator_id: string;
  /** ID of the banned user. */
  user_id: string;
  /** When it was set, as an RFC 3339 timestamp. */
  created_at: string;
  /** When the timeout ends, as an RFC 3339 timestamp. `null` for a permanent ban. */
  end_time: string | null;
}

/** Parameters of {@link ModerationApi.unban}. */
export interface UnbanUserParams {
  /** Broadcaster whose chat the user is banned from. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the user to unban. */
  user_id: string;
}

/** The states an unban request goes through. */
export type UnbanRequestStatus = "pending" | "approved" | "denied" | "acknowledged" | "canceled";

/** A banned user asking to be let back into a channel. */
export interface UnbanRequest {
  /** ID of the request. */
  id: string;
  /** ID of the broadcaster who received the request. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** ID of the moderator who approved or denied the request. */
  moderator_id: string;
  /** Login name of that moderator. */
  moderator_login: string;
  /** Display name of that moderator. */
  moderator_name: string;
  /** ID of the banned user who wrote the request. */
  user_id: string;
  /** Login name of that user. */
  user_login: string;
  /** Display name of that user. */
  user_name: string;
  /** Message written by the user. */
  text: string;
  /** Where the request stands. */
  status: UnbanRequestStatus;
  /** When the request was sent, as an RFC 3339 timestamp. */
  created_at: string;
  /** When the request was approved or denied, as an RFC 3339 timestamp. `null` while it is open. */
  resolved_at: string | null;
  /** Answer written by the moderator. `null` while the request is open. */
  resolution_text: string | null;
}

/** Parameters of {@link ModerationApi.unbanRequests}. */
export interface GetUnbanRequestsParams {
  /** Broadcaster whose channel received the requests. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** Only requests in this state. */
  status: UnbanRequestStatus;
  /** Only requests written by this user. */
  user_id?: string;
  /** Items per page. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link ModerationApi.resolveUnbanRequest}. */
export interface ResolveUnbanRequestParams {
  /** Broadcaster whose channel received the request. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the request to resolve. */
  unban_request_id: string;
  /** The decision. */
  status: "approved" | "denied";
  /** Answer shown to the user, 500 characters at most. */
  resolution_text?: string;
}

/** A word or phrase that cannot be used in a channel's chat. */
export interface BlockedTerm {
  /** ID of the broadcaster who owns the list. */
  broadcaster_id: string;
  /** ID of the moderator who blocked the term. */
  moderator_id: string;
  /** ID of the blocked term. */
  id: string;
  /** The blocked word or phrase. */
  text: string;
  /** When the term was blocked, as an RFC 3339 timestamp. */
  created_at: string;
  /** When the term last changed, as an RFC 3339 timestamp. Moves each time AutoMod denies it again. */
  updated_at: string;
  /**
   * When the block ends, as an RFC 3339 timestamp. `null` for a term added by
   * hand or blocked for good by AutoMod.
   */
  expires_at: string | null;
}

/** Parameters of {@link ModerationApi.blockedTerms}. */
export interface GetBlockedTermsParams {
  /** Broadcaster who owns the list. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link ModerationApi.addBlockedTerm}. */
export interface AddBlockedTermParams {
  /** Broadcaster who owns the list. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /**
   * Word or phrase to block, 2 to 500 characters. A `*` at the start or the
   * end of a word works as a wildcard, as in `"foo*"`.
   */
  text: string;
}

/** Parameters of {@link ModerationApi.removeBlockedTerm}. */
export interface RemoveBlockedTermParams {
  /** Broadcaster who owns the list. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the blocked term to remove. */
  id: string;
}

/** Parameters of {@link ModerationApi.deleteMessages}. */
export interface DeleteChatMessagesParams {
  /** Broadcaster who owns the chat room. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /**
   * ID of the message to remove. It must be less than 6 hours old and written
   * by neither the broadcaster nor a moderator. Leave it out to clear the chat.
   */
  message_id?: string;
}

/** A channel in which a user is a moderator. */
export interface ModeratedChannel {
  /** ID of the channel's broadcaster. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
}

/** Parameters of {@link ModerationApi.moderatedChannels}. */
export interface GetModeratedChannelsParams {
  /** User whose moderated channels to list. Defaults to the user making the call. */
  user_id?: string;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** A moderator of a channel. */
export interface ChannelModerator {
  /** ID of the moderator. */
  user_id: string;
  /** Login name of the moderator. */
  user_login: string;
  /** Display name of the moderator. */
  user_name: string;
}

/** Parameters of {@link ModerationApi.moderators}. */
export interface GetModeratorsParams {
  /** Broadcaster whose moderators to list. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Only these users, when they are moderators. Up to 100 IDs. */
  user_id?: string | readonly string[];
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link ModerationApi.addModerator}. */
export interface AddModeratorParams {
  /** Broadcaster who owns the chat room. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the user to make a moderator. */
  user_id: string;
}

/** Parameters of {@link ModerationApi.removeModerator}. */
export interface RemoveModeratorParams {
  /** Broadcaster who owns the chat room. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the moderator to remove. */
  user_id: string;
}

/** A VIP of a channel. */
export interface ChannelVip {
  /** ID of the VIP. */
  user_id: string;
  /** Display name of the VIP. */
  user_name: string;
  /** Login name of the VIP. */
  user_login: string;
}

/** Parameters of {@link ModerationApi.vips}. */
export interface GetVipsParams {
  /** Broadcaster whose VIPs to list. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Only these users, when they are VIPs. Up to 100 IDs. */
  user_id?: string | readonly string[];
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link ModerationApi.addVip}. */
export interface AddVipParams {
  /** Broadcaster who grants the status. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the user to make a VIP. */
  user_id: string;
}

/** Parameters of {@link ModerationApi.removeVip}. */
export interface RemoveVipParams {
  /** Broadcaster of the channel where the user is a VIP. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the VIP to remove. */
  user_id: string;
}

/** Whether Shield Mode is on in a channel, and who turned it on last. */
export interface ShieldModeStatus {
  /** Whether Shield Mode is on. */
  is_active: boolean;
  /** ID of the moderator who last turned it on. An empty string when it was never on. */
  moderator_id: string;
  /** Login name of that moderator. An empty string when it was never on. */
  moderator_login: string;
  /** Display name of that moderator. An empty string when it was never on. */
  moderator_name: string;
  /** When it was last turned on, as an RFC 3339 timestamp. An empty string when it was never on. */
  last_activated_at: string;
}

/** Parameters of {@link ModerationApi.updateShieldMode}. */
export interface UpdateShieldModeParams {
  /** Broadcaster whose Shield Mode to switch. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** `true` turns Shield Mode on, `false` turns it off. */
  is_active: boolean;
}

/** Parameters of {@link ModerationApi.shieldMode}. */
export interface GetShieldModeParams {
  /** Broadcaster whose Shield Mode to read. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
}

/** Parameters of {@link ModerationApi.warn}. */
export interface WarnUserParams {
  /** Broadcaster of the channel the warning applies to. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the user to warn. */
  user_id: string;
  /** Why the user is warned, 500 characters at most. */
  reason: string;
}

/** A warning that was just sent to a chat user. */
export interface UserWarning {
  /** ID of the broadcaster of the channel the warning applies to. */
  broadcaster_id: string;
  /** ID of the warned user. */
  user_id: string;
  /** ID of the moderator who sent the warning. */
  moderator_id: string;
  /** Reason given with the warning. */
  reason: string;
}

/** How a suspicious user is treated: watched, restricted, or not treated at all. */
export type SuspiciousUserStatus = "ACTIVE_MONITORING" | "RESTRICTED" | "NO_TREATMENT";

/** Why a user counts as suspicious. */
export type SuspiciousUserType =
  | "MANUALLY_ADDED"
  | "DETECTED_BAN_EVADER"
  | "DETECTED_SUS_CHATTER"
  | "BANNED_IN_SHARED_CHANNEL";

/** The suspicious status of a chatter in a channel. */
export interface SuspiciousUser {
  /** ID of the chatter. */
  user_id: string;
  /** ID of the broadcaster of the channel. */
  broadcaster_id: string;
  /** ID of the moderator who last changed the status. */
  moderator_id: string;
  /** When the status last changed, as an RFC 3339 timestamp. */
  updated_at: string;
  /** Current treatment. `"NO_TREATMENT"` once the status has been removed. */
  status: SuspiciousUserStatus;
  /** Reasons the user is considered suspicious. */
  types: SuspiciousUserType[];
}

/** Parameters of {@link ModerationApi.addSuspiciousStatus}. */
export interface AddSuspiciousStatusParams {
  /** Broadcaster of the channel the status applies to. */
  broadcaster_id: string;
  /** Moderator who sets the status. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the chatter to flag. */
  user_id: string;
  /** `"ACTIVE_MONITORING"` watches the user, `"RESTRICTED"` also hides their messages from chat. */
  status: "ACTIVE_MONITORING" | "RESTRICTED";
}

/** Parameters of {@link ModerationApi.removeSuspiciousStatus}. */
export interface RemoveSuspiciousStatusParams {
  /** Broadcaster of the channel the status applies to. */
  broadcaster_id: string;
  /** Moderator who removes the status. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the chatter to clear. */
  user_id: string;
}

/** Moderation: bans, timeouts, warnings, AutoMod, blocked terms, moderators, VIPs and Shield Mode. */
export class ModerationApi extends ApiGroup {
  /**
   * Tells whether AutoMod would let messages through in a channel, without
   * sending them. Twitch limits these checks per channel, from 5 a minute for
   * a regular account to 30 for a partner.
   *
   * Token: app or user, scope `moderation:read`.
   *
   * @example
   * const [result] = await twitch.moderation.checkAutoMod({
   *   data: [{ msg_id: "1", msg_text: "Hello chat" }],
   * });
   * if (!result?.is_permitted) console.log("AutoMod would hold this message");
   * @see https://dev.twitch.tv/docs/api/reference/#check-automod-status
   */
  checkAutoMod(params: CheckAutoModParams, options?: RequestOptions): Promise<AutoModCheckResult[]> {
    const { data, ...query } = params;
    return this.rest.data<AutoModCheckResult>({
      method: "POST",
      path: "moderation/enforcements/status",
      query,
      body: { data },
      scopes: ["moderation:read"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Approves or denies a message that AutoMod is holding for review.
   *
   * Token: app or user, scope `moderator:manage:automod`.
   *
   * @example
   * await twitch.moderation.manageAutoModMessage({ msg_id: "836013710", action: "ALLOW" });
   * @see https://dev.twitch.tv/docs/api/reference/#manage-held-automod-messages
   */
  manageAutoModMessage(params: ManageAutoModMessageParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "POST",
      path: "moderation/automod/message",
      body: params,
      scopes: ["moderator:manage:automod"],
      context: { body: "user_id" },
      options,
    });
  }

  /**
   * Gets the AutoMod levels of a channel.
   *
   * Token: app or user, scope `moderator:read:automod_settings` or `moderator:manage:automod_settings`.
   *
   * @example
   * const settings = await twitch.moderation.autoModSettings({ broadcaster_id: "141981764" });
   * console.log(settings.overall_level);
   * @see https://dev.twitch.tv/docs/api/reference/#get-automod-settings
   */
  autoModSettings(params: GetAutoModSettingsParams, options?: RequestOptions): Promise<AutoModSettings> {
    return this.rest.one<AutoModSettings>({
      path: "moderation/automod/settings",
      query: params,
      scopes: ["moderator:read:automod_settings", "moderator:manage:automod_settings"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Replaces the AutoMod levels of a channel. This overwrites everything: a
   * category you leave out goes back to 0, so send all the levels you want to
   * keep.
   *
   * Token: app or user, scope `moderator:manage:automod_settings`.
   *
   * @example
   * await twitch.moderation.updateAutoModSettings({ broadcaster_id: "141981764", overall_level: 3 });
   * await twitch.moderation.updateAutoModSettings({ broadcaster_id: "141981764", swearing: 2, bullying: 4 });
   * @see https://dev.twitch.tv/docs/api/reference/#update-automod-settings
   */
  updateAutoModSettings(params: UpdateAutoModSettingsParams, options?: RequestOptions): Promise<AutoModSettings> {
    const { broadcaster_id, moderator_id, ...body } = params;
    return this.rest.one<AutoModSettings>({
      method: "PUT",
      path: "moderation/automod/settings",
      query: { broadcaster_id, moderator_id },
      body,
      scopes: ["moderator:manage:automod_settings"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Lists the users who are banned or timed out in a channel.
   *
   * Token: app or user, scope `moderation:read` or `moderator:manage:banned_users`.
   *
   * @example
   * for await (const banned of twitch.moderation.bans()) {
   *   console.log(banned.user_login, banned.expires_at || "permanent");
   * }
   * @see https://dev.twitch.tv/docs/api/reference/#get-banned-users
   */
  bans(params: GetBannedUsersParams = {}, options?: RequestOptions): Paginator<BannedUser> {
    return this.rest.paginate<BannedUser>({
      path: "moderation/banned",
      query: params,
      scopes: ["moderation:read", "moderator:manage:banned_users"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Bans a user from a channel's chat. A timeout is a ban with a `duration`:
   * give the number of seconds and the user is let back in afterwards. Calling
   * it again on a timed out user changes the duration or turns the timeout
   * into a ban, but a banned user has to be unbanned before a timeout can be
   * set.
   *
   * Token: app or user, scope `moderator:manage:banned_users`.
   *
   * @example
   * await twitch.moderation.ban({ broadcaster_id: "141981764", user_id: "9876", reason: "Spam" });
   * const timeout = await twitch.moderation.ban({ broadcaster_id: "141981764", user_id: "9876", duration: 600 });
   * console.log(timeout.end_time);
   * @see https://dev.twitch.tv/docs/api/reference/#ban-user
   */
  ban(params: BanUserParams, options?: RequestOptions): Promise<UserBan> {
    const { broadcaster_id, moderator_id, ...data } = params;
    return this.rest.one<UserBan>({
      method: "POST",
      path: "moderation/bans",
      query: { broadcaster_id, moderator_id },
      body: { data },
      scopes: ["moderator:manage:banned_users"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Lifts the ban or the timeout of a user.
   *
   * Token: app or user, scope `moderator:manage:banned_users`.
   *
   * @example
   * await twitch.moderation.unban({ broadcaster_id: "141981764", user_id: "9876" });
   * @see https://dev.twitch.tv/docs/api/reference/#unban-user
   */
  unban(params: UnbanUserParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "moderation/bans",
      query: params,
      scopes: ["moderator:manage:banned_users"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Lists the unban requests of a channel that are in a given state.
   *
   * Token: user, scope `moderator:read:unban_requests` or `moderator:manage:unban_requests`.
   *
   * @example
   * const pending = await twitch.moderation.unbanRequests({ broadcaster_id: "141981764", status: "pending" }).all();
   * @see https://dev.twitch.tv/docs/api/reference/#get-unban-requests
   */
  unbanRequests(params: GetUnbanRequestsParams, options?: RequestOptions): Paginator<UnbanRequest> {
    return this.rest.paginate<UnbanRequest>({
      path: "moderation/unban_requests",
      query: params,
      auth: "user",
      scopes: ["moderator:read:unban_requests", "moderator:manage:unban_requests"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Approves or denies an unban request. Approving it unbans the user.
   *
   * Token: user, scope `moderator:manage:unban_requests`.
   *
   * @example
   * const request = await twitch.moderation.resolveUnbanRequest({
   *   broadcaster_id: "141981764",
   *   unban_request_id: "92af127c-7326-4483-a52b-b0da0be61c01",
   *   status: "approved",
   *   resolution_text: "Welcome back.",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#resolve-unban-requests
   */
  resolveUnbanRequest(params: ResolveUnbanRequestParams, options?: RequestOptions): Promise<UnbanRequest> {
    return this.rest.one<UnbanRequest>({
      method: "PATCH",
      path: "moderation/unban_requests",
      query: params,
      auth: "user",
      scopes: ["moderator:manage:unban_requests"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Lists the blocked terms of a channel, newest first. Private terms are not
   * included.
   *
   * Token: app or user, scope `moderator:read:blocked_terms` or `moderator:manage:blocked_terms`.
   *
   * @example
   * const terms = await twitch.moderation.blockedTerms({ broadcaster_id: "141981764" }).all();
   * @see https://dev.twitch.tv/docs/api/reference/#get-blocked-terms
   */
  blockedTerms(params: GetBlockedTermsParams, options?: RequestOptions): Paginator<BlockedTerm> {
    return this.rest.paginate<BlockedTerm>({
      path: "moderation/blocked_terms",
      query: params,
      scopes: ["moderator:read:blocked_terms", "moderator:manage:blocked_terms"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Blocks a word or phrase in a channel's chat. When the term is already
   * blocked, the existing entry is returned.
   *
   * Token: app or user, scope `moderator:manage:blocked_terms`.
   *
   * @example
   * const term = await twitch.moderation.addBlockedTerm({ broadcaster_id: "141981764", text: "spoil*" });
   * @see https://dev.twitch.tv/docs/api/reference/#add-blocked-term
   */
  addBlockedTerm(params: AddBlockedTermParams, options?: RequestOptions): Promise<BlockedTerm> {
    const { text, ...query } = params;
    return this.rest.one<BlockedTerm>({
      method: "POST",
      path: "moderation/blocked_terms",
      query,
      body: { text },
      scopes: ["moderator:manage:blocked_terms"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Removes a term from a channel's blocked terms. An ID that does not exist
   * is not an error.
   *
   * Token: app or user, scope `moderator:manage:blocked_terms`.
   *
   * @example
   * await twitch.moderation.removeBlockedTerm({ broadcaster_id: "141981764", id: term.id });
   * @see https://dev.twitch.tv/docs/api/reference/#remove-blocked-term
   */
  removeBlockedTerm(params: RemoveBlockedTermParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "moderation/blocked_terms",
      query: params,
      scopes: ["moderator:manage:blocked_terms"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Removes one message from a channel's chat, or every message when no
   * `message_id` is given.
   *
   * Token: app or user, scope `moderator:manage:chat_messages`.
   *
   * @example
   * await twitch.moderation.deleteMessages({ broadcaster_id: "141981764", message_id: "abc-123-def" });
   * await twitch.moderation.deleteMessages({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#delete-chat-messages
   */
  deleteMessages(params: DeleteChatMessagesParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "moderation/chat",
      query: params,
      scopes: ["moderator:manage:chat_messages"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Lists the channels in which a user is a moderator.
   *
   * Token: app or user, scope `user:read:moderated_channels`.
   *
   * @example
   * for await (const channel of twitch.moderation.moderatedChannels()) {
   *   console.log(channel.broadcaster_login);
   * }
   * @see https://dev.twitch.tv/docs/api/reference/#get-moderated-channels
   */
  moderatedChannels(params: GetModeratedChannelsParams = {}, options?: RequestOptions): Paginator<ModeratedChannel> {
    return this.rest.paginate<ModeratedChannel>({
      path: "moderation/channels",
      query: params,
      scopes: ["user:read:moderated_channels"],
      context: "user_id",
      options,
    });
  }

  /**
   * Lists the moderators of a channel.
   *
   * Token: user, scope `moderation:read` or `channel:manage:moderators`.
   *
   * @example
   * const mods = await twitch.moderation.moderators().all();
   * @see https://dev.twitch.tv/docs/api/reference/#get-moderators
   */
  moderators(params: GetModeratorsParams = {}, options?: RequestOptions): Paginator<ChannelModerator> {
    return this.rest.paginate<ChannelModerator>({
      path: "moderation/moderators",
      query: params,
      auth: "user",
      scopes: ["moderation:read", "channel:manage:moderators"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Makes a user a moderator of the channel. A VIP has to lose that status
   * first. Twitch allows 10 additions per 10 seconds.
   *
   * Token: user, scope `channel:manage:moderators`.
   *
   * @example
   * await twitch.moderation.addModerator({ user_id: "9876" });
   * @see https://dev.twitch.tv/docs/api/reference/#add-channel-moderator
   */
  addModerator(params: AddModeratorParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "POST",
      path: "moderation/moderators",
      query: params,
      auth: "user",
      scopes: ["channel:manage:moderators"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Takes the moderator role away from a user. Twitch allows 10 removals per
   * 10 seconds.
   *
   * Token: user, scope `channel:manage:moderators`.
   *
   * @example
   * await twitch.moderation.removeModerator({ user_id: "9876" });
   * @see https://dev.twitch.tv/docs/api/reference/#remove-channel-moderator
   */
  removeModerator(params: RemoveModeratorParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "moderation/moderators",
      query: params,
      auth: "user",
      scopes: ["channel:manage:moderators"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Lists the VIPs of a channel.
   *
   * Token: user, scope `channel:read:vips` or `channel:manage:vips`.
   *
   * @example
   * const vips = await twitch.moderation.vips().all();
   * @see https://dev.twitch.tv/docs/api/reference/#get-vips
   */
  vips(params: GetVipsParams = {}, options?: RequestOptions): Paginator<ChannelVip> {
    return this.rest.paginate<ChannelVip>({
      path: "channels/vips",
      query: params,
      auth: "user",
      scopes: ["channel:read:vips", "channel:manage:vips"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Makes a user a VIP of the channel. A moderator has to lose that role
   * first, and the channel needs a free VIP slot. Twitch allows 10 additions
   * per 10 seconds.
   *
   * Token: user, scope `channel:manage:vips`.
   *
   * @example
   * await twitch.moderation.addVip({ user_id: "9876" });
   * @see https://dev.twitch.tv/docs/api/reference/#add-channel-vip
   */
  addVip(params: AddVipParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "POST",
      path: "channels/vips",
      query: params,
      auth: "user",
      scopes: ["channel:manage:vips"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Takes the VIP status away from a user. A VIP can also give up their own
   * status: pass the channel in `broadcaster_id` and make the call as that
   * VIP. Twitch allows 10 removals per 10 seconds.
   *
   * Token: user, scope `channel:manage:vips`.
   *
   * @example
   * await twitch.moderation.removeVip({ user_id: "9876" });
   * await twitch.moderation.removeVip({ broadcaster_id: "141981764", user_id: "9876" }, { as: "9876" });
   * @see https://dev.twitch.tv/docs/api/reference/#remove-channel-vip
   */
  removeVip(params: RemoveVipParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "channels/vips",
      query: params,
      auth: "user",
      scopes: ["channel:manage:vips"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Turns Shield Mode on or off in a channel. While it is on, the stricter
   * chat rules the broadcaster prepared for it apply.
   *
   * Token: app or user, scope `moderator:manage:shield_mode`.
   *
   * @example
   * const status = await twitch.moderation.updateShieldMode({ broadcaster_id: "141981764", is_active: true });
   * @see https://dev.twitch.tv/docs/api/reference/#update-shield-mode-status
   */
  updateShieldMode(params: UpdateShieldModeParams, options?: RequestOptions): Promise<ShieldModeStatus> {
    const { is_active, ...query } = params;
    return this.rest.one<ShieldModeStatus>({
      method: "PUT",
      path: "moderation/shield_mode",
      query,
      body: { is_active },
      scopes: ["moderator:manage:shield_mode"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Tells whether Shield Mode is on in a channel and who turned it on last.
   *
   * Token: app or user, scope `moderator:read:shield_mode` or `moderator:manage:shield_mode`.
   *
   * @example
   * const { is_active } = await twitch.moderation.shieldMode({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-shield-mode-status
   */
  shieldMode(params: GetShieldModeParams, options?: RequestOptions): Promise<ShieldModeStatus> {
    return this.rest.one<ShieldModeStatus>({
      path: "moderation/shield_mode",
      query: params,
      scopes: ["moderator:read:shield_mode", "moderator:manage:shield_mode"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Sends a warning to a chat user, who cannot chat again until they
   * acknowledge it. A new warning replaces a pending one.
   *
   * Token: app or user, scope `moderator:manage:warnings`.
   *
   * @example
   * await twitch.moderation.warn({ broadcaster_id: "141981764", user_id: "9876", reason: "Keep it friendly." });
   * @see https://dev.twitch.tv/docs/api/reference/#warn-chat-user
   */
  warn(params: WarnUserParams, options?: RequestOptions): Promise<UserWarning> {
    const { broadcaster_id, moderator_id, ...data } = params;
    return this.rest.one<UserWarning>({
      method: "POST",
      path: "moderation/warnings",
      query: { broadcaster_id, moderator_id },
      body: { data },
      scopes: ["moderator:manage:warnings"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Flags a chatter as suspicious in a channel, either to keep an eye on them
   * or to restrict their messages.
   *
   * Token: app or user, scope `moderator:manage:suspicious_users`.
   *
   * @example
   * const flagged = await twitch.moderation.addSuspiciousStatus({
   *   broadcaster_id: "141981764",
   *   user_id: "9876",
   *   status: "RESTRICTED",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#add-suspicious-status-to-chat-user
   */
  addSuspiciousStatus(params: AddSuspiciousStatusParams, options?: RequestOptions): Promise<SuspiciousUser> {
    const { broadcaster_id, moderator_id, ...body } = params;
    return this.rest.one<SuspiciousUser>({
      method: "POST",
      path: "moderation/suspicious_users",
      query: { broadcaster_id, moderator_id },
      body,
      scopes: ["moderator:manage:suspicious_users"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Clears the suspicious status of a chatter in a channel.
   *
   * Token: app or user, scope `moderator:manage:suspicious_users`.
   *
   * @example
   * await twitch.moderation.removeSuspiciousStatus({ broadcaster_id: "141981764", user_id: "9876" });
   * @see https://dev.twitch.tv/docs/api/reference/#remove-suspicious-status-from-chat-user
   */
  removeSuspiciousStatus(params: RemoveSuspiciousStatusParams, options?: RequestOptions): Promise<SuspiciousUser> {
    return this.rest.one<SuspiciousUser>({
      method: "DELETE",
      path: "moderation/suspicious_users",
      query: params,
      scopes: ["moderator:manage:suspicious_users"],
      context: "moderator_id",
      options,
    });
  }
}
