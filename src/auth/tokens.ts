import type { Awaitable } from "../util.js";

/** A user access token and what is known about it. Plain JSON, safe to persist. */
export interface UserToken {
  /** ID of the user who granted the token. */
  userId: string;
  /** Login name of that user, when known. */
  login?: string;
  /** The access token itself. */
  accessToken: string;
  /** Refresh token. Without it the access token cannot be renewed once it expires. */
  refreshToken?: string;
  /** Scopes granted to the token. */
  scopes: string[];
  /** Epoch milliseconds at which the access token expires. Absent when unknown. */
  expiresAt?: number;
}

/** What you hand to `twitch.auth.addUser()`. Only the access token is mandatory. */
export interface UserTokenInput {
  /** The access token. */
  accessToken: string;
  /** Refresh token, needed for automatic renewal. */
  refreshToken?: string;
  /** Scopes of the token. Looked up from Twitch when omitted. */
  scopes?: readonly string[];
  /** Expiry as epoch milliseconds or a `Date`. */
  expiresAt?: number | Date;
  /** Lifetime in seconds, as returned by Twitch. Used when `expiresAt` is absent. */
  expiresIn?: number;
  /** Owner of the token. Looked up from Twitch when omitted. */
  userId?: string;
  /** Login of the owner. */
  login?: string;
}

/** Result of validating a token against Twitch. */
export interface TokenInfo {
  /** Client ID the token was issued to. */
  clientId: string;
  /** Owner of the token. `null` for an app access token. */
  userId: string | null;
  /** Login of the owner. `null` for an app access token. */
  login: string | null;
  /** Scopes granted to the token. */
  scopes: string[];
  /** Seconds left before the token expires. `0` means it never expires. */
  expiresIn: number;
  /** Epoch milliseconds at which the token expires. Absent when it never expires. */
  expiresAt?: number;
}

/**
 * Where user tokens are persisted between runs. Implement it on top of a
 * database, a KV store or a file. Every method may be sync or async.
 */
export interface TokenStore {
  /** Returns the token saved for `userId`, if any. */
  get(userId: string): Awaitable<UserToken | undefined>;
  /** Saves or replaces the token of `userId`. Called after every refresh. */
  set(userId: string, token: UserToken): Awaitable<void>;
  /** Forgets the token of `userId`. */
  delete(userId: string): Awaitable<void>;
  /** Returns every saved user ID. When present, tokens are restored on first use. */
  list?(): Awaitable<string[]>;
}

/** Keeps tokens in memory. The default store: nothing survives a restart. */
export class MemoryTokenStore implements TokenStore {
  readonly #tokens = new Map<string, UserToken>();

  /** Returns the token saved for `userId`, if any. */
  get(userId: string): UserToken | undefined {
    return this.#tokens.get(userId);
  }

  /** Saves or replaces the token of `userId`. */
  set(userId: string, token: UserToken): void {
    this.#tokens.set(userId, token);
  }

  /** Forgets the token of `userId`. */
  delete(userId: string): void {
    this.#tokens.delete(userId);
  }

  /** Returns every saved user ID. */
  list(): string[] {
    return [...this.#tokens.keys()];
  }
}
