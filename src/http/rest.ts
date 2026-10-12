import type { Auth, AuthKind, Grant } from "../auth/manager.js";
import type { Scope, ScopeInput } from "../auth/scopes.js";
import { TwitchApiError, TwitchAuthError, TwitchError, TwitchNetworkError, TwitchRateLimitError, TwitchTimeoutError } from "../errors.js";
import type { TwitchEvents } from "../events.js";
import { backoff, chunk, type Emitter, sleep } from "../util.js";
import { type PageResult, Paginator } from "./pagination.js";
import type { RateLimiter } from "./rate-limit.js";

/** HTTP methods used by the Twitch API. */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Options accepted as the last argument of every API method. */
export interface RequestOptions {
  /**
   * Make the call as this user. The user must have been registered with
   * `twitch.auth.addUser()`. Overrides the automatic choice of token. Pass
   * `"app"` to use the app token on an endpoint that accepts both kinds.
   */
  as?: "app" | (string & {});
  /** Use this access token as is, without any token management. */
  token?: string;
  /** Cancels the call, including its retries and rate limit waits. */
  signal?: AbortSignal;
  /** Milliseconds before one attempt is abandoned. Overrides the client setting. */
  timeout?: number;
  /** Number of retries after the first attempt. Overrides the client setting. */
  retries?: number;
}

/** Description of one API call. Every method of the API groups builds one of these. */
export interface Endpoint {
  /** Defaults to `GET`. */
  method?: HttpMethod;
  /** Path under the Helix base URL, without a leading slash. Example: `"chat/settings"`. */
  path: string;
  /** Query string parameters. Arrays repeat the key, `undefined` and `null` are skipped. */
  query?: object | undefined;
  /** JSON body. */
  body?: object | undefined;
  /** Kind of token the endpoint accepts. Defaults to `"any"`. */
  auth?: AuthKind;
  /**
   * For endpoints that accept both kinds of token but answer more to a user:
   * `"user"` picks the only registered user when there is one, and falls back
   * to the app token otherwise.
   */
  prefer?: "user";
  /** Scopes that satisfy the endpoint when a user token is used. One of them is enough. */
  scopes?: readonly ScopeInput[];
  /**
   * Name of the parameter that holds the acting user (`"broadcaster_id"`,
   * `"moderator_id"`, `"user_id"`...). It selects whose token is used, and when
   * the caller leaves it out it is filled with the ID of the token's owner.
   * A plain string points into the query, `{ body: name }` into the body.
   */
  context?: string | { body: string };
  /** Per call options forwarded from the public method. */
  options?: RequestOptions | undefined;
  /** How to read the response. Defaults to `"json"`. */
  response?: "json" | "text";
}

/**
 * An endpoint as the API groups of the library describe it: the same thing,
 * with scopes limited to the known ones so that a typo cannot slip in.
 * Internal.
 */
export interface KnownEndpoint extends Endpoint {
  /** Scopes that satisfy the endpoint when a user token is used. One of them is enough. */
  scopes?: readonly Scope[];
}

/** How a paginated endpoint lays out its pages. Only needed when it differs from the usual shape. */
export interface PageConfig<T, R> {
  /** Largest `first` the endpoint accepts. Defaults to 100. */
  max?: number;
  /** Pulls the items, the next cursor and the total out of a response body. */
  extract?: (body: R) => { data: T[] | null | undefined; cursor?: string | undefined; total?: number | undefined };
  /** Name of the page size parameter. Defaults to `"first"`. `null` when the endpoint has none. */
  sizeParam?: string | null;
}

