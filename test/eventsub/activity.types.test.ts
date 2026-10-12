import { describe, expect, expectTypeOf, it } from "vitest";
import {
  activityVersions,
  type ActivityEventSubTypes,
  type ChannelChannelPointsAutomaticRewardRedemptionAddMessageFragmentEmote,
  type ChannelHypeTrainParticipant,
  type ChannelPollChoice,
  type ChannelPollChoiceWithVotes,
  type DropEntitlementGrantEntitlement,
} from "../../src/eventsub/types/activity.js";

type EventOf<K extends keyof ActivityEventSubTypes> = ActivityEventSubTypes[K]["event"];
type ConditionOf<K extends keyof ActivityEventSubTypes> = ActivityEventSubTypes[K]["condition"];

const assigned = [
  "channel.guest_star_session.begin",
  "channel.guest_star_session.end",
  "channel.guest_star_guest.update",
  "channel.guest_star_settings.update",
  "channel.channel_points_automatic_reward_redemption.add",
  "channel.channel_points_automatic_reward_redemption.add@1",
  "channel.channel_points_custom_reward.add",
  "channel.channel_points_custom_reward.update",
  "channel.channel_points_custom_reward.remove",
  "channel.channel_points_custom_reward_redemption.add",
  "channel.channel_points_custom_reward_redemption.update",
  "channel.custom_power_up_redemption.add",
  "channel.poll.begin",
  "channel.poll.progress",
  "channel.poll.end",
  "channel.prediction.begin",
  "channel.prediction.progress",
  "channel.prediction.lock",
  "channel.prediction.end",
  "channel.charity_campaign.donate",
  "channel.charity_campaign.start",
  "channel.charity_campaign.progress",
  "channel.charity_campaign.stop",
  "conduit.shard.disabled",
  "drop.entitlement.grant",
  "extension.bits_transaction.create",
  "channel.goal.begin",
  "channel.goal.progress",
  "channel.goal.end",
  "channel.hype_train.begin",
  "channel.hype_train.progress",
  "channel.hype_train.end",
  "user.authorization.grant",
  "user.authorization.revoke",
  "user.update",
  "user.whisper.message",
];

