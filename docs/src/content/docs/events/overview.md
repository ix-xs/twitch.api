---
title: "Receiving events"
description: "How EventSub events reach your program: the three transports, how to choose one, and the on() interface they share."
sidebar:
  order: 1
---

EventSub is how Twitch tells your program that something happened: a chat message, a follow, a stream going live. You subscribe to a type of event for a given channel or user, and Twitch sends you a notification each time it occurs. The library receives events over WebSocket, webhooks or conduits, and the three listeners share one interface.

## A first example

This listener prints the chat of a channel. It uses a WebSocket, so there is nothing to host.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});
const bot = await twitch.auth.addUser({ accessToken, refreshToken });

const events = twitch.eventsub.websocket();

events.on("channel.chat.message", { broadcaster_user_id: "141981764", user_id: bot.userId }, (event) => {
  console.log(`${event.chatter_user_name}: ${event.message.text}`);
});

events.onError((error) => console.error(error.message));
```

The token registered with `addUser` needs the `user:read:chat` scope here. [Acting as a user](/basics/acting-as-a-user/) explains how tokens are registered.

## Choose a transport

A transport is the way notifications travel from Twitch to you. The handlers you write are the same on all three.

| | WebSocket | Webhooks | Conduits |
| --- | --- | --- | --- |
| Created with | `twitch.eventsub.websocket()` | `twitch.eventsub.webhook({ callback, secret })` | `twitch.eventsub.conduit()` |
| Token that subscribes | A user token | The app token | The app token |
| What you host | Nothing | A public HTTPS endpoint on port 443 | Nothing |
| After a restart | Subscriptions are created again | Subscriptions are still there | Subscriptions are still there |
| Capacity | 3 connections of 300 subscriptions | Bounded by your subscription cost | Bounded by your subscription cost, spread over shards |
| Fits | A bot or a tool that acts for one user, local development | Web servers and serverless platforms | Backends that follow many channels without a public URL |

Each transport has its own page: [WebSocket](/events/websocket/), [Webhooks](/events/webhooks/) and [Conduits](/events/conduits/). The app token needs a client secret, so webhooks and conduits are for code that runs on a server.

## Subscribe to an event

Every listener has the same `on(type, condition, handler)` method.

```ts
events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, async (event) => {
  await twitch.chat.send({ broadcaster_id: event.broadcaster_user_id, message: `Welcome ${event.user_name}` });
});
```

- **type** is the name of the subscription type, such as `channel.follow`. It autocompletes in your editor.
- **condition** says what to listen to: which channel, which user. Its fields depend on the type and are checked by TypeScript.
- **handler** receives the event, typed from the name. It can be synchronous or `async`.

The listener does not wait for an `async` handler to finish before it delivers the next event, so two handlers can run at the same time. [Typed events](/events/typed-events/) covers how the types work, and the [event types reference](/reference/event-types/) lists every type with its condition.

## Read the metadata

The handler gets a second argument, `meta`, that describes the notification itself.

```ts
events.on("stream.online", { broadcaster_user_id: "141981764" }, (event, meta) => {
  console.log(meta.messageId, meta.timestamp, meta.subscription.id);
  console.log(`${event.broadcaster_user_name} went live at ${event.started_at}`);
});
```

| Field | Type | Content |
| --- | --- | --- |
| `messageId` | `string` | Unique ID of the notification. |
| `timestamp` | `string` | When Twitch sent it, as an RFC 3339 timestamp. |
| `type` | `string` | Subscription type, such as `stream.online`. |
| `version` | `string` | Version of the subscription type. |
| `subscription` | `EventSubSubscription` | The subscription the event belongs to, with its `id`, `condition`, `transport` and `cost`. |

Twitch can deliver the same notification more than once. The listeners remember message IDs and run your handlers once per notification, so you do not have to compare `messageId` yourself.

## Wait for a subscription or stop it

`on()` returns a handle right away. The subscription is created in the background.

```ts
const handle = events.on("stream.online", { broadcaster_user_id: channelId }, (event) => {
  console.log(`${event.broadcaster_user_name} is live`);
});

