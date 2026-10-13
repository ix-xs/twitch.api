---
title: twitch.eventsub
description: "EventSub : abonnements, et écouteurs WebSocket, webhook et conduit."
sidebar:
  label: eventsub
---

Toutes les méthodes de `twitch.eventsub`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## subscribe

```ts nocheck
twitch.eventsub.subscribe(params, options?): Promise<EventSubSubscription<string, EventSubCondition<T>>>
```

Crée un abonnement à la main. Vous en avez rarement besoin : les écouteurs renvoyés par `websocket`, `webhook` et `conduit` s'abonnent pour vous.

**Jeton :** utilisateur pour le transport WebSocket, application pour les webhooks et les conduits. Les scopes dépendent du type d'abonnement.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `type` <small>requis</small> | `T` | Type d'abonnement, par exemple `channel.follow`. |
| `condition` <small>requis</small> | `EventSubCondition<T>` | Ce qu'il faut écouter : quelle chaîne, quel utilisateur... Sa forme dépend du type. |
| `transport` <small>requis</small> | `EventSubTransportInput` | Endroit où Twitch livre les événements. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<EventSubSubscription<string, EventSubCondition<T>>>`

<details>
<summary>Champs de EventSubSubscription</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'abonnement. |
| `status` | `EventSubSubscriptionStatus` | État actuel. Seuls les abonnements `enabled` livrent des événements. |
| `type` | `string` | Type d'abonnement, par exemple `channel.follow`. |
| `version` | `string` | Version du type d'abonnement. |
| `condition` | `EventSubCondition<T>` | Condition avec laquelle l'abonnement a été créé. |
| `created_at` | `string` | Date de création de l'abonnement, sous forme d'horodatage RFC 3339. |
| `transport` | `EventSubTransport` | Endroit où les événements sont livrés. |
| `cost` | `number` | Part de votre limite de coût consommée par l'abonnement. |

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

Supprime un abonnement. Le jeton d'application est utilisé sauf indication contraire : pour un abonnement créé par WebSocket, passez `{ as: userId }` avec l'utilisateur dont le jeton l'a créé.

**Jeton :** utilisateur pour un abonnement WebSocket, application sinon.

### Paramètres

`id` : `string`

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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

Liste vos abonnements, du plus ancien au plus récent. Avec le jeton d'application, vous obtenez ceux des webhooks et des conduits. Passez `{ as: userId }` pour obtenir les abonnements WebSocket créés avec le jeton de cet utilisateur.

**Jeton :** application ou utilisateur, voir ci-dessus.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `status` | `EventSubSubscriptionStatus` | Uniquement les abonnements dans cet état. |
| `type` | `(string & {}) \| keyof EventSubTypes` | Uniquement les abonnements de ce type. |
| `user_id` | `string` | Uniquement les abonnements dont la condition mentionne cet utilisateur. |
| `subscription_id` | `string` | Uniquement l'abonnement qui porte cet identifiant. |
| `conduit_id` | `string` | Uniquement les abonnements livrés par ce conduit. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<EventSubSubscription<string, Record<string, string>>, GetEventSubSubscriptionsBody>`

<details>
<summary>Champs de EventSubSubscription</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'abonnement. |
| `status` | `EventSubSubscriptionStatus` | État actuel. Seuls les abonnements `enabled` livrent des événements. |
| `type` | `string` | Type d'abonnement, par exemple `channel.follow`. |
| `version` | `string` | Version du type d'abonnement. |
| `condition` | `Record<string, string>` | Condition avec laquelle l'abonnement a été créé. |
| `created_at` | `string` | Date de création de l'abonnement, sous forme d'horodatage RFC 3339. |
| `transport` | `EventSubTransport` | Endroit où les événements sont livrés. |
| `cost` | `number` | Part de votre limite de coût consommée par l'abonnement. |

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

Ouvre un écouteur WebSocket : le moyen le plus simple de recevoir des événements, sans rien à héberger. Les abonnements sont créés avec un jeton utilisateur.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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
| `sessionIds` | `string[]` | Identifiants des sessions actuellement établies. Vide tant que la connexion est coupée. |
| `connected` | `boolean` | Indique si au moins une session est établie. |
| `entries` | `Map<string, Entry>` |  |
| `#byId` | `Map<string, Entry>` |  |
| `#events` | `Emitter<ListenerEvents>` |  |
| `size` | `number` | Nombre d'abonnements actifs. |

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

Crée un écouteur webhook, pour les serveurs joignables depuis Internet. Les abonnements sont créés avec le jeton d'application et survivent aux redémarrages.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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
| `#seen` | `Map<string, number>` | Identifiants des messages déjà traités, avec le moment où chacun a été vu. Du plus ancien au plus récent. |
| `entries` | `Map<string, Entry>` |  |
| `#byId` | `Map<string, Entry>` |  |
| `#events` | `Emitter<ListenerEvents>` |  |
| `size` | `number` | Nombre d'abonnements actifs. |

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

Ouvre un WebSocket qui dessert un shard d'un conduit. Les abonnements sont créés avec le jeton d'application : un seul processus peut donc suivre autant de chaînes qu'il le faut sans garder une connexion par utilisateur, et ils survivent aux redémarrages. Lancez un processus par shard pour répartir la charge.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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
| `sessionIds` | `string[]` | Identifiants des sessions actuellement établies. Vide tant que la connexion est coupée. |
| `connected` | `boolean` | Indique si au moins une session est établie. |
| `entries` | `Map<string, Entry>` |  |
| `#byId` | `Map<string, Entry>` |  |
| `#events` | `Emitter<ListenerEvents>` |  |
| `size` | `number` | Nombre d'abonnements actifs. |

</details>

### Exemple

```ts
const events = twitch.eventsub.conduit();
events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
  console.log(event.message.text);
});
```

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/)
