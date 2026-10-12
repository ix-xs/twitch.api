import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("search", () => {
  it("categories: sends the query text encoded and returns a page", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "42", name: "Chess & Co" }], pagination: { cursor: "c" } });
    const page = await t.twitch.search.categories({ query: "chess & co", first: 4 });
    expect(page.data).toEqual([{ id: "42", name: "Chess & Co" }]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({ method: "GET", path: "search/categories", token: "app-token" });
    expect(t.last().query).toEqual({ query: "chess & co", first: "4" });
    expect(t.last().url.search).toBe("?query=chess+%26+co&first=4");
  });

  it("categories: iterating walks every page", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "2" }], pagination: {} });
    expect(await t.twitch.search.categories({ query: "ch" }).all()).toEqual([{ id: "1" }, { id: "2" }]);
    expect(t.calls[0]?.query).toEqual({ query: "ch", first: "100" });
    expect(t.calls[1]?.query).toEqual({ query: "ch", first: "100", after: "c" });
  });

  it("channels: live_only goes to the query", async () => {
    const t = createTestClient();
    const channel = { id: "7", broadcaster_login: "seven", is_live: true, started_at: "2026-02-03T04:05:06Z" };
    t.reply({ data: [channel], pagination: {} });
    const page = await t.twitch.search.channels({ query: "sev", live_only: true });
    expect(page.data).toEqual([channel]);
    expect(page.hasNext).toBe(false);
    expect(t.last()).toMatchObject({ method: "GET", path: "search/channels", token: "app-token" });
    expect(t.last().query).toEqual({ query: "sev", live_only: "true" });
  });

  it("channels: iterating walks every page", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "7" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "8" }], pagination: {} });
    const ids: string[] = [];
    for await (const channel of t.twitch.search.channels({ query: "sev" })) ids.push(channel.id);
    expect(ids).toEqual(["7", "8"]);
    expect(t.calls[1]?.query).toEqual({ query: "sev", first: "100", after: "c" });
  });
});
