import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("bits", () => {
  it("leaderboard: returns the entries with the date range and the total", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const entry = { user_id: "5", user_login: "five", user_name: "Five", rank: 1, score: 300 };
    const range = { started_at: "2024-03-04T08:00:00Z", ended_at: "2024-03-11T08:00:00Z" };
    t.reply({ data: [entry], date_range: range, total: 1 });
    const board = await t.twitch.bits.leaderboard({
      count: 3,
      period: "week",
      started_at: new Date("2024-03-05T10:00:00Z"),
      user_id: "5",
    });
    expect(board).toEqual({ data: [entry], date_range: range, total: 1 });
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "bits/leaderboard", token: "token-of-100" });
    expect(call.query).toEqual({ count: "3", period: "week", started_at: "2024-03-05T10:00:00.000Z", user_id: "5" });
    expect(call.body).toBeUndefined();
  });

  it("leaderboard: works without parameters", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [], date_range: { started_at: "", ended_at: "" }, total: 0 });
    expect(await t.twitch.bits.leaderboard()).toEqual({
      data: [],
      date_range: { started_at: "", ended_at: "" },
      total: 0,
    });
    expect(t.last().query).toEqual({});
  });

  it("cheermotes: app token, broadcaster_id is optional", async () => {
    const t = createTestClient();
    const cheermote = { prefix: "Cheer", tiers: [], type: "global_first_party", order: 1 };
    t.reply({ data: [cheermote] });
    expect(await t.twitch.bits.cheermotes()).toEqual([cheermote]);
    expect(t.last()).toMatchObject({ method: "GET", path: "bits/cheermotes", query: {}, token: "app-token" });

    await t.twitch.bits.cheermotes({ broadcaster_id: "7" });
    expect(t.last().query).toEqual({ broadcaster_id: "7" });
  });

  it("customPowerUps: broadcaster_id defaults to the acting user, id is repeated", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const powerUp = { id: "p1", title: "Hydrate", bits: 100, image: null };
    t.reply({ data: [powerUp] });
    expect(await t.twitch.bits.customPowerUps({ id: ["p1", "p2"] })).toEqual([powerUp]);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "bits/custom_power_ups",
      query: { broadcaster_id: "100", id: ["p1", "p2"] },
      token: "token-of-100",
    });

    await t.twitch.bits.customPowerUps();
    expect(t.last().query).toEqual({ broadcaster_id: "100" });
  });

  it("customPowerUps: splits more than 50 IDs into several requests", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const ids = Array.from({ length: 60 }, (_, i) => `p${i}`);
    await t.twitch.bits.customPowerUps({ id: ids });
    expect(t.calls).toHaveLength(2);
    expect(t.calls.map((call) => (call.query["id"] as string[]).length)).toEqual([50, 10]);
    expect(t.calls.every((call) => call.query["broadcaster_id"] === "100")).toBe(true);
  });

  it("extensionTransactions: app token even when a user is registered, paginated", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ id: "t1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "t2" }], pagination: {} });
    const ids: string[] = [];
    for await (const transaction of t.twitch.bits.extensionTransactions({ extension_id: "ext", id: ["t1", "t2"] })) {
      ids.push(transaction.id);
    }
    expect(ids).toEqual(["t1", "t2"]);
    expect(t.calls[0]).toMatchObject({ method: "GET", path: "extensions/transactions", token: "app-token" });
    expect(t.calls[0]?.query).toEqual({ extension_id: "ext", id: ["t1", "t2"], first: "100" });
    expect(t.calls[1]?.query).toEqual({ extension_id: "ext", id: ["t1", "t2"], first: "100", after: "c" });
  });
});
