import type { EventSubDefinition } from "./common.js";

// ---------------------------------------------------------------------------
// Guest Star (beta)
// ---------------------------------------------------------------------------

/** Condition of `channel.guest_star_session.begin`. */
export interface ChannelGuestStarSessionBeginCondition {
  /** ID of the channel that hosts the Guest Star session. */
  broadcaster_user_id: string;
  /** ID of the broadcaster or of one of the channel's moderators; the token must belong to this user. */
  moderator_user_id: string;
}

/** Condition of `channel.guest_star_session.end`. */
export type ChannelGuestStarSessionEndCondition = ChannelGuestStarSessionBeginCondition;

/** Condition of `channel.guest_star_guest.update`. */
export type ChannelGuestStarGuestUpdateCondition = ChannelGuestStarSessionBeginCondition;

/** Condition of `channel.guest_star_settings.update`. */
export type ChannelGuestStarSettingsUpdateCondition = ChannelGuestStarSessionBeginCondition;

/** Event of `channel.guest_star_session.begin`. */
export interface ChannelGuestStarSessionBeginEvent {
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Login of the broadcaster. */
  broadcaster_user_login: string;
  /** Moderator ID. Only appears in Twitch's sample payload, so it may be missing. */
  moderator_user_id?: string;
  /** Moderator display name. Only appears in Twitch's sample payload, so it may be missing. */
  moderator_user_name?: string;
  /** Moderator login. Only appears in Twitch's sample payload, so it may be missing. */
  moderator_user_login?: string;
  /** ID of the session that just started. */
  session_id: string;
  /** RFC 3339 timestamp of the start of the session. */
  started_at: string;
}

/** Event of `channel.guest_star_session.end`. */
export interface ChannelGuestStarSessionEndEvent {
  /** ID of the broadcaster the subscription targets (not necessarily the host). */
  broadcaster_user_id: string;
  /** Display name of that broadcaster. */
  broadcaster_user_name: string;
  /** Login of that broadcaster. */
  broadcaster_user_login: string;
  /** Moderator ID. Only appears in Twitch's sample payload, so it may be missing. */
  moderator_user_id?: string;
  /** Moderator display name. Only appears in Twitch's sample payload, so it may be missing. */
  moderator_user_name?: string;
  /** Moderator login. Only appears in Twitch's sample payload, so it may be missing. */
  moderator_user_login?: string;
  /** ID of the session that ended. */
  session_id: string;
  /** RFC 3339 timestamp of the start of the session. */
  started_at: string;
  /** RFC 3339 timestamp of the end of the session. */
  ended_at: string;
  /** ID of the channel that hosted the session. */
  host_user_id: string;
  /** Display name of the host. */
  host_user_name: string;
  /** Login of the host. */
  host_user_login: string;
}

/** Where a guest stands in a Guest Star session. */
export type ChannelGuestStarGuestUpdateState =
  /** Back in the invite queue, for example after leaving a slot. */
  | "invited"
  /** Accepted the invite and is getting set up. */
  | "accepted"
  /** Ready to be given a slot. */
  | "ready"
  /** Holds a slot but is not shown on stream yet. */
  | "backstage"
  /** Shown live in the host's broadcast. */
  | "live"
  /** Taken out of the call or of the queue. */
  | "removed";

/** Event of `channel.guest_star_guest.update`. */
export interface ChannelGuestStarGuestUpdateEvent {
  /** ID of the broadcaster the subscription targets (not necessarily the host). */
  broadcaster_user_id: string;
  /** Display name of that broadcaster. */
  broadcaster_user_name: string;
  /** Login of that broadcaster. */
  broadcaster_user_login: string;
  /** ID of the session the change belongs to. */
  session_id: string;
  /** ID of the moderator (possibly the host) who made the change, or `null` when the guest did it. */
  moderator_user_id: string | null;
  /** Display name of that moderator, or `null` when the guest made the change. */
  moderator_user_name: string | null;
  /** Login of that moderator, or `null` when the guest made the change. */
  moderator_user_login: string | null;
  /** ID of the guest whose state changed, or `null` when the slot is now empty. */
  guest_user_id: string | null;
  /** Display name of the guest, or `null` when the slot is now empty. */
  guest_user_name: string | null;
  /** Login of the guest, or `null` when the slot is now empty. */
  guest_user_login: string | null;
  /** ID of the slot given to the guest, or `null` while the guest is invited, accepted, ready or removed. */
  slot_id: string | null;
  /** State of the guest after the change, or `null` when the slot is now empty. */
  state: ChannelGuestStarGuestUpdateState | null;
  /** ID of the channel hosting the session. */
  host_user_id: string;
  /** Display name of the host. */
  host_user_name: string;
  /** Login of the host. */
  host_user_login: string;
  /** Whether the host lets participants see the slot's video, or `null` when the guest has no slot. */
  host_video_enabled: boolean | null;
  /** Whether the host lets participants hear the slot's audio, or `null` when the guest has no slot. */
  host_audio_enabled: boolean | null;
  /** Audio level of the slot for participants, from 0 to 100, or `null` when the guest has no slot. */
  host_volume: number | null;
}

/** How guests are arranged in the group browser source. */
export type ChannelGuestStarSettingsUpdateGroupLayout =
  /** Equal tiles for every live guest. */
  | "tiled"
  /** Equal tiles, with an active screen share drawn larger. */
  | "screenshare"
  /** One row aligned to the top. */
  | "horizontal_top"
  /** One row aligned to the bottom. */
  | "horizontal_bottom"
  /** One column aligned to the left. */
  | "vertical_left"
  /** One column aligned to the right. */
  | "vertical_right";

/** Event of `channel.guest_star_settings.update`. */
export interface ChannelGuestStarSettingsUpdateEvent {
  /** ID of the host channel. */
  broadcaster_user_id: string;
  /** Display name of the host. */
  broadcaster_user_name: string;
  /** Login of the host. */
  broadcaster_user_login: string;
  /** Whether Guest Star moderators may decide if a slotted guest goes live. */
  is_moderator_send_live_enabled: boolean;
  /** Number of slots the host can add to a call. */
  slot_count: number;
  /** Whether browser sources tied to this channel's sessions play audio. */
  is_browser_source_audio_enabled: boolean;
  /** Layout used by the group browser source. */
  group_layout: ChannelGuestStarSettingsUpdateGroupLayout;
}

// ---------------------------------------------------------------------------
// Channel points: automatic rewards
// ---------------------------------------------------------------------------

/** Condition of `channel.channel_points_automatic_reward_redemption.add` (version 2). */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddCondition {
  /** ID of the channel whose automatic reward redemptions are wanted. */
  broadcaster_user_id: string;
}

/** Condition of `channel.channel_points_automatic_reward_redemption.add` (version 1). */
export type ChannelChannelPointsAutomaticRewardRedemptionAddV1Condition =
  ChannelChannelPointsAutomaticRewardRedemptionAddCondition;

/** Emote attached to an automatic reward. */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddEmote {
  /** ID of the emote. */
  id: string;
  /** Text token viewers type to use the emote. */
  name: string;
}

/** Automatic rewards reported by version 2. */
export type ChannelChannelPointsAutomaticRewardRedemptionAddRewardType =
  | "single_message_bypass_sub_mode"
  | "send_highlighted_message"
  | "random_sub_emote_unlock"
  | "chosen_sub_emote_unlock"
  | "chosen_modified_sub_emote_unlock";