/** Settings shared by every view of the REST client. Internal. */
export interface RestConfig {
  /** Token manager that picks the token of each request. */
  auth: Auth;
  /** Rate limiter shared by every request of the client. */
  limiter: RateLimiter;
  /** Emitter the request events are sent to. */
  events: Emitter<TwitchEvents>;
  /** The `fetch` used for every Helix request. */
  fetch: typeof fetch;
  /** Base URL of the Helix API, without a trailing slash. */
  baseUrl: string;
  /** Milliseconds before one attempt is abandoned. */
  timeout: number;
  /** Retries after the first attempt. */
  retries: number;
  /** Whether to wait or to throw when a bucket is empty. */
  rateLimit: "wait" | "throw";
  /** Value of the `User-Agent` header, when set. */
  userAgent?: string | undefined;
  /** What `twitch.close()` has to shut down besides the token timers. */
  closers: Set<() => void>;
}

type Dict = Record<string, unknown>;

/** Serialises a query object the way Twitch expects: repeated keys for lists, no commas. */
export function buildQuery(query: object | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) if (item !== undefined && item !== null) params.append(key, format(item));
    } else {
      params.append(key, format(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

function format(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

const IDEMPOTENT = new Set<string>(["GET", "PUT", "DELETE"]);

/**
 * The request pipeline behind every API method: picks the token, respects the
 * rate limit, retries what can be retried and turns failures into typed errors.
 */
export class Rest {
  readonly #config: RestConfig;
  readonly #as: string | undefined;

  /** @internal */
  constructor(config: RestConfig, as?: string) {
    this.#config = config;
    this.#as = as;
  }

  /** Registers something to shut down when the client is closed. */
  onClose(close: () => void): void {
    this.#config.closers.add(close);
  }

  /** Returns a view of this client that acts as `userId` by default. */
  withUser(userId: string): Rest {
    return new Rest(this.#config, userId);
  }

  /** Sends a request and resolves with the parsed body (`undefined` for an empty response). */
  async request<T = unknown>(endpoint: KnownEndpoint): Promise<T> {
    const config = this.#config;
    const method = endpoint.method ?? "GET";
    const options = endpoint.options ?? {};
    const what = `${method} /${endpoint.path}`;
    const query: Dict = { ...(endpoint.query as Dict | undefined) };
    const body: Dict | undefined = endpoint.body ? { ...(endpoint.body as Dict) } : undefined;

    const context = endpoint.context;
    const contextKey = typeof context === "string" ? context : context?.body;
    const contextBag = typeof context === "string" ? query : body;
    const contextValue = contextKey ? contextBag?.[contextKey] : undefined;

    let grant = await config.auth.resolve({
      auth: endpoint.auth ?? "any",
      scopes: endpoint.scopes,
      as: options.as ?? this.#as,
      token: options.token,
      contextId: typeof contextValue === "string" ? contextValue : undefined,
      contextMissing: contextKey !== undefined && (contextValue === undefined || contextValue === null),
      preferUser: endpoint.prefer === "user",
      what,
    });

    if (contextKey && contextBag && (contextValue === undefined || contextValue === null)) {
      if (grant.userId) contextBag[contextKey] = grant.userId;
      else if (grant.kind === "raw") {
        throw new TwitchAuthError(`${what} needs "${contextKey}": a token passed by hand does not say who it belongs to.`);
      } else if (config.auth.users.length > 1) {
        throw new TwitchAuthError(
          `${what} does not say who is acting and several users are registered. Set "${contextKey}", or choose a user with { as: userId } or twitch.as(userId).`,
        );
      } else {
        throw new TwitchAuthError(
          `${what} needs "${contextKey}": the call is made with the app token, which belongs to no user. Set "${contextKey}", or register the acting user with twitch.auth.addUser().`,
        );
      }
    }

    const url = `${config.baseUrl}/${endpoint.path}${buildQuery(query)}`;
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const retries = options.retries ?? config.retries;
    const timeout = options.timeout ?? config.timeout;
    let renewed = false;

    for (let attempt = 0; ; attempt++) {
      options.signal?.throwIfAborted();
      if (config.rateLimit === "wait") await config.limiter.acquire(grant.bucket, options.signal);
      else {
        const waitMs = config.limiter.reserve(grant.bucket);
        if (waitMs > 0) {
          throw new TwitchRateLimitError(
            `Rate limit reached for ${what}.`,
            { status: 429, method, url },
            Date.now() + waitMs,
          );
        }
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${grant.token}`,
        "Client-Id": config.auth.clientId,
      };
      if (payload !== undefined) headers["Content-Type"] = "application/json";
      if (config.userAgent) headers["User-Agent"] = config.userAgent;

      const as = grant.kind === "user" ? grant.userId! : grant.kind;
      const started = Date.now();
      config.events.emit("request", { method, url, attempt: attempt + 1, as });

      let response: Response;
      let text: string;
      try {
        const signals = [AbortSignal.timeout(timeout)];
        if (options.signal) signals.push(options.signal);
        const init: RequestInit = { method, headers, signal: AbortSignal.any(signals) };
        if (payload !== undefined) init.body = payload;
        response = await config.fetch(url, init);
        // Reading the body is part of the attempt: it can time out or break like the rest.
        text = response.status === 204 ? "" : await response.text();
      } catch (error) {
        if (options.signal?.aborted) throw options.signal.reason;
        const timedOut = error instanceof Error && error.name === "TimeoutError";
        if (attempt < retries && IDEMPOTENT.has(method)) {
          await sleep(backoff(attempt), options.signal);
          continue;
        }
        if (timedOut) throw new TwitchTimeoutError(`${what} timed out after ${timeout} ms.`, { cause: error });
        throw new TwitchNetworkError(`${what} could not reach Twitch: ${(error as Error).message}`, { cause: error });
      }

      const remaining = config.limiter.update(grant.bucket, response.headers);
      const event: TwitchEvents["response"][0] = {
        method,
        url,
        attempt: attempt + 1,
        as,
        status: response.status,
        duration: Date.now() - started,
      };
      if (remaining !== undefined) event.remaining = remaining;
      config.events.emit("response", event);

      if (response.ok) {
        if (endpoint.response === "text") return text as T;
        if (!text) return undefined as T;
        try {
          return JSON.parse(text) as T;
        } catch (error) {
          throw new TwitchError(`${what} answered with a body that is not JSON.`, { cause: error });
        }
      }

      const failure = readError(response, text, method, url);

      if (response.status === 401 && !renewed) {
        renewed = true;
        const fresh = await config.auth.renew(grant);
        if (fresh) {
          grant = fresh;
          attempt--;
          continue;
        }
      }

      if (response.status === 429) {
        const reset = Number(response.headers.get("ratelimit-reset"));
        const bucketEmpty = response.headers.get("ratelimit-remaining") === "0" && reset > 0;
        const resetAt = bucketEmpty ? reset * 1000 : Date.now() + backoff(attempt, 1000, 30_000);
        if (bucketEmpty) config.limiter.exhaust(grant.bucket, resetAt);
        if (config.rateLimit === "wait" && attempt < retries) {
          if (!bucketEmpty) {
            // A limit specific to this endpoint: the shared bucket knows nothing about it.
            config.events.emit("rateLimit", { bucket: grant.bucket, waitMs: resetAt - Date.now(), resetAt });
            await sleep(Math.max(0, resetAt - Date.now()), options.signal);
          }
          continue;
        }
        throw new TwitchRateLimitError(failure.message, failure.info, resetAt);
      }

      if (response.status >= 500 && attempt < retries && IDEMPOTENT.has(method)) {
        await sleep(backoff(attempt), options.signal);
        continue;
      }

      throw new TwitchApiError(failure.message, failure.info);
    }
  }

  /** Resolves with the `data` array of the response. */
  async data<T>(endpoint: KnownEndpoint): Promise<T[]> {
    const body = await this.request<{ data?: T[] | null } | undefined>(endpoint);
    return body?.data ?? [];
  }

  /** Resolves with the first item of `data`, for endpoints that always return exactly one. */
  async one<T>(endpoint: KnownEndpoint): Promise<T> {
    const [item] = await this.data<T>(endpoint);
    if (item === undefined) {
      throw new TwitchError(`${endpoint.method ?? "GET"} /${endpoint.path} returned no data.`);
    }
    return item;
  }

  /** Resolves with the first item of `data`, or `null` when Twitch found nothing. */
  async first<T>(endpoint: KnownEndpoint): Promise<T | null> {
    const [item] = await this.data<T>(endpoint);
    return item ?? null;
  }

  /** Sends a request whose response carries nothing useful. */
  async send(endpoint: KnownEndpoint): Promise<void> {
    await this.request(endpoint);
  }

  /**
   * Like {@link Rest.data} for lookups that accept a capped list of IDs or
   * names: longer lists are split into several requests sent in parallel and
   * the results are merged, so callers never have to count.
   */
  async chunked<T>(endpoint: KnownEndpoint, keys: readonly string[], size = 100): Promise<T[]> {
    const query = { ...(endpoint.query as Dict | undefined) };
    const pairs: [string, unknown][] = [];
    for (const key of keys) {
      const value = query[key];
      if (value === undefined || value === null) continue;
      for (const item of Array.isArray(value) ? value : [value]) pairs.push([key, item]);
      delete query[key];
    }
    if (pairs.length <= size) return this.data<T>(endpoint);
    const results = await Promise.all(
      chunk(pairs, size).map((group) => {
        const part: Dict = { ...query };
        for (const [key, value] of group) ((part[key] ??= []) as unknown[]).push(value);
        return this.data<T>({ ...endpoint, query: part });
      }),
    );
    return results.flat();
  }

  /** Builds the lazy paginator returned by every list endpoint. */
  paginate<T, R = unknown>(endpoint: KnownEndpoint, config: PageConfig<T, R> = {}): Paginator<T, R> {
    const query = (endpoint.query ?? {}) as Dict;
    const sizeParam = config.sizeParam === undefined ? "first" : config.sizeParam;
    const backward = query["before"] !== undefined && query["before"] !== null;
    const cursorParam = backward ? "before" : "after";
    const size = sizeParam !== null && typeof query[sizeParam] === "number" ? (query[sizeParam] as number) : undefined;
    const extract = config.extract ?? defaultExtract<T, R>;

    const fetchPage = async (cursor: string | undefined, pageSize: number | undefined): Promise<PageResult<T, R>> => {
      const next: Dict = { ...query };
      if (cursor !== undefined) next[cursorParam] = cursor;
      if (pageSize !== undefined && sizeParam !== null) next[sizeParam] = pageSize;
      const raw = await this.request<R>({ ...endpoint, query: next });
      const { data, cursor: nextCursor, total } = extract(raw);
      return { data: data ?? [], cursor: nextCursor || undefined, total, raw };
    };

    return new Paginator<T, R>(fetchPage, size, config.max ?? 100);
  }
}

function defaultExtract<T, R>(body: R): { data: T[] | null | undefined; cursor?: string | undefined; total?: number | undefined } {
  const shape = (body ?? {}) as { data?: T[] | null; pagination?: { cursor?: string } | string | null; total?: number };
  const cursor = typeof shape.pagination === "string" ? shape.pagination : shape.pagination?.cursor;
  return { data: shape.data, cursor, total: shape.total ?? undefined };
}

function readError(
  response: Response,
  text: string,
  method: string,
  url: string,
): { message: string; info: ConstructorParameters<typeof TwitchApiError>[1] } {
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    // Not JSON: keep the raw text.
  }
  const shape = (typeof body === "object" && body !== null ? body : {}) as { message?: string; error?: string };
  const message = shape.message || shape.error || (typeof body === "string" && body) || response.statusText || "Request failed";
  const info: ConstructorParameters<typeof TwitchApiError>[1] = {
    status: response.status,
    method,
    url,
    body,
    headers: response.headers,
  };
  if (shape.error) info.error = shape.error;
  return { message: `${message} (${response.status} on ${method} ${new URL(url).pathname})`, info };
}
