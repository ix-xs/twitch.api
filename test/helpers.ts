import { SCOPES, Twitch, type TwitchOptions } from "../src/index.js";

/** One request captured by the fake `fetch`. */
export interface RecordedCall {
  method: string;
  /** Path under `/helix/`, without the query string. */
  path: string;
  /** Query parameters. A key that appears several times becomes an array. */
  query: Record<string, string | string[]>;
  /** Parsed JSON body, when there was one. */
  body: unknown;
  headers: Record<string, string>;
  /** The bearer token the request was sent with. */
  token: string;
  url: URL;
}

export interface MockReply {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface AuthCall {
  path: string;
  method: string;
  params: URLSearchParams;
  headers: Record<string, string>;
}

export interface TestClient {
  twitch: Twitch;
  /** Helix requests, in the order they were sent. OAuth requests are not listed here. */
  calls: RecordedCall[];
  /** Requests sent to the OAuth server. */
  authCalls: AuthCall[];
  /** Queues the answer to the next Helix request. Without one, `{ data: [] }` is returned. */
  reply(body?: unknown, init?: Omit<MockReply, "body">): void;
  /** Queues the answer to the next OAuth request, ahead of the built-in ones. */
  replyAuth(body: unknown, status?: number): void;
  /** The most recent Helix request. */
  last(): RecordedCall;
  /** Registers a user without any network call. Every scope is granted unless you list some. */
  addUser(userId?: string, scopes?: readonly string[]): Promise<void>;
}

/**
 * A client wired to a fake `fetch`. The app token is `"app-token"`, user
 * tokens are `"token-of-<userId>"`.
 */
export function createTestClient(options: Partial<TwitchOptions> = {}): TestClient {
  const calls: RecordedCall[] = [];
  const authCalls: AuthCall[] = [];
  const queue: MockReply[] = [];
  const authQueue: { body: unknown; status: number }[] = [];

  const fakeFetch = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    const method = init.method ?? "GET";
    const headers = { ...((init.headers ?? {}) as Record<string, string>) };

    if (url.hostname === "id.twitch.tv") {
      const params = new URLSearchParams(typeof init.body === "string" ? init.body : "");
      authCalls.push({ path: url.pathname.replace("/oauth2", ""), method, params, headers });
      const queued = authQueue.shift();
      if (queued) return json(queued.body, queued.status);
      if (url.pathname.endsWith("/token")) {
        const grant = params.get("grant_type");
        if (grant === "client_credentials") {
          return json({ access_token: "app-token", expires_in: 5_000_000, token_type: "bearer" });
        }
        if (grant === "refresh_token") {
          return json({
            access_token: `refreshed-${params.get("refresh_token")}`,
            refresh_token: `${params.get("refresh_token")}+`,
            expires_in: 14_400,
            token_type: "bearer",
          });
        }
      }
      // Unless a test says otherwise, a token Helix rejected is a dead token.
      if (url.pathname.endsWith("/validate")) return json({ status: 401, message: "invalid access token" }, 401);
      return json({ status: 404, message: "not mocked" }, 404);
    }

    const query: Record<string, string | string[]> = {};
    for (const [key, value] of url.searchParams) {
      const current = query[key];
      if (current === undefined) query[key] = value;
      else if (Array.isArray(current)) current.push(value);
      else query[key] = [current, value];
    }
    calls.push({
      method,
      path: url.pathname.replace(/^\/helix\//, ""),
      query,
      body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
      headers,
      token: (headers["Authorization"] ?? "").replace("Bearer ", ""),
      url,
    });
    const next = queue.shift() ?? { body: { data: [] } };
    return json(next.body, next.status ?? (next.body === undefined ? 204 : 200), next.headers);
  }) as typeof fetch;

  const twitch = new Twitch({
    clientId: "client-id",
    clientSecret: "client-secret",
    fetch: fakeFetch,
    validateTokens: false,
    ...options,
  });

  return {
    twitch,
    calls,
    authCalls,
    reply(body, init = {}) {
      queue.push({ ...init, body });
    },
    replyAuth(body, status = 200) {
      authQueue.push({ body, status });
    },
    last() {
      const call = calls.at(-1);
      if (!call) throw new Error("No request was sent.");
      return call;
    },
    async addUser(userId = "100", scopes = SCOPES) {
      await twitch.auth.addUser({
        accessToken: `token-of-${userId}`,
        refreshToken: `refresh-of-${userId}`,
        userId,
        scopes,
        expiresIn: 14_400,
      });
    },
  };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  if (status === 204 || body === undefined) return new Response(null, { status: status === 200 ? 204 : status, headers });
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
