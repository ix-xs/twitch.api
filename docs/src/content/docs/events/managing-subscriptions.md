---
title: "Managing subscriptions"
description: "Wait for subscriptions, stop them, list what your application has on Twitch's side, create and delete by hand, and read statuses and cost."
sidebar:
  order: 6
---

The listeners create and delete subscriptions for you as handlers come and go. This page covers what happens underneath, and the calls of `twitch.eventsub` that let you inspect and clean up the subscriptions Twitch holds for your application.

## A first example

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });
const hooks = twitch.eventsub.webhook({ callback, secret });

const handle = hooks.on("stream.online", { broadcaster_user_id: "141981764" }, (event) => {
  console.log(`${event.broadcaster_user_name} is live`);
});

await handle.ready; // Twitch accepted the subscription
console.log(handle.type, handle.version, handle.condition);

await handle.stop(); // remove the handler, and the subscription with it
```

## Wait for a subscription

`handle.ready` is a promise that resolves once the subscription is in place: when Twitch has answered the request on a WebSocket or a conduit, when the verification challenge has arrived on a webhook. Awaiting it is optional.

It rejects with a `TwitchEventSubError` when Twitch refuses the subscription. The message reads `Could not subscribe to <type> (version <version>): <reason>`, and `cause` holds the original error, so you can tell a missing scope from another failure:

```ts
import { TwitchApiError, TwitchEventSubError } from "@ix-xs/twitch.api";

const handle = events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, () => {});

try {
  await handle.ready;
} catch (error) {
  if (error instanceof TwitchEventSubError && error.cause instanceof TwitchApiError && error.cause.status === 403) {
    console.error(`Not authorized for ${handle.type}: ask for the missing scope`);
  } else {
    throw error;
  }
}
```

A refused subscription is removed from the listener. Two other cases are worth knowing:

- If you stop the handle or close the listener before Twitch confirmed, `ready` rejects with `The subscription to <type> was removed before Twitch confirmed it.`
- While a WebSocket is disconnected, `ready` stays pending until the connection is back. On a conduit it also waits for the shard to be assigned, and rejects if that assignment fails for good.

Handlers that share a subscription share the same `ready` promise.

## Stop a handler

`handle.stop()` removes that one handler. When other handlers are still attached to the same subscription, nothing else happens. When it was the last one, the listener forgets the subscription and deletes it on Twitch's side:

| Transport | What the last `stop()` does |
| --- | --- |
| WebSocket | Deletes the subscription with the user token, when the session is connected. Closes the connection if this was its last subscription. While disconnected it sends nothing: Twitch has already disabled the subscription. |
| Webhook | Deletes the subscription with the app token. With `subscribe: false` it sends nothing. |
| Conduit | Deletes the subscription with the app token, connected or not. |

The promise returned by `stop()` resolves when the request is done. A `404` from Twitch, meaning the subscription was already gone, is ignored. Any other failure rejects it.

Calling `stop()` while the subscription is still being created is safe: the listener deletes it as soon as Twitch returns it.

:::caution
`close()` is not `stop()`. Closing a WebSocket listener, directly or through `twitch.close()`, lets Twitch disable its subscriptions. Closing a conduit listener leaves them on the conduit, and a webhook listener has no `close()` at all. On webhooks and conduits, subscriptions go away only when a handle is stopped or when you delete them by hand.
:::

A webhook or conduit subscription that already existed when the process started has no known ID until it delivers its first event. Until then `stop()` removes the handler without deleting anything. Delete such a subscription by ID, as described below.

## List your subscriptions

`twitch.eventsub.subscriptions()` returns a [paginator](/basics/pagination/) over the subscriptions Twitch holds, oldest first.

```ts
for await (const subscription of twitch.eventsub.subscriptions({ type: "stream.online" })) {
  console.log(subscription.id, subscription.status, subscription.transport.method, subscription.condition);
}

const failed = await twitch.eventsub.subscriptions({ status: "notification_failures_exceeded" }).all();
```

| Filter | Keeps |
| --- | --- |
| `status` | Subscriptions in this state, for example `"enabled"`. |
| `type` | Subscriptions of this type. |
| `user_id` | Subscriptions whose condition mentions this user. |
| `subscription_id` | The subscription with this ID. |
| `conduit_id` | Subscriptions delivered through this conduit. |

Use at most one filter per call. The endpoint has no page size parameter: Twitch decides how many items a page holds.

Which subscriptions you see depends on the token. With the app token you get the webhook and conduit subscriptions of your application. To see the WebSocket subscriptions created with a user's token, make the call as that user:

```ts
const ofBot = await twitch.eventsub.subscriptions({}, { as: botId }).all();

for (const subscription of ofBot) {
  console.log(subscription.type, subscription.status, subscription.transport.session_id);
}
```

A client that has a client secret uses the app token for this call unless you pass `{ as }`, even when a user is registered.

## Read totals and cost

The body of each page carries three totals next to the items. They are on `page.raw`:

```ts
const page = await twitch.eventsub.subscriptions();
const { total, total_cost, max_total_cost } = page.raw;

console.log(`${total} subscriptions, cost ${total_cost} of ${max_total_cost}`);
```

| Field | Meaning |
| --- | --- |
| `total` | Number of subscriptions you have created. |
| `total_cost` | Sum of the costs of your subscriptions. |
| `max_total_cost` | Highest total cost you are allowed to reach. |

Each subscription has its own `cost`, which is what it adds to `total_cost`. The rules that decide the cost of a subscription are Twitch's, and they are explained in [Subscription limits](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#subscription-limits) in the Twitch documentation.

## Create a subscription by hand

`twitch.eventsub.subscribe()` creates one subscription and resolves with it. You need it for subscriptions a listener does not create: those of a webhook listener built with `subscribe: false`, or those of an endpoint the library does not serve.

```ts
const created = await twitch.eventsub.subscribe({
  type: "stream.online",
  condition: { broadcaster_user_id: "141981764" },
  transport: { method: "webhook", callback: "https://example.com/twitch/eventsub", secret },
});

