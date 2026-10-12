import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("entitlements", () => {
  it("drops: one page when awaited, with the filters in the query", async () => {
    const t = createTestClient();
    const entitlement = { id: "e1", benefit_id: "b1", user_id: "7", game_id: "42", fulfillment_status: "CLAIMED" };
    t.reply({ data: [entitlement], pagination: { cursor: "c" } });
    const page = await t.twitch.entitlements.drops({
      id: ["e1", "e2"],
      user_id: "7",
      game_id: "42",
      fulfillment_status: "CLAIMED",
      first: 50,
    });
    expect(page.data).toEqual([entitlement]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({ method: "GET", path: "entitlements/drops", token: "app-token" });
    expect(t.last().query).toEqual({
      id: ["e1", "e2"],
      user_id: "7",
      game_id: "42",
      fulfillment_status: "CLAIMED",
      first: "50",
    });
  });

  it("drops: iterating walks every page, 1000 entitlements at a time", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "e1" }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "e2" }], pagination: {} });
    const ids: string[] = [];
    for await (const entitlement of t.twitch.entitlements.drops()) ids.push(entitlement.id);
    expect(ids).toEqual(["e1", "e2"]);
    expect(t.calls[0]?.query).toEqual({ first: "1000" });
    expect(t.calls[1]?.query).toEqual({ first: "1000", after: "c" });
  });

  it("drops: a user token is used when asked for", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.twitch.entitlements.drops({ game_id: "42" }, { as: "100" });
    expect(t.last()).toMatchObject({ query: { game_id: "42" }, token: "token-of-100" });
  });

  it("updateDrops: PATCH with a JSON body, returns the outcome of each group", async () => {
    const t = createTestClient();
    const results = [
      { status: "SUCCESS", ids: ["e1"] },
      { status: "NOT_FOUND", ids: ["e2"] },
    ];
    t.reply({ data: results });
    const updated = await t.twitch.entitlements.updateDrops({
      entitlement_ids: ["e1", "e2"],
      fulfillment_status: "FULFILLED",
    });
    expect(updated).toEqual(results);
    expect(t.last()).toMatchObject({ method: "PATCH", path: "entitlements/drops", token: "app-token" });
    expect(t.last().query).toEqual({});
    expect(t.last().body).toEqual({ entitlement_ids: ["e1", "e2"], fulfillment_status: "FULFILLED" });
  });
});
