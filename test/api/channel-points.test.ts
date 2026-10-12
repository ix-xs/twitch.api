import { describe, expect, it } from "vitest";
import { TwitchScopeError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

const reward = { id: "r1", title: "Hydrate", cost: 500 };
const redemption = { id: "x1", user_id: "7", status: "UNFULFILLED", reward: { id: "r1" } };

describe("channelPoints", () => {
  it("createReward: broadcaster_id in the query, the rest in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [reward] });
    const created = await t.twitch.channelPoints.createReward({ title: "Hydrate", cost: 500, is_enabled: false });
    expect(created).toEqual(reward);
    expect(t.last()).toMatchObject({
      method: "POST",
      path: "channel_points/custom_rewards",
      query: { broadcaster_id: "100" },
      body: { title: "Hydrate", cost: 500, is_enabled: false },
      token: "token-of-100",
    });
    expect(t.last().body).not.toHaveProperty("broadcaster_id");
  });

  it("createReward: an explicit broadcaster_id picks that user's token", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    t.reply({ data: [reward] });
    await t.twitch.channelPoints.createReward({ broadcaster_id: "200", title: "Hydrate", cost: 500 });
    expect(t.last()).toMatchObject({ query: { broadcaster_id: "200" }, token: "token-of-200" });
  });

  it("createReward: fails before the network when the scope is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["channel:read:redemptions"]);
    await expect(t.twitch.channelPoints.createReward({ title: "Hydrate", cost: 500 })).rejects.toBeInstanceOf(
      TwitchScopeError,
    );
    expect(t.calls).toHaveLength(0);
  });

  it("deleteReward: DELETE with both IDs in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(await t.twitch.channelPoints.deleteReward({ id: "r1" })).toBeUndefined();
    const call = t.last();
    expect(call).toMatchObject({
      method: "DELETE",
      path: "channel_points/custom_rewards",
      query: { broadcaster_id: "100", id: "r1" },
      token: "token-of-100",
    });
    expect(call.body).toBeUndefined();
  });

  it("rewards: lists the rewards of the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100", ["channel:read:redemptions"]);
    t.reply({ data: [reward] });
    const rewards = await t.twitch.channelPoints.rewards({ id: ["r1", "r2"], only_manageable_rewards: true });
    expect(rewards).toEqual([reward]);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "channel_points/custom_rewards",
      query: { broadcaster_id: "100", id: ["r1", "r2"], only_manageable_rewards: "true" },
      token: "token-of-100",
    });
  });

  it("rewards: splits more than 50 IDs into several requests", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.twitch.channelPoints.rewards({ id: Array.from({ length: 60 }, (_, i) => `r${i}`) });
    expect(t.calls).toHaveLength(2);
    expect(t.calls.map((call) => (call.query["id"] as string[]).length)).toEqual([50, 10]);
    expect(t.calls.map((call) => call.query["broadcaster_id"])).toEqual(["100", "100"]);
  });

  it("redemptions: one page when awaited, with the filters in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [redemption], pagination: { cursor: "c" } });
    const page = await t.twitch.channelPoints.redemptions({ reward_id: "r1", status: "UNFULFILLED", sort: "NEWEST" });
    expect(page.data).toEqual([redemption]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "channel_points/custom_rewards/redemptions",
      query: { broadcaster_id: "100", reward_id: "r1", status: "UNFULFILLED", sort: "NEWEST" },
      token: "token-of-100",
    });
  });

  it("redemptions: walks every page 50 items at a time", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ id: "x1" }], pagination: { cursor: "next" } });
    t.reply({ data: [{ id: "x2" }], pagination: {} });
    const all = await t.twitch.channelPoints.redemptions({ reward_id: "r1", status: "FULFILLED" }).all();
    expect(all).toEqual([{ id: "x1" }, { id: "x2" }]);
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "100", reward_id: "r1", status: "FULFILLED", first: "50" });
    expect(t.calls[1]?.query).toMatchObject({ first: "50", after: "next" });
  });

  it("updateReward: PATCH with the IDs in the query and the changes in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ ...reward, is_paused: true }] });
    const updated = await t.twitch.channelPoints.updateReward({ id: "r1", is_paused: true, cost: 750 });
    expect(updated).toEqual({ ...reward, is_paused: true });
    const call = t.last();
    expect(call).toMatchObject({
      method: "PATCH",
      path: "channel_points/custom_rewards",
      query: { broadcaster_id: "100", id: "r1" },
      token: "token-of-100",
    });
    expect(call.body).toEqual({ is_paused: true, cost: 750 });
  });

  it("updateRedemptions: IDs in the query, status in the body, returns the list", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const fulfilled = [
      { ...redemption, status: "FULFILLED" },
      { ...redemption, id: "x2", status: "FULFILLED" },
    ];
    t.reply({ data: fulfilled });
    const updated = await t.twitch.channelPoints.updateRedemptions({
      reward_id: "r1",
      id: ["x1", "x2"],
      status: "FULFILLED",
    });
    expect(updated).toEqual(fulfilled);
    const call = t.last();
    expect(call).toMatchObject({
      method: "PATCH",
      path: "channel_points/custom_rewards/redemptions",
      token: "token-of-100",
    });
    expect(call.query).toEqual({ broadcaster_id: "100", reward_id: "r1", id: ["x1", "x2"] });
    expect(call.body).toEqual({ status: "FULFILLED" });
  });
});
