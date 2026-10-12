import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("charity", () => {
  it("campaign: broadcaster_id defaults to the acting user, returns the campaign", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const campaign = {
      id: "camp",
      broadcaster_id: "100",
      charity_name: "Trees",
      current_amount: { value: 1250, decimal_places: 2, currency: "EUR" },
      target_amount: null,
    };
    t.reply({ data: [campaign] });
    expect(await t.twitch.charity.campaign()).toEqual(campaign);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "charity/campaigns", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100" });
    expect(call.body).toBeUndefined();
  });

  it("campaign: null when no campaign is running", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [] });
    expect(await t.twitch.charity.campaign({ broadcaster_id: "100" })).toBeNull();
  });

  it("donations: broadcaster_id defaults to the acting user and pages are walked", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const amount = { value: 500, decimal_places: 2, currency: "EUR" };
    t.reply({ data: [{ id: "d1", amount }], pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "d2", amount }], pagination: {} });
    const donations = await t.twitch.charity.donations().all();
    expect(donations).toEqual([
      { id: "d1", amount },
      { id: "d2", amount },
    ]);
    expect(t.calls[0]).toMatchObject({ method: "GET", path: "charity/donations", token: "token-of-100" });
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "100", first: "100" });
    expect(t.calls[1]?.query).toEqual({ broadcaster_id: "100", first: "100", after: "c" });
  });

  it("donations: one page when awaited, with the page size asked for", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ id: "d1" }], pagination: { cursor: "c" } });
    const page = await t.twitch.charity.donations({ first: 10 });
    expect(page.data).toEqual([{ id: "d1" }]);
    expect(page.cursor).toBe("c");
    expect(t.last().query).toEqual({ broadcaster_id: "100", first: "10" });
  });
});