/** Reward of a version 2 automatic reward redemption. */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddReward {
  /** Which automatic reward was redeemed. */
  type: ChannelChannelPointsAutomaticRewardRedemptionAddRewardType;
  /** Channel points spent. */
  channel_points: number;
  /** Emote tied to the reward; missing or `null` for rewards that involve none. */
  emote?: ChannelChannelPointsAutomaticRewardRedemptionAddEmote | null;
}

/** Emote reference carried by an emote fragment. */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddMessageFragmentEmote {
  /** ID of the emote. */
  id: string;
}

/** Plain text part of the message sent with an automatic reward. */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddMessageTextFragment {
  /** Marks the fragment as plain text. */
  type: "text";
  /** Text of the fragment. */
  text: string;
  /** Never set on a text fragment. */
  emote?: null;
}

/** Emote part of the message sent with an automatic reward. */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddMessageEmoteFragment {
  /** Marks the fragment as an emote. */
  type: "emote";
  /** Text of the fragment, that is the emote token. */
  text: string;
  /** The emote this fragment stands for. */
  emote: ChannelChannelPointsAutomaticRewardRedemptionAddMessageFragmentEmote;
}

/** One part of the message sent with an automatic reward; narrow on `type`. */
export type ChannelChannelPointsAutomaticRewardRedemptionAddMessageFragment =
  | ChannelChannelPointsAutomaticRewardRedemptionAddMessageTextFragment
  | ChannelChannelPointsAutomaticRewardRedemptionAddMessageEmoteFragment;

/** Message sent with a version 2 automatic reward redemption. */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddMessage {
  /** Whole message as plain text. */
  text: string;
  /** The message cut into text and emote parts, in order. */
  fragments: ChannelChannelPointsAutomaticRewardRedemptionAddMessageFragment[];
}

/** Event of `channel.channel_points_automatic_reward_redemption.add` (version 2). */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddEvent {
  /** ID of the channel where the reward was redeemed. */
  broadcaster_user_id: string;
  /** Login of that channel. */
  broadcaster_user_login: string;
  /** Display name of that channel. */
  broadcaster_user_name: string;
  /** ID of the viewer who redeemed the reward. */
  user_id: string;
  /** Login of that viewer. */
  user_login: string;
  /** Display name of that viewer. */
  user_name: string;
  /** ID of the redemption. */
  id: string;
  /** What was redeemed and at which price. */
  reward: ChannelChannelPointsAutomaticRewardRedemptionAddReward;
  /** Message typed by the viewer, for rewards that come with one. */
  message?: ChannelChannelPointsAutomaticRewardRedemptionAddMessage;
  /** RFC 3339 timestamp of the redemption. */
  redeemed_at: string;
}

/** Automatic rewards reported by version 1. */
export type ChannelChannelPointsAutomaticRewardRedemptionAddV1RewardType =
  | "single_message_bypass_sub_mode"
  | "send_highlighted_message"
  | "random_sub_emote_unlock"
  | "chosen_sub_emote_unlock"
  | "chosen_modified_sub_emote_unlock"
  | "message_effect"
  | "gigantify_an_emote"
  | "celebration";

/** Reward of a version 1 automatic reward redemption. */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddV1Reward {
  /** Which automatic reward was redeemed. */
  type: ChannelChannelPointsAutomaticRewardRedemptionAddV1RewardType;
  /** Price of the reward. */
  cost: number;
  /** Emote unlocked by the reward; missing or `null` for rewards that unlock none. */
  unlocked_emote?: ChannelChannelPointsAutomaticRewardRedemptionAddEmote | null;
}

/** Position of an emote inside a version 1 message. */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddV1MessageEmote {
  /** ID of the emote. */
  id: string;
  /** Index in the text where the emote starts. */
  begin: number;
  /** Index in the text where the emote ends. */
  end: number;
}

/** Message sent with a version 1 automatic reward redemption. */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddV1Message {
  /** Text of the chat message. */
  text: string;
  /** Emotes found in the text, with their positions. */
  emotes: ChannelChannelPointsAutomaticRewardRedemptionAddV1MessageEmote[];
}

/** Event of `channel.channel_points_automatic_reward_redemption.add` (version 1). */
export interface ChannelChannelPointsAutomaticRewardRedemptionAddV1Event {
  /** ID of the channel where the reward was redeemed. */
  broadcaster_user_id: string;
  /** Login of that channel. */
  broadcaster_user_login: string;
  /** Display name of that channel. */
  broadcaster_user_name: string;
  /** ID of the viewer who redeemed the reward. */
  user_id: string;
  /** Login of that viewer. */
  user_login: string;
  /** Display name of that viewer. */
  user_name: string;
  /** ID of the redemption. */
  id: string;
  /** What was redeemed and at which price. */
  reward: ChannelChannelPointsAutomaticRewardRedemptionAddV1Reward;
  /** Message typed by the viewer, with what is needed to render its emotes. */
  message: ChannelChannelPointsAutomaticRewardRedemptionAddV1Message;
  /** Text typed by the viewer, for rewards that ask for input. */
  user_input?: string;
  /** RFC 3339 timestamp of the redemption. */
  redeemed_at: string;
}

// ---------------------------------------------------------------------------
// Channel points: custom rewards
// ---------------------------------------------------------------------------

/** Condition of `channel.channel_points_custom_reward.add`. */
export interface ChannelChannelPointsCustomRewardAddCondition {
  /** ID of the channel whose new custom rewards are wanted. */
  broadcaster_user_id: string;
}

/** Condition of `channel.channel_points_custom_reward.update`. */
export interface ChannelChannelPointsCustomRewardUpdateCondition {
  /** ID of the channel that owns the rewards. */
  broadcaster_user_id: string;
  /** Limits the notifications to this reward. */
  reward_id?: string;
}

/** Condition of `channel.channel_points_custom_reward.remove`. */
export type ChannelChannelPointsCustomRewardRemoveCondition = ChannelChannelPointsCustomRewardUpdateCondition;

/** Cap on the redemptions of a custom reward during one stream. */
export interface ChannelChannelPointsCustomRewardMaxPerStream {
  /** Whether the cap applies. */
  is_enabled: boolean;
  /** Highest number of redemptions per stream. */
  value: number;
}

/** Cap on the redemptions of a custom reward by one viewer during one stream. */
export interface ChannelChannelPointsCustomRewardMaxPerUserPerStream {
  /** Whether the cap applies. */
  is_enabled: boolean;
  /** Highest number of redemptions per viewer and per stream. */
  value: number;
}

/** Picture of a custom reward in three sizes. */
export interface ChannelChannelPointsCustomRewardImage {
  /** URL of the 1x image. */
  url_1x: string;
  /** URL of the 2x image. */
  url_2x: string;
  /** URL of the 4x image. */
  url_4x: string;
}

/** Cooldown shared by all viewers between two redemptions of a custom reward. */
export interface ChannelChannelPointsCustomRewardGlobalCooldown {
  /** Whether the cooldown applies. */
  is_enabled: boolean;
  /** Length of the cooldown in seconds. */
  seconds: number;
}