await handle.ready; // Twitch accepted the subscription
await handle.stop(); // remove this handler
```

`ready` resolves once Twitch has accepted the subscription and rejects if Twitch refuses it. You do not have to await it: a failure is also reported to `onError`, and an unobserved `ready` never crashes the process. The handle also exposes the `type`, the `version` and the `condition` it was created with. [Managing subscriptions](/events/managing-subscriptions/) describes what `stop()` does on each transport.

## Handle errors

`onError` receives everything that goes wrong inside a listener:

- a subscription Twitch refused, as a `TwitchEventSubError` whose message starts with `Could not subscribe to <type>` and whose `cause` is the original error;
- an error thrown by one of your handlers, or the rejection of an `async` handler, passed as is;
- a connection that could not be opened, or a webhook callback Twitch never verified.

```ts
import { TwitchEventSubError } from "@ix-xs/twitch.api";

const off = events.onError((error) => {
  if (error instanceof TwitchEventSubError) console.error("EventSub:", error.message, error.cause);
  else console.error("A handler failed:", error);
});

off(); // stop listening
```

A handler that throws does not stop delivery: the other handlers and the following events still run.

:::caution
When no `onError` listener is registered, errors are printed with `console.error`, prefixed with `[twitch.api] EventSub error`. Call `onError` right after you create a listener if you want them in your own logs.
:::

## React to revocations

Twitch revokes a subscription when it can no longer deliver it: the user removed your application, the user was banned or deleted, or the subscription type was retired. The listener drops the subscription, its handlers stop running, and `onRevocation` is called with the subscription as Twitch last described it.

```ts
events.onRevocation((subscription) => {
  console.warn(`${subscription.type} was revoked: ${subscription.status}`);
});
```

`subscription.status` gives the reason, for example `authorization_revoked` or `user_removed`. Nothing subscribes again on its own. Like `onError`, `onRevocation` returns a function that removes the listener.

## Share a subscription between handlers

Calling `on()` twice with the same type and the same condition creates one subscription on Twitch's side and attaches both handlers to it. The order of the fields in the condition does not matter.

```ts
const log = events.on("stream.online", { broadcaster_user_id: channelId }, (event) => {
  console.log("online", event.started_at);
});
const announce = events.on("stream.online", { broadcaster_user_id: channelId }, async (event) => {
  await twitch.chat.send({ broadcaster_id: event.broadcaster_user_id, message: "We are live" });
});

console.log(events.size); // 1

await log.stop(); // the subscription stays, announce still runs
await announce.stop(); // last handler gone: the subscription is deleted
```

`size` is the number of active subscriptions of a listener, not the number of handlers. Sharing happens inside one listener object: two listeners that subscribe to the same thing create two subscriptions.

## Where scopes come from

Most event types need a scope, granted by a user named in the condition. `channel.follow` needs `moderator:read:followers` from the user in `moderator_user_id`, `channel.subscribe` needs `channel:read:subscriptions` from the broadcaster, and `stream.online` needs nothing. The [event types reference](/reference/event-types/) gives the scope of every type.

Who has to hold the scope depends on the transport:

- Over WebSocket, the subscription is created with a user token, and that token must carry the scope.
- Over webhooks and conduits, the subscription is created with the app token. The user must have granted the scope to your application at some point, through one of the flows listed in the [authentication overview](/auth/overview/). You do not need to keep their token.

The library does not check event scopes before it subscribes, unlike API calls. When a scope is missing, Twitch answers `403` and the failure reaches `handle.ready` and `onError`:

```ts
const handle = events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, () => {});

try {
  await handle.ready;
} catch (error) {
  // Could not subscribe to channel.follow (version 2): subscription missing proper authorization (403 on POST /helix/eventsub/subscriptions)
  console.error((error as Error).message);
}
```

## See also

- [WebSocket](/events/websocket/): connection handling, reconnection and limits.
- [Webhooks](/events/webhooks/): plugging the listener into your HTTP server.
- [Conduits](/events/conduits/): app token subscriptions over WebSocket shards.
- [Typed events](/events/typed-events/): narrowing events that come in several shapes.
- [Event types](/reference/event-types/): every type, its condition and its scope.
