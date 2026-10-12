import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryTokenStore, TwitchAuthError, TwitchScopeError, type UserToken } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

afterEach(() => {
  vi.useRealTimers();
});

const validation = (overrides: Record<string, unknown> = {}) => ({
  client_id: "client-id",
  login: "someone",
  user_id: "100",
  scopes: ["user:read:chat"],
  expires_in: 3600,
  ...overrides,
});

describe("auth", () => {
  it("addUser: looks up the owner and scopes of a bare access token", async () => {
    const t = createTestClient();
    t.replyAuth(validation());
    const user = await t.twitch.auth.addUser({ accessToken: "abc" });
    expect(user).toMatchObject({ userId: "100", login: "someone", scopes: ["user:read:chat"], accessToken: "abc" });
    expect(user.expiresAt).toBeGreaterThan(Date.now());
    expect(t.authCalls[0]).toMatchObject({ path: "/validate", method: "GET", headers: { Authorization: "OAuth abc" } });
    expect(t.twitch.auth.users).toHaveLength(1);
  });

  it("addUser: renews an expired access token when a refresh token is given", async () => {
    const t = createTestClient();
    t.replyAuth({ status: 401, message: "invalid access token" }, 401);
    t.replyAuth({ access_token: "fresh", refresh_token: "r2", expires_in: 100, token_type: "bearer" });
    t.replyAuth(validation());
    const user = await t.twitch.auth.addUser({ accessToken: "stale", refreshToken: "r1" });
    expect(user).toMatchObject({ accessToken: "fresh", refreshToken: "r2", userId: "100" });
  });

  it("addUser: rejects an app access token", async () => {
    const t = createTestClient();
    t.replyAuth(validation({ user_id: undefined, login: undefined }));
    await expect(t.twitch.auth.addUser({ accessToken: "app" })).rejects.toBeInstanceOf(TwitchAuthError);
  });

  it("authorizeUrl: builds the consent URL", () => {
    const t = createTestClient();
    const url = new URL(
      t.twitch.auth.authorizeUrl({
        redirectUri: "http://localhost:3000/cb",
        scopes: ["user:read:chat", "user:write:chat"],
        state: "xyz",
        forceVerify: true,
      }),
    );
    expect(url.origin + url.pathname).toBe("https://id.twitch.tv/oauth2/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      response_type: "code",
      client_id: "client-id",
      redirect_uri: "http://localhost:3000/cb",
      scope: "user:read:chat user:write:chat",
      state: "xyz",
      force_verify: "true",
    });
  });

  it("exchangeCode: posts the secret in the body and registers the user", async () => {
    const t = createTestClient();
    t.replyAuth({ access_token: "a", refresh_token: "r", expires_in: 100, scope: ["user:read:chat"], token_type: "bearer" });
    t.replyAuth(validation());
    const user = await t.twitch.auth.exchangeCode("the-code", "http://localhost:3000/cb");
    expect(user).toMatchObject({ userId: "100", accessToken: "a", refreshToken: "r" });
    const call = t.authCalls[0]!;
    expect(call.method).toBe("POST");
    expect(Object.fromEntries(call.params)).toEqual({
      client_id: "client-id",
      client_secret: "client-secret",
      code: "the-code",
      grant_type: "authorization_code",
      redirect_uri: "http://localhost:3000/cb",
    });
  });

  it("deviceFlow: polls until the user approves", async () => {
    vi.useFakeTimers();
    const t = createTestClient({ clientSecret: undefined as unknown as string });
    t.replyAuth({ device_code: "dev", expires_in: 1800, interval: 5, user_code: "ABCD", verification_uri: "https://www.twitch.tv/activate?device-code=ABCD" });
    const flow = await t.twitch.auth.deviceFlow({ scopes: ["user:read:chat"] });
    expect(flow.userCode).toBe("ABCD");
    expect(flow.verificationUri).toContain("ABCD");

    t.replyAuth({ status: 400, message: "authorization_pending" }, 400);
    t.replyAuth({ access_token: "a", refresh_token: "r", expires_in: 100, token_type: "bearer" });
    t.replyAuth(validation());
    const waiting = flow.wait();
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    const user = await waiting;
    expect(user).toMatchObject({ userId: "100", accessToken: "a" });
    const poll = t.authCalls[1]!;
    expect(poll.params.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:device_code");
    expect(poll.params.get("device_code")).toBe("dev");
    expect(poll.params.has("client_secret")).toBe(false);
  });

  it("refresh: concurrent calls share one request", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const [a, b] = await Promise.all([t.twitch.auth.refresh("100"), t.twitch.auth.refresh("100")]);
    expect(a).toBe(b);
    expect(t.authCalls.filter((call) => call.params.get("grant_type") === "refresh_token")).toHaveLength(1);
  });

  it("refresh: a rejected refresh token drops the user and emits tokenInvalid", async () => {
    const store = new MemoryTokenStore();
    const t = createTestClient({ tokens: store });
    await t.addUser("100");
    const invalid: string[] = [];
    t.twitch.on("tokenInvalid", (userId) => invalid.push(userId));
    t.replyAuth({ status: 400, message: "Invalid refresh token" }, 400);
    await expect(t.twitch.auth.refresh("100")).rejects.toBeInstanceOf(TwitchAuthError);
    expect(invalid).toEqual(["100"]);
    expect(t.twitch.auth.hasUser("100")).toBe(false);
    expect(store.get("100")).toBeUndefined();
  });

  it("renews a token that is about to expire before using it", async () => {
    const t = createTestClient();
    await t.twitch.auth.addUser({ accessToken: "old", refreshToken: "r", userId: "100", scopes: [], expiresAt: Date.now() + 5000 });
    await t.twitch.users.me().catch(() => {});
    expect(t.last().token).toBe("refreshed-r");
  });

  it("checks scopes before the network and names what is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["user:read:chat"]);
    const error = await t.twitch.users.blocks().then(undefined, (e: unknown) => e);
    expect(error).toBeInstanceOf(TwitchScopeError);
    expect(error).toMatchObject({ userId: "100", required: ["user:read:blocked_users"], granted: ["user:read:chat"] });
    expect(t.calls).toHaveLength(0);
  });

  it("restores users from the store on first use and writes refreshed tokens back", async () => {
    const store = new MemoryTokenStore();
    const saved: UserToken = { userId: "100", accessToken: "stored", refreshToken: "r", scopes: ["user:read:follows"] };
    store.set("100", saved);
    const t = createTestClient({ tokens: store });
    await t.twitch.streams.followed();
    expect(t.last()).toMatchObject({ token: "stored", query: { user_id: "100" } });
    await t.twitch.auth.refresh("100");
    expect(store.get("100")?.accessToken).toBe("refreshed-r");
  });

  it("removeUser: forgets the user and can revoke the token", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.replyAuth(undefined);
    await t.twitch.auth.removeUser("100", { revoke: true });
    expect(t.twitch.auth.users).toHaveLength(0);
    expect(t.authCalls.at(-1)).toMatchObject({ path: "/revoke" });
    expect(t.authCalls.at(-1)?.params.get("token")).toBe("token-of-100");
  });

  it("validateAll: drops a revoked token that cannot be refreshed", async () => {
    const t = createTestClient();
    await t.twitch.auth.addUser({ accessToken: "a", userId: "100", scopes: [] });
    const invalid: string[] = [];
    t.twitch.on("tokenInvalid", (userId) => invalid.push(userId));
    t.replyAuth({ status: 401, message: "invalid access token" }, 401);
    await t.twitch.auth.validateAll();
    expect(invalid).toEqual(["100"]);
    expect(t.twitch.auth.users).toHaveLength(0);
  });

  it("needs a client secret for app tokens", async () => {
    const t = createTestClient({ clientSecret: undefined as unknown as string });
    await expect(t.twitch.users.get({ id: "1" })).rejects.toThrow(/clientSecret/);
  });
});
