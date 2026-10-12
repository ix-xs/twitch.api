import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

const created = { id: "QuickClip", edit_url: "https://example.test/edit/QuickClip" };

describe("clips", () => {
  it("create: POST with everything in the query, as the user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [created] }, { status: 202 });
    const clip = await t.twitch.clips.create({ broadcaster_id: "7", title: "Nice", duration: 12.5 });
    expect(clip).toEqual(created);
    expect(t.last()).toMatchObject({ method: "POST", path: "clips", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "7", title: "Nice", duration: "12.5" });
    expect(t.last().body).toBeUndefined();
  });

  it("createFromVod: uses the token of the editor when it is registered", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [created] }, { status: 202 });
    const clip = await t.twitch.clips.createFromVod({
      editor_id: "100",
      broadcaster_id: "7",
      vod_id: "v1",
      vod_offset: 300,
      duration: 20,
      title: "Intro",
    });
    expect(clip).toEqual(created);
    expect(t.last()).toMatchObject({ method: "POST", path: "videos/clips", token: "token-of-100" });
    expect(t.last().query).toEqual({
      editor_id: "100",
      broadcaster_id: "7",
      vod_id: "v1",
      vod_offset: "300",
      duration: "20",
      title: "Intro",
    });
    expect(t.last().body).toBeUndefined();
  });

  it("createFromVod: editor_id defaults to the acting user, and an app token works with an explicit one", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const vod = { broadcaster_id: "7", vod_id: "v1", vod_offset: 300, title: "Intro" };
    t.reply({ data: [created] });
    await t.twitch.clips.createFromVod(vod, { as: "100" });
    expect(t.last()).toMatchObject({ query: { editor_id: "100", broadcaster_id: "7" }, token: "token-of-100" });

    t.reply({ data: [created] });
    await t.twitch.clips.createFromVod({ ...vod, editor_id: "5" });
    expect(t.last()).toMatchObject({ query: { editor_id: "5" }, token: "app-token" });
  });

  it("get: one page when awaited, with the filters in the query", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "c1", vod_offset: null }], pagination: { cursor: "c" } });
    const page = await t.twitch.clips.get({
      broadcaster_id: "7",
      started_at: new Date("2026-01-01T00:00:00Z"),
      ended_at: "2026-01-08T00:00:00Z",
      is_featured: true,
      first: 5,
    });
    expect(page.data).toEqual([{ id: "c1", vod_offset: null }]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({ method: "GET", path: "clips", token: "app-token" });
    expect(t.last().query).toEqual({
      broadcaster_id: "7",
      started_at: "2026-01-01T00:00:00.000Z",
      ended_at: "2026-01-08T00:00:00Z",
      is_featured: "true",
      first: "5",
    });
  });

  it("get: looks clips up by ID and walks every page", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "c1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "c2" }], pagination: {} });
    const clips = await t.twitch.clips.get({ game_id: "42" }).all();
    expect(clips).toEqual([{ id: "c1" }, { id: "c2" }]);
    expect(t.calls[0]?.query).toEqual({ game_id: "42", first: "100" });
    expect(t.calls[1]?.query).toEqual({ game_id: "42", first: "100", after: "c" });

    await t.twitch.clips.get({ id: ["c1", "c2"] });
    expect(t.last().query).toEqual({ id: ["c1", "c2"] });
  });

  it("downloads: repeats clip_id and splits lists longer than 10", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const file = { clip_id: "c1", landscape_download_url: "https://example.test/c1.mp4", portrait_download_url: null };
    t.reply({ data: [file] });
    const files = await t.twitch.clips.downloads({ editor_id: "100", broadcaster_id: "7", clip_id: ["c1", "c2"] });
    expect(files).toEqual([file]);
    expect(t.last()).toMatchObject({ method: "GET", path: "clips/downloads", token: "token-of-100" });
    expect(t.last().query).toEqual({ editor_id: "100", broadcaster_id: "7", clip_id: ["c1", "c2"] });

    const ids = Array.from({ length: 12 }, (_, i) => `clip${i}`);
    await t.twitch.as("100").clips.downloads({ broadcaster_id: "7", clip_id: ids });
    expect(t.calls).toHaveLength(3);
    expect(t.calls.slice(1).map((call) => (call.query["clip_id"] as string[]).length)).toEqual([10, 2]);
    expect(t.calls[1]?.query).toMatchObject({ editor_id: "100", broadcaster_id: "7" });
    expect(t.calls[2]?.query).toMatchObject({ editor_id: "100", broadcaster_id: "7" });
  });
});