/** A custom channel points reward, as sent by the add, update and remove events. */
export interface ChannelChannelPointsCustomReward {
  /** ID of the reward. */
  id: string;
  /** ID of the channel that owns the reward. */
  broadcaster_user_id: string;
  /** Login of that channel. */
  broadcaster_user_login: string;
  /** Display name of that channel. */
  broadcaster_user_name: string;
  /** Whether the reward is enabled; viewers do not see a disabled reward. */
  is_enabled: boolean;
  /** Whether the reward is paused; a paused reward cannot be redeemed. */
  is_paused: boolean;
  /** Whether the reward is in stock; it cannot be redeemed when out of stock. */
  is_in_stock: boolean;
  /** Title of the reward. */
  title: string;
  /** Price in channel points. */
  cost: number;
  /** Description shown to viewers. */
  prompt: string;
  /** Whether viewers must type something when redeeming. */
  is_user_input_required: boolean;
  /** Whether redemptions are marked `fulfilled` right away instead of waiting in the request queue. */
  should_redemptions_skip_request_queue: boolean;
  /** Per stream cap. */
  max_per_stream: ChannelChannelPointsCustomRewardMaxPerStream;
  /** Per viewer and per stream cap. */
  max_per_user_per_stream: ChannelChannelPointsCustomRewardMaxPerUserPerStream;
  /** Background color as a hex code with the leading `#`, for example `#FA1ED2`. */
  background_color: string;
  /** Images uploaded for the reward, or `null` when there are none. */
  image: ChannelChannelPointsCustomRewardImage | null;
  /** Stock images used when no custom image exists. */
  default_image: ChannelChannelPointsCustomRewardImage;
  /** Cooldown settings. */
  global_cooldown: ChannelChannelPointsCustomRewardGlobalCooldown;
  /** RFC 3339 timestamp of the end of the running cooldown, or `null` when none is running. */
  cooldown_expires_at: string | null;
  /**
   * Redemptions counted against `max_per_stream` in the current stream, or
   * `null` when the channel is offline or the cap is disabled.
   */
  redemptions_redeemed_current_stream: number | null;
}

/** Event of `channel.channel_points_custom_reward.add`. */
export type ChannelChannelPointsCustomRewardAddEvent = ChannelChannelPointsCustomReward;

/** Event of `channel.channel_points_custom_reward.update`. */
export type ChannelChannelPointsCustomRewardUpdateEvent = ChannelChannelPointsCustomReward;

/** Event of `channel.channel_points_custom_reward.remove`. */
export type ChannelChannelPointsCustomRewardRemoveEvent = ChannelChannelPointsCustomReward;

/** Condition of `channel.channel_points_custom_reward_redemption.add`. */
export interface ChannelChannelPointsCustomRewardRedemptionAddCondition {
  /** ID of the channel whose redemptions are wanted. */
  broadcaster_user_id: string;
  /** Limits the notifications to this reward. */
  reward_id?: string;
}

/** Condition of `channel.channel_points_custom_reward_redemption.update`. */
export type ChannelChannelPointsCustomRewardRedemptionUpdateCondition =
  ChannelChannelPointsCustomRewardRedemptionAddCondition;

/** Progress of a custom reward redemption. */
export type ChannelChannelPointsCustomRewardRedemptionStatus = "unknown" | "unfulfilled" | "fulfilled" | "canceled";

/** Snapshot of the reward taken when it was redeemed. */
export interface ChannelChannelPointsCustomRewardRedemptionReward {
  /** ID of the reward. */
  id: string;
  /** Title of the reward. */
  title: string;
  /** Price in channel points. */
  cost: number;
  /** Description of the reward. */
  prompt: string;
}

/** A custom reward redemption, as sent by the redemption add and update events. */
export interface ChannelChannelPointsCustomRewardRedemption {
  /** ID of the redemption. */
  id: string;
  /** ID of the channel where the reward was redeemed. */
  broadcaster_user_id: string;
  /** Login of that channel. */
  broadcaster_user_login: string;
  /** Display name of that channel. */
  broadcaster_user_name: string;
  /** ID of the viewer who redeemed the reward. */
  user_id: string;
  /** Login of that viewer. */
  user_login: string;
  /** Display name of that viewer. */
  user_name: string;
  /** Text typed by the viewer, or an empty string. */
  user_input: string;
  /** State of the redemption: `unfulfilled` when created, `fulfilled` or `canceled` once handled. */
  status: ChannelChannelPointsCustomRewardRedemptionStatus;
  /** The reward as it was when redeemed. */
  reward: ChannelChannelPointsCustomRewardRedemptionReward;
  /** RFC 3339 timestamp of the redemption. */
  redeemed_at: string;
}

/** Event of `channel.channel_points_custom_reward_redemption.add`. */
export type ChannelChannelPointsCustomRewardRedemptionAddEvent = ChannelChannelPointsCustomRewardRedemption;

/** Event of `channel.channel_points_custom_reward_redemption.update`. */
export type ChannelChannelPointsCustomRewardRedemptionUpdateEvent = ChannelChannelPointsCustomRewardRedemption;

// ---------------------------------------------------------------------------
// Custom Power-ups
// ---------------------------------------------------------------------------

/** Condition of `channel.custom_power_up_redemption.add`. */
export interface ChannelCustomPowerUpRedemptionAddCondition {
  /** ID of the channel whose custom Power-up redemptions are wanted. */
  broadcaster_user_id: string;
  /** Limits the notifications to this custom Power-up. */
  reward_id?: string;
}

/** Progress of a custom Power-up redemption. */
export type ChannelCustomPowerUpRedemptionAddStatus = "unknown" | "unfulfilled" | "fulfilled" | "canceled";

/** Snapshot of the custom Power-up taken when it was redeemed. */
export interface ChannelCustomPowerUpRedemptionAddCustomPowerUp {
  /** ID of the custom Power-up. */
  id: string;
  /** Name shown to viewers. */
  title: string;
  /** Price in Bits. */
  bits: number;
  /** Description written by the broadcaster. */
  prompt: string;
}

/** Event of `channel.custom_power_up_redemption.add`. */
export interface ChannelCustomPowerUpRedemptionAddEvent {
  /** ID of the redemption. */
  id: string;
  /** ID of the channel where the Power-up was redeemed. */
  broadcaster_user_id: string;
  /** Login of that channel. */
  broadcaster_user_login: string;
  /** Display name of that channel. */
  broadcaster_user_name: string;
  /** ID of the viewer who redeemed the Power-up. */
  user_id: string;
  /** Login of that viewer. */
  user_login: string;
  /** Display name of that viewer. */
  user_name: string;
  /** Text typed by the viewer, or an empty string. */
  user_input: string;
  /** State of the redemption, `unfulfilled` unless told otherwise. */
  status: ChannelCustomPowerUpRedemptionAddStatus;
  /** The Power-up as it was when redeemed. */
  custom_power_up: ChannelCustomPowerUpRedemptionAddCustomPowerUp;
  /** RFC 3339 timestamp of the redemption. */
  redeemed_at: string;
}

// ---------------------------------------------------------------------------
// Polls
// ---------------------------------------------------------------------------

/** Condition of `channel.poll.begin`. */
export interface ChannelPollBeginCondition {
  /** ID of the channel whose polls are wanted. */
  broadcaster_user_id: string;
}

/** Condition of `channel.poll.progress`. */
export type ChannelPollProgressCondition = ChannelPollBeginCondition;

/** Condition of `channel.poll.end`. */
export type ChannelPollEndCondition = ChannelPollBeginCondition;

/** A choice of a poll, as listed when the poll starts. */
export interface ChannelPollChoice {
  /** ID of the choice. */
  id: string;
  /** Label of the choice. */
  title: string;
}

/** A choice of a poll with its vote counts. */
export interface ChannelPollChoiceWithVotes extends ChannelPollChoice {
  /** Unused by Twitch, expect 0. */
  bits_votes: number;
  /** Votes bought with channel points. */
  channel_points_votes: number;
  /** All votes for the choice, whatever the voting method. */
  votes: number;
}

