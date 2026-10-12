/**
 * Shape of one entry of the subscription type map: the version sent when
 * subscribing, the condition to provide and the event received.
 */
export interface EventSubDefinition<Version extends string, Condition, Event> {
  /** Version sent to Twitch when subscribing. */
  version: Version;
  /** What to provide when subscribing: which channel, which user... */
  condition: Condition;
  /** What a handler receives for each event. */
  event: Event;
}

/** Every state a subscription can be in. Only `enabled` subscriptions deliver events. */
export type EventSubSubscriptionStatus =
  | "enabled"
  | "webhook_callback_verification_pending"
  | "webhook_callback_verification_failed"
  | "notification_failures_exceeded"
  | "authorization_revoked"
  | "moderator_removed"
  | "user_removed"
  | "chat_user_banned"
  | "version_removed"
  | "beta_maintenance"
  | "websocket_disconnected"
  | "websocket_failed_ping_pong"
  | "websocket_received_inbound_traffic"
  | "websocket_connection_unused"
  | "websocket_internal_error"
  | "websocket_network_timeout"
  | "websocket_network_error"
  | "websocket_failed_to_reconnect"
  | "conduit_deleted";

/** Webhook transport as you send it when subscribing. */
export interface EventSubWebhookTransportInput {
  /** Deliver events to a webhook. */
  method: "webhook";
  /** Public HTTPS URL, on port 443, that receives the notifications. */
  callback: string;
  /** Secret used to sign notifications: 10 to 100 ASCII characters. */
  secret: string;
}

/** WebSocket transport as you send it when subscribing. */
export interface EventSubWebSocketTransportInput {
  /** Deliver events to a WebSocket session. */
  method: "websocket";
  /** ID of the WebSocket session, from its welcome message. */
  session_id: string;
}

/** Conduit transport as you send it when subscribing. */
export interface EventSubConduitTransportInput {
  /** Deliver events through a conduit. */
  method: "conduit";
  /** ID of the conduit that distributes the notifications. */
  conduit_id: string;
}

/** Where Twitch should deliver the events of a subscription. */
export type EventSubTransportInput =
  | EventSubWebhookTransportInput
  | EventSubWebSocketTransportInput
  | EventSubConduitTransportInput;

/** Transport of an existing subscription, as Twitch reports it. */
export interface EventSubTransport {
  /** How events are delivered. */
  method: "webhook" | "websocket" | "conduit";
  /** Callback URL. Webhook transport only. */
  callback?: string;
  /** WebSocket session ID. WebSocket transport only. */
  session_id?: string;
  /** When the WebSocket connected, as an RFC 3339 timestamp. WebSocket transport only. */
  connected_at?: string;
  /** When the WebSocket disconnected, as an RFC 3339 timestamp. WebSocket transport only. */
  disconnected_at?: string;
  /** Conduit ID. Conduit transport only. */
  conduit_id?: string;
}

/** An EventSub subscription, as Twitch reports it. */
export interface EventSubSubscription<Type extends string = string, Condition = Record<string, string>> {
  /** ID of the subscription. */
  id: string;
  /** Current state. Only `enabled` subscriptions deliver events. */
  status: EventSubSubscriptionStatus;
  /** Subscription type, such as `channel.follow`. */
  type: Type;
  /** Version of the subscription type. */
  version: string;
  /** Condition the subscription was created with. */
  condition: Condition;
  /** When the subscription was created, as an RFC 3339 timestamp. */
  created_at: string;
  /** Where the events are delivered. */
  transport: EventSubTransport;
  /** How much the subscription counts against your cost limit. */
  cost: number;
}

/** Totals reported next to subscription lists. */
export interface EventSubTotals {
  /** Number of subscriptions you have created. */
  total: number;
  /** Sum of the costs of your subscriptions. */
  total_cost: number;
  /** Highest total cost you are allowed to reach. */
  max_total_cost: number;
}
