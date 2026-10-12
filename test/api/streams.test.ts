import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("streams", () => {
  it("get: one page when awaited, with the filters in the query", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "s1" }], pagination: { cursor: "c" } });
    const page = await t.twitch.streams.get({ user_login: ["a", "b"], type: "live", first: 5 });
    expect(page.data).toEqual([{ id: "s1" }]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({
      path: "streams",
      query: { user_login: ["a", "b"], type: "live", first: "5" },
      token: "app-token",
    });
  });

  it("get: iterating walks every page at the largest page size", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "s1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "s2" }], pagination: {} });
    const ids: string[] = [];
    for await (const stream of t.twitch.streams.get({ language: "fr" })) ids.push(stream.id);
    expect(ids).toEqual(["s1", "s2"]);
    expect(t.calls[0]?.query).toEqual({ language: "fr", first: "100" });
    expect(t.calls[1]?.query).toEqual({ language: "fr", first: "100", after: "c" });
  });

  it("followed: user token, user_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.twitch.streams.followed();
    expect(t.last()).toMatchObject({ path: "streams/followed", query: { user_id: "100" }, token: "token-of-100" });
  });

  it("key: returns the bare key", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ stream_key: "live_secret" }] });
    expect(await t.twitch.streams.key()).toBe("live_secret");
    expect(t.last()).toMatchObject({ path: "streams/key", query: { broadcaster_id: "100" } });
  });

  it("createMarker: POST with a JSON body, user_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ id: "m1", position_seconds: 12 }] });
    const marker = await t.twitch.streams.createMarker({ description: "hello" });
    expect(marker).toEqual({ id: "m1", position_seconds: 12 });
    expect(t.last()).toMatchObject({
      method: "POST",
      path: "streams/markers",
      query: {},
      body: { user_id: "100", description: "hello" },
    });
  });

  it("markers: paginated by video", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ user_id: "100", videos: [] }], pagination: {} });
    const page = await t.twitch.streams.markers({ video_id: "v1" });
    expect(page.data).toHaveLength(1);
    expect(t.last()).toMatchObject({ path: "streams/markers", query: { video_id: "v1" } });
  });
});
