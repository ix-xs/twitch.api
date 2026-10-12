import { describe, expect, it } from "vitest";
import { TwitchScopeError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

const levels = {
  disability: 1,
  aggression: 2,
  sexuality_sex_or_gender: 0,
  misogyny: 0,
  bullying: 3,
  swearing: 0,
  race_ethnicity_or_religion: 4,
  sex_based_terms: 0,
};
const settings = { broadcaster_id: "200", moderator_id: "100", overall_level: null, ...levels };
const term = { id: "t1", broadcaster_id: "200", moderator_id: "100", text: "nope", expires_at: null };
const shield = { is_active: true, moderator_id: "100", moderator_login: "mod", moderator_name: "Mod" };
const request = { id: "r1", broadcaster_id: "200", user_id: "5", status: "pending", resolved_at: null };
const suspicious = { user_id: "5", broadcaster_id: "200", moderator_id: "100", status: "RESTRICTED", types: [] };

describe("moderation", () => {
  it("checkAutoMod: POST with the messages in the body and broadcaster_id defaulted", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ msg_id: "a", is_permitted: false }] });
    const data = [{ msg_id: "a", msg_text: "hello" }];
    const results = await t.twitch.moderation.checkAutoMod({ data }, { as: "100" });
    expect(results).toEqual([{ msg_id: "a", is_permitted: false }]);
    expect(t.last()).toMatchObject({
      method: "POST",
      path: "moderation/enforcements/status",
      body: { data },
      token: "token-of-100",
    });
    expect(t.last().query).toEqual({ broadcaster_id: "100" });
  });

  it("manageAutoModMessage: everything in the body, user_id defaulted there", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    const result = await t.twitch.moderation.manageAutoModMessage({ msg_id: "m1", action: "DENY" }, { as: "100" });
    expect(result).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "POST", path: "moderation/automod/message", token: "token-of-100" });
    expect(t.last().query).toEqual({});
    expect(t.last().body).toEqual({ user_id: "100", msg_id: "m1", action: "DENY" });
  });

  it("autoModSettings: picks the token of the moderator named in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [settings] });
    expect(await t.twitch.moderation.autoModSettings({ broadcaster_id: "200", moderator_id: "100" })).toEqual(settings);
    expect(t.last()).toMatchObject({ method: "GET", path: "moderation/automod/settings", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100" });
    expect(t.last().body).toBeUndefined();
  });

  it("autoModSettings: falls back to the app token for a moderator that is not registered", async () => {
    const t = createTestClient();
    t.reply({ data: [settings] });
    await t.twitch.moderation.autoModSettings({ broadcaster_id: "200", moderator_id: "300" });
    expect(t.last()).toMatchObject({ query: { broadcaster_id: "200", moderator_id: "300" }, token: "app-token" });
  });

  it("updateAutoModSettings: PUT with the IDs in the query and the levels in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [settings] });
    const updated = await t.twitch.moderation.updateAutoModSettings(
      { broadcaster_id: "200", swearing: 2, bullying: 4 },
      { as: "100" },
    );
    expect(updated).toEqual(settings);
    expect(t.last()).toMatchObject({ method: "PUT", path: "moderation/automod/settings", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100" });
    expect(t.last().body).toEqual({ swearing: 2, bullying: 4 });
  });

  it("updateAutoModSettings: fails before the network when the scope is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["moderator:read:automod_settings"]);
    await expect(
      t.twitch.moderation.updateAutoModSettings({ broadcaster_id: "200", moderator_id: "100", overall_level: 1 }),
    ).rejects.toBeInstanceOf(TwitchScopeError);
    expect(t.calls).toHaveLength(0);
  });

  it("bans: broadcaster_id defaulted, repeated user_id, walks every page", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ user_id: "5" }], pagination: { cursor: "next" } });
    t.reply({ data: [{ user_id: "6" }], pagination: {} });
    const banned = await t.twitch.moderation.bans({ user_id: ["5", "6"] }, { as: "100" }).all();
    expect(banned).toEqual([{ user_id: "5" }, { user_id: "6" }]);
    expect(t.calls[0]).toMatchObject({ method: "GET", path: "moderation/banned", token: "token-of-100" });
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "100", user_id: ["5", "6"], first: "100" });
    expect(t.calls[1]?.query).toMatchObject({ broadcaster_id: "100", after: "next" });
  });

  it("bans: pages backwards with before", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ user_id: "5" }], pagination: { cursor: "prev" } });
    const page = await t.twitch.moderation.bans({ broadcaster_id: "100", before: "cur", first: 3 });
    expect(page.cursor).toBe("prev");
    expect(t.last().query).toEqual({ broadcaster_id: "100", before: "cur", first: "3" });
  });

  it("ban: wraps the body in data and returns the ban", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const ban = { broadcaster_id: "200", moderator_id: "100", user_id: "5", end_time: null };
    t.reply({ data: [ban] });
    const result = await t.twitch.moderation.ban({ broadcaster_id: "200", user_id: "5", reason: "spam" }, { as: "100" });
    expect(result).toEqual(ban);
    expect(t.last()).toMatchObject({ method: "POST", path: "moderation/bans", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100" });
    expect(t.last().body).toEqual({ data: { user_id: "5", reason: "spam" } });
  });

  it("ban: a duration makes it a timeout", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ user_id: "5", end_time: "2030-01-01T00:10:00Z" }] });
    const timeout = await t.twitch.moderation.ban({
      broadcaster_id: "200",
      moderator_id: "100",
      user_id: "5",
      duration: 600,
    });
    expect(timeout.end_time).toBe("2030-01-01T00:10:00Z");
    expect(t.last().body).toEqual({ data: { user_id: "5", duration: 600 } });
    expect(t.last().token).toBe("token-of-100");
  });

  it("unban: DELETE with everything in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(await t.twitch.moderation.unban({ broadcaster_id: "200", user_id: "5" }, { as: "100" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "DELETE", path: "moderation/bans", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100", user_id: "5" });
    expect(t.last().body).toBeUndefined();
  });

  it("unbanRequests: user token, moderator_id defaulted, paginated", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [request], pagination: { cursor: "next" } });
    t.reply({ data: [{ ...request, id: "r2" }], pagination: {} });
    const ids: string[] = [];
    for await (const item of t.twitch.moderation.unbanRequests({ broadcaster_id: "200", status: "pending" })) {
      ids.push(item.id);
    }
    expect(ids).toEqual(["r1", "r2"]);
    expect(t.calls[0]).toMatchObject({ method: "GET", path: "moderation/unban_requests", token: "token-of-100" });
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "200", moderator_id: "100", status: "pending", first: "100" });
    expect(t.calls[1]?.query).toMatchObject({ after: "next" });
  });

  it("resolveUnbanRequest: PATCH with the decision in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const resolved = { ...request, status: "denied", resolution_text: "no" };
    t.reply({ data: [resolved] });
    const result = await t.twitch.moderation.resolveUnbanRequest({
      broadcaster_id: "200",
      unban_request_id: "r1",
      status: "denied",
      resolution_text: "no",
    });
    expect(result).toEqual(resolved);
    expect(t.last()).toMatchObject({ method: "PATCH", path: "moderation/unban_requests", token: "token-of-100" });
    expect(t.last().query).toEqual({
      broadcaster_id: "200",
      moderator_id: "100",
      unban_request_id: "r1",
      status: "denied",
      resolution_text: "no",
    });
    expect(t.last().body).toBeUndefined();
  });

  it("blockedTerms: paginated, with the moderator's token", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [term], pagination: { cursor: "c" } });
    const page = await t.twitch.moderation.blockedTerms({ broadcaster_id: "200", moderator_id: "100", first: 10 });
    expect(page.data).toEqual([term]);
    expect(page.cursor).toBe("c");
    expect(t.last()).toMatchObject({ method: "GET", path: "moderation/blocked_terms", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100", first: "10" });
  });

  it("addBlockedTerm: text in the body, IDs in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [term] });
    expect(await t.twitch.moderation.addBlockedTerm({ broadcaster_id: "200", text: "nope" }, { as: "100" })).toEqual(term);
    expect(t.last()).toMatchObject({ method: "POST", path: "moderation/blocked_terms", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100" });
    expect(t.last().body).toEqual({ text: "nope" });
  });

  it("removeBlockedTerm: DELETE by id", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    const result = await t.twitch.moderation.removeBlockedTerm({ broadcaster_id: "200", moderator_id: "100", id: "t1" });
    expect(result).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "DELETE", path: "moderation/blocked_terms", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100", id: "t1" });
  });

  it("deleteMessages: one message, or the whole chat without message_id", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    await t.twitch.moderation.deleteMessages({ broadcaster_id: "200", message_id: "abc" }, { as: "100" });
    expect(t.last()).toMatchObject({ method: "DELETE", path: "moderation/chat", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100", message_id: "abc" });

    t.reply(undefined);
    await t.twitch.moderation.deleteMessages({ broadcaster_id: "200", moderator_id: "100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100" });
  });

  it("moderatedChannels: user_id defaulted to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ broadcaster_id: "200" }], pagination: {} });
    const channels = await t.twitch.moderation.moderatedChannels({}, { as: "100" }).all();
    expect(channels).toEqual([{ broadcaster_id: "200" }]);
    expect(t.last()).toMatchObject({ method: "GET", path: "moderation/channels", token: "token-of-100" });
    expect(t.last().query).toEqual({ user_id: "100", first: "100" });
  });

  it("moderators: user token, broadcaster_id defaulted, user_id filter repeated", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ user_id: "5" }], pagination: {} });
    const page = await t.twitch.moderation.moderators({ user_id: ["5", "6"] });
    expect(page.data).toEqual([{ user_id: "5" }]);
    expect(page.hasNext).toBe(false);
    expect(t.last()).toMatchObject({ method: "GET", path: "moderation/moderators", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "100", user_id: ["5", "6"] });
  });

  it("addModerator: POST with the user in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(await t.twitch.moderation.addModerator({ user_id: "5" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "POST", path: "moderation/moderators", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "100", user_id: "5" });
    expect(t.last().body).toBeUndefined();
  });

  it("removeModerator: DELETE with the user in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(await t.twitch.moderation.removeModerator({ user_id: "5" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "DELETE", path: "moderation/moderators", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "100", user_id: "5" });
  });

  it("vips: lives under channels/vips and walks every page", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ user_id: "5" }], pagination: { cursor: "next" } });
    t.reply({ data: [{ user_id: "6" }], pagination: {} });
    expect(await t.twitch.moderation.vips().all()).toEqual([{ user_id: "5" }, { user_id: "6" }]);
    expect(t.calls[0]).toMatchObject({ method: "GET", path: "channels/vips", token: "token-of-100" });
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "100", first: "100" });
    expect(t.calls[1]?.query).toEqual({ broadcaster_id: "100", first: "100", after: "next" });
  });

  it("addVip: POST with the user in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(await t.twitch.moderation.addVip({ user_id: "5" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "POST", path: "channels/vips", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "100", user_id: "5" });
  });

  it("removeVip: by the broadcaster, or by the VIP on another channel", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(await t.twitch.moderation.removeVip({ user_id: "5" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "DELETE", path: "channels/vips", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "100", user_id: "5" });

    t.reply(undefined);
    await t.twitch.moderation.removeVip({ broadcaster_id: "200", user_id: "100" }, { as: "100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", user_id: "100" });
    expect(t.last().token).toBe("token-of-100");
  });

  it("updateShieldMode: PUT with is_active in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [shield] });
    const status = await t.twitch.moderation.updateShieldMode({ broadcaster_id: "200", is_active: true }, { as: "100" });
    expect(status).toEqual(shield);
    expect(t.last()).toMatchObject({ method: "PUT", path: "moderation/shield_mode", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100" });
    expect(t.last().body).toEqual({ is_active: true });
  });

  it("shieldMode: GET with both IDs in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [shield] });
    expect(await t.twitch.moderation.shieldMode({ broadcaster_id: "200", moderator_id: "100" })).toEqual(shield);
    expect(t.last()).toMatchObject({ method: "GET", path: "moderation/shield_mode", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100" });
  });

  it("warn: wraps user_id and reason in data", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const warning = { broadcaster_id: "200", user_id: "5", moderator_id: "100", reason: "calm down" };
    t.reply({ data: [warning] });
    const result = await t.twitch.moderation.warn(
      { broadcaster_id: "200", user_id: "5", reason: "calm down" },
      { as: "100" },
    );
    expect(result).toEqual(warning);
    expect(t.last()).toMatchObject({ method: "POST", path: "moderation/warnings", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100" });
    expect(t.last().body).toEqual({ data: { user_id: "5", reason: "calm down" } });
  });

  it("addSuspiciousStatus: user_id and status in a bare body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [suspicious] });
    const result = await t.twitch.moderation.addSuspiciousStatus(
      { broadcaster_id: "200", user_id: "5", status: "RESTRICTED" },
      { as: "100" },
    );
    expect(result).toEqual(suspicious);
    expect(t.last()).toMatchObject({ method: "POST", path: "moderation/suspicious_users", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "100" });
    expect(t.last().body).toEqual({ user_id: "5", status: "RESTRICTED" });
  });

  it("removeSuspiciousStatus: DELETE that returns the cleared status", async () => {
    const t = createTestClient();
    const cleared = { ...suspicious, moderator_id: "300", status: "NO_TREATMENT" };
    t.reply({ data: [cleared] });
    const result = await t.twitch.moderation.removeSuspiciousStatus({
      broadcaster_id: "200",
      moderator_id: "300",
      user_id: "5",
    });
    expect(result).toEqual(cleared);
    expect(t.last()).toMatchObject({ method: "DELETE", path: "moderation/suspicious_users", token: "app-token" });
    expect(t.last().query).toEqual({ broadcaster_id: "200", moderator_id: "300", user_id: "5" });
    expect(t.last().body).toBeUndefined();
  });
});
