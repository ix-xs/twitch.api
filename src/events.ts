import type { UserToken } from "./auth/tokens.js";

/** Describes one HTTP attempt, emitted right before it is sent. */
export interface RequestEvent {
  /** HTTP method of the request. */
  method: string;
  /** Full URL of the request. */
  url: string;
  /** `1` for the first try, then `2`, `3`... */
  attempt: number;
  /** Whose token is used: `"app"`, a user ID, or `"raw"` for a token passed by hand. */
  as: string;
}

/** Describes one HTTP response. */
export interface ResponseEvent extends RequestEvent {
  /** HTTP status of the response. */
  status: number;
  /** Time spent on this attempt, in milliseconds. */
  duration: number;
  /** Points left in the rate limit bucket, when Twitch reported it. */
  remaining?: number;
}

/** Emitted when a request is held back or retried because of the rate limit. */
export interface RateLimitEvent {
  /** `"app"` or `"user:<id>"`. */
  bucket: string;
  /** How long the request waits, in milliseconds. */
  waitMs: number;
  /** Epoch milliseconds at which the bucket refills. */
  resetAt: number;
}

/** Events emitted by the client. Listen with `twitch.on(name, listener)`. */
export interface TwitchEvents {
  /** An HTTP attempt is about to be sent. */
  request: [event: RequestEvent];
  /** An HTTP response came back. */
  response: [event: ResponseEvent];
  /** A request is waiting for the rate limit bucket to refill. */
  rateLimit: [event: RateLimitEvent];
  /** A user token was renewed. Persist it if you do not use a token store. */
  tokenRefresh: [token: UserToken];
  /** A user token is dead (revoked, or its refresh token was rejected) and was dropped. */
  tokenInvalid: [userId: string, error: Error];
}
