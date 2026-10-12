---
title: twitch.eventsub
description: "EventSub: subscriptions, and the WebSocket, webhook and conduit listeners."
sidebar:
  label: eventsub
---

Toutes les méthodes de `twitch.eventsub`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## subscribe

```ts nocheck
twitch.eventsub.subscribe(params, options?): Promise<EventSubSubscription<string, EventSubCondition<T>>>
```

Creates a subscription by hand. You rarely need it: the listeners returned
by `websocket`, `webhook` and
`conduit` subscribe for you.

**Jeton:** user for the WebSocket transport, app for webhooks and conduits. The scopes depend on the subscription type.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `type` <small>requis</small> | `T` | Subscription type, such as `channel.follow`. |
| `condition` <small>requis</small> | `EventSubCondition<T>` | What to listen to: which channel, which user... Its shape depends on the type. |
| `transport` <small>requis</small> | `EventSubTransportInput` | Where Twitch delivers the events. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<EventSubSubscription<string, EventSubCondition<T>>>`

<details>
<summary>Champs de EventSubSubscription</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the subscription. |
| `status` | `EventSubSubscriptionStatus` | Current state. Only `enabled` subscriptions deliver events. |
| `type` | `string` | Subscription type, such as `channel.follow`. |
| `version` | `string` | Version of the subscription type. |
| `condition` | `EventSubCondition<T>` | Condition the subscription was created with. |
| `created_at` | `string` | When the subscription was created, as an RFC 3339 timestamp. |
| `transport` | `EventSubTransport` | Where the events are delivered. |
| `cost` | `number` | How much the subscription counts against your cost limit. |

</details>

### Exemple

```ts
await twitch.eventsub.subscribe({
  type: "stream.online",
  condition: { broadcaster_user_id: "141981764" },
  transport: { method: "webhook", callback: "https://example.com/twitch", secret },
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription)

## unsubscribe

```ts nocheck
twitch.eventsub.unsubscribe(id, options?): Promise<void>
```

Deletes a subscription. The app token is used unless you say otherwise:
for a subscription created over WebSocket, pass `{ as: userId }` with the
user whose token created it.

**Jeton:** user for a WebSocket subscription, app otherwise.

### Paramètres

`id`: `string`

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.eventsub.unsubscribe(subscription.id);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription)

## subscriptions

```ts nocheck
twitch.eventsub.subscriptions(params?, options?): Paginator<EventSubSubscription<string, Record<string, string>>, GetEventSubSubscriptionsBody>
```

Lists your subscriptions, oldest first. With the app token you get the
webhook and conduit ones. Pass `{ as: userId }` to get the WebSocket
subscriptions created with that user's token.

**Jeton:** app or user, see above.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `status` | `EventSubSubscriptionStatus` | Only subscriptions in this state. |
| `type` | `(string & {}) \| keyof EventSubTypes` | Only subscriptions of this type. |
| `user_id` | `string` | Only subscriptions whose condition mentions this user. |
| `subscription_id` | `string` | Only the subscription with this ID. |
| `conduit_id` | `string` | Only subscriptions delivered through this conduit. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<EventSubSubscription<string, Record<string, string>>, GetEventSubSubscriptionsBody>`

<details>
<summary>Champs de EventSubSubscription</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the subscription. |
| `status` | `EventSubSubscriptionStatus` | Current state. Only `enabled` subscriptions deliver events. |
| `type` | `string` | Subscription type, such as `channel.follow`. |
| `version` | `string` | Version of the subscription type. |
| `condition` | `Record<string, string>` | Condition the subscription was created with. |
| `created_at` | `string` | When the subscription was created, as an RFC 3339 timestamp. |
| `transport` | `EventSubTransport` | Where the events are delivered. |
| `cost` | `number` | How much the subscription counts against your cost limit. |

</details>

### Exemple

```ts
const page = await twitch.eventsub.subscriptions({ status: "enabled" });
console.log(page.raw.total_cost, "of", page.raw.max_total_cost);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions)

