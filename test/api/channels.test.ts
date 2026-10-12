import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("channels", () => {
  it("get: repeats broadcaster_id and uses the app token", async () => {
    const t = createTestClient();
    const channel = { broadcaster_id: "1", title: "Hello", tags: [] };
    t.reply({ data: [channel] });
    expect(await t.twitch.channels.get({ broadcaster_id: ["1", "2"] })).toEqual([channel]);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "channels",
      query: { broadcaster_id: ["1", "2"] },
      token: "app-token",
    });
  });

  it("get: splits more than 100 IDs into several requests", async () => {
    const t = createTestClient();
    const ids = Array.from({ length: 130 }, (_, i) => String(i));
    await t.twitch.channels.get({ broadcaster_id: ids });
    expect(t.calls).toHaveLength(2);
    expect(t.calls.map((call) => (call.query["broadcaster_id"] as string[]).length)).toEqual([100, 30]);
  });

  it("update: PATCH with broadcaster_id in the query and the rest in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    const labels = [{ id: "Gambling", is_enabled: true }] as const;
    const result = await t.twitch.channels.update({
      title: "New title",
      game_id: "33214",
      tags: ["One", "Two"],
      content_classification_labels: labels,
    });
    expect(result).toBeUndefined();
    const call = t.last();
    expect(call).toMatchObject({ method: "PATCH", path: "channels", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100" });
    expect(call.body).toEqual({
      title: "New title",
      game_id: "33214",
      tags: ["One", "Two"],
      content_classification_labels: labels,
    });
  });

  it("editors: user token, broadcaster_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const editor = { user_id: "5", user_name: "Five", created_at: "2024-01-02T03:04:05Z" };
    t.reply({ data: [editor] });
    expect(await t.twitch.channels.editors()).toEqual([editor]);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "channels/editors",
      query: { broadcaster_id: "100" },
      token: "token-of-100",
    });
  });

  it("followed: user_id defaults to the acting user, total is exposed", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ total: 8, data: [{ broadcaster_id: "7" }], pagination: {} });
    const page = await t.twitch.channels.followed({ broadcaster_id: "7" });
    expect(page.data).toEqual([{ broadcaster_id: "7" }]);
    expect(page.total).toBe(8);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "channels/followed",
      query: { user_id: "100", broadcaster_id: "7" },
      token: "token-of-100",
    });
  });

  it("followed: walks every page at the largest page size", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ broadcaster_id: "7" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ broadcaster_id: "8" }], pagination: {} });
    const all = await t.twitch.channels.followed().all();
    expect(all).toEqual([{ broadcaster_id: "7" }, { broadcaster_id: "8" }]);
    expect(t.calls[0]?.query).toEqual({ user_id: "100", first: "100" });
    expect(t.calls[1]?.query).toEqual({ user_id: "100", first: "100", after: "c" });
  });

  it("followers: a moderator reads another channel, broadcaster_id is left alone", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ total: 42, data: [{ user_id: "5" }], pagination: { cursor: "c" } });
    const page = await t.twitch.channels.followers({ broadcaster_id: "200", first: 1 });
    expect(page.data).toEqual([{ user_id: "5" }]);
    expect(page.total).toBe(42);
    expect(page.cursor).toBe("c");
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "channels/followers", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "200", first: "1" });
  });

  it("followers: total() asks for a single item", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ total: 42, data: [], pagination: {} });
    expect(await t.twitch.channels.followers({ broadcaster_id: "100", user_id: "5" }).total()).toBe(42);
    expect(t.last().query).toEqual({ broadcaster_id: "100", user_id: "5", first: "1" });
  });
});
