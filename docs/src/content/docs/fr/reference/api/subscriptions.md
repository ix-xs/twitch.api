---
title: twitch.subscriptions
description: "Subscriptions: the subscribers of a channel, and whether a user is one."
sidebar:
  label: subscriptions
---

Toutes les méthodes de `twitch.subscriptions`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## get

```ts nocheck
twitch.subscriptions.get(params?, options?): Paginator<BroadcasterSubscription, BroadcasterSubscriptionsBody>
```

Lists the subscribers of a channel. Each page also carries the subscriber
points of the channel, in `page.raw.points`.

**Jeton:** user, scope `channel:read:subscriptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose subscribers to list. Defaults to the user making the call. |
| `user_id` | `string \| readonly string[]` | Only these subscribers. Up to 100 IDs. Cannot be combined with a cursor. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |
| `before` | `string` | Cursor of the previous page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<BroadcasterSubscription, BroadcasterSubscriptionsBody>`

<details>
<summary>Champs de BroadcasterSubscription</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `gifter_id` | `string` | ID of the user who offered the subscription. An empty string when it is not a gift. |
| `gifter_login` | `string` | Login name of that user. An empty string when it is not a gift. |
| `gifter_name` | `string` | Display name of that user. An empty string when it is not a gift. |
| `is_gift` | `boolean` | Whether the subscription was offered by someone else. |
| `plan_name` | `string` | Name of the subscription plan. |
| `tier` | `SubscriptionTier` | Level of the subscription. |
| `user_id` | `string` | ID of the subscriber. |
| `user_name` | `string` | Display name of the subscriber. |
| `user_login` | `string` | Login name of the subscriber. |

</details>

### Exemple

```ts
const page = await twitch.subscriptions.get();
console.log(page.total, page.raw.points);
for await (const sub of twitch.subscriptions.get()) console.log(sub.user_name, sub.tier);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-broadcaster-subscriptions)

## check

```ts nocheck
twitch.subscriptions.check(params, options?): Promise<UserSubscription | null>
```

Gets the subscription of a user to a channel, or `null` when the user is
not subscribed.

**Jeton:** user, scope `user:read:subscriptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster the user may be subscribed to. Must be a partner or an affiliate. |
| `user_id` | `string` | User to check. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserSubscription \| null>`

<details>
<summary>Champs de UserSubscription</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `gifter_id` | `string` | ID of the user who offered the subscription. Only present on a gift. |
| `gifter_login` | `string` | Login name of that user. Only present on a gift. |
| `gifter_name` | `string` | Display name of that user. Only present on a gift. |
| `is_gift` | `boolean` | Whether the subscription was offered by someone else. |
| `tier` | `SubscriptionTier` | Level of the subscription. |

</details>

### Exemple

```ts
const sub = await twitch.subscriptions.check({ broadcaster_id: "141981764" });
if (sub) console.log(`Subscribed at tier ${sub.tier}`);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#check-user-subscription)