/** Bits voting settings of a poll. Twitch no longer supports Bits voting. */
export interface ChannelPollBitsVoting {
  /** Unused by Twitch, expect `false`. */
  is_enabled: boolean;
  /** Unused by Twitch, expect 0. */
  amount_per_vote: number;
}

/** Channel points voting settings of a poll. */
export interface ChannelPollChannelPointsVoting {
  /** Whether viewers can buy extra votes with channel points. */
  is_enabled: boolean;
  /** Channel points one extra vote costs. */
  amount_per_vote: number;
}

/** Fields found in every poll event. */
export interface ChannelPollBase {
  /** ID of the poll. */
  id: string;
  /** ID of the channel running the poll. */
  broadcaster_user_id: string;
  /** Login of that channel. */
  broadcaster_user_login: string;
  /** Display name of that channel. */
  broadcaster_user_name: string;
  /** Question asked by the poll. */
  title: string;
  /** Bits voting settings, kept for compatibility. */
  bits_voting: ChannelPollBitsVoting;
  /** Channel points voting settings. */
  channel_points_voting: ChannelPollChannelPointsVoting;
  /** RFC 3339 timestamp of the start of the poll. */
  started_at: string;
}

/** Event of `channel.poll.begin`. */
export interface ChannelPollBeginEvent extends ChannelPollBase {
  /** Choices offered, without vote counts yet. */
  choices: ChannelPollChoice[];
  /** RFC 3339 timestamp at which the poll is due to end. */
  ends_at: string;
}

/** Event of `channel.poll.progress`. */
export interface ChannelPollProgressEvent extends ChannelPollBase {
  /** Choices offered, with the votes counted so far. */
  choices: ChannelPollChoiceWithVotes[];
  /** RFC 3339 timestamp at which the poll is due to end. */
  ends_at: string;
}

/** How a poll ended. */
export type ChannelPollEndStatus = "completed" | "archived" | "terminated";

/** Event of `channel.poll.end`. */
export interface ChannelPollEndEvent extends ChannelPollBase {
  /** Choices offered, with the final votes. */
  choices: ChannelPollChoiceWithVotes[];
  /** How the poll ended. */
  status: ChannelPollEndStatus;
  /** RFC 3339 timestamp of the end of the poll. */
  ended_at: string;
}

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------

/** Condition of `channel.prediction.begin`. */
export interface ChannelPredictionBeginCondition {
  /** ID of the channel whose Predictions are wanted. */
  broadcaster_user_id: string;
}

/** Condition of `channel.prediction.progress`. */
export type ChannelPredictionProgressCondition = ChannelPredictionBeginCondition;

/** Condition of `channel.prediction.lock`. */
export type ChannelPredictionLockCondition = ChannelPredictionBeginCondition;

/** Condition of `channel.prediction.end`. */
export type ChannelPredictionEndCondition = ChannelPredictionBeginCondition;

/** A viewer among the biggest spenders on a Prediction outcome. */
export interface ChannelPredictionTopPredictor {
  /** ID of the viewer. */
  user_id: string;
  /** Login of the viewer. */
  user_login: string;
  /** Display name of the viewer. */
  user_name: string;
  /**
   * Channel points won. Always `null` in progress and lock events; in the end
   * event, 0 or `null` for a lost or refunded bet.
   */
  channel_points_won: number | null;
  /** Channel points the viewer bet. */
  channel_points_used: number;
}

/** An outcome of a Prediction, as listed when the Prediction starts. */
export interface ChannelPredictionOutcome {
  /** ID of the outcome. */
  id: string;
  /** Label of the outcome. */
  title: string;
  /** Color Twitch gives the outcome. */
  color: "pink" | "blue";
}

/** An outcome of a Prediction with its bets. */
export interface ChannelPredictionOutcomeWithBets extends ChannelPredictionOutcome {
  /** Number of viewers who bet on the outcome. */
  users: number;
  /** Channel points bet on the outcome. */
  channel_points: number;
  /** Up to 10 viewers who bet the most on the outcome. */
  top_predictors: ChannelPredictionTopPredictor[];
}

/** Fields found in every Prediction event. */
export interface ChannelPredictionBase {
  /** ID of the Prediction. */
  id: string;
  /** ID of the channel running the Prediction. */
  broadcaster_user_id: string;
  /** Login of that channel. */
  broadcaster_user_login: string;
  /** Display name of that channel. */
  broadcaster_user_name: string;
  /** Title of the Prediction. */
  title: string;
  /** RFC 3339 timestamp of the start of the Prediction. */
  started_at: string;
}

/** Event of `channel.prediction.begin`. */
export interface ChannelPredictionBeginEvent extends ChannelPredictionBase {
  /** Outcomes viewers can bet on, without bets yet. */
  outcomes: ChannelPredictionOutcome[];
  /** RFC 3339 timestamp at which betting closes on its own. */
  locks_at: string;
}

/** Event of `channel.prediction.progress`. */
export interface ChannelPredictionProgressEvent extends ChannelPredictionBase {
  /** Outcomes with the bets placed so far. */
  outcomes: ChannelPredictionOutcomeWithBets[];
  /** RFC 3339 timestamp at which betting closes on its own. */
  locks_at: string;
}

/** Event of `channel.prediction.lock`. */
export interface ChannelPredictionLockEvent extends ChannelPredictionBase {
  /** Outcomes with the bets placed before the lock. */
  outcomes: ChannelPredictionOutcomeWithBets[];
  /** RFC 3339 timestamp at which betting closed. */
  locked_at: string;
}

/** How a Prediction ended: with a winning outcome, or refunded. */
export type ChannelPredictionEndStatus = "resolved" | "canceled";

/** Event of `channel.prediction.end`. */
export interface ChannelPredictionEndEvent extends ChannelPredictionBase {
  /** ID of the outcome that won. */
  winning_outcome_id: string;
  /** Outcomes with their final bets and winnings. */
  outcomes: ChannelPredictionOutcomeWithBets[];
  /** How the Prediction ended. */
  status: ChannelPredictionEndStatus;
  /** RFC 3339 timestamp of the end of the Prediction. */
  ended_at: string;
}

// ---------------------------------------------------------------------------
// Charity campaigns
// ---------------------------------------------------------------------------

/** Condition of `channel.charity_campaign.donate`. */
export interface ChannelCharityCampaignDonateCondition {
  /** ID of the channel running the charity campaign. */
  broadcaster_user_id: string;
}

/** Condition of `channel.charity_campaign.start`. */
export type ChannelCharityCampaignStartCondition = ChannelCharityCampaignDonateCondition;

/** Condition of `channel.charity_campaign.progress`. */
export type ChannelCharityCampaignProgressCondition = ChannelCharityCampaignDonateCondition;

/** Condition of `channel.charity_campaign.stop`. */
export type ChannelCharityCampaignStopCondition = ChannelCharityCampaignDonateCondition;

/** An amount of money in a charity campaign. */
export interface ChannelCharityCampaignAmount {
  /** Amount in the smallest unit of the currency: 550 stands for 5.50 USD. */
  value: number;
  /** Decimal places of the currency; the amount in whole units is `value / 10 ** decimal_places`. */
  decimal_places: number;
  /** ISO 4217 code of the currency, three letters. */
  currency: string;
}

/** Description of the charity a campaign raises money for. */
export interface ChannelCharityCampaignCharity {
  /** Name of the charity. */
  charity_name: string;
  /** Description of the charity. */
  charity_description: string;
  /** URL of the charity's logo, a 100 by 100 pixel PNG. */
  charity_logo: string;
  /** URL of the charity's website. */
  charity_website: string;
}

