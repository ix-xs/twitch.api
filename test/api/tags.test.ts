import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

const tag = {
  tag_id: "tag-1",
  is_auto: false,
  localization_names: { "en-us": "Cozy" },
  localization_descriptions: { "en-us": "For quiet streams" },
};

describe("tags", () => {
  it("all: one page when awaited, with the tag filter in the query", async () => {
    const t = createTestClient();
    t.reply({ data: [tag], pagination: { cursor: "c" } });
    const page = await t.twitch.tags.all({ tag_id: ["tag-1", "tag-2"], first: 2 });
    expect(page.data).toEqual([tag]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({ method: "GET", path: "tags/streams", token: "app-token" });
    expect(t.last().query).toEqual({ tag_id: ["tag-1", "tag-2"], first: "2" });
  });

  it("all: iterating walks every page at the largest page size", async () => {
    const t = createTestClient();
    t.reply({ data: [{ tag_id: "tag-1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ tag_id: "tag-2" }], pagination: {} });
    expect(await t.twitch.tags.all().all()).toEqual([{ tag_id: "tag-1" }, { tag_id: "tag-2" }]);
    expect(t.calls[0]?.query).toEqual({ first: "100" });
    expect(t.calls[1]?.query).toEqual({ first: "100", after: "c" });
  });

  it("ofChannel: lists the tags of a broadcaster", async () => {
    const t = createTestClient();
    t.reply({ data: [tag] });
    expect(await t.twitch.tags.ofChannel({ broadcaster_id: "7" })).toEqual([tag]);
    expect(t.last()).toMatchObject({ method: "GET", path: "streams/tags", token: "app-token" });
    expect(t.last().query).toEqual({ broadcaster_id: "7" });
  });
});
