import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

const schedule = {
  segments: [{ id: "seg1", title: "Morning show" }],
  broadcaster_id: "7",
  broadcaster_name: "Seven",
  broadcaster_login: "seven",
  vacation: null,
};

describe("schedule", () => {
  it("get: yields segments and keeps the rest of the schedule in raw", async () => {
    const t = createTestClient();
    t.reply({ data: schedule, pagination: { cursor: "c" } });
    const page = await t.twitch.schedule.get({
      broadcaster_id: "7",
      id: ["seg1", "seg2"],
      start_time: new Date("2026-03-01T10:00:00Z"),
      first: 5,
    });
    expect(page.data).toEqual([{ id: "seg1", title: "Morning show" }]);
    expect(page.cursor).toBe("c");
    expect(page.raw.data.broadcaster_login).toBe("seven");
    expect(page.raw.data.vacation).toBeNull();
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "schedule",
      query: { broadcaster_id: "7", id: ["seg1", "seg2"], start_time: "2026-03-01T10:00:00.000Z", first: "5" },
      token: "app-token",
    });
  });

  it("get: iterating walks every page, 25 segments at a time", async () => {
    const t = createTestClient();
    t.reply({ data: schedule, pagination: { cursor: "c" } });
    t.reply({ data: { ...schedule, segments: [{ id: "seg2" }] }, pagination: {} });
    const ids: string[] = [];
    for await (const segment of t.twitch.schedule.get({ broadcaster_id: "7" })) ids.push(segment.id);
    expect(ids).toEqual(["seg1", "seg2"]);
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "7", first: "25" });
    expect(t.calls[1]?.query).toEqual({ broadcaster_id: "7", first: "25", after: "c" });
  });

  it("get: a schedule without segments is an empty page", async () => {
    const t = createTestClient();
    t.reply({ data: { ...schedule, segments: null }, pagination: {} });
    expect(await t.twitch.schedule.get({ broadcaster_id: "7" }).all()).toEqual([]);
  });

  it("icalendar: returns the text as is", async () => {
    const t = createTestClient();
    const ics = "BEGIN:VCALENDAR\nNAME:Seven\nEND:VCALENDAR";
    t.reply(ics);
    expect(await t.twitch.schedule.icalendar({ broadcaster_id: "7" })).toBe(ics);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "schedule/icalendar",
      query: { broadcaster_id: "7" },
      token: "app-token",
    });
  });

  it("updateSettings: PATCH with everything in the query, broadcaster_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    const result = await t.twitch.schedule.updateSettings({
      is_vacation_enabled: true,
      vacation_start_time: new Date("2026-08-01T00:00:00Z"),
      vacation_end_time: "2026-08-15T00:00:00Z",
      timezone: "Europe/Paris",
    });
    expect(result).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "PATCH", path: "schedule/settings", token: "token-of-100" });
    expect(t.last().query).toEqual({
      broadcaster_id: "100",
      is_vacation_enabled: "true",
      vacation_start_time: "2026-08-01T00:00:00.000Z",
      vacation_end_time: "2026-08-15T00:00:00Z",
      timezone: "Europe/Paris",
    });
    expect(t.last().body).toBeUndefined();
  });

  it("createSegment: broadcaster_id in the query, the rest in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: schedule });
    const created = await t.twitch.schedule.createSegment({
      start_time: new Date("2026-07-01T18:00:00Z"),
      timezone: "Europe/Paris",
      duration: "120",
      is_recurring: true,
      category_id: "42",
      title: "Morning show",
    });
    expect(created).toEqual(schedule);
    expect(t.last()).toMatchObject({ method: "POST", path: "schedule/segment", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "100" });
    expect(t.last().body).toEqual({
      start_time: "2026-07-01T18:00:00.000Z",
      timezone: "Europe/Paris",
      duration: "120",
      is_recurring: true,
      category_id: "42",
      title: "Morning show",
    });
  });

  it("updateSegment: broadcaster_id and id in the query, the changes in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: schedule });
    const updated = await t.twitch.schedule.updateSegment({ id: "seg1", duration: "90", is_canceled: false });
    expect(updated).toEqual(schedule);
    expect(t.last()).toMatchObject({ method: "PATCH", path: "schedule/segment", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "100", id: "seg1" });
    expect(t.last().body).toEqual({ duration: "90", is_canceled: false });
  });

  it("deleteSegment: DELETE with the segment in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    t.reply(undefined);
    expect(await t.twitch.schedule.deleteSegment({ broadcaster_id: "200", id: "seg1" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "DELETE", path: "schedule/segment", token: "token-of-200" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", id: "seg1" });
    expect(t.last().body).toBeUndefined();
  });
});
