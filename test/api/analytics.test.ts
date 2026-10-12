import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

const range = { started_at: "2024-01-01T00:00:00Z", ended_at: "2024-02-01T00:00:00Z" };

describe("analytics", () => {
  it("extensions: user token, filters and dates in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const report = { extension_id: "ext", URL: "https://reports.test/ext.csv", type: "overview_v2", date_range: range };
    t.reply({ data: [report], pagination: {} });
    const page = await t.twitch.analytics.extensions({
      extension_id: "ext",
      type: "overview_v2",
      started_at: new Date("2024-01-01T00:00:00Z"),
      ended_at: "2024-02-01T00:00:00Z",
      first: 5,
    });
    expect(page.data).toEqual([report]);
    expect(page.hasNext).toBe(false);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "analytics/extensions", token: "token-of-100" });
    expect(call.query).toEqual({
      extension_id: "ext",
      type: "overview_v2",
      started_at: "2024-01-01T00:00:00.000Z",
      ended_at: "2024-02-01T00:00:00Z",
      first: "5",
    });
    expect(call.body).toBeUndefined();
  });

  it("extensions: walks every page", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ extension_id: "a" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ extension_id: "b" }], pagination: {} });
    const reports = await t.twitch.analytics.extensions().all();
    expect(reports.map((report) => report.extension_id)).toEqual(["a", "b"]);
    expect(t.calls[0]?.query).toEqual({ first: "100" });
    expect(t.calls[1]?.query).toEqual({ first: "100", after: "c" });
  });

  it("games: user token, filters in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const report = { game_id: "g1", URL: "https://reports.test/g1.csv", type: "overview_v2", date_range: range };
    t.reply({ data: [report] });
    const page = await t.twitch.analytics.games({ game_id: "g1" });
    expect(page.data).toEqual([report]);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "analytics/games", token: "token-of-100" });
    expect(call.query).toEqual({ game_id: "g1" });
  });

  it("games: walks every page", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ game_id: "g1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ game_id: "g2" }], pagination: {} });
    const ids: string[] = [];
    for await (const report of t.twitch.analytics.games({ first: 1 })) ids.push(report.game_id);
    expect(ids).toEqual(["g1", "g2"]);
    expect(t.calls[0]?.query).toEqual({ first: "1" });
    expect(t.calls[1]?.query).toEqual({ first: "1", after: "c" });
  });
});
