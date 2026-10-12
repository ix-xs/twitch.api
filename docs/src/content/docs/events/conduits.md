---
title: "Conduits"
description: "Receive events over WebSocket with the app token: what a conduit is, when to pick it, how to run several shards and how to manage conduits by hand."
sidebar:
  order: 4
---

A conduit is a container that belongs to your application. You subscribe to events once, on the conduit, with the app token. Twitch then delivers the notifications to the shards of the conduit, and each shard is a WebSocket connection or a webhook callback that you plug in. `twitch.eventsub.conduit()` opens a WebSocket and serves one shard with it.

## A first example

This program logs when any channel of a list goes live. It needs a client ID and a client secret, and no user token at all.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const events = twitch.eventsub.conduit(); // finds your conduit, or creates one
events.onError((error) => console.error(error.message));

const channels = await twitch.users.get({ login: ["twitchdev", "twitch"] });
for (const channel of channels) {
  events.on("stream.online", { broadcaster_user_id: channel.id }, (event) => {
    console.log(`${event.broadcaster_user_name} went live`);
  });
}
```

The object returned is the same class as the [WebSocket listener](/events/websocket/). `on()`, `onError()`, `onRevocation()`, `onConnect()`, `onDisconnect()`, `connected`, `sessionIds` and `close()` are all there, and the connection is kept alive and restored in the same way.

## When a conduit is the right choice

| You want to | Use |
| --- | --- |
| Act for one user, from a CLI, a desktop app or a bot with its own token | [WebSocket](/events/websocket/) |
| Receive events on a server that already has a public HTTPS address | [Webhooks](/events/webhooks/) |
| Follow many channels from a backend, with no public address | A conduit |
| Get past 3 connections of 300 subscriptions per user | A conduit |
| Spread the events of one application over several processes | A conduit with several shards |

A conduit needs the app token, so it needs a client secret. It is not for code that runs on a user's machine.

## What the listener does

`conduit()` opens nothing until the first `on()`, like `websocket()`. Each time a WebSocket session is established, the listener:

1. Finds the conduit: the one given as `conduitId`, otherwise the first conduit of your application, otherwise a new one that it creates.
2. Assigns its session to the shard `shardId` of that conduit.
3. Creates the subscriptions that Twitch has not confirmed yet, with the app token and the conduit as transport.

Some behaviours differ from a plain WebSocket listener:

| | `websocket()` | `conduit()` |
| --- | --- | --- |
| Token that subscribes | A user token | The app token |
| Connections | Up to 3 | 1 |
| Subscriptions per connection | 300 | No cap in the library |
| After a reconnection | Every subscription is created again | The shard is assigned to the new session, subscriptions are untouched |
| A subscription that already exists (`409`) | Refused | Counts as accepted |
| `close()` or `twitch.close()` | Twitch disables the subscriptions | The subscriptions stay on the conduit |

Steps 1 and 2 can fail, and the listener treats two kinds of failure differently:

- A temporary failure (a `5xx`, a `429`, a network error or a timeout) is reported once to `onError`, as a `TwitchEventSubError` that starts with `Could not bind the WebSocket session`. The listener then tries again on the same session, with a backoff that grows up to 30 seconds. `handle.ready` stays pending in the meantime.
- A failure that waiting cannot fix, such as a shard ID the conduit does not have, rejects the `ready` of every subscription still pending with the reason, drops those subscriptions and closes the connection.

## Options

```ts
const events = twitch.eventsub.conduit({ conduitId: conduit.id, shardId: "0", keepalive: 30 });
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `conduitId` | `string` | first conduit of the application | ID of the conduit to join. When you have none and leave it out, one is created. |
| `shardId` | `string` | `"0"` | ID of the shard this process serves. Shard IDs are the indexes `"0"`, `"1"`, `"2"`... |
| `keepalive` | `number` | Twitch uses 10 | Seconds of silence after which Twitch sends a keepalive, from 10 to 600. |
| `webSocket` | `WebSocketConstructor` | the global `WebSocket` | WebSocket class to use. |
| `url` | `string` | `wss://eventsub.wss.twitch.tv/ws` | EventSub WebSocket URL. |

There is no `user` option: subscriptions always go through the app token, also when the listener is created from a `twitch.as(userId)` view.

## Subscriptions outlive the process

Subscriptions belong to the conduit, not to the connection. When your process restarts, `on()` asks for a subscription that already exists, Twitch answers `409`, and the listener counts it as accepted. Its ID is learned from the first event it delivers.

This also means that `close()`, `twitch.close()` and a crash leave the subscriptions in place. To remove one, stop its handle:

```ts
const handle = events.on("stream.offline", { broadcaster_user_id: channelId }, (event) => {
  console.log(`${event.broadcaster_user_name} went offline`);
});

await handle.ready;
await handle.stop(); // deletes the subscription on Twitch's side
```

`stop()` can only delete a subscription whose ID is known. For one that existed before the process started and has not delivered an event yet, delete it by ID as shown in [Managing subscriptions](/events/managing-subscriptions/).

## Run several shards

Twitch sends each notification to one shard. With several shards, each served by its own process, the load is shared between them.

Create the conduit once, with as many shards as you run processes, and keep its ID:

