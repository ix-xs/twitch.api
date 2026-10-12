---
title: "A chat bot"
description: "A bot that answers chat commands over EventSub WebSocket. It signs in once with the device code flow, then replies to commands with a per-user cooldown."
sidebar:
  order: 1
---

This recipe builds a chat bot in one file. It signs in the first time you run it, keeps its token in a file, reads the chat of a channel over EventSub WebSocket and answers three commands: `!ping`, `!uptime` and `!so <login>`. Nothing has to be hosted: the bot runs on your machine.

## What you need

| | |
| --- | --- |
| Application | A client ID from the [Twitch developer console](https://dev.twitch.tv/console/apps). No client secret: see [Credentials](/credentials/). |
| Account | A Twitch account for the bot. Your own account works too. |
| Token | A user token of that account, obtained by the program with the device code flow. |
| Scopes | `user:read:chat` to receive messages, `user:write:chat` to send them, `moderator:manage:shoutouts` for `!so`. |
| In the channel | For `!so`, the bot account must be the broadcaster or one of their moderators. The other commands work in any channel. |

## Sign in once

Build the client with a `FileTokenStore`. On the first run the file is empty, so the program starts the device code flow: it prints a link and a code, you approve in a browser, and `flow.wait()` resolves with the registered user. The token is saved in `tokens.json`, and on the next runs `restore()` finds it there.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [bot] = await twitch.auth.restore();
if (!bot) {
  const flow = await twitch.auth.deviceFlow({
    scopes: ["user:read:chat", "user:write:chat", "moderator:manage:shoutouts"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  bot = await flow.wait();
}
const botId = bot.userId;

// The channel to join: the first argument, or the bot's own channel.
const channel = await twitch.users.getByLogin(process.argv[2] ?? bot.login!);
if (!channel) throw new Error("Unknown channel");
const channelId = channel.id;
```

From here on the client renews the access token before it expires and writes each new token to the file. Add `tokens.json` to your `.gitignore`: it holds credentials. [Device code flow](/auth/device-code/) and [Storing tokens](/auth/storing-tokens/) cover both parts in detail.

## Listen to the chat

`channel.chat.message` takes two IDs: the channel to read and the user who reads it. The listener connects when the first handler is added.

```ts
const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.chatter_user_id === botId) return; // the bot's own messages

  if (event.message.text.trim() === "!ping") {
    await twitch.chat.send({
      broadcaster_id: event.broadcaster_user_id,
      message: "pong",
      reply_parent_message_id: event.message_id,
    });
  }
});
```

Three details matter here:

- The bot receives its own messages like everyone else's. Without the first line, a reply that starts with a command name would trigger the bot again.
- `sender_id` is not written. Only one user is registered, so the message is sent as the bot.
- `reply_parent_message_id` turns the message into a reply to the viewer who typed the command.

## Add a command table

A command is a function that receives the event and the words typed after the command name. It returns the text of the reply, or `undefined` to stay silent.

```ts
import type { EventSubEvent } from "@ix-xs/twitch.api";

type ChatMessage = EventSubEvent<"channel.chat.message">;
type Command = (event: ChatMessage, args: string[]) => Promise<string | undefined>;

const isModerator = (event: ChatMessage) =>
  event.badges.some((badge) => badge.set_id === "moderator" || badge.set_id === "broadcaster");

const commands: Record<string, Command> = {
  "!ping": async () => "pong",

  "!uptime": async (event) => {
    const stream = await twitch.streams.get({ user_id: event.broadcaster_user_id }).first();
    if (!stream) return "The stream is offline.";
    const minutes = Math.floor((Date.now() - Date.parse(stream.started_at)) / 60_000);
    return `Live for ${Math.floor(minutes / 60)} h ${minutes % 60} min.`;
  },

  "!so": async (event, [login]) => {
    if (!login || !isModerator(event)) return undefined;
    const target = await twitch.users.getByLogin(login.replace(/^@/, ""));
    if (!target) return `I do not know ${login}.`;
    await twitch.chat.shoutout({
      from_broadcaster_id: event.broadcaster_user_id,
      to_broadcaster_id: target.id,
    });
    return `Go follow ${target.display_name} at twitch.tv/${target.login}`;
  },
};
```

`streams.get` returns a paginator, and `first()` resolves with the live stream of the channel or with `undefined` when it is offline. The `started_at` field is a string, so it goes through `Date.parse`.

`!so` is reserved to the broadcaster and the moderators. The event carries the badges of the sender: a `set_id` of `moderator` or `broadcaster` is what tells them apart from other viewers. The shoutout itself is made by the bot, so `moderator_id` is left out and filled with the bot's ID.

## Add a cooldown and reply

A `Map` remembers when each viewer last used a command. The handler of the second step is replaced by one that finds the command, checks the cooldown and sends the reply.

```ts
import type { EventSubEvent } from "@ix-xs/twitch.api";

type ChatMessage = EventSubEvent<"channel.chat.message">;
// The table of the previous step.
declare const commands: Record<string, (event: ChatMessage, args: string[]) => Promise<string | undefined>>;

const COOLDOWN_MS = 5_000;
const lastUse = new Map<string, number>();

function onCooldown(userId: string): boolean {
  const now = Date.now();
  if (now - (lastUse.get(userId) ?? 0) < COOLDOWN_MS) return true;
  lastUse.set(userId, now);
  return false;
}

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.chatter_user_id === botId) return;

  const [name = "", ...args] = event.message.text.trim().split(/\s+/);
  const command = commands[name.toLowerCase()];
  if (!command || onCooldown(event.chatter_user_id)) return;

  const reply = await command(event, args);
  if (!reply) return;
  await twitch.chat.send({
    broadcaster_id: event.broadcaster_user_id,
    message: reply,
    reply_parent_message_id: event.message_id,
  });
});
```

An error thrown by a handler does not stop the listener. It is passed to the `onError` listener, so a shoutout that Twitch refuses (the channel is offline, or the last shoutout is less than 2 minutes old) prints one line and the bot keeps running.

## The whole file

```ts title="src/bot.ts"
import { Twitch, type EventSubEvent } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

