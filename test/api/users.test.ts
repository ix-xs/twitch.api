import { describe, expect, it } from "vitest";
import { TwitchScopeError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

const user = { id: "1", login: "one", display_name: "One" };

describe("users", () => {
  it("get: repeats id and login keys and uses the app token", async () => {
    const t = createTestClient();
    t.reply({ data: [user] });
    const users = await t.twitch.users.get({ id: ["1", "2"], login: "one" });
    expect(users).toEqual([user]);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "users",
      query: { id: ["1", "2"], login: "one" },
      token: "app-token",
    });
  });

  it("get: splits more than 100 lookups into several requests", async () => {
    const t = createTestClient();
    const ids = Array.from({ length: 230 }, (_, i) => String(i));
    await t.twitch.users.get({ id: ids });
    expect(t.calls).toHaveLength(3);
    expect(t.calls.map((call) => (call.query["id"] as string[]).length)).toEqual([100, 100, 30]);
  });

  it("getById / getByLogin: merge calls of the same tick into one request", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "1" }, { id: "2" }] });
    const [a, b, missing, again] = await Promise.all([
      t.twitch.users.getById("1"),
      t.twitch.users.getById("2"),
      t.twitch.users.getById("3"),
      t.twitch.users.getById("1"),
    ]);
    expect(t.calls).toHaveLength(1);
    expect(t.last().query).toEqual({ id: ["1", "2", "3"] });
    expect(a).toEqual({ id: "1" });
    expect(b).toEqual({ id: "2" });
    expect(missing).toBeNull();
    expect(again).toBe(a);

    t.reply({ data: [{ id: "9", login: "twitchdev" }] });
    expect(await t.twitch.users.getByLogin("TwitchDev")).toEqual({ id: "9", login: "twitchdev" });
    expect(t.last().query).toEqual({ login: "twitchdev" });
  });

  it("me: uses the user token without parameters", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [user] });
    expect(await t.twitch.users.me()).toEqual(user);
    expect(t.last()).toMatchObject({ path: "users", query: {}, token: "token-of-100" });
  });

  it("update: PUT with the description in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [user] });
    await t.twitch.users.update({ description: "" });
    expect(t.last()).toMatchObject({ method: "PUT", path: "users", query: { description: "" } });
  });

  it("update: fails before the network when the scope is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["user:read:email"]);
    await expect(t.twitch.users.update({ description: "x" })).rejects.toBeInstanceOf(TwitchScopeError);
    expect(t.calls).toHaveLength(0);
  });

  it("authorization: app token, chunks of 10", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.twitch.users.authorization({ user_id: Array.from({ length: 12 }, (_, i) => String(i)) });
    expect(t.calls).toHaveLength(2);
    expect(t.calls[0]).toMatchObject({ path: "authorization/users", token: "app-token" });
  });

  it("blocks: fills broadcaster_id with the acting user and paginates", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ user_id: "5" }], pagination: { cursor: "next" } });
    t.reply({ data: [{ user_id: "6" }], pagination: {} });
    const all = await t.twitch.users.blocks().all();
    expect(all).toEqual([{ user_id: "5" }, { user_id: "6" }]);
    expect(t.calls[0]).toMatchObject({ path: "users/blocks", query: { broadcaster_id: "100", first: "100" } });
    expect(t.calls[1]?.query).toMatchObject({ after: "next" });
  });

  it("block / unblock", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    await t.twitch.users.block({ target_user_id: "5", reason: "spam", source_context: "chat" });
    expect(t.last()).toMatchObject({
      method: "PUT",
      path: "users/blocks",
      query: { target_user_id: "5", reason: "spam", source_context: "chat" },
    });
    t.reply(undefined);
    await t.twitch.users.unblock({ target_user_id: "5" });
    expect(t.last()).toMatchObject({ method: "DELETE", path: "users/blocks", query: { target_user_id: "5" } });
  });

  it("extensions / activeExtensions / updateExtensions", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ id: "ext" }] });
    expect(await t.twitch.users.extensions()).toEqual([{ id: "ext" }]);
    expect(t.last()).toMatchObject({ path: "users/extensions/list", token: "token-of-100" });

    const active = { panel: { "1": { active: false } }, overlay: {}, component: {} };
    t.reply({ data: active });
    expect(await t.twitch.users.activeExtensions({ user_id: "7" })).toEqual(active);
    expect(t.last()).toMatchObject({ path: "users/extensions", query: { user_id: "7" }, token: "app-token" });

    t.reply({ data: active });
    const data = { panel: { "1": { active: true, id: "ext", version: "1.0.0" } } };
    expect(await t.twitch.users.updateExtensions({ data })).toEqual(active);
    expect(t.last()).toMatchObject({ method: "PUT", path: "users/extensions", body: { data } });
  });
});
