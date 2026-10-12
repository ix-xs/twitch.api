import { describe, expect, expectTypeOf, it } from "vitest";
import {
  chatVersions,
  type AutomodMessageHoldAutomod,
  type AutomodMessageHoldBlockedTerm,
  type AutomodMessageHoldEvent,
  type AutomodMessageHoldFragment,
  type AutomodMessageUpdateEvent,
  type ChannelBitsUseCustomPowerUp,
  type ChannelBitsUseEvent,
  type ChannelBitsUseFragment,
  type ChannelBitsUsePowerUp,
  type ChannelChatMessageEvent,
  type ChannelChatMessageFragment,
  type ChannelChatMessageGif,
  type ChannelChatMessageMention,
  type ChannelChatNotificationEvent,
  type ChannelChatNotificationRaid,
  type ChannelChatNotificationResub,
  type ChannelChatNotificationUnraid,
  type ChatEventSubTypes,
} from "../../src/eventsub/types/chat.js";

const broadcaster = {
  broadcaster_user_id: "1337",
  broadcaster_user_login: "streamer",
  broadcaster_user_name: "Streamer",
};

const sender = { user_id: "4242", user_login: "viewer", user_name: "Viewer" };

/** Every per-notice object of a chat notification, all empty. */
const noDetails = {
  sub: null,
  resub: null,
  sub_gift: null,
  community_sub_gift: null,
  gift_paid_upgrade: null,
  prime_paid_upgrade: null,
  pay_it_forward: null,
  raid: null,
  unraid: null,
  announcement: null,
  bits_badge_tier: null,
  charity_donation: null,
  watch_streak: null,
  modiversary: null,
  gifted_drops_summary: null,
};

const notice = {
  ...broadcaster,
  chatter_user_id: "4242",
  chatter_user_login: "viewer",
  chatter_user_name: "Viewer",
  chatter_is_anonymous: false,
  color: "#00FF7F",
  badges: [{ set_id: "subscriber", id: "12", info: "16" }],
  system_message: "",
  message_id: "d62235c8-47ff-4a4f-84e8-5a29a65a9c03",
  message: { text: "", fragments: [] },
};