console.log(created.id, created.status, created.cost);
```

The type and the condition are typed like in `on()`, and the version is filled in from the name. The token follows the transport: a user token for `{ method: "websocket", session_id }`, the app token for `webhook` and `{ method: "conduit", conduit_id }`.

A webhook subscription starts as `webhook_callback_verification_pending` and becomes `enabled` once the callback has answered the challenge. Unlike a listener, `subscribe()` throws when the subscription already exists: catch the `TwitchApiError` whose `status` is `409` if that is fine for you. The other errors are described in [Errors](/basics/errors/).

A listener only runs handlers for the subscriptions it knows. If the events of a subscription created by hand arrive at a listener, register a handler with the same type and condition there.

## Delete a subscription by hand

`twitch.eventsub.unsubscribe(id)` deletes a subscription by ID.

```ts
await twitch.eventsub.unsubscribe(subscription.id);

// A WebSocket subscription is deleted as the user who created it.
await twitch.eventsub.unsubscribe(subscription.id, { as: botId });
```

A listener is not told when you delete one of its subscriptions this way: its handlers stay registered and no longer receive anything. Inside a running program, prefer `handle.stop()`.

## Delete webhook subscriptions that no longer work

Webhook subscriptions pile up when a callback URL changes or a server goes away. This script removes every webhook subscription that is neither enabled nor waiting for its challenge.

```ts title="scripts/clean-subscriptions.ts"
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// Read the whole list first, so that deleting does not shift the pages.
const subscriptions = await twitch.eventsub.subscriptions().all();

const dead = subscriptions.filter(
  (subscription) =>
    subscription.transport.method === "webhook" &&
    subscription.status !== "enabled" &&
    subscription.status !== "webhook_callback_verification_pending",
);

for (const subscription of dead) {
  await twitch.eventsub.unsubscribe(subscription.id);
  console.log(`Deleted ${subscription.type} (${subscription.status}) of ${subscription.transport.callback}`);
}

console.log(`${dead.length} of ${subscriptions.length} subscriptions deleted`);
```

To drop the subscriptions of an old tunnel or an old domain instead, filter on `subscription.transport.callback`.

## Subscription statuses

`status` is typed as `EventSubSubscriptionStatus`. Only `enabled` subscriptions deliver events.

| Status | Meaning |
| --- | --- |
| `enabled` | The subscription delivers events. |
| `webhook_callback_verification_pending` | Twitch is waiting for the callback to answer the challenge. |
| `webhook_callback_verification_failed` | The callback did not answer the challenge correctly. |
| `notification_failures_exceeded` | Too many deliveries to the callback failed. |
| `authorization_revoked` | The user withdrew the authorization the subscription relied on. |
| `moderator_removed` | The moderator named in the condition is no longer a moderator of the channel. |
| `user_removed` | A user named in the condition no longer exists. |
| `chat_user_banned` | The user named in the condition was banned from the broadcaster's chat. |
| `version_removed` | The type or this version of it is no longer available. |
| `beta_maintenance` | The type is in beta and under maintenance. |
| `websocket_disconnected` | The client closed the connection. |
| `websocket_failed_ping_pong` | The client did not answer a ping. |
| `websocket_received_inbound_traffic` | The client sent a message other than a pong. |
| `websocket_connection_unused` | The client created no subscription in time after connecting. |
| `websocket_internal_error` | Twitch had an internal error. |
| `websocket_network_timeout` | Twitch timed out writing to the connection. |
| `websocket_network_error` | Twitch had a network error writing to the connection. |
| `websocket_failed_to_reconnect` | The client did not move to the new connection after a reconnect request. |
| `conduit_deleted` | The conduit of the subscription was deleted. |

## Revocations

When Twitch ends a subscription on its own, it sends a revocation. The listener drops the subscription, stops calling its handlers and calls the `onRevocation` listeners with the subscription, whose `status` says why.

```ts
declare function alertOwner(text: string): void;

hooks.onRevocation((subscription) => {
  const channel = subscription.condition.broadcaster_user_id;

  if (subscription.status === "authorization_revoked") {
    alertOwner(`Channel ${channel} disconnected the application`);
  } else {
    alertOwner(`${subscription.type} was revoked for channel ${channel}: ${subscription.status}`);
  }
});
```

The listener does not subscribe again. Once the cause is fixed, for example after the user authorized your application again, call `on()` to create a new subscription.

On webhooks and conduits you can also follow authorizations for the whole application with [`user.authorization.revoke`](/reference/event-types/#userauthorizationrevoke), whose condition is your client ID.

## Cost and limits

- The total cost of your subscriptions cannot exceed `max_total_cost`. Read both numbers from `page.raw` instead of assuming them.
- Creating a subscription that already exists with the same transport gives a `409`. The webhook and conduit listeners count it as accepted, `subscribe()` throws it.
- WebSocket subscriptions have their own limits per user, listed in [WebSocket](/events/websocket/).

## See also

- [Receiving events](/events/overview/): the handle, `onError` and `onRevocation`.
- [Pagination](/basics/pagination/): everything the paginator returned by `subscriptions()` can do.
- [twitch.eventsub](/reference/api/eventsub/): `subscribe`, `unsubscribe` and `subscriptions` in the reference.
- [Event types](/reference/event-types/): the condition and scope of every type.
