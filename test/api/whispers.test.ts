import { describe, expect, it } from "vitest";
import { TwitchScopeError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

describe("whispers", () => {
  it("send: POST with the users in the query and the message in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(await t.twitch.whispers.send({ to_user_id: "7", message: "hello" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "POST", path: "whispers", token: "token-of-100" });
    expect(t.last().query).toEqual({ from_user_id: "100", to_user_id: "7" });
    expect(t.last().body).toEqual({ message: "hello" });
  });

  it("send: picks the token of the sender named in the call", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    t.reply(undefined);
    await t.twitch.whispers.send({ from_user_id: "200", to_user_id: "7", message: "hello" });
    expect(t.last()).toMatchObject({ query: { from_user_id: "200", to_user_id: "7" }, token: "token-of-200" });
  });

  it("send: fails before the network when the scope is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["user:read:whispers"]);
    await expect(t.twitch.whispers.send({ to_user_id: "7", message: "hello" })).rejects.toBeInstanceOf(TwitchScopeError);
    expect(t.calls).toHaveLength(0);
  });
});
