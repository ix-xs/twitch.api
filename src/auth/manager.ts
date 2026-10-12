import { TwitchApiError, TwitchAuthError, TwitchNetworkError, TwitchScopeError, TwitchTimeoutError } from "../errors.js";
import type { TwitchEvents } from "../events.js";
import { backoff, type Emitter, fingerprint, sleep, unref } from "../util.js";
import type { ScopeInput } from "./scopes.js";
import { MemoryTokenStore, type TokenInfo, type TokenStore, type UserToken, type UserTokenInput } from "./tokens.js";

/** Which kind of token an endpoint accepts. */
export type AuthKind = "any" | "app" | "user";

/** A token picked for one request. Internal. */
export interface Grant {
  /** The access token to send. */
  token: string;
  /** Where the token comes from: the app, a registered user, or the caller. */
  kind: "app" | "user" | "raw";
  /** Owner of the token, for user grants. */
  userId?: string;
  /** Rate limit bucket the request counts against. */
  bucket: string;
}

/** What a request needs from the token layer. Internal. */
export interface TokenNeed {
  /** Kind of token the endpoint accepts. */
  auth: AuthKind;
  /** Scopes that satisfy the endpoint. One of them is enough. */
  scopes?: readonly ScopeInput[] | undefined;
  /** Explicit user to act as. */
  as?: string | undefined;
  /** Raw token passed by the caller. */
  token?: string | undefined;
  /** User named by the request itself (broadcaster, moderator...). */
  contextId?: string | undefined;
  /** The request has a field for the acting user and the caller left it empty. */
  contextMissing?: boolean | undefined;
  /** The endpoint answers more to a user token: use the only registered user when there is one. */
  preferUser?: boolean | undefined;
  /** Human readable name of the call, for error messages. */
  what: string;
}

/** Options of {@link Auth.authorizeUrl}. */
export interface AuthorizeUrlOptions {
  /** Where Twitch sends the user back. Must match a redirect URL registered for your app. */
  redirectUri: string;
  /** Scopes to request. */
  scopes?: readonly ScopeInput[];
  /** Opaque value echoed back to your redirect URL. Use it to prevent CSRF. */
  state?: string;
  /** Forces the consent screen even if the user already authorized your app. */
  forceVerify?: boolean;
  /** `"code"` (default) for the authorization code flow, `"token"` for the implicit flow. */
  responseType?: "code" | "token";
}

/** An in-progress device code authorization. */
export interface DeviceFlow {
  /** Code the user types on the verification page. */
  userCode: string;
  /** Page the user must open. The code is already filled in. */
  verificationUri: string;
  /** Raw device code. You rarely need it. */
  deviceCode: string;
  /** Epoch milliseconds after which the code is no longer valid. */
  expiresAt: number;
  /** Seconds between two polls. Grows when Twitch asks to slow down. */
  interval: number;
  /** Polls Twitch until the user approves, then registers and returns the token. */
  wait(signal?: AbortSignal): Promise<UserToken>;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string[];
  token_type: string;
}

/** Internal wiring of {@link Auth}. */
export interface AuthConfig {
  /** Client ID of the application. */
  clientId: string;
  /** Client secret of the application, when there is one. */
  clientSecret?: string | undefined;
  /** Where user tokens are persisted. Memory only when absent. */
  store?: TokenStore | undefined;
  /** The `fetch` used for every OAuth request. */
  fetch: typeof fetch;
  /** Base URL of the OAuth server. */
  authUrl: string;
  /** Emitter the token events are sent to. */
  events: Emitter<TwitchEvents>;
  /** Hourly validation of user tokens, as Twitch requires. */
  validate: boolean;
  /** Milliseconds before an OAuth request is abandoned. */
  timeout: number;
  /** Retries of the OAuth requests that are safe to repeat. */
  retries: number;
}

/** Refresh a token this long before it expires. */
const EXPIRY_MARGIN = 60_000;
const HOUR = 3_600_000;

/**
 * Token management: the app token, user tokens, their renewal and the OAuth
 * flows. Reach it through `twitch.auth`.
 */
export class Auth {
  /** Client ID of your application. */
  readonly clientId: string;
  readonly #secret: string | undefined;
  readonly #store: TokenStore;
  readonly #hasStore: boolean;
  readonly #fetch: typeof fetch;
  readonly #authUrl: string;
  readonly #events: Emitter<TwitchEvents>;
  readonly #validate: boolean;
  readonly #timeout: number;
  readonly #retries: number;

