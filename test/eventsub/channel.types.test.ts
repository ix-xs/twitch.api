import { describe, expect, expectTypeOf, it } from "vitest";
import {
  channelVersions,
  type ChannelBanEvent,
  type ChannelEventSubTypes,
  type ChannelModerateAction,
  type ChannelModerateBase,
  type ChannelModerateEmptyActionObjects,
  type ChannelModerateEvent,
  type ChannelModerateTimeout,
  type ChannelModerateV1Action,
  type ChannelModerateV1EmptyActionObjects,
  type ChannelModerateV1Event,
  type ChannelSubscriptionMessageEvent,
  type ChannelSuspiciousUserMessageEvent,
  type ChannelSuspiciousUserMessageFragment,
} from "../../src/eventsub/types/channel.js";

const moderateBase: ChannelModerateBase = {
  broadcaster_user_id: "1337",
  broadcaster_user_login: "cool_channel",
  broadcaster_user_name: "Cool_Channel",
  moderator_user_id: "4242",
  moderator_user_login: "sharp_mod",
  moderator_user_name: "Sharp_Mod",
};

const noObjectsV1: ChannelModerateV1EmptyActionObjects = {
  followers: null,
  slow: null,
  vip: null,
  unvip: null,
  mod: null,
  unmod: null,
  ban: null,
  unban: null,
  timeout: null,
  untimeout: null,
  raid: null,
  unraid: null,
  delete: null,
  automod_terms: null,
  unban_request: null,
  shared_chat_ban: null,
  shared_chat_unban: null,
  shared_chat_timeout: null,
  shared_chat_untimeout: null,
  shared_chat_delete: null,
};

const noObjects: ChannelModerateEmptyActionObjects = { ...noObjectsV1, warn: null };

const target = { user_id: "9001", user_login: "loud_viewer", user_name: "Loud_Viewer" };

/** What a handler would write: read the details of an event after narrowing on `action`. */
function describeAction(event: ChannelModerateEvent): string {
  expectTypeOf(event.timeout).toEqualTypeOf<ChannelModerateTimeout | null>();
  if (event.action === "timeout") {
    expectTypeOf(event.timeout).toEqualTypeOf<ChannelModerateTimeout>();
    expectTypeOf(event.ban).toEqualTypeOf<null>();
    return `timeout until ${event.timeout.expires_at}`;
  }
  if (event.action === "warn") return `warn for ${event.warn.reason ?? "no reason"}`;
  if (event.action === "followers") return `followers ${event.followers.follow_duration_minutes}`;
  if (event.action === "add_blocked_term" || event.action === "remove_permitted_term") {
    return `${event.automod_terms.action} ${event.automod_terms.list}`;
  }
  if (event.action === "approve_unban_request") return `approved ${event.unban_request.is_approved}`;
  if (event.action === "shared_chat_ban") return `shared ban of ${event.shared_chat_ban.user_login}`;
  if (event.action === "emoteonly" || event.action === "clear") {
    expectTypeOf(event.timeout).toEqualTypeOf<null>();
    expectTypeOf(event.warn).toEqualTypeOf<null>();
    return event.action;
  }
  return "other";
}

