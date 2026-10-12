// Names the examples of the documentation may use without declaring them.
// An example that declares one of these itself shadows it.
// Keep this list short: a name here is a promise that readers know what it is.

/** A client built with a client ID and a client secret. */
declare const twitch: import("@ix-xs/twitch.api").Twitch;
/** A WebSocket listener: `twitch.eventsub.websocket()`. */
declare const events: import("@ix-xs/twitch.api").EventSubWebSocket;
/** A webhook listener: `twitch.eventsub.webhook({ callback, secret })`. */
declare const hooks: import("@ix-xs/twitch.api").EventSubWebhook;

declare const clientId: string;
declare const clientSecret: string;
declare const accessToken: string;
declare const refreshToken: string;
/** The `code` Twitch sends back to the redirect URL. */
declare const code: string;
/** The anti-CSRF value of the authorization code flow. */
declare const state: string;
/** The webhook secret. */
declare const secret: string;
/** The public webhook URL. */
declare const callback: string;
/** A signed extension JWT. */
declare const jwt: string;

/** ID of the channel the example works on. */
declare const channelId: string;
/** ID of the bot account. */
declare const botId: string;
/** ID of some user. */
declare const userId: string;
declare const broadcaster_id: string;
declare const user_id: string;
declare const moderator_id: string;
declare const extension_id: string;

// Results of an earlier call, as the examples of the generated reference use them.
declare const id: string;
declare const session_id: string;
declare const rewardId: string;
declare const pollId: string;
declare const predictionId: string;
declare const outcomeId: string;
declare const conduit: import("@ix-xs/twitch.api").Conduit;
declare const subscription: import("@ix-xs/twitch.api").EventSubSubscription;
declare const redemption: import("@ix-xs/twitch.api").CustomRewardRedemption;
declare const sent: import("@ix-xs/twitch.api").SentChatMessage;
declare const pinned: import("@ix-xs/twitch.api").PinnedChatMessage;
declare const session: import("@ix-xs/twitch.api").GuestStarSession;
declare const term: import("@ix-xs/twitch.api").BlockedTerm;
declare const segment: import("@ix-xs/twitch.api").ScheduleSegment;
