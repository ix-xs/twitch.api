import { describe, expect, it } from "vitest";
import {
  Twitch,
  TwitchApiError,
  TwitchAuthError,
  TwitchError,
  TwitchNetworkError,
  MemoryTokenStore,
  type RateLimitEvent,
  type TokenStore,
  type UserToken,
} from "../../src/index.js";
import { createTestClient } from "../helpers.js";

describe("401 that is not about the token", () => {
  it("does not refresh a healthy token and raises Twitch's own message", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ error: "Unauthorized", status: 401, message: "The ID in broadcaster_id must match the user ID in the token" }, { status: 401 });
    t.replyAuth({ client_id: "client-id", user_id: "100", login: "bot", scopes: [], expires_in: 1000 });
    const error = await t.twitch.users.blocks({ broadcaster_id: "999" }).then(undefined, (e: unknown) => e);
    expect(error).toBeInstanceOf(TwitchApiError);
    expect((error as TwitchApiError).message).toContain("must match");
    expect(t.calls).toHaveLength(1);
    expect(t.authCalls.filter((call) => call.params.get("grant_type") === "refresh_token")).toHaveLength(0);
    expect(t.twitch.auth.getUser("100")?.accessToken).toBe("token-of-100");
  });

  it("drops a dead token that has no refresh token and says so", async () => {
    const t = createTestClient();
    await t.twitch.auth.addUser({ accessToken: "a", userId: "100", scopes: [] });
    const invalid: string[] = [];
    t.twitch.on("tokenInvalid", (userId) => invalid.push(userId));
    t.reply({ message: "Invalid OAuth token" }, { status: 401 });
    await expect(t.twitch.users.me()).rejects.toBeInstanceOf(TwitchAuthError);
    expect(invalid).toEqual(["100"]);
    expect(t.twitch.auth.hasUser("100")).toBe(false);
  });

  it("keeps the user when a refresh fails for a reason other than an invalid refresh token", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.replyAuth({ status: 400, message: "missing client secret" }, 400);
    await expect(t.twitch.auth.refresh("100")).rejects.toBeInstanceOf(TwitchApiError);
    expect(t.twitch.auth.hasUser("100")).toBe(true);
  });
});

describe("choice of token, edge cases", () => {
  it("keeps the app token on app-only endpoints inside an as() view", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.twitch.as("100").conduits.list();
    expect(t.last().token).toBe("app-token");
    await t.twitch.conduits.list({ as: "100" });
    expect(t.last().token).toBe("app-token");
  });

  it("never puts a raw token in a bucket name", async () => {
    const t = createTestClient();
    const events: RateLimitEvent[] = [];
    t.twitch.on("rateLimit", (event) => events.push(event));
    const reset = String(Math.floor(Date.now() / 1000) + 1);
    t.reply({ message: "Too Many Requests" }, { status: 429, headers: { "Ratelimit-Limit": "800", "Ratelimit-Remaining": "0", "Ratelimit-Reset": reset } });
    t.reply({ data: [] });
    await t.twitch.request({ path: "users", options: { token: "abcdefghijklmnopqrstuvwxyz1234" } });
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.bucket).toMatch(/^raw:[0-9a-f]{8}$/);
      expect("abcdefghijklmnopqrstuvwxyz1234").not.toContain(event.bucket.slice(4));
    }
  });
});

describe("forcing the app token", () => {
  it("uses the app token with { as: \"app\" } even when the acting user is registered", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.twitch.request({
      method: "POST",
      path: "chat/messages",
      body: { broadcaster_id: "1", sender_id: "100", message: "hi" },
      context: { body: "sender_id" },
      options: { as: "app" },
    });
    expect(t.last().token).toBe("app-token");
    await t.twitch.as("app").users.get({ id: "1" });
    expect(t.last().token).toBe("app-token");
  });

  it("still refuses the app token on a user-only endpoint", async () => {
    const t = createTestClient();
    await expect(t.twitch.users.me({ as: "app" })).rejects.toBeInstanceOf(TwitchAuthError);
  });
});

describe("who is acting, when it cannot be guessed", () => {
  it("says so when several users are registered", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    const error = await t.twitch
      .request({ method: "POST", path: "chat/messages", body: { broadcaster_id: "1", message: "hi" }, context: { body: "sender_id" } })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TwitchAuthError);
    expect((error as Error).message).toMatch(/several users are registered/);
    expect(t.calls).toHaveLength(0);
  });

  it("says so without a client secret too", async () => {
    const t = createTestClient({ clientSecret: undefined as unknown as string });
    await t.addUser("100");
    await t.addUser("200");
    await expect(t.twitch.users.get({ id: "1" })).rejects.toThrow(/several users are registered/);
  });
});