  readonly #users = new Map<string, UserToken>();
  readonly #refreshing = new Map<string, Promise<UserToken>>();
  /** Bumped each time a user is removed, so a refresh in flight knows not to bring them back. */
  readonly #removals = new Map<string, number>();
  #app: { token: string; expiresAt: number } | undefined;
  #appPending: Promise<string> | undefined;
  #restored: Promise<UserToken[]> | undefined;
  #timer: ReturnType<typeof setInterval> | undefined;

  /** @internal */
  constructor(config: AuthConfig) {
    this.clientId = config.clientId;
    this.#secret = config.clientSecret;
    this.#hasStore = config.store !== undefined;
    this.#store = config.store ?? new MemoryTokenStore();
    this.#fetch = config.fetch;
    this.#authUrl = config.authUrl.replace(/\/+$/, "");
    this.#events = config.events;
    this.#validate = config.validate;
    this.#timeout = config.timeout;
    this.#retries = config.retries;
  }

  /** Whether a client secret was provided, which is what app tokens need. */
  get hasSecret(): boolean {
    return this.#secret !== undefined;
  }

  /** Users whose token is currently loaded. */
  get users(): UserToken[] {
    return [...this.#users.values()];
  }

  /** Returns the loaded token of `userId`. */
  getUser(userId: string): UserToken | undefined {
    return this.#users.get(userId);
  }

  /** Whether a token is loaded for `userId`. */
  hasUser(userId: string): boolean {
    return this.#users.has(userId);
  }

  /**
   * Registers a user token. Missing details (owner, scopes, expiry) are looked
   * up from Twitch, and an expired access token is renewed on the spot when a
   * refresh token is provided.
   *
   * @example
   * const user = await twitch.auth.addUser({ accessToken, refreshToken });
   * console.log(user.userId, user.scopes);
   */
  async addUser(input: UserTokenInput): Promise<UserToken> {
    let accessToken = input.accessToken;
    let refreshToken = input.refreshToken;
    let expiresAt =
      input.expiresAt instanceof Date
        ? input.expiresAt.getTime()
        : (input.expiresAt ?? (input.expiresIn ? Date.now() + input.expiresIn * 1000 : undefined));
    let userId = input.userId;
    let login = input.login;
    let scopes = input.scopes ? [...input.scopes] : undefined;

    if (!userId || !scopes) {
      let info: TokenInfo;
      try {
        info = await this.validate(accessToken);
      } catch (error) {
        if (!(error instanceof TwitchApiError) || error.status !== 401 || !refreshToken) throw error;
        const fresh = await this.#requestRefresh(refreshToken);
        accessToken = fresh.access_token;
        refreshToken = fresh.refresh_token ?? refreshToken;
        expiresAt = fresh.expires_in ? Date.now() + fresh.expires_in * 1000 : undefined;
        info = await this.validate(accessToken);
      }
      if (!info.userId) {
        throw new TwitchAuthError("This is an app access token, not a user access token.");
      }
      if (info.clientId !== this.clientId) {
        throw new TwitchAuthError(
          `This token was issued to another application (client ID ${info.clientId}), so it cannot be used with client ID ${this.clientId}.`,
          { userId: info.userId },
        );
      }
      userId = info.userId;
      login = info.login ?? login;
      scopes = info.scopes;
      expiresAt ??= info.expiresAt;
    }

    const token: UserToken = { userId, accessToken, scopes };
    if (login) token.login = login;
    if (refreshToken) token.refreshToken = refreshToken;
    if (expiresAt !== undefined) token.expiresAt = expiresAt;
    await this.#save(token);
    return token;
  }

  /**
   * Forgets a user. Pass `{ revoke: true }` to also invalidate the access
   * token on Twitch's side.
   */
  async removeUser(userId: string, options: { revoke?: boolean } = {}): Promise<void> {
    const token = this.#users.get(userId);
    this.#removals.set(userId, (this.#removals.get(userId) ?? 0) + 1);
    this.#users.delete(userId);
    await this.#store.delete(userId);
    if (options.revoke && token) await this.revoke(token.accessToken).catch(() => {});
    if (this.#users.size === 0) this.#stopTimer();
  }

  /**
   * Loads every token saved in the store. Runs by itself before the first
   * request when you provided a store, so calling it is optional.
   */
  restore(): Promise<UserToken[]> {
    return (this.#restored ??= (async () => {
      const ids = (await this.#store.list?.()) ?? [];
      const loaded: UserToken[] = [];
      for (const id of ids) {
        if (this.#users.has(id)) continue;
        const token = await this.#store.get(id);
        if (token) {
          this.#users.set(id, token);
          loaded.push(token);
        }
      }
      if (this.#users.size > 0) this.#startTimer();
      return loaded;
    })().catch((error: unknown) => {
      // A store that failed once must get another chance on the next call.
      this.#restored = undefined;
      throw error;
    }));
  }

  /**
   * Builds the URL to send a user to so they can authorize your app.
   *
   * @example
   * const url = twitch.auth.authorizeUrl({
   *   redirectUri: "http://localhost:3000/callback",
   *   scopes: ["user:read:chat", "user:write:chat"],
   *   state,
   * });
   */
  authorizeUrl(options: AuthorizeUrlOptions): string {
    const params = new URLSearchParams({
      response_type: options.responseType ?? "code",
      client_id: this.clientId,
      redirect_uri: options.redirectUri,
      scope: (options.scopes ?? []).join(" "),
    });
    if (options.state) params.set("state", options.state);
    if (options.forceVerify) params.set("force_verify", "true");
    return `${this.#authUrl}/authorize?${params}`;
  }

  /**
   * Finishes the authorization code flow: trades the `code` Twitch sent to
   * your redirect URL for tokens, and registers the user.
   */
  async exchangeCode(code: string, redirectUri: string): Promise<UserToken> {
    const response = await this.#form<TokenResponse>("/token", {
      client_id: this.clientId,
      client_secret: this.#requireSecret("exchange an authorization code"),
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });
    return this.#fromResponse(response);
  }

  /**
   * Starts the device code flow, the one to use for CLIs, desktop apps and
   * anything that cannot receive a redirect. Works without a client secret.
   *
   * @example
   * const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat"] });
   * console.log(`Open ${flow.verificationUri}`);
   * const user = await flow.wait();
   */
  async deviceFlow(options: { scopes: readonly ScopeInput[] }): Promise<DeviceFlow> {
    const scopes = options.scopes.join(" ");
    const start = await this.#form<{
      device_code: string;
      expires_in: number;
      interval: number;
      user_code: string;
      verification_uri: string;
    }>("/device", { client_id: this.clientId, scopes });
    const expiresAt = Date.now() + start.expires_in * 1000;
    let interval = start.interval;

    const wait = async (signal?: AbortSignal): Promise<UserToken> => {
      while (Date.now() < expiresAt) {
        await sleep(interval * 1000, signal);
        try {
          const response = await this.#form<TokenResponse>("/token", {
            client_id: this.clientId,
            ...(this.#secret ? { client_secret: this.#secret } : {}),
            scopes,
            device_code: start.device_code,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          });
          return await this.#fromResponse(response);
        } catch (error) {
          // A check that could not reach Twitch costs nothing: the next one asks again.
          if (error instanceof TwitchNetworkError || error instanceof TwitchTimeoutError) continue;
          if (!(error instanceof TwitchApiError) || error.status !== 400) throw error;
          if (/slow_down/i.test(error.message)) interval += 5;
          else if (!/authorization_pending/i.test(error.message)) throw error;
        }
      }
      throw new TwitchAuthError("The device code expired before the user approved the request.");
    };

