import { describe, expect, it } from "vitest";
import { TwitchScopeError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

const poll = { id: "p1", title: "Tea or coffee?", status: "ACTIVE", choices: [{ id: "c1", title: "Tea", votes: 3 }] };

describe("polls", () => {
  it("get: one page when awaited, broadcaster_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100", ["channel:read:polls"]);
    t.reply({ data: [poll], pagination: { cursor: "c" } });
    const page = await t.twitch.polls.get({ id: ["p1", "p2"], first: 2 });
    expect(page.data).toEqual([poll]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "polls",
      query: { broadcaster_id: "100", id: ["p1", "p2"], first: "2" },
      token: "token-of-100",
    });
  });

  it("get: walks every page 20 items at a time", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ id: "p1" }], pagination: { cursor: "next" } });
    t.reply({ data: [{ id: "p2" }], pagination: {} });
    const ids: string[] = [];
    for await (const item of t.twitch.polls.get()) ids.push(item.id);
    expect(ids).toEqual(["p1", "p2"]);
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "100", first: "20" });
    expect(t.calls[1]?.query).toEqual({ broadcaster_id: "100", first: "20", after: "next" });
  });

  it("create: everything in the body, plain strings become choice objects", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [poll] });
    const created = await t.twitch.polls.create({
      title: "Tea or coffee?",
      choices: ["Tea", { title: "Coffee" }],
      duration: 60,
      channel_points_voting_enabled: true,
      channel_points_per_vote: 10,
    });
    expect(created).toEqual(poll);
    const call = t.last();
    expect(call).toMatchObject({ method: "POST", path: "polls", query: {}, token: "token-of-100" });
    expect(call.body).toEqual({
      broadcaster_id: "100",
      title: "Tea or coffee?",
      choices: [{ title: "Tea" }, { title: "Coffee" }],
      duration: 60,
      channel_points_voting_enabled: true,
      channel_points_per_vote: 10,
    });
  });

  it("create: fails before the network when the scope is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["channel:read:polls"]);
    await expect(t.twitch.polls.create({ title: "x", choices: ["a", "b"], duration: 15 })).rejects.toBeInstanceOf(
      TwitchScopeError,
    );
    expect(t.calls).toHaveLength(0);
  });

  it("end: PATCH with the poll and its new status in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    t.reply({ data: [{ ...poll, status: "ARCHIVED" }] });
    const ended = await t.twitch.polls.end({ broadcaster_id: "200", id: "p1", status: "ARCHIVED" });
    expect(ended).toEqual({ ...poll, status: "ARCHIVED" });
    const call = t.last();
    expect(call).toMatchObject({ method: "PATCH", path: "polls", query: {}, token: "token-of-200" });
    expect(call.body).toEqual({ broadcaster_id: "200", id: "p1", status: "ARCHIVED" });

    t.reply({ data: [{ ...poll, status: "TERMINATED" }] });
    await t.twitch.polls.end({ id: "p1", status: "TERMINATED" }, { as: "100" });
    expect(t.last()).toMatchObject({ body: { broadcaster_id: "100", id: "p1", status: "TERMINATED" }, token: "token-of-100" });
  });
});
