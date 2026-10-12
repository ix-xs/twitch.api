---
title: "WebSocket"
description: "Receive events over a WebSocket with a user token: what the listener does on its own, how to follow the connection, its options and the limits Twitch sets."
sidebar:
  order: 2
---

`twitch.eventsub.websocket()` returns a listener that receives events over an outgoing WebSocket connection. There is nothing to host and no public URL to expose, which makes it the transport for bots, desktop tools and local development. Subscriptions are created with a user token.

## A first example

A bot that answers `!ping` in a channel. The bot's token needs the `user:read:chat` scope to read the chat and `user:write:chat` to answer.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});
const bot = await twitch.auth.addUser({ accessToken, refreshToken });

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on("channel.chat.message", { broadcaster_user_id: "141981764", user_id: bot.userId }, async (event) => {
  if (event.chatter_user_id === bot.userId) return; // ignore our own messages
  if (event.message.text.trim() !== "!ping") return;

  await twitch.chat.send({
    broadcaster_id: event.broadcaster_user_id,
    message: "pong",
    reply_parent_message_id: event.message_id,
  });
});
```

`on()`, `onError()`, `onRevocation()` and the handle returned by `on()` are the same on every transport. They are described in [Receiving events](/events/overview/).

## Which user's token is used

Twitch only accepts a user token for WebSocket subscriptions. The listener picks it in this order:

1. The `user` option: `twitch.eventsub.websocket({ user: botId })`.
2. The user of the view, when the listener is created from `twitch.as(userId)`.
3. The only registered user, when exactly one is registered.

```ts
// Both listeners subscribe with the token of the bot.
const first = twitch.eventsub.websocket({ user: botId });
const second = twitch.as(botId).eventsub.websocket();
```

When none of the three applies, the subscription fails and the error reaches `handle.ready` and `onError`. Its message ends with `needs a user access token and no user is registered. Add one with twitch.auth.addUser().` or with `needs a user access token and several users are registered. Choose one with { as: userId } or twitch.as(userId).`

One listener subscribes as one user. To receive events on behalf of two users, create two listeners. The token is kept fresh by the client like for any other call, so a listener that reconnects after hours still subscribes with a valid token.

## When it connects

Creating the listener does not open anything. The connection is opened by the first `on()`, and each subscription is created once Twitch has sent its welcome message with the session ID. Calls to `on()` made before that are kept and sent together, 20 at a time.

When a session already exists, `on()` subscribes right away on it.

```ts
const handle = events.on("stream.online", { broadcaster_user_id: channelId }, (event) => {
  console.log(`${event.broadcaster_user_name} went live`);
});

await handle.ready; // connected, and the subscription is accepted
console.log(events.connected, events.sessionIds);
```

## What it does on its own

Once it has a handler, the listener keeps itself running:

- **Reconnect requests.** When Twitch asks the client to move to another server, the listener opens the new connection, keeps reading the old one until the new one is welcomed, then closes the old one. Subscriptions move with the session, nothing is subscribed again and no event is lost.
- **Keepalive.** Twitch sends a keepalive message when nothing else was sent for the keepalive period. If nothing at all arrives for that period plus 5 seconds, the connection is treated as lost. A new connection that gets no welcome message within 15 seconds is treated the same way.
- **Reconnection.** After a lost connection, the listener connects again with an exponential backoff: between 250 and 500 ms before the first attempt, doubling after each failure, never more than 30 seconds. On the new session it creates every subscription again.
- **Temporary failures.** A subscription request that fails with a `5xx`, a `429`, a network error or a timeout is sent again, with the same backoff, for as long as the session lives. A refusal such as a `403` is final: the subscription is dropped and reported.
- **More connections.** A connection carries 300 subscriptions. Past that, the listener opens a second, then a third connection. The 901st subscription is refused with `Subscription limit reached: 3 connections of 300 subscriptions.`
- **Fewer connections.** A connection is closed when its last subscription is stopped, and right away when every subscription it carried was refused.
- **Duplicates.** A notification delivered twice runs your handlers once.

Subscriptions that are created again after a reconnection get new IDs. If one of them is refused at that point, for example because the user revoked your application in the meantime, it is dropped and the error goes to `onError`. `handle.ready` has already resolved by then and does not change.

## Follow the connection

`onConnect` runs each time a session is established: on the first connection, after every reconnection, and after a move requested by Twitch. `onDisconnect` runs when a connection is lost.

```ts
events.onConnect((sessionId) => {
  console.log(`Connected, session ${sessionId}`);
});