/** Event of `channel.charity_campaign.donate`. */
export interface ChannelCharityCampaignDonateEvent extends ChannelCharityCampaignCharity {
  /** ID of the donation, unique across campaigns. */
  id: string;
  /** ID of the campaign that received the donation. */
  campaign_id: string;
  /** ID of the channel running the campaign. */
  broadcaster_user_id: string;
  /** Login of that channel. */
  broadcaster_user_login: string;
  /** Display name of that channel. */
  broadcaster_user_name: string;
  /** ID of the donor. */
  user_id: string;
  /** Login of the donor. */
  user_login: string;
  /** Display name of the donor. */
  user_name: string;
  /** Amount given. */
  amount: ChannelCharityCampaignAmount;
}

/**
 * Fields found in the start, progress and stop events of a charity campaign.
 * Unlike most events, the broadcaster fields have no `user_` part in their name.
 */
export interface ChannelCharityCampaignBase extends ChannelCharityCampaignCharity {
  /** ID of the campaign. */
  id: string;
  /** ID of the channel running the campaign. */
  broadcaster_id: string;
  /** Login of that channel. */
  broadcaster_login: string;
  /** Display name of that channel. */
  broadcaster_name: string;
  /** Money raised so far. */
  current_amount: ChannelCharityCampaignAmount;
  /** Fundraising goal of the campaign. */
  target_amount: ChannelCharityCampaignAmount;
}

/** Event of `channel.charity_campaign.start`. */
export interface ChannelCharityCampaignStartEvent extends ChannelCharityCampaignBase {
  /** RFC 3339 timestamp of the start of the campaign. */
  started_at: string;
}

/** Event of `channel.charity_campaign.progress`. */
export type ChannelCharityCampaignProgressEvent = ChannelCharityCampaignBase;

/** Event of `channel.charity_campaign.stop`. */
export interface ChannelCharityCampaignStopEvent extends ChannelCharityCampaignBase {
  /** RFC 3339 timestamp of the end of the campaign. */
  stopped_at: string;
}

// ---------------------------------------------------------------------------
// Conduits, Drops and Extensions
// ---------------------------------------------------------------------------

/** Condition of `conduit.shard.disabled`. */
export interface ConduitShardDisabledCondition {
  /** Client ID of the application; it must be the one of the app access token. */
  client_id: string;
  /** Limits the notifications to this conduit; every conduit of the client when left out. */
  conduit_id?: string;
}

/** Transport of a disabled shard that was delivering to a webhook. */
export interface ConduitShardDisabledWebhookTransport {
  /** Marks a webhook transport. */
  method: "webhook";
  /** URL the notifications were posted to. */
  callback: string;
  /** Never set on a webhook transport. */
  session_id?: null;
  /** Never set on a webhook transport. */
  connected_at?: null;
  /** Never set on a webhook transport. */
  disconnected_at?: null;
}

/** Transport of a disabled shard that was delivering to a WebSocket session. */
export interface ConduitShardDisabledWebsocketTransport {
  /** Marks a WebSocket transport. */
  method: "websocket";
  /** Never set on a WebSocket transport. */
  callback?: null;
  /** ID of the WebSocket session. */
  session_id: string;
  /** RFC 3339 timestamp at which the session connected. */
  connected_at: string;
  /** RFC 3339 timestamp at which the session disconnected. */
  disconnected_at: string;
}

/** Transport of a disabled shard; narrow on `method`. */
export type ConduitShardDisabledTransport = ConduitShardDisabledWebhookTransport | ConduitShardDisabledWebsocketTransport;

/** Event of `conduit.shard.disabled`. */
export interface ConduitShardDisabledEvent {
  /** ID of the conduit the shard belongs to. */
  conduit_id: string;
  /** ID of the shard that was disabled. */
  shard_id: string;
  /** New status of the shard's transport, for example `websocket_disconnected`. */
  status: string;
  /** The transport that stopped working. */
  transport: ConduitShardDisabledTransport;
}

/** Condition of `drop.entitlement.grant`. */
export interface DropEntitlementGrantCondition {
  /** ID of the organization that owns the game in the developer console. */
  organization_id: string;
  /** Limits the notifications to this category (game). */
  category_id?: string;
  /** Limits the notifications to this Drops campaign. */
  campaign_id?: string;
}

/** Details of a Drop entitlement. */
export interface DropEntitlementGrantEntitlementData {
  /** ID of the organization that owns the game. */
  organization_id: string;
  /** ID of the category (game) being watched when the Drop was earned. */
  category_id: string;
  /** Name of that category. */
  category_name: string;
  /** ID of the Drops campaign. */
  campaign_id: string;
  /** ID of the viewer who earned the entitlement. */
  user_id: string;
  /** Display name of that viewer. */
  user_name: string;
  /** Login of that viewer. */
  user_login: string;
  /** ID of the entitlement; use it to ignore an entitlement received twice. */
  entitlement_id: string;
  /** ID of the benefit granted. */
  benefit_id: string;
  /** RFC 3339 timestamp at which the entitlement was granted. */
  created_at: string;
}

/** One entitlement of a `drop.entitlement.grant` batch. */
export interface DropEntitlementGrantEntitlement {
  /** ID EventSub gives this entry; use it to ignore an entry received twice. */
  id: string;
  /** The entitlement itself. */
  data: DropEntitlementGrantEntitlementData;
}

/**
 * Event of `drop.entitlement.grant`. This type is delivered in batches, so the
 * event is an array with one entry per entitlement.
 */
export type DropEntitlementGrantEvent = DropEntitlementGrantEntitlement[];

/** Condition of `extension.bits_transaction.create`. */
export interface ExtensionBitsTransactionCreateCondition {
  /** Client ID of the extension. */
  extension_client_id: string;
}

/** Product bought with Bits inside an extension. */
export interface ExtensionBitsTransactionCreateProduct {
  /** Name of the product. */
  name: string;
  /** Bits spent; 0 while the product is in development. */
  bits: number;
  /** SKU that identifies the product. */
  sku: string;
  /** Whether the product is still in development. */
  in_development: boolean;
}

