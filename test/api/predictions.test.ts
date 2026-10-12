import { describe, expect, it } from "vitest";
import { TwitchScopeError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

const prediction = {
  id: "q1",
  title: "First try?",
  status: "ACTIVE",
  winning_outcome_id: null,
  outcomes: [{ id: "o1", title: "Yes", color: "BLUE", top_predictors: null }],
};

describe("predictions", () => {
  it("get: one page when awaited, broadcaster_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100", ["channel:read:predictions"]);
    t.reply({ data: [prediction], pagination: {} });
    const page = await t.twitch.predictions.get({ id: "q1", first: 5 });
    expect(page.data).toEqual([prediction]);
    expect(page.hasNext).toBe(false);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "predictions",
      query: { broadcaster_id: "100", id: "q1", first: "5" },
      token: "token-of-100",
    });
  });

  it("get: walks every page 25 items at a time", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ id: "q1" }], pagination: { cursor: "next" } });
    t.reply({ data: [{ id: "q2" }], pagination: {} });
    const all = await t.twitch.predictions.get().all();
    expect(all).toEqual([{ id: "q1" }, { id: "q2" }]);
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "100", first: "25" });
    expect(t.calls[1]?.query).toEqual({ broadcaster_id: "100", first: "25", after: "next" });
  });

  it("create: everything in the body, plain strings become outcome objects", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [prediction] });
    const created = await t.twitch.predictions.create({
      title: "First try?",
      outcomes: ["Yes", { title: "No" }],
      prediction_window: 90,
    });
    expect(created).toEqual(prediction);
    const call = t.last();
    expect(call).toMatchObject({ method: "POST", path: "predictions", query: {}, token: "token-of-100" });
    expect(call.body).toEqual({
      broadcaster_id: "100",
      title: "First try?",
      outcomes: [{ title: "Yes" }, { title: "No" }],
      prediction_window: 90,
    });
  });

  it("create: fails before the network when the scope is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["channel:read:predictions"]);
    await expect(
      t.twitch.predictions.create({ title: "x", outcomes: ["a", "b"], prediction_window: 30 }),
    ).rejects.toBeInstanceOf(TwitchScopeError);
    expect(t.calls).toHaveLength(0);
  });

  it("end: PATCH with the status and the winner in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const resolved = { ...prediction, status: "RESOLVED", winning_outcome_id: "o1" };
    t.reply({ data: [resolved] });
    const ended = await t.twitch.predictions.end({ id: "q1", status: "RESOLVED", winning_outcome_id: "o1" });
    expect(ended).toEqual(resolved);
    const call = t.last();
    expect(call).toMatchObject({ method: "PATCH", path: "predictions", query: {}, token: "token-of-100" });
    expect(call.body).toEqual({ broadcaster_id: "100", id: "q1", status: "RESOLVED", winning_outcome_id: "o1" });
  });
});