describe("activity EventSub types", () => {
  it("lists every type with its version", () => {
    expect(Object.keys(activityVersions).sort()).toEqual([...assigned].sort());
    expect(activityVersions["channel.guest_star_guest.update"]).toBe("beta");
    expect(activityVersions["channel.channel_points_automatic_reward_redemption.add"]).toBe("2");
    expect(activityVersions["channel.channel_points_automatic_reward_redemption.add@1"]).toBe("1");
    expect(activityVersions["channel.hype_train.end"]).toBe("2");
    expectTypeOf<ActivityEventSubTypes["channel.hype_train.begin"]["version"]>().toEqualTypeOf<"2">();
    expectTypeOf<ActivityEventSubTypes["channel.guest_star_session.begin"]["version"]>().toEqualTypeOf<"beta">();
  });

  it("types the conditions", () => {
    const reward: ConditionOf<"channel.channel_points_custom_reward_redemption.add"> = { broadcaster_user_id: "1337" };
    expect(reward.reward_id).toBeUndefined();
    expectTypeOf<ConditionOf<"channel.channel_points_custom_reward.add">>().toEqualTypeOf<{
      broadcaster_user_id: string;
    }>();
    expectTypeOf<ConditionOf<"channel.guest_star_guest.update">["moderator_user_id"]>().toEqualTypeOf<string>();
    expectTypeOf<ConditionOf<"drop.entitlement.grant">["organization_id"]>().toEqualTypeOf<string>();
    expectTypeOf<ConditionOf<"drop.entitlement.grant">["campaign_id"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ConditionOf<"conduit.shard.disabled">["conduit_id"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ConditionOf<"user.authorization.revoke">>().toEqualTypeOf<{ client_id: string }>();
  });

  it("narrows the fragments of an automatic reward message", () => {
    const event: EventOf<"channel.channel_points_automatic_reward_redemption.add"> = {
      broadcaster_user_id: "12826",
      broadcaster_user_login: "twitch",
      broadcaster_user_name: "Twitch",
      user_id: "141981764",
      user_login: "twitchdev",
      user_name: "TwitchDev",
      id: "f024099a-e0fe-4339-9a0a-a706fb59f353",
      reward: { type: "send_highlighted_message", channel_points: 100, emote: null },
      message: {
        text: "Hi VoHiYo",
        fragments: [
          { type: "text", text: "Hi ", emote: null },
          { type: "emote", text: "VoHiYo", emote: { id: "81274" } },
        ],
      },
      redeemed_at: "2024-08-12T21:14:34.260398045Z",
    };
    const ids: string[] = [];
    for (const fragment of event.message?.fragments ?? []) {
      if (fragment.type === "emote") {
        expectTypeOf(fragment.emote).toEqualTypeOf<ChannelChannelPointsAutomaticRewardRedemptionAddMessageFragmentEmote>();
        ids.push(fragment.emote.id);
      } else {
        expectTypeOf(fragment.emote).toEqualTypeOf<null | undefined>();
      }
    }
    expect(ids).toEqual(["81274"]);
    expect(event.reward.channel_points).toBe(100);
  });

  it("types the version 1 automatic reward event", () => {
    type V1 = EventOf<"channel.channel_points_automatic_reward_redemption.add@1">;
    expectTypeOf<V1["reward"]["cost"]>().toEqualTypeOf<number>();
    expectTypeOf<V1["message"]["emotes"][number]["begin"]>().toEqualTypeOf<number>();
    expectTypeOf<V1["user_input"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<"celebration">().toMatchTypeOf<V1["reward"]["type"]>();
  });

  it("types custom rewards and their redemptions", () => {
    type Reward = EventOf<"channel.channel_points_custom_reward.update">;
    expectTypeOf<Reward["image"]>().toEqualTypeOf<Reward["default_image"] | null>();
    expectTypeOf<Reward["cooldown_expires_at"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Reward["redemptions_redeemed_current_stream"]>().toEqualTypeOf<number | null>();
    const redemption: EventOf<"channel.channel_points_custom_reward_redemption.update"> = {
      id: "17fa2df1-ad76-4804-bfa5-a40ef63efe63",
      broadcaster_user_id: "1337",
      broadcaster_user_login: "cool_user",
      broadcaster_user_name: "Cool_User",
      user_id: "9001",
      user_login: "cooler_user",
      user_name: "Cooler_User",
      user_input: "",
      status: "canceled",
      reward: { id: "92af127c", title: "Hydrate", cost: 100, prompt: "Drink some water" },
      redeemed_at: "2020-07-15T17:16:03.17106713Z",
    };
    expect(redemption.reward.cost).toBe(100);
    expectTypeOf(redemption.status).toEqualTypeOf<"unknown" | "unfulfilled" | "fulfilled" | "canceled">();
    expectTypeOf<EventOf<"channel.custom_power_up_redemption.add">["custom_power_up"]["bits"]>().toEqualTypeOf<number>();
  });

  it("types polls and Predictions", () => {
    expectTypeOf<EventOf<"channel.poll.begin">["choices"]>().toEqualTypeOf<ChannelPollChoice[]>();
    expectTypeOf<EventOf<"channel.poll.progress">["choices"]>().toEqualTypeOf<ChannelPollChoiceWithVotes[]>();
    const poll: EventOf<"channel.poll.end"> = {
      id: "1243456",
      broadcaster_user_id: "1337",
      broadcaster_user_login: "cool_user",
      broadcaster_user_name: "Cool_User",
      title: "Next game?",
      choices: [{ id: "123", title: "Chess", bits_votes: 0, channel_points_votes: 70, votes: 120 }],
      bits_voting: { is_enabled: false, amount_per_vote: 0 },
      channel_points_voting: { is_enabled: true, amount_per_vote: 10 },
      status: "completed",
      started_at: "2020-07-15T17:16:03.17106713Z",
      ended_at: "2020-07-15T17:16:11.17106713Z",
    };
    expect(poll.choices[0]?.votes).toBe(120);
    expectTypeOf(poll.status).toEqualTypeOf<"completed" | "archived" | "terminated">();

    type End = EventOf<"channel.prediction.end">;
    expectTypeOf<End["status"]>().toEqualTypeOf<"resolved" | "canceled">();
    expectTypeOf<End["outcomes"][number]["color"]>().toEqualTypeOf<"pink" | "blue">();
    expectTypeOf<End["outcomes"][number]["top_predictors"][number]["channel_points_won"]>().toEqualTypeOf<
      number | null
    >();
    expectTypeOf<EventOf<"channel.prediction.lock">["locked_at"]>().toEqualTypeOf<string>();
    expectTypeOf<EventOf<"channel.prediction.begin">["outcomes"][number]>().not.toHaveProperty("top_predictors");
  });

  it("types Guest Star, charity and goal events", () => {
    type Guest = EventOf<"channel.guest_star_guest.update">;
    expectTypeOf<Guest["slot_id"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Guest["host_volume"]>().toEqualTypeOf<number | null>();
    expectTypeOf<"backstage">().toMatchTypeOf<NonNullable<Guest["state"]>>();
    expectTypeOf<"tiled">().toMatchTypeOf<EventOf<"channel.guest_star_settings.update">["group_layout"]>();

    expectTypeOf<EventOf<"channel.charity_campaign.donate">["amount"]["decimal_places"]>().toEqualTypeOf<number>();
    expectTypeOf<EventOf<"channel.charity_campaign.donate">["broadcaster_user_id"]>().toEqualTypeOf<string>();
    expectTypeOf<EventOf<"channel.charity_campaign.stop">["broadcaster_id"]>().toEqualTypeOf<string>();
    expectTypeOf<EventOf<"channel.charity_campaign.stop">["stopped_at"]>().toEqualTypeOf<string>();
    expectTypeOf<EventOf<"channel.charity_campaign.progress">>().not.toHaveProperty("started_at");

    expectTypeOf<EventOf<"channel.goal.end">["is_achieved"]>().toEqualTypeOf<boolean>();
    expectTypeOf<EventOf<"channel.goal.progress">>().not.toHaveProperty("ended_at");
    expectTypeOf<"new_cheerer">().toMatchTypeOf<EventOf<"channel.goal.begin">["type"]>();
  });

  it("narrows the transport of a disabled shard", () => {
    const event: EventOf<"conduit.shard.disabled"> = {
      conduit_id: "bfcfc993-26b1-b876-44d9-afe75a379dac",
      shard_id: "4",
      status: "websocket_disconnected",
      transport: {
        method: "websocket",
        session_id: "ad1c9fc3-0d99-4eb7-8a04-8608e8ff9ec9",
        connected_at: "2020-11-10T14:32:18.730260295Z",
        disconnected_at: "2020-11-11T14:32:18.730260295Z",
      },
    };
    const { transport } = event;
    if (transport.method === "websocket") {
      expectTypeOf(transport.session_id).toEqualTypeOf<string>();
      expectTypeOf(transport.callback).toEqualTypeOf<null | undefined>();
      expect(transport.session_id).toMatch(/^ad1c/);
    } else {
      expectTypeOf(transport.callback).toEqualTypeOf<string>();
      expectTypeOf(transport.session_id).toEqualTypeOf<null | undefined>();
      throw new Error("expected a websocket transport");
    }
  });

  it("types the Drop entitlement event as a batch", () => {
    const event: EventOf<"drop.entitlement.grant"> = [
      {
        id: "bf7c8577-e3e3-4881-a78a-e9446641d45d",
        data: {
          organization_id: "9001",
          category_id: "9002",
          category_name: "Fortnite",
          campaign_id: "9003",
          user_id: "1234",
          user_name: "Cool_User",
          user_login: "cool_user",
          entitlement_id: "fb78259e-fb81-4d1b-8333-34a06ffc24c0",
          benefit_id: "74c52265-e214-48a6-91b9-23b6014e8041",
          created_at: "2019-01-28T04:17:53.325Z",
        },
      },
    ];
    expectTypeOf(event).toEqualTypeOf<DropEntitlementGrantEntitlement[]>();
    expect(event.map((entry) => entry.data.user_login)).toEqual(["cool_user"]);
    expectTypeOf<EventOf<"extension.bits_transaction.create">["product"]["in_development"]>().toEqualTypeOf<boolean>();
  });

  it("narrows a Hype Train on is_shared_train", () => {
    const event = {
      id: "1b0AsbInCHZW2SQFQkCzqN07Ib2",
      broadcaster_user_id: "1337",
      broadcaster_user_login: "cool_user",
      broadcaster_user_name: "Cool_User",
      total: 137,
      progress: 137,
      goal: 500,
      top_contributions: [{ user_id: "123", user_login: "pogchamp", user_name: "PogChamp", type: "bits", total: 50 }],
      shared_train_participants: [
        { broadcaster_user_id: "1337", broadcaster_user_login: "cool_user", broadcaster_user_name: "Cool_User" },
        { broadcaster_user_id: "1338", broadcaster_user_login: "other_user", broadcaster_user_name: "Other_User" },
      ],
      level: 1,
      started_at: "2020-07-15T17:16:03.17106713Z",
      expires_at: "2020-07-15T17:16:11.17106713Z",
      is_shared_train: true,
      type: "regular",
      all_time_high_level: 4,
      all_time_high_total: 2845,
    } as EventOf<"channel.hype_train.begin">;
    if (event.is_shared_train) {
      expectTypeOf(event.shared_train_participants).toEqualTypeOf<ChannelHypeTrainParticipant[]>();
      expect(event.shared_train_participants).toHaveLength(2);
    } else {
      expectTypeOf(event.shared_train_participants).toEqualTypeOf<null | undefined>();
      throw new Error("expected a shared train");
    }
    expect(event.all_time_high_level).toBe(4);

    const solo: EventOf<"channel.hype_train.end"> = {
      id: "1b0AsbInCHZW2SQFQkCzqN07Ib2",
      broadcaster_user_id: "1337",
      broadcaster_user_login: "cool_user",
      broadcaster_user_name: "Cool_User",
      total: 137,
      top_contributions: [],
      shared_train_participants: null,
      level: 1,
      started_at: "2020-07-15T17:16:03.17106713Z",
      ended_at: "2020-07-15T17:16:11.17106713Z",
      cooldown_ends_at: "2020-07-16T17:16:11.17106713Z",
      is_shared_train: false,
      type: "golden_kappa",
    };
    expect(solo.shared_train_participants).toBeNull();
    expectTypeOf<EventOf<"channel.hype_train.progress">>().not.toHaveProperty("all_time_high_level");
    expectTypeOf<EventOf<"channel.hype_train.end">>().not.toHaveProperty("expires_at");
  });

  it("types the user events", () => {
    expectTypeOf<EventOf<"user.authorization.grant">["user_login"]>().toEqualTypeOf<string>();
    expectTypeOf<EventOf<"user.authorization.revoke">["user_login"]>().toEqualTypeOf<string | null>();
    expectTypeOf<EventOf<"user.update">["email"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<EventOf<"user.whisper.message">["whisper"]["text"]>().toEqualTypeOf<string>();
  });
});