/** Event of `extension.bits_transaction.create`. */
export interface ExtensionBitsTransactionCreateEvent {
  /** Client ID of the extension. */
  extension_client_id: string;
  /** ID of the transaction. */
  id: string;
  /** ID of the channel where the transaction took place. */
  broadcaster_user_id: string;
  /** Login of that channel. */
  broadcaster_user_login: string;
  /** Display name of that channel. */
  broadcaster_user_name: string;
  /** ID of the buyer. */
  user_id: string;
  /** Login of the buyer. */
  user_login: string;
  /** Display name of the buyer. */
  user_name: string;
  /** What was bought. */
  product: ExtensionBitsTransactionCreateProduct;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

/** Condition of `channel.goal.begin`. */
export interface ChannelGoalBeginCondition {
  /** ID of the broadcaster; it must be the user of the access token. */
  broadcaster_user_id: string;
}

/** Condition of `channel.goal.progress`. */
export type ChannelGoalProgressCondition = ChannelGoalBeginCondition;

/** Condition of `channel.goal.end`. */
export type ChannelGoalEndCondition = ChannelGoalBeginCondition;

/** What a creator goal counts. */
export type ChannelGoalType =
  /** Followers. */
  | "follow"
  /** Subscription tier points, net of cancellations. */
  | "subscription"
  /** Number of subscriptions, net of cancellations. */
  | "subscription_count"
  /** Tier points of new subscriptions only; cancellations are ignored. */
  | "new_subscription"
  /** Number of new subscriptions only; cancellations are ignored. */
  | "new_subscription_count"
  /** Bits used on the channel. */
  | "new_bit"
  /** Distinct viewers who cheered. */
  | "new_cheerer";

/** Fields found in every goal event. */
export interface ChannelGoalBase {
  /** ID of the goal. */
  id: string;
  /** ID of the broadcaster. */
  broadcaster_user_id: string;
  /** Display name of the broadcaster. */
  broadcaster_user_name: string;
  /** Login of the broadcaster. */
  broadcaster_user_login: string;
  /** What the goal counts. */
  type: ChannelGoalType;
  /** Description given by the broadcaster, 40 characters at most. */
  description: string;
  /** Value reached so far, in the unit set by `type` (followers, tier points, subscriptions...). */
  current_amount: number;
  /** Value the broadcaster aims for. */
  target_amount: number;
  /** RFC 3339 timestamp of the creation of the goal. */
  started_at: string;
}

/** Event of `channel.goal.begin`. */
export type ChannelGoalBeginEvent = ChannelGoalBase;

/** Event of `channel.goal.progress`. */
export type ChannelGoalProgressEvent = ChannelGoalBase;

/** Event of `channel.goal.end`. */
export interface ChannelGoalEndEvent extends ChannelGoalBase {
  /** Whether the target was reached. */
  is_achieved: boolean;
  /** RFC 3339 timestamp at which the broadcaster ended the goal. */
  ended_at: string;
}

// ---------------------------------------------------------------------------
// Hype Trains (version 2)
// ---------------------------------------------------------------------------

/** Condition of `channel.hype_train.begin`. */
export interface ChannelHypeTrainBeginCondition {
  /** ID of the channel whose Hype Trains are wanted. */
  broadcaster_user_id: string;
}

/** Condition of `channel.hype_train.progress`. */
export type ChannelHypeTrainProgressCondition = ChannelHypeTrainBeginCondition;

/** Condition of `channel.hype_train.end`. */
export type ChannelHypeTrainEndCondition = ChannelHypeTrainBeginCondition;

/** A leading contributor of a Hype Train. */
export interface ChannelHypeTrainContribution {
  /** ID of the contributor. */
  user_id: string;
  /** Login of the contributor. */
  user_login: string;
  /** Display name of the contributor. */
  user_name: string;
  /** How the viewer contributed: Bits, subscriptions (bought or gifted), or anything else. */
  type: "bits" | "subscription" | "other";
  /**
   * Amount contributed: a number of Bits for `bits`; 500, 1000 or 2500 for a
   * tier 1, 2 or 3 subscription.
   */
  total: number;
}

/** A channel taking part in a shared Hype Train. */
export interface ChannelHypeTrainParticipant {
  /** ID of the channel. */
  broadcaster_user_id: string;
  /** Login of the channel. */
  broadcaster_user_login: string;
  /** Display name of the channel. */
  broadcaster_user_name: string;
}

/** Kind of Hype Train. */
export type ChannelHypeTrainType = "treasure" | "golden_kappa" | "regular";

/** Sharing fields of a Hype Train that runs on several channels at once. */
export interface ChannelHypeTrainShared {
  /** The train is shared. */
  is_shared_train: true;
  /** Channels the train is shared between. */
  shared_train_participants: ChannelHypeTrainParticipant[];
}

/** Sharing fields of a Hype Train that runs on a single channel. */
export interface ChannelHypeTrainNotShared {
  /** The train is not shared. */
  is_shared_train: false;
  /** Never set when the train is not shared. */
  shared_train_participants?: null;
}

/** Sharing fields of a Hype Train; narrow on `is_shared_train`. */
export type ChannelHypeTrainSharing = ChannelHypeTrainShared | ChannelHypeTrainNotShared;

/** Fields found in every Hype Train event, sharing fields aside. */
export interface ChannelHypeTrainBase {
  /** ID of the Hype Train. */
  id: string;
  /** ID of the channel. */
  broadcaster_user_id: string;
  /** Login of the channel. */
  broadcaster_user_login: string;
  /** Display name of the channel. */
  broadcaster_user_name: string;
  /** Points contributed to the train since it started. */
  total: number;
  /** Viewers who contributed the most. */
  top_contributions: ChannelHypeTrainContribution[];
  /** Level the train is at, or reached for an ended train. */
  level: number;
  /** RFC 3339 timestamp of the start of the train. */
  started_at: string;
  /** Kind of Hype Train. */
  type: ChannelHypeTrainType;
}

/** Fields of `channel.hype_train.progress`, sharing fields aside. */
export interface ChannelHypeTrainProgressBase extends ChannelHypeTrainBase {
  /** Points contributed within the current level. */
  progress: number;
  /** Points needed to complete the current level. */
  goal: number;
  /** RFC 3339 timestamp at which the train expires; pushed back each time a level is completed. */
  expires_at: string;
}

/** Fields of `channel.hype_train.begin`, sharing fields aside. */
export interface ChannelHypeTrainBeginBase extends ChannelHypeTrainProgressBase {
  /** Highest level this kind of train ever reached on the channel. */
  all_time_high_level: number;
  /** Highest total this kind of train ever reached on the channel. */
  all_time_high_total: number;
}

/** Fields of `channel.hype_train.end`, sharing fields aside. */
export interface ChannelHypeTrainEndBase extends ChannelHypeTrainBase {
  /** RFC 3339 timestamp of the end of the train. */
  ended_at: string;
  /** RFC 3339 timestamp from which a new train can start. */
  cooldown_ends_at: string;
}

/** Event of `channel.hype_train.begin`. Checking `is_shared_train` narrows `shared_train_participants`. */
export type ChannelHypeTrainBeginEvent = ChannelHypeTrainBeginBase & ChannelHypeTrainSharing;

/** Event of `channel.hype_train.progress`. Checking `is_shared_train` narrows `shared_train_participants`. */
export type ChannelHypeTrainProgressEvent = ChannelHypeTrainProgressBase & ChannelHypeTrainSharing;

/** Event of `channel.hype_train.end`. Checking `is_shared_train` narrows `shared_train_participants`. */
export type ChannelHypeTrainEndEvent = ChannelHypeTrainEndBase & ChannelHypeTrainSharing;

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/** Condition of `user.authorization.grant`. */
export interface UserAuthorizationGrantCondition {
  /** Client ID of the application; it must be the one of the app access token. */
  client_id: string;
}

/** Condition of `user.authorization.revoke`. */
export type UserAuthorizationRevokeCondition = UserAuthorizationGrantCondition;

/** Event of `user.authorization.grant`. */
export interface UserAuthorizationGrantEvent {
  /** Client ID of the application that was authorized. */
  client_id: string;
  /** ID of the user who authorized the application. */
  user_id: string;
  /** Login of that user. */
  user_login: string;
  /** Display name of that user. */
  user_name: string;
}

/** Event of `user.authorization.revoke`. */
export interface UserAuthorizationRevokeEvent {
  /** Client ID of the application that lost its access. */
  client_id: string;
  /** ID of the user whose authorization was revoked. */
  user_id: string;
  /** Login of that user, or `null` when the account no longer exists. */
  user_login: string | null;
  /** Display name of that user, or `null` when the account no longer exists. */
  user_name: string | null;
}

/** Condition of `user.update`. */
export interface UserUpdateCondition {
  /** ID of the user to watch. */
  user_id: string;
}

/** Event of `user.update`. */
export interface UserUpdateEvent {
  /** ID of the user. */
  user_id: string;
  /** Login of the user. */
  user_login: string;
  /** Display name of the user. */
  user_name: string;
  /**
   * Email address of the user. Only filled when the user granted
   * `user:read:email` to the application; otherwise empty or missing.
   */
  email?: string;
  /** Whether Twitch verified the email address. Meaningless when `email` is empty. */
  email_verified: boolean;
  /** Description of the user's channel. */
  description: string;
}

/** Condition of `user.whisper.message`. */
export interface UserWhisperMessageCondition {
  /** ID of the user who receives the whispers. */
  user_id: string;
}

/** Content of a whisper. */
export interface UserWhisperMessageWhisper {
  /** Text of the whisper. */
  text: string;
}

/** Event of `user.whisper.message`. */
export interface UserWhisperMessageEvent {
  /** ID of the sender. */
  from_user_id: string;
  /** Display name of the sender. */
  from_user_name: string;
  /** Login of the sender. */
  from_user_login: string;
  /** ID of the recipient. */
  to_user_id: string;
  /** Display name of the recipient. */
  to_user_name: string;
  /** Login of the recipient. */
  to_user_login: string;
  /** ID of the whisper. */
  whisper_id: string;
  /** Content of the whisper. */
  whisper: UserWhisperMessageWhisper;
}

// ---------------------------------------------------------------------------
// Map and versions
// ---------------------------------------------------------------------------

/**
 * Subscription types about channel activity (Guest Star, channel points,
 * Power-ups, polls, Predictions, charity, goals, Hype Trains) and about
 * conduits, Drops, extensions and users.
 */
export interface ActivityEventSubTypes {
  /**
   * The host started a Guest Star session.
   *
   * Scope: one of `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`,
   * `moderator:manage:guest_star`, from the user given as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionbegin
   */
  "channel.guest_star_session.begin": EventSubDefinition<
    "beta",
    ChannelGuestStarSessionBeginCondition,
    ChannelGuestStarSessionBeginEvent
  >;
  /**
   * A Guest Star session ended, closed by the host or by Twitch.
   *
   * Scope: one of `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`,
   * `moderator:manage:guest_star`, from the user given as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionend
   */
  "channel.guest_star_session.end": EventSubDefinition<
    "beta",
    ChannelGuestStarSessionEndCondition,
    ChannelGuestStarSessionEndEvent
  >;
  /**
   * A guest or a slot changed in a running Guest Star session.
   *
   * Scope: one of `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`,
   * `moderator:manage:guest_star`, from the user given as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_guestupdate
   */
  "channel.guest_star_guest.update": EventSubDefinition<
    "beta",
    ChannelGuestStarGuestUpdateCondition,
    ChannelGuestStarGuestUpdateEvent
  >;
  /**
   * The host changed the Guest Star preferences of the channel.
   *
   * Scope: one of `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`,
   * `moderator:manage:guest_star`, from the user given as `moderator_user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_settingsupdate
   */
  "channel.guest_star_settings.update": EventSubDefinition<
    "beta",
    ChannelGuestStarSettingsUpdateCondition,
    ChannelGuestStarSettingsUpdateEvent
  >;
  /**
   * A viewer redeemed an automatic channel points reward (version 2, message split into fragments).
   *
   * Scope: one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd-v2
   */
  "channel.channel_points_automatic_reward_redemption.add": EventSubDefinition<
    "2",
    ChannelChannelPointsAutomaticRewardRedemptionAddCondition,
    ChannelChannelPointsAutomaticRewardRedemptionAddEvent
  >;
  /**
   * A viewer redeemed an automatic channel points reward (version 1, message with emote positions).
   *
   * Scope: one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd
   */
  "channel.channel_points_automatic_reward_redemption.add@1": EventSubDefinition<
    "1",
    ChannelChannelPointsAutomaticRewardRedemptionAddV1Condition,
    ChannelChannelPointsAutomaticRewardRedemptionAddV1Event
  >;
  /**
   * The broadcaster created a custom channel points reward.
   *
   * Scope: one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardadd
   */
  "channel.channel_points_custom_reward.add": EventSubDefinition<
    "1",
    ChannelChannelPointsCustomRewardAddCondition,
    ChannelChannelPointsCustomRewardAddEvent
  >;
  /**
   * A custom channel points reward was edited.
   *
   * Scope: one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardupdate
   */
  "channel.channel_points_custom_reward.update": EventSubDefinition<
    "1",
    ChannelChannelPointsCustomRewardUpdateCondition,
    ChannelChannelPointsCustomRewardUpdateEvent
  >;
  /**
   * A custom channel points reward was deleted.
   *
   * Scope: one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardremove
   */
  "channel.channel_points_custom_reward.remove": EventSubDefinition<
    "1",
    ChannelChannelPointsCustomRewardRemoveCondition,
    ChannelChannelPointsCustomRewardRemoveEvent
  >;
  /**
   * A viewer redeemed a custom channel points reward.
   *
   * Scope: one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionadd
   */
  "channel.channel_points_custom_reward_redemption.add": EventSubDefinition<
    "1",
    ChannelChannelPointsCustomRewardRedemptionAddCondition,
    ChannelChannelPointsCustomRewardRedemptionAddEvent
  >;
  /**
   * A redemption of a custom channel points reward was fulfilled or canceled.
   *
   * Scope: one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionupdate
   */
  "channel.channel_points_custom_reward_redemption.update": EventSubDefinition<
    "1",
    ChannelChannelPointsCustomRewardRedemptionUpdateCondition,
    ChannelChannelPointsCustomRewardRedemptionUpdateEvent
  >;
  /**
   * A viewer redeemed a custom Power-up.
   *
   * Scope: `bits:read`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcustom_power_up_redemptionadd
   */
  "channel.custom_power_up_redemption.add": EventSubDefinition<
    "1",
    ChannelCustomPowerUpRedemptionAddCondition,
    ChannelCustomPowerUpRedemptionAddEvent
  >;
  /**
   * A poll started on the channel.
   *
   * Scope: one of `channel:read:polls`, `channel:manage:polls`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollbegin
   */
  "channel.poll.begin": EventSubDefinition<"1", ChannelPollBeginCondition, ChannelPollBeginEvent>;
  /**
   * Viewers voted in a running poll.
   *
   * Scope: one of `channel:read:polls`, `channel:manage:polls`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollprogress
   */
  "channel.poll.progress": EventSubDefinition<"1", ChannelPollProgressCondition, ChannelPollProgressEvent>;
  /**
   * A poll ended on the channel.
   *
   * Scope: one of `channel:read:polls`, `channel:manage:polls`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollend
   */
  "channel.poll.end": EventSubDefinition<"1", ChannelPollEndCondition, ChannelPollEndEvent>;
  /**
   * A Prediction started on the channel.
   *
   * Scope: one of `channel:read:predictions`, `channel:manage:predictions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionbegin
   */
  "channel.prediction.begin": EventSubDefinition<"1", ChannelPredictionBeginCondition, ChannelPredictionBeginEvent>;
  /**
   * Viewers bet on a running Prediction.
   *
   * Scope: one of `channel:read:predictions`, `channel:manage:predictions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionprogress
   */
  "channel.prediction.progress": EventSubDefinition<
    "1",
    ChannelPredictionProgressCondition,
    ChannelPredictionProgressEvent
  >;
  /**
   * Betting closed on a Prediction.
   *
   * Scope: one of `channel:read:predictions`, `channel:manage:predictions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionlock
   */
  "channel.prediction.lock": EventSubDefinition<"1", ChannelPredictionLockCondition, ChannelPredictionLockEvent>;
  /**
   * A Prediction ended, resolved or canceled.
   *
   * Scope: one of `channel:read:predictions`, `channel:manage:predictions`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionend
   */
  "channel.prediction.end": EventSubDefinition<"1", ChannelPredictionEndCondition, ChannelPredictionEndEvent>;
  /**
   * A viewer donated to the broadcaster's charity campaign.
   *
   * Scope: `channel:read:charity`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaigndonate
   */
  "channel.charity_campaign.donate": EventSubDefinition<
    "1",
    ChannelCharityCampaignDonateCondition,
    ChannelCharityCampaignDonateEvent
  >;
  /**
   * The broadcaster started a charity campaign. May arrive after the first progress event.
   *
   * Scope: `channel:read:charity`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstart
   */
  "channel.charity_campaign.start": EventSubDefinition<
    "1",
    ChannelCharityCampaignStartCondition,
    ChannelCharityCampaignStartEvent
  >;
  /**
   * A charity campaign moved toward its goal, or the broadcaster changed the goal.
   *
   * Scope: `channel:read:charity`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignprogress
   */
  "channel.charity_campaign.progress": EventSubDefinition<
    "1",
    ChannelCharityCampaignProgressCondition,
    ChannelCharityCampaignProgressEvent
  >;
  /**
   * The broadcaster stopped a charity campaign.
   *
   * Scope: `channel:read:charity`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstop
   */
  "channel.charity_campaign.stop": EventSubDefinition<
    "1",
    ChannelCharityCampaignStopCondition,
    ChannelCharityCampaignStopEvent
  >;
  /**
   * EventSub disabled a conduit shard because the state of its transport changed.
   *
   * Scope: none. Needs an app access token whose client ID equals `client_id`; with `conduit_id`, that client
   * must own the conduit.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#conduitsharddisabled
   */
  "conduit.shard.disabled": EventSubDefinition<"1", ConduitShardDisabledCondition, ConduitShardDisabledEvent>;
  /**
   * Viewers were granted Drop entitlements. Delivered in batches: the event is an array of entitlements, and the
   * subscription must be created with batching enabled. Webhooks and conduits only.
   *
   * Scope: none. Needs an app access token from a client owned by a member of the organization.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#dropentitlementgrant
   */
  "drop.entitlement.grant": EventSubDefinition<"1", DropEntitlementGrantCondition, DropEntitlementGrantEvent>;
  /**
   * A Bits transaction was made in an extension. Webhooks and conduits only.
   *
   * Scope: none. The client ID of the token must be the extension's client ID.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#extensionbits_transactioncreate
   */
  "extension.bits_transaction.create": EventSubDefinition<
    "1",
    ExtensionBitsTransactionCreateCondition,
    ExtensionBitsTransactionCreateEvent
  >;
  /**
   * The broadcaster started a creator goal. May arrive after the first progress events.
   *
   * Scope: `channel:read:goals`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalbegin
   */
  "channel.goal.begin": EventSubDefinition<"1", ChannelGoalBeginCondition, ChannelGoalBeginEvent>;
  /**
   * A creator goal moved forward or backward.
   *
   * Scope: `channel:read:goals`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalprogress
   */
  "channel.goal.progress": EventSubDefinition<"1", ChannelGoalProgressCondition, ChannelGoalProgressEvent>;
  /**
   * The broadcaster ended a creator goal.
   *
   * Scope: `channel:read:goals`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalend
   */
  "channel.goal.end": EventSubDefinition<"1", ChannelGoalEndCondition, ChannelGoalEndEvent>;
  /**
   * A Hype Train started on the channel. The first progress events may arrive before this one.
   *
   * Scope: `channel:read:hype_train`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin
   */
  "channel.hype_train.begin": EventSubDefinition<"2", ChannelHypeTrainBeginCondition, ChannelHypeTrainBeginEvent>;
  /**
   * A contribution moved a running Hype Train forward.
   *
   * Scope: `channel:read:hype_train`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainprogress
   */
  "channel.hype_train.progress": EventSubDefinition<
    "2",
    ChannelHypeTrainProgressCondition,
    ChannelHypeTrainProgressEvent
  >;
  /**
   * A Hype Train ended on the channel.
   *
   * Scope: `channel:read:hype_train`, from the broadcaster.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainend
   */
  "channel.hype_train.end": EventSubDefinition<"2", ChannelHypeTrainEndCondition, ChannelHypeTrainEndEvent>;
  /**
   * A user authorized the application. Webhooks and conduits only.
   *
   * Scope: none. Needs an app access token whose client ID equals `client_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationgrant
   */
  "user.authorization.grant": EventSubDefinition<"1", UserAuthorizationGrantCondition, UserAuthorizationGrantEvent>;
  /**
   * The application lost a user's authorization. Webhooks and conduits only.
   *
   * Scope: none. Needs an app access token whose client ID equals `client_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationrevoke
   */
  "user.authorization.revoke": EventSubDefinition<"1", UserAuthorizationRevokeCondition, UserAuthorizationRevokeEvent>;
  /**
   * A user changed their account (name, description, email...).
   *
   * Scope: none. `user:read:email` from that user adds their email address to the event.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userupdate
   */
  "user.update": EventSubDefinition<"1", UserUpdateCondition, UserUpdateEvent>;
  /**
   * The user received a whisper.
   *
   * Scope: one of `user:read:whispers`, `user:manage:whispers`, from the user given as `user_id`.
   *
   * @see https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userwhispermessage
   */
  "user.whisper.message": EventSubDefinition<"1", UserWhisperMessageCondition, UserWhisperMessageEvent>;
}

/** Version of each subscription type of {@link ActivityEventSubTypes}. */
export const activityVersions = {
  "channel.guest_star_session.begin": "beta",
  "channel.guest_star_session.end": "beta",
  "channel.guest_star_guest.update": "beta",
  "channel.guest_star_settings.update": "beta",
  "channel.channel_points_automatic_reward_redemption.add": "2",
  "channel.channel_points_automatic_reward_redemption.add@1": "1",
  "channel.channel_points_custom_reward.add": "1",
  "channel.channel_points_custom_reward.update": "1",
  "channel.channel_points_custom_reward.remove": "1",
  "channel.channel_points_custom_reward_redemption.add": "1",
  "channel.channel_points_custom_reward_redemption.update": "1",
  "channel.custom_power_up_redemption.add": "1",
  "channel.poll.begin": "1",
  "channel.poll.progress": "1",
  "channel.poll.end": "1",
  "channel.prediction.begin": "1",
  "channel.prediction.progress": "1",
  "channel.prediction.lock": "1",
  "channel.prediction.end": "1",
  "channel.charity_campaign.donate": "1",
  "channel.charity_campaign.start": "1",
  "channel.charity_campaign.progress": "1",
  "channel.charity_campaign.stop": "1",
  "conduit.shard.disabled": "1",
  "drop.entitlement.grant": "1",
  "extension.bits_transaction.create": "1",
  "channel.goal.begin": "1",
  "channel.goal.progress": "1",
  "channel.goal.end": "1",
  "channel.hype_train.begin": "2",
  "channel.hype_train.progress": "2",
  "channel.hype_train.end": "2",
  "user.authorization.grant": "1",
  "user.authorization.revoke": "1",
  "user.update": "1",
  "user.whisper.message": "1",
} as const satisfies { [K in keyof ActivityEventSubTypes]: ActivityEventSubTypes[K]["version"] };
