import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

const game = { id: "42", name: "Chess", box_art_url: "https://example.test/42-{width}x{height}.jpg", igdb_id: "9" };

describe("games", () => {
  it("top: one page when awaited", async () => {
    const t = createTestClient();
    t.reply({ data: [game], pagination: { cursor: "c" } });
    const page = await t.twitch.games.top({ first: 2 });
    expect(page.data).toEqual([game]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({ method: "GET", path: "games/top", query: { first: "2" }, token: "app-token" });
  });

  it("top: iterating walks every page at the largest page size", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "2" }], pagination: {} });
    expect(await t.twitch.games.top().all()).toEqual([{ id: "1" }, { id: "2" }]);
    expect(t.calls[0]?.query).toEqual({ first: "100" });
    expect(t.calls[1]?.query).toEqual({ first: "100", after: "c" });
  });

  it("get: repeats id, name and igdb_id keys", async () => {
    const t = createTestClient();
    t.reply({ data: [game] });
    const games = await t.twitch.games.get({ id: ["42", "43"], name: "Chess", igdb_id: "9" });
    expect(games).toEqual([game]);
    expect(t.last()).toMatchObject({ method: "GET", path: "games", token: "app-token" });
    expect(t.last().query).toEqual({ id: ["42", "43"], name: "Chess", igdb_id: "9" });
  });

  it("get: splits more than 100 lookups, counted across the three keys", async () => {
    const t = createTestClient();
    const ids = Array.from({ length: 99 }, (_, i) => String(i));
    await t.twitch.games.get({ id: ids, name: ["Chess", "Go"], igdb_id: "9" });
    expect(t.calls).toHaveLength(2);
    expect(t.calls[0]?.query).toEqual({ id: ids, name: "Chess" });
    expect(t.calls[1]?.query).toEqual({ name: "Go", igdb_id: "9" });
  });
});
