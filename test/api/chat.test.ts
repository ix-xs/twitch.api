import { describe, expect, it } from "vitest";
import { TwitchScopeError } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

const template = "https://cdn.test/{{id}}/{{format}}/{{theme_mode}}/{{scale}}";

describe("chat", () => {
  it("chatters: moderator_id defaults to the acting user, pages of 1000", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ user_id: "1" }], pagination: { cursor: "c" }, total: 2 });
    t.reply({ data: [{ user_id: "2" }], pagination: {}, total: 2 });
    const ids: string[] = [];
    for await (const chatter of t.twitch.chat.chatters({ broadcaster_id: "5" }, { as: "100" })) ids.push(chatter.user_id);
    expect(ids).toEqual(["1", "2"]);
    expect(t.calls[0]).toMatchObject({ method: "GET", path: "chat/chatters", token: "token-of-100" });
    expect(t.calls[0]?.query).toEqual({ broadcaster_id: "5", moderator_id: "100", first: "1000" });
    expect(t.calls[1]?.query).toEqual({ broadcaster_id: "5", moderator_id: "100", first: "1000", after: "c" });
  });

  it("chatters: picks the token of the moderator named in the call and exposes the total", async () => {
    const t = createTestClient();
    await t.addUser("100");
    await t.addUser("200");
    t.reply({ data: [{ user_id: "1" }], pagination: {}, total: 41 });
    const page = await t.twitch.chat.chatters({ broadcaster_id: "5", moderator_id: "200", first: 1 });
    expect(page.total).toBe(41);
    expect(t.last()).toMatchObject({ query: { moderator_id: "200", first: "1" }, token: "token-of-200" });
  });

  it("chatters: fails before the network when the scope is missing", async () => {
    const t = createTestClient();
    await t.addUser("100", ["user:read:chat"]);
    await expect(t.twitch.chat.chatters({ broadcaster_id: "5", moderator_id: "100" })).rejects.toBeInstanceOf(
      TwitchScopeError,
    );
    expect(t.calls).toHaveLength(0);
  });

  it("channelEmotes: returns the emotes with the template", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "e1", tier: "1000" }], template });
    expect(await t.twitch.chat.channelEmotes({ broadcaster_id: "5" })).toEqual({
      data: [{ id: "e1", tier: "1000" }],
      template,
    });
    expect(t.last()).toMatchObject({ method: "GET", path: "chat/emotes", token: "app-token" });
    expect(t.last().query).toEqual({ broadcaster_id: "5" });
  });

  it("globalEmotes: no parameters", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "g1" }], template });
    expect(await t.twitch.chat.globalEmotes()).toEqual({ data: [{ id: "g1" }], template });
    expect(t.last()).toMatchObject({ method: "GET", path: "chat/emotes/global", query: {}, token: "app-token" });
    expect(t.last().query).toEqual({});
  });

  it("emoteSets: repeats emote_set_id and keeps the template", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "e1", emote_set_id: "s1" }], template });
    expect(await t.twitch.chat.emoteSets({ emote_set_id: ["s1", "s2"] })).toEqual({
      data: [{ id: "e1", emote_set_id: "s1" }],
      template,
    });
    expect(t.last()).toMatchObject({ method: "GET", path: "chat/emotes/set", token: "app-token" });
    expect(t.last().query).toEqual({ emote_set_id: ["s1", "s2"] });

    t.reply({ data: [], template });
    await t.twitch.chat.emoteSets({ emote_set_id: "s3" });
    expect(t.last().query).toEqual({ emote_set_id: "s3" });
  });

  it("emoteSets: splits more than 25 sets into several requests and merges them", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "a" }], template });
    t.reply({ data: [{ id: "b" }], template });
    t.reply({ data: [{ id: "c" }], template });
    const ids = Array.from({ length: 60 }, (_, i) => String(i));
    const list = await t.twitch.chat.emoteSets({ emote_set_id: ids });
    expect(t.calls.map((call) => (call.query["emote_set_id"] as string[]).length)).toEqual([25, 25, 10]);
    expect(list.data.map((emote) => emote.id).sort()).toEqual(["a", "b", "c"]);
    expect(list.template).toBe(template);
  });

  it("channelBadges / globalBadges", async () => {
    const t = createTestClient();
    const sets = [{ set_id: "subscriber", versions: [{ id: "0", click_url: null }] }];
    t.reply({ data: sets });
    expect(await t.twitch.chat.channelBadges({ broadcaster_id: "5" })).toEqual(sets);
    expect(t.last()).toMatchObject({ method: "GET", path: "chat/badges", token: "app-token" });
    expect(t.last().query).toEqual({ broadcaster_id: "5" });

    t.reply({ data: sets });
    expect(await t.twitch.chat.globalBadges()).toEqual(sets);
    expect(t.last()).toMatchObject({ method: "GET", path: "chat/badges/global", token: "app-token" });
    expect(t.last().query).toEqual({});
  });

  it("settings: returns the single settings object", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const settings = { broadcaster_id: "5", slow_mode: false, slow_mode_wait_time: null };
    t.reply({ data: [settings] });
    expect(await t.twitch.chat.settings({ broadcaster_id: "5" })).toEqual(settings);
    expect(t.last()).toMatchObject({ method: "GET", path: "chat/settings", token: "app-token" });
    expect(t.last().query).toEqual({ broadcaster_id: "5" });

    t.reply({ data: [{ ...settings, non_moderator_chat_delay: false }] });
    await t.twitch.chat.settings({ broadcaster_id: "5", moderator_id: "100" }, { as: "100" });
    expect(t.last()).toMatchObject({ query: { broadcaster_id: "5", moderator_id: "100" }, token: "token-of-100" });
  });

  it("sharedSession: the session, or null when there is none", async () => {
    const t = createTestClient();
    const session = { session_id: "s", host_broadcaster_id: "5", participants: [{ broadcaster_id: "5" }] };
    t.reply({ data: [session] });
    expect(await t.twitch.chat.sharedSession({ broadcaster_id: "5" })).toEqual(session);
    expect(t.last()).toMatchObject({ method: "GET", path: "shared_chat/session", token: "app-token" });
    expect(t.last().query).toEqual({ broadcaster_id: "5" });

    t.reply({ data: [] });
    expect(await t.twitch.chat.sharedSession({ broadcaster_id: "6" })).toBeNull();
  });

  it("userEmotes: user token, user_id defaults to the acting user, template on the raw page", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ id: "e1" }], template, pagination: { cursor: "c" } });
    t.reply({ data: [{ id: "e2" }], template, pagination: {} });
    const page = await t.twitch.chat.userEmotes({ broadcaster_id: "5" });
    expect(page.data).toEqual([{ id: "e1" }]);
    expect(page.raw.template).toBe(template);
    expect(t.last()).toMatchObject({ method: "GET", path: "chat/emotes/user", token: "token-of-100" });
    expect(t.last().query).toEqual({ user_id: "100", broadcaster_id: "5" });

    const next = await page.next();
    expect(next?.data).toEqual([{ id: "e2" }]);
    expect(next?.hasNext).toBe(false);
    expect(t.last().query).toEqual({ user_id: "100", broadcaster_id: "5", after: "c" });
  });

  it("updateSettings: PATCH with the IDs in the query and the settings in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const settings = { broadcaster_id: "5", moderator_id: "100", slow_mode: true, slow_mode_wait_time: 10 };
    t.reply({ data: [settings] });
    const result = await t.twitch.chat.updateSettings(
      { broadcaster_id: "5", slow_mode: true, slow_mode_wait_time: 10 },
      { as: "100" },
    );
    expect(result).toEqual(settings);
    expect(t.last()).toMatchObject({ method: "PATCH", path: "chat/settings", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "5", moderator_id: "100" });
    expect(t.last().body).toEqual({ slow_mode: true, slow_mode_wait_time: 10 });
  });

  it("announce: POST with the message in the body", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(
      await t.twitch.chat.announce({ broadcaster_id: "5", message: "Soon", color: "green" }, { as: "100" }),
    ).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "POST", path: "chat/announcements", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "5", moderator_id: "100" });
    expect(t.last().body).toEqual({ message: "Soon", color: "green" });

    t.reply(undefined);
    await t.twitch.chat.announce({ broadcaster_id: "5", moderator_id: "7", message: "Soon", for_source_only: false });
    expect(t.last()).toMatchObject({ query: { moderator_id: "7" }, token: "app-token" });
    expect(t.last().body).toEqual({ message: "Soon", for_source_only: false });
  });

  it("shoutout: everything in the query", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(
      await t.twitch.chat.shoutout({ from_broadcaster_id: "5", to_broadcaster_id: "6" }, { as: "100" }),
    ).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "POST", path: "chat/shoutouts", token: "token-of-100" });
    expect(t.last().query).toEqual({ from_broadcaster_id: "5", to_broadcaster_id: "6", moderator_id: "100" });
    expect(t.last().body).toBeUndefined();
  });

  it("send: JSON body, sender_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [{ message_id: "m1", is_sent: true }] });
    const sent = await t.twitch.as("100").chat.send({ broadcaster_id: "5", message: "hi", reply_parent_message_id: "m0" });
    expect(sent).toEqual({ message_id: "m1", is_sent: true });
    expect(t.last()).toMatchObject({ method: "POST", path: "chat/messages", token: "token-of-100" });
    expect(t.last().query).toEqual({});
    expect(t.last().body).toEqual({
      broadcaster_id: "5",
      sender_id: "100",
      message: "hi",
      reply_parent_message_id: "m0",
    });
  });

  it("send: uses the app token for a sender that is not registered", async () => {
    const t = createTestClient();
    const dropped = { message_id: "", is_sent: false, drop_reason: { code: "blocked", message: "Nope" } };
    t.reply({ data: [dropped] });
    const sent = await t.twitch.chat.send({ broadcaster_id: "5", sender_id: "7", message: "hi", for_source_only: false });
    expect(sent).toEqual(dropped);
    expect(t.last()).toMatchObject({
      token: "app-token",
      body: { broadcaster_id: "5", sender_id: "7", message: "hi", for_source_only: false },
    });
  });

  it("pinnedMessage: the pinned message, or null when nothing is pinned", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const pinned = { message_id: "m1", message: { text: "rules", fragments: [] }, ends_at: null };
    t.reply({ data: [pinned] });
    expect(await t.twitch.chat.pinnedMessage({ broadcaster_id: "5" }, { as: "100" })).toEqual(pinned);
    expect(t.last()).toMatchObject({ method: "GET", path: "chat/pins", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "5", moderator_id: "100" });

    t.reply({ data: [] });
    expect(await t.twitch.chat.pinnedMessage({ broadcaster_id: "5", moderator_id: "100" })).toBeNull();
  });

  it("pinnedMessage: the read scope alone is enough", async () => {
    const t = createTestClient();
    await t.addUser("100", ["moderator:read:chat_messages"]);
    await t.twitch.chat.pinnedMessage({ broadcaster_id: "5", moderator_id: "100" });
    expect(t.last().token).toBe("token-of-100");
    await expect(t.twitch.chat.unpin({ broadcaster_id: "5", moderator_id: "100", message_id: "m1" })).rejects.toBeInstanceOf(
      TwitchScopeError,
    );
  });

  it("pin / updatePin / unpin", async () => {
    const t = createTestClient();
    await t.addUser("100");
    const asMod = t.twitch.as("100");

    t.reply(undefined);
    expect(await asMod.chat.pin({ broadcaster_id: "5", message_id: "m1", duration_seconds: 60 })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "PUT", path: "chat/pins", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "5", moderator_id: "100", message_id: "m1", duration_seconds: "60" });
    expect(t.last().body).toBeUndefined();

    t.reply(undefined);
    expect(await asMod.chat.updatePin({ broadcaster_id: "5", message_id: "m1", duration_seconds: 90 })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "PATCH", path: "chat/pins", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "5", moderator_id: "100", message_id: "m1", duration_seconds: "90" });

    t.reply(undefined);
    expect(await asMod.chat.unpin({ broadcaster_id: "5", message_id: "m1" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "DELETE", path: "chat/pins", token: "token-of-100" });
    expect(t.last().query).toEqual({ broadcaster_id: "5", moderator_id: "100", message_id: "m1" });
  });

  it("colors: repeats user_id and splits more than 100 lookups", async () => {
    const t = createTestClient();
    const colors = [{ user_id: "1", color: "#112233" }, { user_id: "2", color: "" }];
    t.reply({ data: colors });
    expect(await t.twitch.chat.colors({ user_id: ["1", "2"] })).toEqual(colors);
    expect(t.last()).toMatchObject({ method: "GET", path: "chat/color", token: "app-token" });
    expect(t.last().query).toEqual({ user_id: ["1", "2"] });

    await t.twitch.chat.colors({ user_id: Array.from({ length: 130 }, (_, i) => String(i)) });
    expect(t.calls.slice(1).map((call) => (call.query["user_id"] as string[]).length)).toEqual([100, 30]);
  });

  it("setColor: PUT in the query, user_id defaults to the acting user", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply(undefined);
    expect(await t.twitch.chat.setColor({ color: "#9146FF" })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "PUT", path: "chat/color", token: "token-of-100" });
    expect(t.last().query).toEqual({ user_id: "100", color: "#9146FF" });
    expect(t.last().url.search).toContain("color=%239146FF");
    expect(t.last().body).toBeUndefined();
  });
});
