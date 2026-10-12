import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("goals", () => {
  it("get: user token, broadcaster_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const goal = { id: "g1", broadcaster_id: "100", type: "follower", current_amount: 120, target_amount: 200 };
    t.reply({ data: [goal] });
    expect(await t.twitch.goals.get()).toEqual([goal]);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "goals", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100" });
    expect(call.body).toBeUndefined();
  });

  it("get: picks the token of the broadcaster that is named", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    expect(await t.twitch.goals.get({ broadcaster_id: "200" })).toEqual([]);
    expect(t.last()).toMatchObject({ query: { broadcaster_id: "200" }, token: "token-of-200" });
  });
});
