import { describe, expect, it } from "vitest";
import { TwitchScopeError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

describe("raids", () => {
  it("start: POST with both IDs in the query, the raider defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const raid = { created_at: "2024-05-01T10:00:00Z", is_mature: false };
    t.reply({ data: [raid] });
    expect(await t.twitch.raids.start({ to_broadcaster_id: "200" })).toEqual(raid);
    const call = t.last();
    expect(call).toMatchObject({
      method: "POST",
      path: "raids",
      query: { from_broadcaster_id: "100", to_broadcaster_id: "200" },
      token: "token-of-100",
    });
    expect(call.body).toBeUndefined();
  });

  it("start: an explicit from_broadcaster_id picks that user's token", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("300");
    t.reply({ data: [{ created_at: "2024-05-01T10:00:00Z", is_mature: false }] });
    await t.twitch.raids.start({ from_broadcaster_id: "300", to_broadcaster_id: "200" });
    expect(t.last()).toMatchObject({
      query: { from_broadcaster_id: "300", to_broadcaster_id: "200" },
      token: "token-of-300",
    });
  });

  it("start: fails before the network when the scope is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["channel:read:polls"]);
    await expect(t.twitch.raids.start({ to_broadcaster_id: "200" })).rejects.toBeInstanceOf(TwitchScopeError);
    expect(t.calls).toHaveLength(0);
  });

  it("cancel: DELETE with broadcaster_id defaulted to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(await t.twitch.raids.cancel()).toBeUndefined();
    const call = t.last();
    expect(call).toMatchObject({ method: "DELETE", path: "raids", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100" });
    expect(call.body).toBeUndefined();
  });
});
