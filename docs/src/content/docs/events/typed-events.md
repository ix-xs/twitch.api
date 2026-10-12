---
title: "Typed events"
description: "How the name of a subscription type gives you a typed condition and a typed event, and how to narrow events that come in several shapes."
sidebar:
  order: 5
---

Every subscription type the library knows has an entry in one TypeScript map. The name you pass to `on()` selects that entry, and from there the condition you must provide and the event your handler receives are fully typed. This page shows how to use those types, on any of the three listeners.

## A first example

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });
const events = twitch.eventsub.websocket();

events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, (event) => {
  console.log(event.user_name, event.followed_at); // both are strings
});

// @ts-expect-error the condition of channel.follow also needs moderator_user_id
events.on("channel.follow", { broadcaster_user_id: channelId }, () => {});
```

The name autocompletes, the condition is checked field by field, and `event` needs no annotation.

## How the name drives the types

The map is the `EventSubTypes` interface. Each of its keys is a type name, and each entry holds a `version`, a `condition` and an `event`. A few helper types read it for you:

| Type | Gives |
| --- | --- |
| `EventSubType` | The union of every known name, such as `"channel.follow"`. |
| `EventSubCondition<T>` | The condition to provide when subscribing to `T`. |
| `EventSubEvent<T>` | The event delivered by a subscription to `T`. |
| `EventSubHandler<T>` | The function type of a handler for `T`: `(event, meta) => unknown`. |
| `EventSubMeta` | The second argument of every handler. |

Use them to type your own functions and values:

```ts
import type { EventSubCondition, EventSubEvent } from "@ix-xs/twitch.api";

const chat: EventSubCondition<"channel.chat.message"> = { broadcaster_user_id: channelId, user_id: botId };

function isCommand(event: EventSubEvent<"channel.chat.message">): boolean {
  return event.message.text.startsWith("!");
}

events.on("channel.chat.message", chat, (event) => {
  if (isCommand(event)) console.log(`Command from ${event.chatter_user_login}`);
});
```

Every event and condition is also exported under its own name: `EventSubEvent<"channel.chat.message">` is `ChannelChatMessageEvent`. The [event types reference](/reference/event-types/) gives the interface name of each type.

Values arrive as Twitch sends them: IDs are strings and timestamps are RFC 3339 strings. Fields Twitch may leave out or set to `null` are typed that way, so the compiler tells you where a check is needed.

## Narrow events that come in several shapes

Some types deliver different payloads depending on what happened. They are typed as unions with one field that tells the variants apart. Test that field and TypeScript knows which details are present.

| Type | Narrow on |
| --- | --- |
| `channel.chat.notification` | `notice_type` |
| `channel.moderate` | `action` |
| `channel.bits.use` | `type` |
| `channel.hype_train.begin`, `.progress`, `.end` | `is_shared_train` |
| `automod.message.hold`, `automod.message.update` | `reason` |
| Message fragments, in chat and Bits events | `type` of each fragment |

### Chat notifications

`channel.chat.notification` covers subscriptions, gifts, raids, announcements and more. Each notice has a details object named after its `notice_type`. It is filled for that notice and `null` for the others.

```ts
events.on("channel.chat.notification", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
  switch (event.notice_type) {
    case "sub":
      console.log(`${event.chatter_user_name} subscribed at tier ${event.sub.sub_tier}`);
      break;
    case "resub":
      console.log(`${event.chatter_user_name} has been here for ${event.resub.cumulative_months} months`);
      break;
    case "community_sub_gift":
      console.log(`${event.chatter_user_name} gifted ${event.community_sub_gift.total} subscriptions`);
      break;
    case "raid":
      console.log(`${event.raid.user_name} raids with ${event.raid.viewer_count} viewers`);
      break;
    default:
      console.log(event.system_message);
  }
});
```

Keep a `default` branch. `system_message` is the text Twitch shows in chat and exists on every notice, including one Twitch adds after your version of the library was published.

### Moderation actions

`channel.moderate` reports what moderators do. `action` names the action, and the object of the same name carries its details.

```ts
events.on("channel.moderate", { broadcaster_user_id: channelId, moderator_user_id: botId }, (event) => {
  if (event.action === "timeout") {
    console.log(`${event.timeout.user_name} is timed out until ${event.timeout.expires_at}`);
  } else if (event.action === "ban") {
    console.log(`${event.ban.user_name} was banned: ${event.ban.reason ?? "no reason given"}`);
  } else if (event.action === "delete") {
    console.log(`Message of ${event.delete.user_name} deleted: ${event.delete.message_body}`);
  } else if (event.action === "add_blocked_term" || event.action === "remove_blocked_term") {
    console.log(`Blocked terms changed: ${event.automod_terms.terms.join(", ")}`);
  } else {
    console.log(`${event.moderator_user_name} did ${event.action}`);
  }
});
```

Two groups of actions share an object: the four term actions fill `automod_terms`, and `approve_unban_request` and `deny_unban_request` fill `unban_request`. Actions such as `clear`, `emoteonly` or `slowoff` have no details at all. The type `ChannelModerateAction` is the union of every value `action` can take.

### Bits

`channel.bits.use` fires for cheers and for Power-ups. Its `type` is `"cheer"`, `"power_up"` or `"custom_power_up"`.

```ts
events.on("channel.bits.use", { broadcaster_user_id: channelId }, (event) => {
  if (event.type === "power_up") {
    console.log(`${event.user_name} used ${event.power_up.type} for ${event.bits} Bits`);
  } else if (event.type === "custom_power_up") {
    console.log(`${event.user_name} redeemed ${event.custom_power_up.title}`);
  } else {
    console.log(`${event.user_name} cheered ${event.bits} Bits`);
  }
});
```

### Message fragments

A chat message comes as plain `text` and as a list of `fragments`: text, emotes, Cheermotes, mentions. Each fragment has a `type`, and the matching details are present once you have tested it.

```ts
events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
  const emotes: string[] = [];
  const mentions: string[] = [];
  let bits = 0;

  for (const fragment of event.message.fragments) {
    if (fragment.type === "emote") emotes.push(fragment.emote.id);
    else if (fragment.type === "mention") mentions.push(fragment.mention.user_login);
    else if (fragment.type === "cheermote") bits += fragment.cheermote.bits;
  }

  console.log({ text: event.message.text, emotes, mentions, bits });
});
```

### Hype Trains

The three Hype Train types tell a train shared between several channels from a train on one channel with the boolean `is_shared_train`.

```ts
events.on("channel.hype_train.begin", { broadcaster_user_id: channelId }, (event) => {
  if (event.is_shared_train) {
    const names = event.shared_train_participants.map((channel) => channel.broadcaster_user_name);
    console.log(`Shared Hype Train with ${names.join(", ")}`);
  } else {
    console.log(`Hype Train level ${event.level}, goal ${event.goal}`);
  }
});
```

## Versions

Twitch publishes some types in several versions. The plain name is the newest version the library knows, and an older one is written `name@version`. Four types have an older version:

- `automod.message.hold@1`
- `automod.message.update@1`
- `channel.channel_points_automatic_reward_redemption.add@1`
- `channel.moderate@1`

Each version has its own event type. Version 1 of `channel.moderate` does not report warnings, so `"warn"` is not one of its actions:

```ts
const handle = events.on("channel.moderate@1", { broadcaster_user_id: channelId, moderator_user_id: botId }, (event) => {
  if (event.action === "ban") console.log(event.ban.user_name);
});