## websocket

```ts nocheck
twitch.eventsub.websocket(options?): EventSubWebSocket
```

Opens a WebSocket listener: the simplest way to receive events, with
nothing to host. Subscriptions are created with a user token.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`EventSubWebSocket`

<details>
<summary>Champs de EventSubWebSocket</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `url` | `string` |  |
| `WebSocket` | `WebSocketConstructor` |  |
| `#backend` | `SubscriptionBackend` |  |
| `#strategy` | `SessionStrategy` |  |
| `#connections` | `Connection[]` |  |
| `#where` | `Map<Entry, Connection>` |  |
| `#seen` | `BoundedMap<string, true>` |  |
| `#lifecycle` | `Emitter<SocketEvents>` |  |
| `sessionIds` | `string[]` | IDs of the sessions currently established. Empty while disconnected. |
| `connected` | `boolean` | Whether at least one session is established. |
| `entries` | `Map<string, Entry>` |  |
| `#byId` | `Map<string, Entry>` |  |
| `#events` | `Emitter<ListenerEvents>` |  |
| `size` | `number` | Number of active subscriptions. |

</details>

### Exemple

```ts
const events = twitch.eventsub.websocket();
events.on("channel.follow", { broadcaster_user_id: id, moderator_user_id: id }, (event) => {
  console.log(`${event.user_name} followed`);
});
```

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/)

## webhook

```ts nocheck
twitch.eventsub.webhook(options): EventSubWebhook
```

Creates a webhook listener, for servers reachable from the internet.
Subscriptions are created with the app token and survive restarts.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`EventSubWebhook`

<details>
<summary>Champs de EventSubWebhook</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `#backend` | `SubscriptionBackend` |  |
| `#callback` | `string` |  |
| `#secret` | `string` |  |
| `#subscribe` | `boolean` |  |
| `#maxAge` | `number` |  |
| `#seen` | `Map<string, number>` | Message IDs already handled, with the time each one was seen. Oldest first. |
| `entries` | `Map<string, Entry>` |  |
| `#byId` | `Map<string, Entry>` |  |
| `#events` | `Emitter<ListenerEvents>` |  |
| `size` | `number` | Number of active subscriptions. |

</details>

### Exemple

```ts
const hooks = twitch.eventsub.webhook({ callback: "https://example.com/twitch", secret });
hooks.on("stream.online", { broadcaster_user_id: "141981764" }, (event) => {
  console.log(`${event.broadcaster_user_name} went live`);
});
export default { fetch: (request: Request) => hooks.handle(request) };
```

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/handling-webhook-events/)

## conduit

```ts nocheck
twitch.eventsub.conduit(options?): EventSubWebSocket
```

Opens a WebSocket that serves one shard of a conduit. Subscriptions are
created with the app token, so one process can follow any number of
channels without holding a connection per user, and they survive
restarts. Run one process per shard to spread the load.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`EventSubWebSocket`

<details>
<summary>Champs de EventSubWebSocket</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `url` | `string` |  |
| `WebSocket` | `WebSocketConstructor` |  |
| `#backend` | `SubscriptionBackend` |  |
| `#strategy` | `SessionStrategy` |  |
| `#connections` | `Connection[]` |  |
| `#where` | `Map<Entry, Connection>` |  |
| `#seen` | `BoundedMap<string, true>` |  |
| `#lifecycle` | `Emitter<SocketEvents>` |  |
| `sessionIds` | `string[]` | IDs of the sessions currently established. Empty while disconnected. |
| `connected` | `boolean` | Whether at least one session is established. |
| `entries` | `Map<string, Entry>` |  |
| `#byId` | `Map<string, Entry>` |  |
| `#events` | `Emitter<ListenerEvents>` |  |
| `size` | `number` | Number of active subscriptions. |

</details>

### Exemple

```ts
const events = twitch.eventsub.conduit();
events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
  console.log(event.message.text);
});
```

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/)
