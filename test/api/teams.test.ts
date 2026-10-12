import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("teams", () => {
  it("ofChannel: lists the teams of a broadcaster", async () => {
    const t = createTestClient();
    const team = { id: "t1", team_name: "nightowls", broadcaster_id: "7", banner: null };
    t.reply({ data: [team] });
    expect(await t.twitch.teams.ofChannel({ broadcaster_id: "7" })).toEqual([team]);
    expect(t.last()).toMatchObject({ method: "GET", path: "teams/channel", token: "app-token" });
    expect(t.last().query).toEqual({ broadcaster_id: "7" });
  });

  it("ofChannel: an empty list when the broadcaster has no team", async () => {
    const t = createTestClient();
    t.reply({ data: null });
    expect(await t.twitch.teams.ofChannel({ broadcaster_id: "7" })).toEqual([]);
  });

  it("get: returns the single team, by name or by ID", async () => {
    const t = createTestClient();
    const team = { id: "t1", team_name: "nightowls", users: [{ user_id: "7", user_login: "seven" }] };
    t.reply({ data: [team] });
    expect(await t.twitch.teams.get({ name: "nightowls" })).toEqual(team);
    expect(t.last()).toMatchObject({ method: "GET", path: "teams", token: "app-token" });
    expect(t.last().query).toEqual({ name: "nightowls" });

    t.reply({ data: [team] });
    await t.twitch.teams.get({ id: "t1" });
    expect(t.last().query).toEqual({ id: "t1" });
  });

  it("get: null when Twitch returns no team", async () => {
    const t = createTestClient();
    t.reply({ data: [] });
    expect(await t.twitch.teams.get({ id: "nope" })).toBeNull();
  });
});