events.onDisconnect(({ code, reason, willReconnect }) => {
  console.warn(`Connection lost (${code ?? "no code"} ${reason ?? ""})`, willReconnect ? "reconnecting" : "");
});
```

| Member | Type | Meaning |
| --- | --- | --- |
| `onConnect(listener)` | returns a function that removes the listener | Called with the ID of each new session. The listener may be `async`. |
| `onDisconnect(listener)` | returns a function that removes the listener | Called with `code` and `reason` of the close, and `willReconnect`. The listener may be `async`. |
| `connected` | `boolean` | Whether at least one session is established. |
| `sessionIds` | `string[]` | IDs of the established sessions. Empty while disconnected. |
| `size` | `number` | Number of active subscriptions. |

When the keepalive check is what detected the loss, `code` is `undefined` and `reason` is `"keepalive timeout"`. `willReconnect` is `false` when the lost connection had no subscription left to restore.

Whatever one of these listeners throws, or rejects with when it is `async`, goes to the `onError` listeners.

## Events missed while disconnected

Twitch does not keep events for a WebSocket that is away. Whatever happened between the loss of a connection and the new subscriptions is not replayed. For most chat features this does not matter. When it does, read the current state from the API each time a session starts:

```ts
events.onConnect(async () => {
  const live = await twitch.streams.get({ user_id: channelId }).first();
  console.log(live ? `Live since ${live.started_at}` : "Offline");
});
```

If the request fails, the error is reported to `onError`.

If you cannot afford to miss an event at all, use [webhooks](/events/webhooks/): Twitch sends a notification again when it is not sure that your server received it.

## Close the listener

```ts
events.close();
```

`close()` closes every connection and forgets every subscription and handler. It sends no request: Twitch disables the subscriptions of a session when its connection closes. A `ready` promise that was still pending rejects with `The subscription to <type> was removed before Twitch confirmed it.`

An open connection keeps the process alive, and so does a listener that waits to reconnect. Close the listener when your program is done. `twitch.close()` does it for you: it closes every WebSocket and conduit listener created from the client, and stops the client's own timer.

## Options

```ts
const events = twitch.eventsub.websocket({ user: botId, keepalive: 30 });
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `user` | `string` | see above | ID of the user whose token creates the subscriptions. |
| `keepalive` | `number` | Twitch uses 10 | Seconds of silence after which Twitch sends a keepalive, from 10 to 600. A lower value detects a dead connection sooner. |
| `webSocket` | `WebSocketConstructor` | the global `WebSocket` | WebSocket class to use, for runtimes that have none. |
| `url` | `string` | `wss://eventsub.wss.twitch.tv/ws` | EventSub WebSocket URL. Point it at the Twitch CLI for local testing. |

The listener needs a WebSocket class with the standard `onmessage` and `onclose` properties and a `close()` method. Node.js 22, Bun, Deno and browsers have one. Elsewhere, `twitch.eventsub.websocket()` throws a `TwitchEventSubError` saying `This runtime has no global WebSocket`, and you pass a class yourself:

```ts
import type { WebSocketConstructor } from "@ix-xs/twitch.api";

// For example the default export of the "ws" package.
declare const WS: WebSocketConstructor;

const events = twitch.eventsub.websocket({ webSocket: WS });
```

[Runtimes](/basics/runtimes/) says more about what each runtime provides.

## Limits set by Twitch

These rules come from [Twitch's WebSocket documentation](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/), not from the library:

- Subscriptions over WebSocket are created with a user token. The app token is refused.
- One user can hold 3 connections with enabled subscriptions for one client ID, and each connection 300 enabled subscriptions. A second listener for the same user shares that budget.
- The total cost of a user's WebSocket subscriptions cannot exceed 10, the `max_total_cost` of this transport. Not every subscription has a cost: [Managing subscriptions](/events/managing-subscriptions/) shows how to read it.
- A connection must subscribe to something within 10 seconds of its welcome message or Twitch closes it. The listener only connects when it has a subscription to create, so this takes care of itself.
- `drop.entitlement.grant`, `extension.bits_transaction.create`, `user.authorization.grant` and `user.authorization.revoke` are not delivered over WebSocket. Use webhooks or a conduit for them.

:::note
To follow many channels with the app token, or more than 900 subscriptions, use a [conduit](/events/conduits/). It keeps the WebSocket connection and lifts the per user limits.
:::

## See also

- [Receiving events](/events/overview/): `on()`, `meta`, `onError` and `onRevocation`.
- [Managing subscriptions](/events/managing-subscriptions/): stopping handlers, listing subscriptions, cost.
- [Acting as a user](/basics/acting-as-a-user/): registering the user token the listener needs.
- [twitch.eventsub.websocket](/reference/api/eventsub/#websocket): the method in the reference.
- [A chat bot](/recipes/chat-bot/): a complete program built on this listener.
