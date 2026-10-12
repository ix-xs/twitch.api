import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("ads", () => {
  it("startCommercial: POST with a JSON body and the token of the broadcaster", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const status = { length: 60, message: "", retry_after: 480 };
    t.reply({ data: [status] });
    expect(await t.twitch.ads.startCommercial({ broadcaster_id: "100", length: 60 })).toEqual(status);
    const call = t.last();
    expect(call).toMatchObject({ method: "POST", path: "channels/commercial", token: "token-of-100" });
    expect(call.query).toEqual({});
    expect(call.body).toEqual({ broadcaster_id: "100", length: 60 });
  });

  it("startCommercial: broadcaster_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ length: 30, message: "", retry_after: 480 }] });
    await t.twitch.as("100").ads.startCommercial({ length: 30 });
    expect(t.last()).toMatchObject({ token: "token-of-100", body: { broadcaster_id: "100", length: 30 } });

    t.reply({ data: [{ length: 30, message: "", retry_after: 480 }] });
    await t.twitch.ads.startCommercial({ length: 30 }, { as: "100" });
    expect(t.last()).toMatchObject({ token: "token-of-100", body: { broadcaster_id: "100", length: 30 } });
  });

  it("startCommercial: falls back to the app token for a broadcaster that is not registered", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ length: 30, message: "", retry_after: 480 }] });
    await t.twitch.ads.startCommercial({ broadcaster_id: "200", length: 30 });
    expect(t.last()).toMatchObject({ token: "app-token", body: { broadcaster_id: "200", length: 30 } });
  });

  it("schedule: GET with broadcaster_id in the query, returns the single object", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const schedule = { snooze_count: 2, next_ad_at: "2024-05-06T07:08:09Z", duration: 90, preroll_free_time: 0 };
    t.reply({ data: [schedule] });
    expect(await t.twitch.ads.schedule({ broadcaster_id: "100" })).toEqual(schedule);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "channels/ads", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100" });
    expect(call.body).toBeUndefined();

    t.reply({ data: [schedule] });
    await t.twitch.as("100").ads.schedule();
    expect(t.last()).toMatchObject({ query: { broadcaster_id: "100" }, token: "token-of-100" });

    t.reply({ data: [schedule] });
    await t.twitch.ads.schedule({ broadcaster_id: "200" });
    expect(t.last()).toMatchObject({ query: { broadcaster_id: "200" }, token: "app-token" });
  });

  it("snooze: POST with broadcaster_id in the query and no body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const snooze = { snooze_count: 1, snooze_refresh_at: "2024-05-06T08:00:00Z", next_ad_at: "2024-05-06T07:13:09Z" };
    t.reply({ data: [snooze] });
    expect(await t.twitch.ads.snooze({ broadcaster_id: "100" })).toEqual(snooze);
    const call = t.last();
    expect(call).toMatchObject({ method: "POST", path: "channels/ads/schedule/snooze", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100" });
    expect(call.body).toBeUndefined();

    t.reply({ data: [snooze] });
    await t.twitch.as("100").ads.snooze();
    expect(t.last()).toMatchObject({ query: { broadcaster_id: "100" }, token: "token-of-100" });
  });
});