describe("channel EventSub types", () => {
  it("lists every type with its version", () => {
    expect(Object.keys(channelVersions).sort()).toEqual(
      [
        "channel.update",
        "channel.follow",
        "channel.ad_break.begin",
        "channel.subscribe",
        "channel.subscription.end",
        "channel.subscription.gift",
        "channel.subscription.message",
        "channel.cheer",
        "channel.raid",
        "channel.ban",
        "channel.unban",
        "channel.unban_request.create",
        "channel.unban_request.resolve",
        "channel.moderate",
        "channel.moderate@1",
        "channel.moderator.add",
        "channel.moderator.remove",
        "channel.suspicious_user.message",
        "channel.suspicious_user.update",
        "channel.vip.add",
        "channel.vip.remove",
        "channel.warning.acknowledge",
        "channel.warning.send",
        "channel.shield_mode.begin",
        "channel.shield_mode.end",
        "channel.shoutout.create",
        "channel.shoutout.receive",
        "stream.online",
        "stream.offline",
      ].sort(),
    );
    expect(channelVersions["channel.update"]).toBe("2");
    expect(channelVersions["channel.follow"]).toBe("2");
    expect(channelVersions["channel.moderate"]).toBe("2");
    expect(channelVersions["channel.moderate@1"]).toBe("1");
    expect(Object.values(channelVersions).filter((version) => version === "1")).toHaveLength(26);
    expectTypeOf<keyof ChannelEventSubTypes>().toEqualTypeOf<keyof typeof channelVersions>();
  });

  it("types conditions", () => {
    type Types = ChannelEventSubTypes;
    expectTypeOf<Types["channel.follow"]["condition"]>().toEqualTypeOf<{
      broadcaster_user_id: string;
      moderator_user_id: string;
    }>();
    expectTypeOf<Types["channel.raid"]["condition"]>().toEqualTypeOf<{
      from_broadcaster_user_id?: string;
      to_broadcaster_user_id?: string;
    }>();
    expectTypeOf<Types["channel.moderate@1"]["condition"]>().toEqualTypeOf<Types["channel.moderate"]["condition"]>();
    expectTypeOf<Types["stream.online"]["condition"]>().toEqualTypeOf<{ broadcaster_user_id: string }>();
  });

  it("types simple events", () => {
    type Types = ChannelEventSubTypes;
    expectTypeOf<Types["channel.follow"]["event"]["followed_at"]>().toEqualTypeOf<string>();
    expectTypeOf<Types["channel.update"]["event"]["content_classification_labels"]>().toEqualTypeOf<string[]>();
    expectTypeOf<Types["channel.ad_break.begin"]["event"]["duration_seconds"]>().toEqualTypeOf<number>();
    expectTypeOf<Types["channel.subscribe"]["event"]["tier"]>().toEqualTypeOf<"1000" | "2000" | "3000">();
    expectTypeOf<Types["channel.subscription.gift"]["event"]["cumulative_total"]>().toEqualTypeOf<number | null>();
    expectTypeOf<Types["channel.cheer"]["event"]["user_id"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Types["channel.raid"]["event"]["viewers"]>().toEqualTypeOf<number>();
    expectTypeOf<Types["channel.unban_request.resolve"]["event"]["status"]>().toEqualTypeOf<
      "approved" | "canceled" | "denied"
    >();
    expectTypeOf<Types["channel.warning.send"]["event"]["chat_rules_cited"]>().toEqualTypeOf<
      string[] | null | undefined
    >();
    expectTypeOf<Types["channel.shield_mode.begin"]["event"]>().toHaveProperty("started_at");
    expectTypeOf<Types["channel.shield_mode.end"]["event"]>().toHaveProperty("ended_at");
    expectTypeOf<Types["channel.shield_mode.end"]["event"]>().not.toHaveProperty("started_at");
    expectTypeOf<Types["channel.shoutout.create"]["event"]["viewer_count"]>().toEqualTypeOf<number>();
    expectTypeOf<Types["stream.online"]["event"]["type"]>().toEqualTypeOf<
      "live" | "playlist" | "watch_party" | "premiere" | "rerun"
    >();
    expectTypeOf<Types["stream.offline"]["event"]["broadcaster_user_login"]>().toEqualTypeOf<string>();
  });

  it("types the ban event", () => {
    const event: ChannelBanEvent = {
      user_id: "9001",
      user_login: "loud_viewer",
      user_name: "Loud_Viewer",
      broadcaster_user_id: "1337",
      broadcaster_user_login: "cool_channel",
      broadcaster_user_name: "Cool_Channel",
      moderator_user_id: "4242",
      moderator_user_login: "sharp_mod",
      moderator_user_name: "Sharp_Mod",
      reason: "spam",
      banned_at: "2026-03-01T18:15:11.171Z",
      ends_at: null,
      is_permanent: true,
    };
    expect(event.is_permanent).toBe(true);
    expectTypeOf(event.ends_at).toEqualTypeOf<string | null>();
  });

  it("types the resubscription message event", () => {
    const event: ChannelSubscriptionMessageEvent = {
      user_id: "9001",
      user_login: "loyal_viewer",
      user_name: "Loyal_Viewer",
      broadcaster_user_id: "1337",
      broadcaster_user_login: "cool_channel",
      broadcaster_user_name: "Cool_Channel",
      tier: "2000",
      message: { text: "Fifteen months! Kappa", emotes: [{ begin: 16, end: 20, id: "25" }] },
      cumulative_months: 15,
      streak_months: null,
      duration_months: 3,
    };
    expect(event.message.emotes?.[0]?.id).toBe("25");
    expectTypeOf(event.streak_months).toEqualTypeOf<number | null>();
  });

  it("narrows channel.moderate on action", () => {
    expectTypeOf<ChannelEventSubTypes["channel.moderate"]["event"]>().toEqualTypeOf<ChannelModerateEvent>();
    expectTypeOf<Exclude<ChannelModerateAction, ChannelModerateV1Action>>().toEqualTypeOf<"warn">();
    expectTypeOf<Exclude<ChannelModerateV1Action, ChannelModerateAction>>().toEqualTypeOf<never>();

    const timeout: ChannelModerateEvent = {
      ...moderateBase,
      ...noObjects,
      action: "timeout",
      timeout: { ...target, reason: "caps", expires_at: "2026-03-01T18:25:11Z" },
    };
    const warn: ChannelModerateEvent = {
      ...moderateBase,
      ...noObjects,
      action: "warn",
      warn: { ...target, reason: "be kind", chat_rules_cited: null },
    };
    const terms: ChannelModerateEvent = {
      ...moderateBase,
      ...noObjects,
      action: "add_blocked_term",
      automod_terms: { action: "add", list: "blocked", terms: ["pineapple"], from_automod: false },
    };
    const sharedBan: ChannelModerateEvent = {
      ...moderateBase,
      ...noObjects,
      source_broadcaster_user_id: "7777",
      source_broadcaster_user_login: "other_channel",
      source_broadcaster_user_name: "Other_Channel",
      action: "shared_chat_ban",
      shared_chat_ban: { ...target, reason: "raid bot" },
    };
    const emoteOnly: ChannelModerateEvent = { ...moderateBase, ...noObjects, action: "emoteonly" };

    expect(describeAction(timeout)).toBe("timeout until 2026-03-01T18:25:11Z");
    expect(describeAction(warn)).toBe("warn for be kind");
    expect(describeAction(terms)).toBe("add blocked");
    expect(describeAction(sharedBan)).toBe("shared ban of loud_viewer");
    expect(describeAction(emoteOnly)).toBe("emoteonly");

    // @ts-expect-error an action that carries details needs its object
    const broken: ChannelModerateEvent = { ...moderateBase, ...noObjects, action: "ban" };
    void broken;
  });

  it("narrows channel.moderate version 1 on action", () => {
    expectTypeOf<ChannelEventSubTypes["channel.moderate@1"]["event"]>().toEqualTypeOf<ChannelModerateV1Event>();
    expectTypeOf<ChannelModerateV1Event>().not.toHaveProperty("warn");

    const event: ChannelModerateV1Event = {
      ...moderateBase,
      ...noObjectsV1,
      action: "shared_chat_timeout",
      shared_chat_timeout: { ...target, expires_at: "2026-03-01T18:25:11Z" },
    };
    const read = (value: ChannelModerateV1Event): string | null => {
      if (value.action === "shared_chat_timeout") return value.shared_chat_timeout.expires_at;
      if (value.action === "raid") return String(value.raid.viewer_count);
      if (value.action === "slowoff") {
        expectTypeOf(value.slow).toEqualTypeOf<null>();
        return null;
      }
      return null;
    };
    expect(read(event)).toBe("2026-03-01T18:25:11Z");
    expect(read({ ...moderateBase, ...noObjectsV1, action: "raid", raid: { ...target, viewer_count: 42 } })).toBe("42");
    expect(read({ ...moderateBase, ...noObjectsV1, action: "slowoff" })).toBeNull();
  });

  it("narrows suspicious user message fragments on type", () => {
    const event: ChannelSuspiciousUserMessageEvent = {
      broadcaster_user_id: "1337",
      broadcaster_user_name: "Cool_Channel",
      broadcaster_user_login: "cool_channel",
      user_id: "9001",
      user_name: "Loud_Viewer",
      user_login: "loud_viewer",
      low_trust_status: "active_monitoring",
      shared_ban_channel_ids: ["100"],
      types: ["ban_evader"],
      ban_evasion_evaluation: "likely",
      message: {
        message_id: "5c1f8f6e-2a55-4f0b-9d5c-6f0f3c1f7a10",
        text: "hi Kappa Cheer100",
        fragments: [
          { type: "text", text: "hi ", cheermote: null, emote: null },
          { type: "emote", text: "Kappa", cheermote: null, emote: { id: "25", emote_set_id: "0" } },
          { type: "cheermote", text: "Cheer100", cheermote: { prefix: "Cheer", bits: 100, tier: 1 }, emote: null },
        ],
      },
    };
    const bits = (fragment: ChannelSuspiciousUserMessageFragment): number => {
      if (fragment.type === "cheermote") return fragment.cheermote.bits;
      if (fragment.type === "emote") {
        expectTypeOf(fragment.emote.id).toEqualTypeOf<string>();
        expectTypeOf(fragment.cheermote).toEqualTypeOf<null>();
      }
      return 0;
    };
    expect(event.message.fragments.map(bits)).toEqual([0, 0, 100]);
    expectTypeOf<ChannelEventSubTypes["channel.suspicious_user.update"]["event"]["low_trust_status"]>().toEqualTypeOf<
      "none" | "active_monitoring" | "restricted"
    >();
  });
});