type ChatMessage = EventSubEvent<"channel.chat.message">;
type Command = (event: ChatMessage, args: string[]) => Promise<string | undefined>;

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

// Sign in: from the file when possible, with the device code flow otherwise.
let [bot] = await twitch.auth.restore();
if (!bot) {
  const flow = await twitch.auth.deviceFlow({
    scopes: ["user:read:chat", "user:write:chat", "moderator:manage:shoutouts"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  bot = await flow.wait();
}
const botId = bot.userId;

const channel = await twitch.users.getByLogin(process.argv[2] ?? bot.login!);
if (!channel) throw new Error("Unknown channel");
const channelId = channel.id;

const isModerator = (event: ChatMessage) =>
  event.badges.some((badge) => badge.set_id === "moderator" || badge.set_id === "broadcaster");

const commands: Record<string, Command> = {
  "!ping": async () => "pong",

  "!uptime": async (event) => {
    const stream = await twitch.streams.get({ user_id: event.broadcaster_user_id }).first();
    if (!stream) return "The stream is offline.";
    const minutes = Math.floor((Date.now() - Date.parse(stream.started_at)) / 60_000);
    return `Live for ${Math.floor(minutes / 60)} h ${minutes % 60} min.`;
  },

  "!so": async (event, [login]) => {
    if (!login || !isModerator(event)) return undefined;
    const target = await twitch.users.getByLogin(login.replace(/^@/, ""));
    if (!target) return `I do not know ${login}.`;
    await twitch.chat.shoutout({
      from_broadcaster_id: event.broadcaster_user_id,
      to_broadcaster_id: target.id,
    });
    return `Go follow ${target.display_name} at twitch.tv/${target.login}`;
  },
};

const COOLDOWN_MS = 5_000;
const lastUse = new Map<string, number>();

function onCooldown(userId: string): boolean {
  const now = Date.now();
  if (now - (lastUse.get(userId) ?? 0) < COOLDOWN_MS) return true;
  lastUse.set(userId, now);
  return false;
}

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));
events.onConnect(() => console.log(`Listening to #${channel.login}`));

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.chatter_user_id === botId) return;

  const [name = "", ...args] = event.message.text.trim().split(/\s+/);
  const command = commands[name.toLowerCase()];
  if (!command || onCooldown(event.chatter_user_id)) return;

  const reply = await command(event, args);
  if (!reply) return;
  await twitch.chat.send({
    broadcaster_id: event.broadcaster_user_id,
    message: reply,
    reply_parent_message_id: event.message_id,
  });
});
```

The file uses top-level `await`, so the project must be an ES module (`"type": "module"` in `package.json`). Put the client ID in a `.env` file and run the bot with [tsx](https://tsx.is/), giving it the login of the channel to join:

```ini
TWITCH_CLIENT_ID=your-client-id
```

```bash
node --env-file=.env --import tsx src/bot.ts some_channel
```

## Going further

### Check that a reply reached the chat

`chat.send` does not throw when Twitch refuses a message, for example one that AutoMod holds back. It resolves with `is_sent: false` and the reason.

```ts
const sent = await twitch.chat.send({ broadcaster_id: channelId, message: "pong" });
if (!sent.is_sent) console.warn(`Dropped: ${sent.drop_reason?.message}`);
```

### React to more than messages

The same listener carries other subscriptions. Resubscriptions, raids and gifted subscriptions arrive through `channel.chat.notification`, which needs the same scope as chat messages.

```ts
events.on("channel.chat.notification", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.notice_type !== "raid") return;
  await twitch.chat.send({
    broadcaster_id: event.broadcaster_user_id,
    message: `Welcome to the ${event.raid.viewer_count} raiders of ${event.raid.user_name}`,
  });
});
```

### Add a scope later

The scopes are granted when the bot signs in and saved with the token. When a new command needs another scope, the call fails with a `TwitchScopeError` that names it. Add the scope to the `deviceFlow` call, delete `tokens.json` and run the program again to sign in with the new list.

## See also

- [WebSocket](/events/websocket/): reconnection, limits and options of the listener.
- [Device code flow](/auth/device-code/): what `deviceFlow` and `wait` do.
- [Acting as a user](/basics/acting-as-a-user/): how the token of a call is chosen.
- [chat.send](/reference/api/chat/#send): every parameter of a chat message.
- [channel.chat.message](/reference/event-types/#channelchatmessage): the condition and the scopes of the event.
