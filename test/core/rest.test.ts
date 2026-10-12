import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Twitch,
  TwitchApiError,
  TwitchAuthError,
  TwitchError,
  TwitchRateLimitError,
  TwitchTimeoutError,
  type UserToken,
} from "../../src/index.js";
import { createTestClient } from "../helpers.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("request pipeline", () => {
  it("sends the client ID and a bearer token", async () => {
    const t = createTestClient();
    await t.twitch.request({ path: "users", query: { login: "a" } });
    expect(t.last().headers).toMatchObject({ Authorization: "Bearer app-token", "Client-Id": "client-id" });
    expect(t.authCalls).toHaveLength(1);
    expect(t.authCalls[0]?.params.get("client_secret")).toBe("client-secret");
  });

  it("requests the app token once for concurrent calls", async () => {
    const t = createTestClient();
    await Promise.all([t.twitch.request({ path: "a" }), t.twitch.request({ path: "b" }), t.twitch.request({ path: "c" })]);
    expect(t.authCalls).toHaveLength(1);
    expect(t.calls).toHaveLength(3);
  });

  it("serialises dates, booleans and lists, and skips empty values", async () => {
    const t = createTestClient();
    await t.twitch.request({
      path: "x",
      query: { when: new Date("2026-01-02T03:04:05.000Z"), flag: false, ids: ["1", "2"], none: undefined, nil: null, empty: "" },
    });
    expect(t.last().query).toEqual({ when: "2026-01-02T03:04:05.000Z", flag: "false", ids: ["1", "2"], empty: "" });
  });

  it("turns an error response into a TwitchApiError", async () => {
    const t = createTestClient();
    t.reply({ error: "Bad Request", status: 400, message: "Missing required parameter" }, { status: 400 });
    const error = await t.twitch.request({ path: "users" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TwitchApiError);
    expect(error).toMatchObject({ status: 400, error: "Bad Request", method: "GET" });
    expect((error as TwitchApiError).message).toContain("Missing required parameter");
    expect((error as TwitchApiError).url).toContain("/helix/users");
  });

  it("renews the app token after a 401 and retries once", async () => {
    const t = createTestClient();
    t.reply({ message: "Invalid OAuth token" }, { status: 401 });
    t.reply({ data: [{ ok: true }] });
    const body = await t.twitch.request<{ data: unknown[] }>({ path: "users" });
    expect(body.data).toEqual([{ ok: true }]);
    expect(t.calls).toHaveLength(2);
    expect(t.authCalls.filter((call) => call.params.get("grant_type") === "client_credentials")).toHaveLength(2);
  });

  it("refreshes a user token after a 401, retries, and announces the new token", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const refreshed: UserToken[] = [];
    t.twitch.on("tokenRefresh", (token) => refreshed.push(token));
    t.reply({ message: "Invalid OAuth token" }, { status: 401 });
    t.reply({ data: [] });
    await t.twitch.users.me().catch(() => {});
    expect(t.calls.map((call) => call.token)).toEqual(["token-of-100", "refreshed-refresh-of-100"]);
    expect(refreshed).toHaveLength(1);
    expect(t.twitch.auth.getUser("100")).toMatchObject({
      accessToken: "refreshed-refresh-of-100",
      refreshToken: "refresh-of-100+",
    });
  });

  it("gives up after a second 401", async () => {
    const t = createTestClient();
    t.reply({ message: "nope" }, { status: 401 });
    t.reply({ message: "nope" }, { status: 401 });
    await expect(t.twitch.request({ path: "users" })).rejects.toMatchObject({ status: 401 });
    expect(t.calls).toHaveLength(2);
  });

  it("retries a GET after a 5xx but never a POST", async () => {
    const t = createTestClient();
    t.reply({ message: "boom" }, { status: 503 });
    t.reply({ data: [] });
    await t.twitch.request({ path: "users" });
    expect(t.calls).toHaveLength(2);

    t.reply({ message: "boom" }, { status: 500 });
    await expect(t.twitch.request({ method: "POST", path: "polls", body: {} })).rejects.toMatchObject({ status: 500 });
    expect(t.calls).toHaveLength(3);
  });

  it("waits for the bucket to refill after a 429, then retries", async () => {
    vi.useFakeTimers({ now: 1_000_000_000_000 });
    const t = createTestClient();
    const waits: number[] = [];
    t.twitch.on("rateLimit", (event) => waits.push(event.waitMs));
    const reset = String(1_000_000_000 + 2);
    t.reply({ message: "Too Many Requests" }, { status: 429, headers: { "Ratelimit-Limit": "800", "Ratelimit-Remaining": "0", "Ratelimit-Reset": reset } });
    t.reply({ data: [{ ok: true }] });
    const pending = t.twitch.request<{ data: unknown[] }>({ path: "users" });
    await vi.advanceTimersByTimeAsync(1900);
    expect(t.calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(200);
    expect((await pending).data).toEqual([{ ok: true }]);
    expect(t.calls).toHaveLength(2);
    expect(waits[0]).toBe(2000);
  });

  it("holds requests back before hitting the limit when the bucket is known to be empty", async () => {
    vi.useFakeTimers({ now: 1_000_000_000_000 });
    const t = createTestClient();
    t.reply({ data: [] }, { headers: { "Ratelimit-Limit": "800", "Ratelimit-Remaining": "0", "Ratelimit-Reset": String(1_000_000_000 + 1) } });
    await t.twitch.request({ path: "a" });
    const pending = t.twitch.request({ path: "b" });
    await vi.advanceTimersByTimeAsync(500);
    expect(t.calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(600);
    await pending;
    expect(t.calls).toHaveLength(2);
    expect(t.twitch.rateLimitOf()).toBeUndefined();
  });

  it("throws instead of waiting with rateLimit: throw", async () => {
    const t = createTestClient({ rateLimit: "throw" });
    const reset = String(Math.floor(Date.now() / 1000) + 30);
    t.reply({ message: "Too Many Requests" }, { status: 429, headers: { "Ratelimit-Limit": "800", "Ratelimit-Remaining": "0", "Ratelimit-Reset": reset } });
    const error = await t.twitch.request({ path: "users" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TwitchRateLimitError);
    expect((error as TwitchRateLimitError).retryAfter).toBeGreaterThan(0);
    await expect(t.twitch.request({ path: "users" })).rejects.toBeInstanceOf(TwitchRateLimitError);
    expect(t.calls).toHaveLength(1);
  });

  it("reports the rate limit state per bucket", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const reset = String(Math.floor(Date.now() / 1000) + 30);
    t.reply({ data: [] }, { headers: { "Ratelimit-Limit": "800", "Ratelimit-Remaining": "799", "Ratelimit-Reset": reset } });
    await t.twitch.users.me().catch(() => {});
    expect(t.twitch.rateLimitOf("100")).toMatchObject({ limit: 800, remaining: 799 });
    expect(t.twitch.rateLimitOf()).toBeUndefined();
  });

  it("times out", async () => {
    const hang = ((_: unknown, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      })) as typeof fetch;
    const twitch = new Twitch({ clientId: "id", fetch: hang, timeout: 20, retries: 0 });
    await expect(twitch.request({ path: "users", options: { token: "raw" } })).rejects.toBeInstanceOf(TwitchTimeoutError);
  });

  it("stops when the caller aborts", async () => {
    const t = createTestClient();
    const controller = new AbortController();
    controller.abort(new Error("cancelled"));
    await t.twitch.auth.appToken();
    await expect(t.twitch.request({ path: "users", options: { signal: controller.signal } })).rejects.toThrow("cancelled");
  });

  it("emits request and response events", async () => {
    const t = createTestClient();
    const seen: string[] = [];
    t.twitch.on("request", (event) => seen.push(`> ${event.method} ${event.as} #${event.attempt}`));
    t.twitch.on("response", (event) => seen.push(`< ${event.status}`));
    await t.twitch.request({ path: "users" });
    expect(seen).toEqual(["> GET app #1", "< 200"]);
  });
});