describe("OAuth requests", () => {
  it("wrap a connection failure like every other request", async () => {
    const broken = (() => Promise.reject(new TypeError("fetch failed"))) as unknown as typeof fetch;
    const twitch = new Twitch({ clientId: "id", clientSecret: "secret", fetch: broken, retries: 0 });
    await expect(twitch.users.get({ id: "1" })).rejects.toBeInstanceOf(TwitchNetworkError);
    await expect(twitch.auth.validate("token")).rejects.toBeInstanceOf(TwitchNetworkError);
  });

  it("retry the app token request after a server error", async () => {
    let tokenCalls = 0;
    const flaky = (async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/oauth2/token")) {
        tokenCalls++;
        if (tokenCalls === 1) return new Response("{}", { status: 503 });
        return new Response(JSON.stringify({ access_token: "app", expires_in: 3600, token_type: "bearer" }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }) as typeof fetch;
    const twitch = new Twitch({ clientId: "id", clientSecret: "secret", fetch: flaky });
    await twitch.users.get({ id: "1" });
    expect(tokenCalls).toBe(2);
  });

  it("never repeat a refresh, whose token may be single use", async () => {
    let refreshCalls = 0;
    const down = (async (input: string | URL | Request) => {
      if (String(input).includes("/oauth2/token")) refreshCalls++;
      return new Response("{}", { status: 503 });
    }) as typeof fetch;
    const twitch = new Twitch({ clientId: "id", fetch: down, validateTokens: false });
    await twitch.auth.addUser({ accessToken: "a", refreshToken: "r", userId: "100", scopes: [] });
    await expect(twitch.auth.refresh("100")).rejects.toBeInstanceOf(TwitchApiError);
    expect(refreshCalls).toBe(1);
    expect(twitch.auth.hasUser("100")).toBe(true);
  });
});

describe("rate limit state", () => {
  it("forgets a window that is over", async () => {
    const t = createTestClient();
    const past = String(Math.floor(Date.now() / 1000) - 5);
    t.reply({ data: [] }, { headers: { "Ratelimit-Limit": "800", "Ratelimit-Remaining": "700", "Ratelimit-Reset": past } });
    await t.twitch.users.get({ id: "1" });
    expect(t.twitch.rateLimitOf()).toBeUndefined();
  });
});

describe("tokens that do not belong here", () => {
  it("refuses a token issued to another application", async () => {
    const t = createTestClient();
    t.replyAuth({ client_id: "someone-else", user_id: "100", login: "bot", scopes: [], expires_in: 1000 });
    await expect(t.twitch.auth.addUser({ accessToken: "foreign" })).rejects.toThrow(/another application/);
    expect(t.twitch.auth.users).toHaveLength(0);
  });
});

describe("a store shared by several processes", () => {
  it("adopts a token another process already renewed instead of refreshing again", async () => {
    const store = new MemoryTokenStore();
    const t = createTestClient({ tokens: store });
    await t.addUser("100");
    // Another process renews the token and saves it.
    store.set("100", { userId: "100", accessToken: "renewed-elsewhere", refreshToken: "next", scopes: [] });
    const token = await t.twitch.auth.refresh("100");
    expect(token.accessToken).toBe("renewed-elsewhere");
    expect(t.authCalls.filter((call) => call.params.get("grant_type") === "refresh_token")).toHaveLength(0);
  });

  it("keeps the user when its refresh token was spent by another process a moment ago", async () => {
    let reads = 0;
    const mine = { userId: "100", accessToken: "token-of-100", refreshToken: "refresh-of-100", scopes: [] as string[] };
    const theirs = { userId: "100", accessToken: "renewed-elsewhere", refreshToken: "next", scopes: [] as string[] };
    const store: TokenStore = {
      // Unchanged when the refresh starts, renewed by the time Twitch has refused ours.
      get: () => (++reads <= 1 ? mine : theirs),
      set: () => {},
      delete: () => {},
    };
    const t = createTestClient({ tokens: store });
    await t.twitch.auth.addUser({ accessToken: "token-of-100", refreshToken: "refresh-of-100", userId: "100", scopes: [] });
    t.replyAuth({ status: 400, message: "Invalid refresh token" }, 400);
    const token = await t.twitch.auth.refresh("100");
    expect(token.accessToken).toBe("renewed-elsewhere");
    expect(t.twitch.auth.hasUser("100")).toBe(true);
  });
});

describe("failures that must not stick", () => {
  it("asks the token store again after it failed once", async () => {
    let fail = true;
    const saved: UserToken = { userId: "100", accessToken: "stored", scopes: ["user:read:follows"] };
    const store: TokenStore = {
      get: () => saved,
      set: () => {},
      delete: () => {},
      list: () => {
        if (fail) throw new Error("database is down");
        return ["100"];
      },
    };
    const t = createTestClient({ tokens: store });
    await expect(t.twitch.users.get({ id: "1" })).rejects.toThrow("database is down");
    fail = false;
    await t.twitch.streams.followed();
    expect(t.last().token).toBe("stored");
  });

  it("does not bring back a user removed while their token was being renewed", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const refreshing = t.twitch.auth.refresh("100").catch((error: unknown) => error);
    await t.twitch.auth.removeUser("100");
    expect(await refreshing).toBeInstanceOf(TwitchAuthError);
    expect(t.twitch.auth.hasUser("100")).toBe(false);
  });
});

describe("errors are always typed", () => {
  it("wraps a connection failure", async () => {
    const broken = (() => Promise.reject(new TypeError("fetch failed"))) as unknown as typeof fetch;
    const twitch = new Twitch({ clientId: "id", fetch: broken, retries: 0 });
    const error = await twitch.request({ path: "users", options: { token: "raw" } }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TwitchNetworkError);
    expect(error).toBeInstanceOf(TwitchError);
  });

  it("wraps a failure while reading the body, and retries a GET", async () => {
    let calls = 0;
    const flaky = (async () => {
      calls++;
      if (calls === 1) {
        return { ok: true, status: 200, headers: new Headers(), text: () => Promise.reject(new TypeError("terminated")) };
      }
      return new Response(JSON.stringify({ data: [{ id: "1" }] }), { status: 200 });
    }) as unknown as typeof fetch;
    const twitch = new Twitch({ clientId: "id", fetch: flaky });
    const body = await twitch.request<{ data: unknown[] }>({ path: "users", options: { token: "raw" } });
    expect(body.data).toHaveLength(1);
    expect(calls).toBe(2);
  });

  it("reports a body that is not JSON", async () => {
    const html = (async () => new Response("<html>oops</html>", { status: 200 })) as unknown as typeof fetch;
    const twitch = new Twitch({ clientId: "id", fetch: html });
    await expect(twitch.request({ path: "users", options: { token: "raw" } })).rejects.toThrow(/not JSON/);
  });
});
