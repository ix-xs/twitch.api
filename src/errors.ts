import type { ScopeInput } from "./auth/scopes.js";

/** Base class of every error thrown by this library. */
export class TwitchError extends Error {
  override name = "TwitchError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

/** Details attached to a {@link TwitchApiError}. */
export interface TwitchApiErrorInfo {
  /** HTTP status code. */
  status: number;
  /** HTTP method of the failed request. */
  method: string;
  /** Full URL of the failed request. */
  url: string;
  /** Short error label sent by Twitch, such as `Unauthorized`. */
  error?: string;
  /** Parsed response body, when there was one. */
  body?: unknown;
  /** Response headers. */
  headers?: Headers;
}

/** Twitch answered with a non-2xx status. */
export class TwitchApiError extends TwitchError {
  override name = "TwitchApiError";
  /** HTTP status code. */
  readonly status: number;
  /** HTTP method of the failed request. */
  readonly method: string;
  /** Full URL of the failed request. */
  readonly url: string;
  /** Short error label sent by Twitch, such as `Unauthorized`. */
  readonly error: string | undefined;
  /** Parsed response body, when there was one. */
  readonly body: unknown;
  /** Response headers. */
  readonly headers: Headers | undefined;

  constructor(message: string, info: TwitchApiErrorInfo) {
    super(message);
    this.status = info.status;
    this.method = info.method;
    this.url = info.url;
    this.error = info.error;
    this.body = info.body;
    this.headers = info.headers;
  }
}

/** The rate limit was hit and the request was not retried (or ran out of retries). */
export class TwitchRateLimitError extends TwitchApiError {
  override name = "TwitchRateLimitError";
  /** Epoch milliseconds at which the bucket refills, when Twitch told us. */
  readonly resetAt: number | undefined;

  constructor(message: string, info: TwitchApiErrorInfo, resetAt?: number) {
    super(message, info);
    this.resetAt = resetAt;
  }

  /** Milliseconds to wait before the bucket refills. `0` when unknown. */
  get retryAfter(): number {
    return this.resetAt === undefined ? 0 : Math.max(0, this.resetAt - Date.now());
  }
}

/** No usable token: missing credentials, unknown user, expired or revoked authorization. */
export class TwitchAuthError extends TwitchError {
  override name = "TwitchAuthError";
  /** The user the token belongs to, when the problem concerns a user token. */
  readonly userId: string | undefined;

  constructor(message: string, options?: { cause?: unknown; userId?: string }) {
    super(message, options);
    this.userId = options?.userId;
  }
}

/** The user token exists but lacks a scope the endpoint needs. Thrown before any network call. */
export class TwitchScopeError extends TwitchAuthError {
  override name = "TwitchScopeError";
  /** Scopes that would satisfy the endpoint. One of them is enough. */
  readonly required: readonly ScopeInput[];
  /** Scopes the token actually has. */
  readonly granted: readonly string[];

  constructor(userId: string, required: readonly ScopeInput[], granted: readonly string[], what: string) {
    const list = required.map((s) => `"${s}"`).join(" or ");
    super(`The token of user ${userId} is missing the ${list} scope required by ${what}.`, { userId });
    this.required = required;
    this.granted = granted;
  }
}

/** The request never reached Twitch, or the connection broke before the answer arrived. */
export class TwitchNetworkError extends TwitchError {
  override name = "TwitchNetworkError";
}

/** The request did not complete within the configured timeout. */
export class TwitchTimeoutError extends TwitchError {
  override name = "TwitchTimeoutError";
}

/** An EventSub transport failed: connection lost for good, subscription refused, bad signature. */
export class TwitchEventSubError extends TwitchError {
  override name = "TwitchEventSubError";
}