describe("choice of token", () => {
  it("uses a raw token untouched", async () => {
    const t = createTestClient();
    await t.twitch.request({ path: "users", options: { token: "my-jwt" } });
    expect(t.last().token).toBe("my-jwt");
    expect(t.authCalls).toHaveLength(0);
  });

  it("acts as the chosen user with { as } and with twitch.as()", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    await t.twitch.request({ path: "users", options: { as: "200" } });
    expect(t.last().token).toBe("token-of-200");
    await t.twitch.as("100").users.get({ id: "1" });
    expect(t.last().token).toBe("token-of-100");
    expect(t.twitch.as("100").userId).toBe("100");
  });

  it("picks the token of the user named by the request", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    await t.twitch.users.blocks({ broadcaster_id: "200" });
    expect(t.last().token).toBe("token-of-200");
  });

  it("asks which user when several are registered and none is named", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    await expect(t.twitch.users.me()).rejects.toBeInstanceOf(TwitchAuthError);
    expect(t.calls).toHaveLength(0);
  });

  it("explains what is missing when no user is registered", async () => {
    const t = createTestClient();
    await expect(t.twitch.users.me()).rejects.toThrow(/no user is registered/);
  });

  it("prefers the only registered user when the acting user is left out of an app-or-user endpoint", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.twitch.request({ method: "POST", path: "chat/messages", body: { broadcaster_id: "1", message: "hi" }, context: { body: "sender_id" } });
    expect(t.last()).toMatchObject({ token: "token-of-100", body: { broadcaster_id: "1", sender_id: "100", message: "hi" } });
  });

  it("requires the acting user field when only the app token is available", async () => {
    const t = createTestClient();
    await expect(t.twitch.request({ path: "x", context: "moderator_id" })).rejects.toBeInstanceOf(TwitchError);
    expect(t.calls).toHaveLength(0);
  });

  it("falls back to the only user when there is no client secret", async () => {
    const t = createTestClient({ clientSecret: undefined as unknown as string });
    await t.addUser("100");
    await t.twitch.users.get({ id: "1" });
    expect(t.last().token).toBe("token-of-100");
  });

  it("refuses to build a client without a client ID", () => {
    expect(() => new Twitch({ clientId: "" })).toThrow(TwitchError);
  });
});