```ts
const conduit = await twitch.conduits.create({ shard_count: 3 });
console.log(conduit.id);
```

Then start each process with the conduit ID and its own shard ID:

```ts
const events = twitch.eventsub.conduit({
  conduitId: process.env.CONDUIT_ID!,
  shardId: process.env.SHARD_ID ?? "0",
});

events.on("stream.online", { broadcaster_user_id: channelId }, (event) => {
  console.log(`[shard ${process.env.SHARD_ID}] ${event.broadcaster_user_name} went live`);
});
```

Three rules keep this working:

- Every process registers the same handlers. A process only runs handlers it registered itself, and an event that reaches a shard with no handler for it is dropped. The first process creates each subscription, the others get the `409` and carry on.
- Pass `conduitId` explicitly. Without it, the listener creates a conduit only when the application has none, sized for its own shard: `shardId: "2"` creates 3 shards. A process that joins a conduit too small for its shard ID sees its subscriptions rejected with `Could not bind the WebSocket session: Shard 2 of conduit <id>: ...` followed by the reason Twitch gave, and its connection is closed.
- Keep `shard_count` equal to the number of processes you run. Change it with `twitch.conduits.update`.

The subscription is shared by all the processes: a `handle.stop()` in one of them deletes it for the others too.

## Manage conduits by hand

The `twitch.conduits` group covers the conduit endpoints. All of them use the app token.

```ts
const conduits = await twitch.conduits.list();

for (const conduit of conduits) {
  const shards = await twitch.conduits.shards({ conduit_id: conduit.id }).all();
  for (const shard of shards) {
    console.log(conduit.id, shard.id, shard.status, shard.transport.method);
  }
}
```

| Method | Does |
| --- | --- |
| [conduits.list](/reference/api/conduits/#list) | Lists the conduits of your application. |
| [conduits.create](/reference/api/conduits/#create) | Creates a conduit with a number of shards. |
| [conduits.update](/reference/api/conduits/#update) | Changes the number of shards. Lowering it removes the shards with the highest IDs. |
| [conduits.delete](/reference/api/conduits/#delete) | Deletes a conduit. Its subscriptions stop shortly after. |
| [conduits.shards](/reference/api/conduits/#shards) | Lists the shards of a conduit, with their status and transport. |
| [conduits.updateShards](/reference/api/conduits/#updateshards) | Points shards at a WebSocket session or a webhook callback. |

`updateShards` does not throw when Twitch refuses some of the shards. It resolves with the shards that were updated in `data` and the refused ones in `errors`:

```ts
const { data, errors } = await twitch.conduits.updateShards({
  conduit_id: conduit.id,
  shards: [{ id: "0", transport: { method: "websocket", session_id } }],
});

for (const failure of errors) console.error(`Shard ${failure.id}: ${failure.message} (${failure.code})`);
console.log(`${data.length} shard(s) updated`);
```

Only shards whose status is `enabled` receive events. To be told when one stops, subscribe to [`conduit.shard.disabled`](/reference/event-types/#conduitsharddisabled) with your client ID as `client_id`.

## Authorizations the app token needs

The app token carries no scope. For an event type that needs one, Twitch checks that the user named in the condition granted that scope to your application. The user does this once, through the [authorization code flow](/auth/authorization-code/) or the [device code flow](/auth/device-code/). The subscription itself does not use their token.

- `stream.online`, `channel.update` and other types without a scope work for any channel.
- `channel.follow` needs `moderator:read:followers` granted by the user in `moderator_user_id`.
- Chat types such as `channel.chat.message` need more with an app token than with a user token: `user:read:chat` and `user:bot` granted by the user in `user_id`, plus either `channel:bot` granted by the broadcaster or moderator status for that user in the channel.

```ts
// botId granted user:read:chat and user:bot, the broadcaster granted channel:bot.
events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
  console.log(`${event.chatter_user_name}: ${event.message.text}`);
});
```

When an authorization is missing, Twitch refuses the subscription with a `403`, which rejects `handle.ready` and reaches `onError`. When a user removes your application later, the subscription is revoked and `onRevocation` is called. The [event types reference](/reference/event-types/) gives the requirements of every type.

## Limits

- [Twitch's conduit documentation](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) sets the limits at five enabled conduits per application and 20,000 shards per conduit, and says these numbers may change.
- Subscriptions on a conduit count against the total cost of your application. [Managing subscriptions](/events/managing-subscriptions/) shows how to read it.
- One listener serves one shard over one connection. Create one listener per shard.
- When a shard is disabled, for example because its connection dropped, Twitch tries to send its notifications to another shard. If that one is disabled too, the notification is lost. With a single shard, an event that occurs while the connection is down is therefore not delivered later.
- A conduit whose shards have all been disabled for 72 hours is deleted by Twitch.

## See also

- [WebSocket](/events/websocket/): connection handling shared by both listeners.
- [Managing subscriptions](/events/managing-subscriptions/): listing the subscriptions of a conduit, deleting them.
- [twitch.eventsub.conduit](/reference/api/eventsub/#conduit): the method in the reference.
- [twitch.conduits](/reference/api/conduits/): every conduit endpoint.
