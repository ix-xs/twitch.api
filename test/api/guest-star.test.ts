import { describe, expect, it } from "vitest";
import { TwitchScopeError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

const session = { id: "sess", guests: [{ slot_id: "0", user_id: "100", is_live: true }] };

describe("guestStar", () => {
  it("settings: moderator_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const settings = { slot_count: 4, group_layout: "TILED_LAYOUT", browser_source_token: "tok" };
    t.reply({ data: [settings] });
    expect(await t.twitch.guestStar.settings({ broadcaster_id: "9" })).toEqual(settings);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "guest_star/channel_settings", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "9", moderator_id: "100" });
  });

  it("settings: picks the token of the moderator named in the call", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    t.reply({ data: [{ slot_count: 2 }] });
    await t.twitch.guestStar.settings({ broadcaster_id: "9", moderator_id: "200" });
    expect(t.last()).toMatchObject({ query: { broadcaster_id: "9", moderator_id: "200" }, token: "token-of-200" });
  });

  it("updateSettings: broadcaster_id in the query, the settings in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    const result = await t.twitch.guestStar.updateSettings({ slot_count: 6, group_layout: "VERTICAL_LAYOUT" });
    expect(result).toBeUndefined();
    const call = t.last();
    expect(call).toMatchObject({ method: "PUT", path: "guest_star/channel_settings", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100" });
    expect(call.body).toEqual({ slot_count: 6, group_layout: "VERTICAL_LAYOUT" });
  });

  it("updateSettings: fails before the network when the scope is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["channel:read:guest_star"]);
    await expect(t.twitch.guestStar.updateSettings({ slot_count: 2 })).rejects.toBeInstanceOf(TwitchScopeError);
    expect(t.calls).toHaveLength(0);
  });

  it("session: returns the session, or null when none is running", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [session] });
    expect(await t.twitch.guestStar.session({ broadcaster_id: "9" })).toEqual(session);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "guest_star/session", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "9", moderator_id: "100" });

    t.reply({ data: [] });
    expect(await t.twitch.guestStar.session({ broadcaster_id: "9" })).toBeNull();
  });

  it("createSession: POST, broadcaster_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [session] });
    expect(await t.twitch.guestStar.createSession()).toEqual(session);
    const call = t.last();
    expect(call).toMatchObject({ method: "POST", path: "guest_star/session", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100" });
    expect(call.body).toBeUndefined();
  });

  it("endSession: DELETE, returns the ended session or null on an empty answer", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [session] });
    expect(await t.twitch.guestStar.endSession({ session_id: "sess" })).toEqual(session);
    const call = t.last();
    expect(call).toMatchObject({ method: "DELETE", path: "guest_star/session", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "100", session_id: "sess" });

    t.reply(undefined);
    expect(await t.twitch.guestStar.endSession({ session_id: "sess" })).toBeNull();
  });

  it("invites: lists the invitations of a session", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const invite = { user_id: "5", status: "READY", is_audio_enabled: true };
    t.reply({ data: [invite] });
    expect(await t.twitch.guestStar.invites({ broadcaster_id: "9", session_id: "sess" })).toEqual([invite]);
    const call = t.last();
    expect(call).toMatchObject({ method: "GET", path: "guest_star/invites", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "9", moderator_id: "100", session_id: "sess" });
  });

  it("invite / deleteInvite: everything in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const query = { broadcaster_id: "9", moderator_id: "100", session_id: "sess", guest_id: "5" };

    t.reply(undefined);
    expect(await t.twitch.guestStar.invite({ broadcaster_id: "9", session_id: "sess", guest_id: "5" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "POST", path: "guest_star/invites", token: "token-of-100" });
    expect(t.last().query).toEqual(query);
    expect(t.last().body).toBeUndefined();

    t.reply(undefined);
    await t.twitch.guestStar.deleteInvite({ broadcaster_id: "9", session_id: "sess", guest_id: "5" });
    expect(t.last()).toMatchObject({ method: "DELETE", path: "guest_star/invites", token: "token-of-100" });
    expect(t.last().query).toEqual(query);
  });

  it("assignSlot: POST with the slot in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    const result = await t.twitch.guestStar.assignSlot({ broadcaster_id: "9", session_id: "sess", guest_id: "5", slot_id: "1" });
    expect(result).toBeUndefined();
    const call = t.last();
    expect(call).toMatchObject({ method: "POST", path: "guest_star/slot", token: "token-of-100" });
    expect(call.query).toEqual({ broadcaster_id: "9", moderator_id: "100", session_id: "sess", guest_id: "5", slot_id: "1" });
    expect(call.body).toBeUndefined();
  });

  it("updateSlot: PATCH with source and destination", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    await t.twitch.guestStar.updateSlot({
      broadcaster_id: "9",
      session_id: "sess",
      source_slot_id: "1",
      destination_slot_id: "2",
    });
    const call = t.last();
    expect(call).toMatchObject({ method: "PATCH", path: "guest_star/slot", token: "token-of-100" });
    expect(call.query).toEqual({
      broadcaster_id: "9",
      moderator_id: "100",
      session_id: "sess",
      source_slot_id: "1",
      destination_slot_id: "2",
    });
  });

  it("deleteSlot: DELETE, with the reinvite flag as text", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    await t.twitch.guestStar.deleteSlot({
      broadcaster_id: "9",
      session_id: "sess",
      guest_id: "5",
      slot_id: "1",
      should_reinvite_guest: true,
    });
    const call = t.last();
    expect(call).toMatchObject({ method: "DELETE", path: "guest_star/slot", token: "token-of-100" });
    expect(call.query).toEqual({
      broadcaster_id: "9",
      moderator_id: "100",
      session_id: "sess",
      guest_id: "5",
      slot_id: "1",
      should_reinvite_guest: "true",
    });
  });

  it("updateSlotSettings: PATCH with the settings in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    await t.twitch.guestStar.updateSlotSettings({
      broadcaster_id: "9",
      session_id: "sess",
      slot_id: "1",
      is_audio_enabled: false,
      volume: 40,
    });
    const call = t.last();
    expect(call).toMatchObject({ method: "PATCH", path: "guest_star/slot_settings", token: "token-of-100" });
    expect(call.query).toEqual({
      broadcaster_id: "9",
      moderator_id: "100",
      session_id: "sess",
      slot_id: "1",
      is_audio_enabled: "false",
      volume: "40",
    });
    expect(call.body).toBeUndefined();
  });
});