console.log(handle.type, handle.version); // "channel.moderate" "1"
```

The version of a notification is also in `meta.version`. The constant `EVENTSUB_VERSIONS` maps every known name to the version sent to Twitch:

```ts
import { EVENTSUB_VERSIONS } from "@ix-xs/twitch.api";

console.log(EVENTSUB_VERSIONS["channel.follow"]); // "2"
```

## Types newer than the library

Twitch adds subscription types regularly. To use one this version does not know, write its version after an `@`. The condition is then a plain record of strings and the event is `unknown`: describe the part you read yourself.

```ts
// An invented type name, to show the form.
events.on("channel.new_feature.begin@1", { broadcaster_user_id: channelId }, (event, meta) => {
  const data = event as { broadcaster_user_name: string };
  console.log(meta.type, meta.version, data.broadcaster_user_name);
});
```

A name the library does not know and that has no `@version` is a compile error. In plain JavaScript, `on()` throws a `TypeError`: `Unknown EventSub type "channel.new_feature.begin". For a type newer than this library, write "channel.new_feature.begin@<version>".`

The same form works for a version of a known type that the library does not list, and in [eventsub.subscribe](/reference/api/eventsub/#subscribe).

## Batched events

`drop.entitlement.grant` is the one type Twitch delivers in batches. Its event is an array, with one entry per entitlement. The library asks for batching when it creates the subscription, as Twitch requires for this type. It is delivered over webhooks and conduits only.

```ts
declare function grantReward(userId: string, benefitId: string, entitlementId: string): Promise<void>;

hooks.on("drop.entitlement.grant", { organization_id: "9001" }, async (entitlements) => {
  for (const { data } of entitlements) {
    await grantReward(data.user_id, data.benefit_id, data.entitlement_id);
  }
});
```

`meta.messageId` identifies the whole batch. To recognize one entitlement you already handled, use `data.entitlement_id`.

## Type a handler declared elsewhere

Inside `on()`, the parameters of the handler are inferred. A handler written on its own, in another file for example, needs the type spelled out, and `EventSubHandler<T>` does it:

```ts
import type { EventSubHandler } from "@ix-xs/twitch.api";

const onFollow: EventSubHandler<"channel.follow"> = async (event, meta) => {
  console.log(`${event.user_name} followed at ${event.followed_at} (${meta.messageId})`);
};

events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, onFollow);
```

Give it a union of names to write one handler for several types. Only the fields the events have in common are available in it:

```ts
import type { EventSubHandler } from "@ix-xs/twitch.api";

const logStream: EventSubHandler<"stream.online" | "stream.offline"> = (event, meta) => {
  console.log(`${event.broadcaster_user_name}: ${meta.type}`);
};

events.on("stream.online", { broadcaster_user_id: channelId }, logStream);
events.on("stream.offline", { broadcaster_user_id: channelId }, logStream);
```

## See also

- [Event types](/reference/event-types/): every type with its version, condition, scope and event interface.
- [Receiving events](/events/overview/): `on()`, `meta` and the handle.
- [Managing subscriptions](/events/managing-subscriptions/): creating subscriptions by hand with the same type names.