    return {
      userCode: start.user_code,
      verificationUri: start.verification_uri,
      deviceCode: start.device_code,
      expiresAt,
      get interval() {
        return interval;
      },
      wait,
    };
  }

  /** Renews the access token of `userId` right now. Concurrent calls share one request. */
  refresh(userId: string): Promise<UserToken> {
    const pending = this.#refreshing.get(userId);
    if (pending) return pending;
    const run = (async () => {
      const removals = this.#removals.get(userId) ?? 0;
      const memory = this.#users.get(userId);
      const stored = this.#hasStore ? await this.#store.get(userId) : undefined;
      if (memory && stored && stored.accessToken !== memory.accessToken) {
        // Another process sharing the store already renewed it: take its token instead of spending ours.
        this.#users.set(userId, stored);
        return stored;
      }
      const current = memory ?? stored ?? (await this.#store.get(userId));
      if (!current) throw new TwitchAuthError(`No token is registered for user ${userId}.`, { userId });
      if (!current.refreshToken) {
        throw new TwitchAuthError(
          `The access token of user ${userId} expired and there is no refresh token to renew it.`,
          { userId },
        );
      }
      let response: TokenResponse;
      try {
        response = await this.#requestRefresh(current.refreshToken);
      } catch (error) {
        // Only a refresh token Twitch calls invalid is lost for good. Anything else may be temporary.
        if (error instanceof TwitchApiError && error.status < 500 && /invalid refresh token/i.test(error.message)) {
          // A single use refresh token may have been spent by another process a moment ago.
          const latest = this.#hasStore ? await this.#store.get(userId) : undefined;
          if (latest && latest.refreshToken !== current.refreshToken) {
            this.#users.set(userId, latest);
            return latest;
          }
          const dead = new TwitchAuthError(
            `Twitch rejected the refresh token of user ${userId}: ${error.message}. The user has to authorize the app again.`,
            { cause: error, userId },
          );
          await this.#drop(userId, dead);
          throw dead;
        }
        throw error;
      }
      const token: UserToken = {
        ...current,
        accessToken: response.access_token,
        refreshToken: response.refresh_token ?? current.refreshToken,
        scopes: response.scope ?? current.scopes,
      };
      if (response.expires_in) token.expiresAt = Date.now() + response.expires_in * 1000;
      else delete token.expiresAt;
      if ((this.#removals.get(userId) ?? 0) !== removals) {
        throw new TwitchAuthError(`User ${userId} was removed while their token was being renewed.`, { userId });
      }
      await this.#save(token);
      this.#events.emit("tokenRefresh", token);
      return token;
    })().finally(() => this.#refreshing.delete(userId));
    this.#refreshing.set(userId, run);
    return run;
  }

  /** Asks Twitch whether a token is valid and who it belongs to. Throws a 401 {@link TwitchApiError} when it is not. */
  async validate(token: string): Promise<TokenInfo> {
    const url = `${this.#authUrl}/validate`;
    const response = await this.#send("GET", url, { headers: { Authorization: `OAuth ${token}` } }, true);
    const body = (await response.json().catch(() => undefined)) as
      | { client_id: string; login?: string; user_id?: string; scopes?: string[] | null; expires_in?: number; message?: string }
      | undefined;
    if (!response.ok || !body) {
      throw new TwitchApiError(body?.message ?? `Token validation failed with status ${response.status}`, {
        status: response.status,
        method: "GET",
        url,
        body,
        headers: response.headers,
      });
    }
    const info: TokenInfo = {
      clientId: body.client_id,
      userId: body.user_id || null,
      login: body.login || null,
      scopes: body.scopes ?? [],
      expiresIn: body.expires_in ?? 0,
    };
    if (body.expires_in) info.expiresAt = Date.now() + body.expires_in * 1000;
    return info;
  }

  /** Invalidates an access token on Twitch's side. */
  async revoke(token: string): Promise<void> {
    await this.#form("/revoke", { client_id: this.clientId, token });
  }

  /** Returns a valid app access token, requesting or renewing it when needed. */
  appToken(): Promise<string> {
    if (this.#app && this.#app.expiresAt - EXPIRY_MARGIN > Date.now()) return Promise.resolve(this.#app.token);
    return (this.#appPending ??= (async () => {
      const response = await this.#form<TokenResponse>(
        "/token",
        {
          client_id: this.clientId,
          client_secret: this.#requireSecret("get an app access token"),
          grant_type: "client_credentials",
        },
        true,
      );
      this.#app = {
        token: response.access_token,
        expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
      };
      return response.access_token;
    })().finally(() => {
      this.#appPending = undefined;
    }));
  }

  /**
   * Validates every loaded user token now. Runs hourly by itself, which is
   * what Twitch asks of apps that keep user sessions.
   */
  async validateAll(): Promise<void> {
    await Promise.all(
      [...this.#users.values()].map(async (user) => {
        try {
          const info = await this.validate(user.accessToken);
          const current = this.#users.get(user.userId);
          if (!current || current.accessToken !== user.accessToken) return;
          current.scopes = info.scopes;
          if (info.expiresAt !== undefined) current.expiresAt = info.expiresAt;
        } catch (error) {
          if (!(error instanceof TwitchApiError) || error.status !== 401) return;
          if (user.refreshToken) await this.refresh(user.userId).catch(() => {});
          else await this.#drop(user.userId, new TwitchAuthError(`The token of user ${user.userId} is no longer valid.`, { cause: error, userId: user.userId }));
        }
      }),
    );
  }

  /** Stops the hourly validation timer. Called by `twitch.close()`. */
  close(): void {
    this.#stopTimer();
  }

  /** @internal Picks the token for one request. */
  async resolve(need: TokenNeed): Promise<Grant> {
    if (need.token) return { token: need.token, kind: "raw", bucket: `raw:${fingerprint(need.token)}` };
    // "app" asks for the app token on an endpoint that would otherwise pick a user's.
    if (need.as === "app") {
      if (need.auth === "user") {
        throw new TwitchAuthError(`${need.what} only accepts a user access token: the app token cannot be used for it.`);
      }
      return { token: await this.appToken(), kind: "app", bucket: "app" };
    }
    if (this.#hasStore) await this.restore();

    // An endpoint that only takes the app token gets it, whoever the client acts as.
    if (need.as && need.auth !== "app") return this.#userGrant(need.as, need);

    if (need.auth !== "app") {
      if (need.contextId && (await this.#known(need.contextId))) return this.#userGrant(need.contextId, need);
      if (need.auth === "user") {
        const sole = this.#sole();
        if (sole) return this.#userGrant(sole, need);
        throw new TwitchAuthError(
          this.#users.size === 0
            ? `${need.what} needs a user access token and no user is registered. Add one with twitch.auth.addUser().`
            : need.contextId
              ? `${need.what} needs the token of user ${need.contextId}, which is not registered. Add it with twitch.auth.addUser() or choose a user with { as: userId }.`
              : `${need.what} needs a user access token and several users are registered. Choose one with { as: userId } or twitch.as(userId).`,
        );
      }
      // The caller did not say who is acting and only one user is known: that is who.
      if (need.contextMissing || need.preferUser) {
        const sole = this.#sole();
        if (sole) return this.#userGrant(sole, need);
      }
    }

    if (this.#secret) return { token: await this.appToken(), kind: "app", bucket: "app" };
    if (need.auth === "any") {
      const sole = this.#sole();
      if (sole) return this.#userGrant(sole, need);
    }
    if (need.auth === "any" && this.#users.size > 1) {
      throw new TwitchAuthError(
        `${need.what} can use a user token, but several users are registered. Choose one with { as: userId } or twitch.as(userId).`,
      );
    }
    throw new TwitchAuthError(
      `${need.what} needs an app access token, which requires a clientSecret${need.auth === "any" ? " (or a registered user token)" : ""}.`,
    );
  }

  /**
   * @internal Called after a 401. Resolves with a fresh grant to retry with,
   * or `null` when the token is fine and the 401 is about something else.
   */
  async renew(grant: Grant): Promise<Grant | null> {
    if (grant.kind === "raw") return null;

    // Another request may already have renewed it.
    if (grant.kind === "app" && this.#app && this.#app.token !== grant.token) {
      return { ...grant, token: this.#app.token };
    }
    const user = grant.userId ? this.#users.get(grant.userId) : undefined;
    if (user && user.accessToken !== grant.token) return { ...grant, token: user.accessToken };

    // Twitch also answers 401 to a valid token that is not allowed to do this
    // (wrong broadcaster, missing scope). Only a dead token is worth renewing.
    try {
      await this.validate(grant.token);
      return null;
    } catch (error) {
      if (!(error instanceof TwitchApiError) || error.status !== 401) return null;
    }

    if (grant.kind === "app") {
      if (this.#app?.token === grant.token) this.#app = undefined;
      return { ...grant, token: await this.appToken() };
    }
    const userId = grant.userId!;
    if (user && !user.refreshToken) {
      const dead = new TwitchAuthError(
        `The access token of user ${userId} is no longer valid and there is no refresh token to renew it. The user has to authorize the app again.`,
        { userId },
      );
      await this.#drop(userId, dead);
      throw dead;
    }
    return { ...grant, token: (await this.refresh(userId)).accessToken };
  }

  async #userGrant(userId: string, need: TokenNeed): Promise<Grant> {
    let token = this.#users.get(userId);
    if (!token) {
      if (!(await this.#known(userId))) {
        throw new TwitchAuthError(
          `No token is registered for user ${userId}. Add it with twitch.auth.addUser().`,
          { userId },
        );
      }
      token = this.#users.get(userId)!;
    }
    if (token.expiresAt !== undefined && token.expiresAt - EXPIRY_MARGIN <= Date.now() && token.refreshToken) {
      token = await this.refresh(userId);
    }
    if (need.scopes?.length && !need.scopes.some((scope) => token.scopes.includes(scope))) {
      throw new TwitchScopeError(userId, need.scopes, token.scopes, need.what);
    }
    return { token: token.accessToken, kind: "user", userId, bucket: `user:${userId}` };
  }

  /** Whether a token exists for `userId`, loading it from the store if needed. */
  async #known(userId: string): Promise<boolean> {
    if (this.#users.has(userId)) return true;
    if (!this.#hasStore) return false;
    const token = await this.#store.get(userId);
    if (!token) return false;
    this.#users.set(userId, token);
    this.#startTimer();
    return true;
  }

  #sole(): string | undefined {
    if (this.#users.size !== 1) return undefined;
    return this.#users.keys().next().value;
  }

  async #save(token: UserToken): Promise<void> {
    this.#users.set(token.userId, token);
    await this.#store.set(token.userId, token);
    this.#startTimer();
  }

  async #drop(userId: string, error: Error): Promise<void> {
    this.#users.delete(userId);
    await Promise.resolve(this.#store.delete(userId)).catch(() => {});
    if (this.#users.size === 0) this.#stopTimer();
    this.#events.emit("tokenInvalid", userId, error);
  }

  async #fromResponse(response: TokenResponse): Promise<UserToken> {
    const input: UserTokenInput = { accessToken: response.access_token };
    if (response.refresh_token) input.refreshToken = response.refresh_token;
    if (response.expires_in) input.expiresIn = response.expires_in;
    return this.addUser(input);
  }

  #requestRefresh(refreshToken: string): Promise<TokenResponse> {
    return this.#form<TokenResponse>("/token", {
      client_id: this.clientId,
      ...(this.#secret ? { client_secret: this.#secret } : {}),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
  }

  #requireSecret(action: string): string {
    if (!this.#secret) throw new TwitchAuthError(`A clientSecret is required to ${action}.`);
    return this.#secret;
  }

  /** Sends a form encoded POST to the OAuth server. Credentials travel in the body, never in the URL. */
  async #form<T>(path: string, params: Record<string, string>, repeatable = false): Promise<T> {
    const url = `${this.#authUrl}${path}`;
    const response = await this.#send(
      "POST",
      url,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params).toString() },
      repeatable,
    );
    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    if (!response.ok) {
      const message =
        (body as { message?: string } | undefined)?.message ?? `OAuth request failed with status ${response.status}`;
      throw new TwitchApiError(message, {
        status: response.status,
        method: "POST",
        url,
        body,
        headers: response.headers,
      });
    }
    return body as T;
  }

  /**
   * Sends one OAuth request with the client's timeout, and turns a failure to
   * reach Twitch into a typed error. Only requests that are safe to repeat
   * (validation, the app token) are retried: a refresh token may be single use.
   */
  async #send(method: string, url: string, init: RequestInit, repeatable: boolean): Promise<Response> {
    const what = `${method} ${new URL(url).pathname}`;
    for (let attempt = 0; ; attempt++) {
      const again = repeatable && attempt < this.#retries;
      try {
        const response = await this.#fetch(url, { ...init, method, signal: AbortSignal.timeout(this.#timeout) });
        if (response.status < 500 || !again) return response;
      } catch (error) {
        if (!again) {
          if (error instanceof Error && error.name === "TimeoutError") {
            throw new TwitchTimeoutError(`${what} timed out after ${this.#timeout} ms.`, { cause: error });
          }
          throw new TwitchNetworkError(`${what} could not reach Twitch: ${(error as Error).message}`, { cause: error });
        }
      }
      await sleep(backoff(attempt));
    }
  }

  #startTimer(): void {
    if (!this.#validate || this.#timer) return;
    this.#timer = unref(setInterval(() => void this.validateAll(), HOUR));
  }

  #stopTimer(): void {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = undefined;
  }
}
