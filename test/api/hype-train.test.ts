import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("hypeTrain", () => {
  it("status: broadcaster_id defaults to the acting user, returns the single object", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const status = {
      current: {
        id: "train",
        broadcaster_user_id: "100",
        level: 2,
        total: 700,
        progress: 200,
        goal: 1000,
        top_contributions: [{ user_id: "5", user_login: "five", user_name: "Five", type: "bits", total: 50 }],
        shared_train_participants: null,
        type: "regular",
        is_shared_train: false,
      },
      all_time_high: { level: 4, total: 2100, achieved_at: "2024-02-03T04:05:06Z" },
      shared_all_time_high: null,
    };
    t.reply({ data: [status] });
    const result = await t.twitch.hypeTrain.status();
    expect(result).toEqual(status);
    expect(result.current?.top_contributions[0]?.total).toBe(50);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "hypetrain/status", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100" });
    expect(call.body).toBeUndefined();
  });

  it("status: picks the token of the broadcaster that is named", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    const idle = { current: null, all_time_high: null, shared_all_time_high: null };
    t.reply({ data: [idle] });
    expect(await t.twitch.hypeTrain.status({ broadcaster_id: "200" })).toEqual(idle);
    expect(t.last()).toMatchObject({ query: { broadcaster_id: "200" }, token: "token-of-200" });
  });
});
