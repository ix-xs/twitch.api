---
title: "Moderation"
description: "Act as a moderator: time out, ban, warn, delete messages, review what AutoMod holds and switch Shield Mode, with the moderator ID filled in for you."
sidebar:
  order: 3
---

This recipe builds a moderation helper that runs under the account of a moderator. It reviews the messages AutoMod holds, removes links posted by viewers, and gives the moderators of the channel three chat commands: `!timeout`, `!ban` and `!unban`, plus `!shield` to switch Shield Mode. Along the way it shows every moderation call on its own.

## What you need

| | |
| --- | --- |
| Application | A client ID from the [Twitch developer console](https://dev.twitch.tv/console/apps). The program signs in with the device code flow, which needs no client secret. |
| Account | The broadcaster, or an account the broadcaster made a moderator of the channel. |
| Token | A user token of that account. |
| Scopes | `moderator:manage:banned_users`, `moderator:manage:warnings`, `moderator:manage:chat_messages`, `moderator:manage:automod`, `moderator:manage:shield_mode`, and `user:read:chat` to read the chat. |

Ask only for the scopes of the parts you keep. [Scopes](/reference/scopes/) lists what each one unlocks.

## Sign in as the moderator

The sign-in is the same as in the [chat bot recipe](/recipes/chat-bot/): a `FileTokenStore`, and the device code flow when the file is empty. The channel is the first argument of the program, or the moderator's own channel. Give this program a token file of its own: a token saved by another program may belong to another account or lack these scopes.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [moderator] = await twitch.auth.restore();
if (!moderator) {
  const flow = await twitch.auth.deviceFlow({
    scopes: [
      "user:read:chat",
      "moderator:manage:banned_users",
      "moderator:manage:warnings",
      "moderator:manage:chat_messages",
      "moderator:manage:automod",
      "moderator:manage:shield_mode",
    ],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  moderator = await flow.wait();
}
const moderator_id = moderator.userId;

const channel = await twitch.users.getByLogin(process.argv[2] ?? moderator.login!);
if (!channel) throw new Error("Unknown channel");
const broadcaster_id = channel.id;
```

## Time out, ban, warn and delete

A timeout is a ban with a `duration` in seconds. Without it the ban is permanent. The `reason` is shown to the user and to the other moderators.

```ts
// Ten minutes out of the chat.
const timeout = await twitch.moderation.ban({ broadcaster_id, user_id, duration: 600, reason: "Spam" });
console.log(`Back at ${timeout.end_time}`);

// For good.
await twitch.moderation.ban({ broadcaster_id, user_id, reason: "Harassment" });

// Lifts a ban or a timeout.
await twitch.moderation.unban({ broadcaster_id, user_id });

// The user cannot chat again until they acknowledge the warning.
await twitch.moderation.warn({ broadcaster_id, user_id, reason: "Keep it friendly." });

// Removes one message. Without `message_id`, the whole chat is cleared.
await twitch.moderation.deleteMessages({ broadcaster_id, message_id: "abc-123-def" });
```

None of these calls says who the moderator is. Every one of these endpoints has a `moderator_id` parameter, and the client fills it with the ID of the user whose token it uses. With a single user registered, that user is the moderator. You can still write `moderator_id` yourself, and [Acting as a user](/basics/acting-as-a-user/) explains how the token is chosen when several users are registered.

Twitch sets a few rules of its own. A banned user has to be unbanned before a timeout can be set. A message can be removed for 6 hours after it was sent, and the messages of the broadcaster and of the moderators cannot be removed.

## Review what AutoMod holds

`automod.message.hold` fires each time AutoMod keeps a message out of the chat until a moderator decides. The event has two shapes, told apart by `reason`: a message caught by AutoMod itself carries a category and a level from 1 to 4, a message caught by a blocked term or a blocked link carries the terms that were found.

```ts
events.on(
  "automod.message.hold",
  { broadcaster_user_id: broadcaster_id, moderator_user_id: moderator_id },
  async (event) => {
    let action: "ALLOW" | "DENY" | undefined;
    if (event.reason === "automod") {
      // The mildest catches go through, the others wait for a human.
      if (event.automod.level === 1) action = "ALLOW";
    } else {
      // A blocked term or a blocked link.
      action = "DENY";
    }

    console.log(`Held "${event.message.text}" from ${event.user_login}: ${action ?? "left in the queue"}`);
    if (action) await twitch.moderation.manageAutoModMessage({ msg_id: event.message_id, action });
  },
);
```

`ALLOW` releases the message to the chat and `DENY` discards it. The moderator who takes the decision is called `user_id` on this endpoint. It is left out here as well.

The condition of a subscription is the one place where the moderator's ID has to be written: Twitch needs it to know who is listening, and nothing fills it for you.

The policy above is only an example. Decide for your channel which catches a program may settle and which ones a person should read.

## Switch Shield Mode and list the bans

Shield Mode applies the stricter chat rules the broadcaster prepared for it. `updateShieldMode` returns the new status, and `shieldMode` reads it.

```ts
const status = await twitch.moderation.updateShieldMode({ broadcaster_id, is_active: true });
console.log(`Shield Mode is ${status.is_active ? "on" : "off"}`);

const current = await twitch.moderation.shieldMode({ broadcaster_id });
console.log(`Last turned on by ${current.moderator_login || "nobody"}`);
```

`bans` lists the users who are banned or timed out. It returns a paginator: `for await` walks through every page.

```ts
for await (const ban of twitch.moderation.bans()) {
  const until = ban.expires_at ? `until ${ban.expires_at}` : "for good";
  console.log(`${ban.user_login} is out ${until}, by ${ban.moderator_login}: ${ban.reason || "no reason"}`);
}
```

:::note
With a user token, Twitch requires the `broadcaster_id` of this request to match the user ID of the token. `bans()` without a `broadcaster_id` reads the list of the user making the call, which fits a program signed in as the broadcaster. Signed in as a moderator, register the broadcaster's token as well: `bans({ broadcaster_id })` then uses it, because `broadcaster_id` names a registered user. With a client secret and only the moderator registered, the same call goes out with the app token.
:::

## The whole file

The program puts the calls above behind two subscriptions. The first one settles AutoMod holds. The second one reads the chat: a message from a viewer that contains a link is removed and its author warned, and a message from the broadcaster or a moderator is read as a command. The badges of the event tell who is who.

```ts title="src/mod.ts"
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [moderator] = await twitch.auth.restore();
if (!moderator) {
  const flow = await twitch.auth.deviceFlow({
    scopes: [
      "user:read:chat",
      "moderator:manage:banned_users",
      "moderator:manage:warnings",
      "moderator:manage:chat_messages",
      "moderator:manage:automod",
      "moderator:manage:shield_mode",
    ],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  moderator = await flow.wait();
}
const moderator_id = moderator.userId;

const channel = await twitch.users.getByLogin(process.argv[2] ?? moderator.login!);
if (!channel) throw new Error("Unknown channel");
const broadcaster_id = channel.id;

// The list of bans is read with the token of the channel's owner.
if (moderator_id === broadcaster_id) {
  for await (const ban of twitch.moderation.bans()) {
    const until = ban.expires_at ? `until ${ban.expires_at}` : "for good";
    console.log(`${ban.user_login} is out ${until}, by ${ban.moderator_login}: ${ban.reason || "no reason"}`);
  }
}

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on(
  "automod.message.hold",
  { broadcaster_user_id: broadcaster_id, moderator_user_id: moderator_id },
  async (event) => {
    let action: "ALLOW" | "DENY" | undefined;
    if (event.reason === "automod") {
      if (event.automod.level === 1) action = "ALLOW";
    } else {
      action = "DENY";
    }

    console.log(`Held "${event.message.text}" from ${event.user_login}: ${action ?? "left in the queue"}`);
    if (action) await twitch.moderation.manageAutoModMessage({ msg_id: event.message_id, action });
  },
);

events.on("channel.chat.message", { broadcaster_user_id: broadcaster_id, user_id: moderator_id }, async (event) => {
  const text = event.message.text.trim();
  const trusted = event.badges.some((badge) => badge.set_id === "moderator" || badge.set_id === "broadcaster");

  if (!trusted) {
    if (!/https?:\/\//i.test(text)) return;
    await twitch.moderation.deleteMessages({ broadcaster_id, message_id: event.message_id });
    await twitch.moderation.warn({
      broadcaster_id,
      user_id: event.chatter_user_id,
      reason: "Links are not allowed in this chat.",
    });
    return;
  }

  const [name, arg = "", ...rest] = text.split(/\s+/);

  if (name === "!shield") {
    const status = await twitch.moderation.updateShieldMode({ broadcaster_id, is_active: arg === "on" });
    console.log(`Shield Mode is ${status.is_active ? "on" : "off"}`);
    return;
  }
  if ((name !== "!timeout" && name !== "!ban" && name !== "!unban") || !arg) return;

  const target = await twitch.users.getByLogin(arg.replace(/^@/, ""));
  if (!target) return;
  const user_id = target.id;

  if (name === "!unban") {
    await twitch.moderation.unban({ broadcaster_id, user_id });
  } else if (name === "!ban") {
    await twitch.moderation.ban({ broadcaster_id, user_id, reason: rest.join(" ") || "No reason given" });
  } else {
    // !timeout <login> <seconds> <reason>
    const duration = Number(rest[0]) || 600;
    const reason = rest.slice(1).join(" ") || "No reason given";
    const timeout = await twitch.moderation.ban({ broadcaster_id, user_id, duration, reason });
    console.log(`${target.login} is timed out until ${timeout.end_time}`);
  }
});
```

Run it with [tsx](https://tsx.is/), in a project that is an ES module (`"type": "module"` in `package.json`), with `TWITCH_CLIENT_ID` in a `.env` file:

```bash
node --env-file=.env --import tsx src/mod.ts some_channel
```

In the chat, a moderator can now type `!timeout some_viewer 300 Calm down`, `!ban some_viewer Spam bot`, `!unban some_viewer`, `!shield on` and `!shield off`.

## Going further

### Tell a refused action from a broken one

Twitch refuses some actions for good reasons: the target is a moderator, the user is already banned. These come back as a `TwitchApiError`, and a token that lacks a scope fails earlier with a `TwitchScopeError`. Thrown inside a handler and not caught, both end up in `onError`.

```ts
import { TwitchApiError, TwitchScopeError } from "@ix-xs/twitch.api";

try {
  await twitch.moderation.ban({ broadcaster_id, user_id, duration: 600, reason: "Spam" });
} catch (error) {
  if (error instanceof TwitchScopeError) console.error(`Sign in again with one of: ${error.required.join(", ")}`);
  else if (error instanceof TwitchApiError) console.error(`Refused (${error.status}): ${error.message}`);
  else throw error;
}
```

### Run with several accounts

When more than one user is registered, the client can no longer guess who the moderator is. A call that leaves `moderator_id` out then fails with a `TwitchAuthError` before any request is sent, and its message tells you to choose a user with `{ as: userId }` or `twitch.as(userId)`. Name the moderator once with `twitch.as()`, or write `moderator_id` in the call.

```ts
const asModerator = twitch.as(moderator_id);
await asModerator.moderation.ban({ broadcaster_id, user_id, duration: 600, reason: "Spam" });

// The broadcaster is registered too: the list of bans is read with their token.
const banned = await twitch.moderation.bans({ broadcaster_id }).all();
```

The second call needs no `as`: `broadcaster_id` names a registered user, and that is the token the client picks.

### Block a term

`addBlockedTerm` adds a word or a phrase to the blocked terms of the channel. It needs the `moderator:manage:blocked_terms` scope. A `*` at the start or at the end of a word is a wildcard.

```ts
const term = await twitch.moderation.addBlockedTerm({ broadcaster_id, text: "spoil*" });
console.log(`Blocked "${term.text}"`);
```

## See also

- [twitch.moderation](/reference/api/moderation/): every moderation method, with its parameters and scopes.
- [Acting as a user](/basics/acting-as-a-user/): which token a call uses, and the fields filled for you.
- [Errors](/basics/errors/): the error classes and their fields.
- [automod.message.hold](/reference/event-types/#automodmessagehold): the condition and the scope of the event.
- [Typed events](/events/typed-events/): narrowing an event on its discriminator.
