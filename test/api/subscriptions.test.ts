import { describe, expect, it } from "vitest";
import { TwitchApiError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

describe("subscriptions", () => {
  it("get: broadcaster_id defaults to the acting user, points are reachable on the page", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const sub = { broadcaster_id: "100", user_id: "5", tier: "1000", is_gift: false };
    t.reply({ data: [sub], pagination: { cursor: "c" }, total: 13, points: 17 });
    const page = await t.twitch.subscriptions.get({ first: 1 });
    expect(page.data).toEqual([sub]);
    expect(page.total).toBe(13);
    expect(page.raw.points).toBe(17);
    expect(page.cursor).toBe("c");
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "subscriptions", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100", first: "1" });
    expect(call.body).toBeUndefined();
  });

  it("get: repeats user_id and walks every page", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ user_id: "5" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ user_id: "6" }], pagination: {} });
    const subs = await t.twitch.subscriptions.get().all();
    expect(subs).toEqual([{ user_id: "5" }, { user_id: "6" }]);
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "100", first: "100" });
    expect(t.calls[1]?.query).toEqual({ broadcaster_id: "100", first: "100", after: "c" });

    t.reply({ data: [{ user_id: "5" }], pagination: {}, total: null, points: null });
    await t.twitch.subscriptions.get({ user_id: ["5", "6"] });
    expect(t.last().query).toEqual({ broadcaster_id: "100", user_id: ["5", "6"] });
  });

  it("check: user_id defaults to the acting user, returns the subscription", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const sub = { broadcaster_id: "200", broadcaster_login: "two", is_gift: false, tier: "2000" };
    t.reply({ data: [sub] });
    expect(await t.twitch.subscriptions.check({ broadcaster_id: "200" })).toEqual(sub);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "subscriptions/user", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "200", user_id: "100" });
    expect(call.body).toBeUndefined();
  });

  it("check: null when Twitch answers 404", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ error: "Not Found", status: 404, message: "no subscription" }, { status: 404 });
    expect(await t.twitch.subscriptions.check({ broadcaster_id: "200" })).toBeNull();
    expect(t.calls).toHaveLength(1);
  });

  it("check: other failures are still thrown", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ error: "Bad Request", status: 400, message: "broken" }, { status: 400 });
    const failure = await t.twitch.subscriptions.check({ broadcaster_id: "200" }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(TwitchApiError);
    expect((failure as TwitchApiError).status).toBe(400);
  });
});
