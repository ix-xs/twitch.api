import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("videos", () => {
  it("get: one page when awaited, with the filters in the query", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "v1", muted_segments: null }], pagination: { cursor: "c" } });
    const page = await t.twitch.videos.get({ user_id: "7", period: "week", sort: "views", type: "archive", first: 3 });
    expect(page.data).toEqual([{ id: "v1", muted_segments: null }]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({ method: "GET", path: "videos", token: "app-token" });
    expect(t.last().query).toEqual({ user_id: "7", period: "week", sort: "views", type: "archive", first: "3" });
  });

  it("get: looks videos up by ID and walks every page", async () => {
    const t = createTestClient();
    await t.twitch.videos.get({ id: ["v1", "v2"] });
    expect(t.last().query).toEqual({ id: ["v1", "v2"] });

    t.reply({ data: [{ id: "v1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "v2" }], pagination: {} });
    const ids: string[] = [];
    for await (const video of t.twitch.videos.get({ game_id: "42", language: "fr" })) ids.push(video.id);
    expect(ids).toEqual(["v1", "v2"]);
    expect(t.calls[1]?.query).toEqual({ game_id: "42", language: "fr", first: "100" });
    expect(t.calls[2]?.query).toEqual({ game_id: "42", language: "fr", first: "100", after: "c" });
  });

  it("delete: DELETE with the IDs in the query, returns the deleted IDs", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: ["v1", "v2"] });
    expect(await t.twitch.videos.delete({ id: ["v1", "v2"] })).toEqual(["v1", "v2"]);
    expect(t.last()).toMatchObject({ method: "DELETE", path: "videos", token: "token-of-100" });
    expect(t.last().query).toEqual({ id: ["v1", "v2"] });
    expect(t.last().body).toBeUndefined();

    t.reply({ data: ["v3"] });
    expect(await t.twitch.videos.delete({ id: "v3" })).toEqual(["v3"]);
    expect(t.last().query).toEqual({ id: "v3" });
  });

  it("delete: sends 5 IDs per request and merges the results", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const ids = Array.from({ length: 7 }, (_, i) => `v${i}`);
    t.reply({ data: ids.slice(0, 5) });
    t.reply({ data: ids.slice(5) });
    expect(await t.twitch.videos.delete({ id: ids })).toEqual(ids);
    expect(t.calls.map((call) => call.query["id"])).toEqual([ids.slice(0, 5), ids.slice(5)]);
  });
});