describe("chat EventSub types", () => {
  it("lists every type with its version", () => {
    expect(Object.keys(chatVersions).sort()).toEqual(
      [
        "automod.message.hold",
        "automod.message.hold@1",
        "automod.message.update",
        "automod.message.update@1",
        "automod.settings.update",
        "automod.terms.update",
        "channel.bits.use",
        "channel.chat.clear",
        "channel.chat.clear_user_messages",
        "channel.chat.message",
        "channel.chat.message_delete",
        "channel.chat.notification",
        "channel.chat_settings.update",
        "channel.chat.user_message_hold",
        "channel.chat.user_message_update",
        "channel.shared_chat.begin",
        "channel.shared_chat.update",
        "channel.shared_chat.end",
      ].sort(),
    );
    expect(chatVersions["automod.message.hold"]).toBe("2");
    expect(chatVersions["automod.message.hold@1"]).toBe("1");
    expect(chatVersions["automod.message.update"]).toBe("2");
    expectTypeOf<ChatEventSubTypes["automod.message.update@1"]["version"]>().toEqualTypeOf<"1">();
    expectTypeOf<ChatEventSubTypes["channel.chat.message"]["version"]>().toEqualTypeOf<"1">();
  });

  it("types the conditions", () => {
    expectTypeOf<ChatEventSubTypes["automod.message.hold"]["condition"]>().toEqualTypeOf<{
      broadcaster_user_id: string;
      moderator_user_id: string;
    }>();
    expectTypeOf<ChatEventSubTypes["channel.chat.message"]["condition"]>().toEqualTypeOf<{
      broadcaster_user_id: string;
      user_id: string;
    }>();
    expectTypeOf<ChatEventSubTypes["channel.shared_chat.end"]["condition"]>().toEqualTypeOf<{
      broadcaster_user_id: string;
    }>();
  });

  it("narrows automod events on reason", () => {
    const describeHold = (event: AutomodMessageHoldEvent | AutomodMessageUpdateEvent): string => {
      if (event.reason === "automod") {
        expectTypeOf(event.automod).toEqualTypeOf<AutomodMessageHoldAutomod>();
        expectTypeOf(event.blocked_term).toEqualTypeOf<null | undefined>();
        return `${event.automod.category}:${event.automod.level}`;
      }
      expectTypeOf(event.reason).toEqualTypeOf<"blocked_term" | "blocked_link">();
      expectTypeOf(event.blocked_term).toEqualTypeOf<AutomodMessageHoldBlockedTerm>();
      return event.blocked_term.terms_found.map((term) => term.term_id).join(",");
    };

    const hold: AutomodMessageHoldEvent = {
      ...broadcaster,
      ...sender,
      message_id: "bad-message-id",
      message: {
        text: "you are bad pogchamp100",
        fragments: [
          { type: "text", text: "you are bad ", emote: null, cheermote: null },
          { type: "cheermote", text: "pogchamp100", emote: null, cheermote: { prefix: "pogchamp", bits: 100, tier: 1 } },
        ],
      },
      reason: "automod",
      automod: { category: "aggressive", level: 2, boundaries: [{ start_pos: 0, end_pos: 10 }] },
      blocked_term: null,
      held_at: "2025-12-02T15:00:00Z",
    };
    const update: AutomodMessageUpdateEvent = {
      ...broadcaster,
      ...sender,
      moderator_user_id: "9001",
      moderator_user_login: "the_mod",
      moderator_user_name: "The_Mod",
      message_id: "bad-message-id",
      message: { text: "badword", fragments: [{ type: "text", text: "badword" }] },
      reason: "blocked_term",
      automod: null,
      blocked_term: {
        terms_found: [
          {
            term_id: "123",
            boundary: { start_pos: 0, end_pos: 6 },
            owner_broadcaster_user_id: "1337",
            owner_broadcaster_user_login: "streamer",
            owner_broadcaster_user_name: "Streamer",
          },
        ],
      },
      status: "denied",
      held_at: "2025-12-02T15:00:00Z",
    };

    expect(describeHold(hold)).toBe("aggressive:2");
    expect(describeHold(update)).toBe("123");
    expectTypeOf<ChatEventSubTypes["automod.message.hold"]["event"]>().toEqualTypeOf<AutomodMessageHoldEvent>();
    expectTypeOf<ChatEventSubTypes["automod.message.hold@1"]["event"]["level"]>().toEqualTypeOf<number>();
    expectTypeOf<ChatEventSubTypes["automod.message.update@1"]["event"]["status"]>().toEqualTypeOf<
      "approved" | "denied" | "expired"
    >();
    expectTypeOf<ChatEventSubTypes["automod.settings.update"]["event"]["overall_level"]>().toEqualTypeOf<
      number | null
    >();

    const bitsOf = (fragment: AutomodMessageHoldFragment): number => {
      if (fragment.type === "cheermote") return fragment.cheermote.bits;
      if (fragment.type === "emote") {
        expectTypeOf(fragment.emote.emote_set_id).toEqualTypeOf<string>();
        return 0;
      }
      expectTypeOf(fragment.cheermote).toEqualTypeOf<null | undefined>();
      return 0;
    };
    expect(hold.message.fragments.map(bitsOf)).toEqual([0, 100]);
  });

  it("narrows the bits use event on type", () => {
    const describeBits = (event: ChannelBitsUseEvent): string => {
      switch (event.type) {
        case "cheer":
          expectTypeOf(event.power_up).toEqualTypeOf<null | undefined>();
          return `cheer:${event.bits}`;
        case "power_up":
          expectTypeOf(event.power_up).toEqualTypeOf<ChannelBitsUsePowerUp>();
          return `power_up:${event.power_up.type}`;
        case "custom_power_up":
          expectTypeOf(event.custom_power_up).toEqualTypeOf<ChannelBitsUseCustomPowerUp>();
          return `custom:${event.custom_power_up.title}`;
      }
    };
    const emoteOwner = (fragment: ChannelBitsUseFragment): string | undefined =>
      fragment.type === "emote" ? fragment.emote.owner_id : undefined;

    const cheer: ChannelBitsUseEvent = {
      ...broadcaster,
      ...sender,
      bits: 2,
      type: "cheer",
      power_up: null,
      custom_power_up: null,
      message: {
        text: "cheer1 hi cheer1",
        fragments: [
          { type: "cheermote", text: "cheer1", cheermote: { prefix: "cheer", bits: 1, tier: 1 }, emote: null },
          { type: "text", text: " hi ", cheermote: null, emote: null },
          { type: "cheermote", text: "cheer1", cheermote: { prefix: "cheer", bits: 1, tier: 1 }, emote: null },
        ],
      },
    };
    const powerUp: ChannelBitsUseEvent = {
      ...broadcaster,
      ...sender,
      bits: 30,
      type: "power_up",
      power_up: { type: "gigantify_an_emote", emote: { id: "25", name: "Kappa" }, message_effect_id: null },
      custom_power_up: null,
      message: {
        text: "Kappa",
        fragments: [
          {
            type: "emote",
            text: "Kappa",
            cheermote: null,
            emote: { id: "25", emote_set_id: "0", owner_id: "0", format: ["static"] },
          },
        ],
      },
    };
    const custom: ChannelBitsUseEvent = {
      ...broadcaster,
      ...sender,
      bits: 500,
      type: "custom_power_up",
      custom_power_up: { title: "Hydrate", reward_id: "92af127c-7326-4483-a52b-b0da0be61c01" },
    };

    expect([cheer, powerUp, custom].map(describeBits)).toEqual([
      "cheer:2",
      "power_up:gigantify_an_emote",
      "custom:Hydrate",
    ]);
    expect(powerUp.message?.fragments.map(emoteOwner)).toEqual(["0"]);
  });

  it("types the chat message event and narrows its fragments", () => {
    const describeFragment = (fragment: ChannelChatMessageFragment): string => {
      switch (fragment.type) {
        case "text":
          expectTypeOf(fragment.mention).toEqualTypeOf<null | undefined>();
          return fragment.text;
        case "cheermote":
          return `${fragment.cheermote.prefix}:${fragment.cheermote.bits}`;
        case "emote":
          expectTypeOf(fragment.emote.format).toEqualTypeOf<("animated" | "static")[]>();
          return `emote:${fragment.emote.id}`;
        case "mention":
          expectTypeOf(fragment.mention).toEqualTypeOf<ChannelChatMessageMention>();
          return `@${fragment.mention.user_login}`;
        case "gif":
          expectTypeOf(fragment.gif).toEqualTypeOf<ChannelChatMessageGif>();
          return fragment.gif.url;
      }
    };

    const event: ChannelChatMessageEvent = {
      ...broadcaster,
      chatter_user_id: "4145994",
      chatter_user_login: "viewer32",
      chatter_user_name: "viewer32",
      message_id: "cc106a89-1814-919d-454c-f4f2f970aae7",
      message: {
        text: "Hi @streamer Kappa cheer100",
        fragments: [
          { type: "text", text: "Hi ", cheermote: null, emote: null, mention: null },
          {
            type: "mention",
            text: "@streamer",
            cheermote: null,
            emote: null,
            mention: { user_id: "1337", user_login: "streamer", user_name: "Streamer" },
          },
          {
            type: "emote",
            text: "Kappa",
            cheermote: null,
            emote: { id: "25", emote_set_id: "0", owner_id: "0", format: ["static"] },
            mention: null,
          },
          {
            type: "cheermote",
            text: "cheer100",
            cheermote: { prefix: "cheer", bits: 100, tier: 100 },
            emote: null,
            mention: null,
          },
        ],
      },
      color: "#00FF7F",
      badges: [{ set_id: "moderator", id: "1", info: "" }],
      message_type: "text",
      cheer: { bits: 100 },
      reply: null,
      channel_points_custom_reward_id: null,
      source_broadcaster_user_id: null,
      source_broadcaster_user_login: null,
      source_broadcaster_user_name: null,
      source_message_id: null,
      source_badges: null,
    };

    expect(event.message.fragments.map(describeFragment)).toEqual(["Hi ", "@streamer", "emote:25", "cheer:100"]);
    expect(event.cheer?.bits).toBe(100);
    expectTypeOf(event.source_badges).toEqualTypeOf<
      { set_id: string; id: string; info: string }[] | null | undefined
    >();
    expectTypeOf<ChatEventSubTypes["channel.chat.message"]["event"]>().toEqualTypeOf<ChannelChatMessageEvent>();
    expectTypeOf<ChatEventSubTypes["channel.chat.user_message_update"]["event"]["status"]>().toEqualTypeOf<
      "approved" | "denied" | "invalid"
    >();
  });

  it("narrows the chat notification event on notice_type", () => {
    const describeNotice = (event: ChannelChatNotificationEvent): string => {
      switch (event.notice_type) {
        case "resub":
          expectTypeOf(event.resub).toEqualTypeOf<ChannelChatNotificationResub>();
          expectTypeOf(event.sub).toEqualTypeOf<null>();
          return `resub:${event.resub.cumulative_months}`;
        case "raid":
          expectTypeOf(event.raid).toEqualTypeOf<ChannelChatNotificationRaid>();
          expectTypeOf(event.shared_chat_raid).toEqualTypeOf<null | undefined>();
          return `raid:${event.raid.viewer_count}`;
        case "unraid":
          expectTypeOf(event.unraid).toEqualTypeOf<ChannelChatNotificationUnraid>();
          return "unraid";
        case "shared_chat_resub":
          expectTypeOf(event.shared_chat_resub).toEqualTypeOf<ChannelChatNotificationResub>();
          expectTypeOf(event.resub).toEqualTypeOf<null>();
          return `shared_resub:${event.shared_chat_resub.sub_tier}`;
        case "unknown":
          expectTypeOf(event.raid).toEqualTypeOf<null>();
          return "unknown";
        default:
          return event.notice_type;
      }
    };

    const resub: ChannelChatNotificationEvent = {
      ...notice,
      ...noDetails,
      system_message: "Viewer subscribed at Tier 1. They've subscribed for 10 months!",
      notice_type: "resub",
      resub: {
        cumulative_months: 10,
        duration_months: 1,
        streak_months: null,
        sub_tier: "1000",
        is_gift: false,
        gifter_is_anonymous: null,
        gifter_user_id: null,
        gifter_user_name: null,
        gifter_user_login: null,
      },
    };
    const raid: ChannelChatNotificationEvent = {
      ...notice,
      ...noDetails,
      notice_type: "raid",
      raid: {
        user_id: "112233",
        user_login: "streamer33",
        user_name: "Streamer33",
        viewer_count: 250,
        profile_image_url: "https://static-cdn.jtvnw.net/jtv_user_pictures/streamer33.png",
      },
    };
    const sharedResub: ChannelChatNotificationEvent = {
      ...notice,
      ...noDetails,
      notice_type: "shared_chat_resub",
      shared_chat_resub: {
        cumulative_months: 3,
        duration_months: 1,
        streak_months: 3,
        sub_tier: "2000",
        is_gift: false,
        gifter_user_id: null,
        gifter_user_name: null,
      },
      source_broadcaster_user_id: "112233",
      source_broadcaster_user_login: "streamer33",
      source_broadcaster_user_name: "Streamer33",
      source_message_id: "2be7193d-0366-4453-b6ec-b288ce9f2c39",
      source_badges: [{ set_id: "subscriber", id: "3", info: "3" }],
      is_source_only: true,
    };
    const announcement: ChannelChatNotificationEvent = {
      ...notice,
      ...noDetails,
      notice_type: "announcement",
      announcement: { color: "PURPLE" },
    };
    const unknown: ChannelChatNotificationEvent = { ...notice, ...noDetails, notice_type: "unknown" };

    expect([resub, raid, sharedResub, announcement, unknown].map(describeNotice)).toEqual([
      "resub:10",
      "raid:250",
      "shared_resub:2000",
      "announcement",
      "unknown",
    ]);
    expectTypeOf<ChannelChatNotificationEvent["notice_type"]>().toEqualTypeOf<
      | "sub"
      | "resub"
      | "sub_gift"
      | "community_sub_gift"
      | "gift_paid_upgrade"
      | "prime_paid_upgrade"
      | "raid"
      | "unraid"
      | "pay_it_forward"
      | "announcement"
      | "bits_badge_tier"
      | "charity_donation"
      | "watch_streak"
      | "modiversary"
      | "gifted_drops_summary"
      | "shared_chat_sub"
      | "shared_chat_resub"
      | "shared_chat_sub_gift"
      | "shared_chat_community_sub_gift"
      | "shared_chat_gift_paid_upgrade"
      | "shared_chat_prime_paid_upgrade"
      | "shared_chat_raid"
      | "shared_chat_pay_it_forward"
      | "shared_chat_announcement"
      | "shared_chat_modiversary"
      | "shared_chat_gifted_drops_summary"
      | "unknown"
    >();
  });

  it("types the chat settings and shared chat events", () => {
    expectTypeOf<
      ChatEventSubTypes["channel.chat_settings.update"]["event"]["slow_mode_wait_time_seconds"]
    >().toEqualTypeOf<number | null>();
    expectTypeOf<ChatEventSubTypes["channel.shared_chat.begin"]["event"]["participants"]>().toEqualTypeOf<
      ChatEventSubTypes["channel.shared_chat.update"]["event"]["participants"]
    >();
    expectTypeOf<ChatEventSubTypes["channel.shared_chat.end"]["event"]>().not.toHaveProperty("participants");
    expectTypeOf<ChatEventSubTypes["channel.chat.message_delete"]["event"]["message_id"]>().toEqualTypeOf<string>();
  });
});