describe("pagination", () => {
  it("stops at the limit without fetching more than needed", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "1" }, { id: "2" }, { id: "3" }], pagination: { cursor: "c" } });
    const items = await t.twitch.streams.get().take(2);
    expect(items).toEqual([{ id: "1" }, { id: "2" }]);
    expect(t.calls).toHaveLength(1);
    expect(t.last().query).toEqual({ first: "2" });
  });

  it("walks pages by hand with next()", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "2" }] });
    const first = await t.twitch.streams.get({ first: 1 });
    expect(first.hasNext).toBe(true);
    const second = await first.next();
    expect(second?.data).toEqual([{ id: "2" }]);
    expect(second?.hasNext).toBe(false);
    expect(await second?.next()).toBeNull();
    expect(t.calls[1]?.query).toEqual({ first: "1", after: "c" });
  });

  it("pages backward when a before cursor is given", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "2" }], pagination: { cursor: "b1" } });
    t.reply({ data: [{ id: "1" }], pagination: {} });
    await t.twitch.streams.get({ before: "b0" }).all();
    expect(t.calls[1]?.query).toMatchObject({ before: "b1" });
    expect(t.calls[1]?.query).not.toHaveProperty("after");
  });

  it("does not loop when Twitch repeats a cursor", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "1" }], pagination: { cursor: "same" } });
    t.reply({ data: [{ id: "2" }], pagination: { cursor: "same" } });
    expect(await t.twitch.streams.get().all()).toHaveLength(2);
    expect(t.calls).toHaveLength(2);
  });

  it("first() and total() make the smallest request", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "1" }], total: 42, pagination: { cursor: "c" } });
    expect(await t.twitch.streams.get().first()).toEqual({ id: "1" });
    expect(t.last().query).toEqual({ first: "1" });
    t.reply({ data: [{ id: "1" }], total: 42 });
    expect(await t.twitch.streams.get().total()).toBe(42);
  });
});
