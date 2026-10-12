---
title: twitch.subscriptions
description: "Subscriptions: the subscribers of a channel, and whether a user is one."
sidebar:
  label: subscriptions
---

Every method of `twitch.subscriptions`, with its parameters, what it returns and the token it needs.

## get

```ts nocheck
twitch.subscriptions.get(params?, options?): Paginator<BroadcasterSubscription, BroadcasterSubscriptionsBody>
```

Lists the subscribers of a channel. Each page also carries the subscriber
points of the channel, in `page.raw.points`.

**Token:** user, scope `channel:read:subscriptions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose subscribers to list. Defaults to the user making the call. |
| `user_id` | `string \| readonly string[]` | Only these subscribers. Up to 100 IDs. Cannot be combined with a cursor. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |
| `before` | `string` | Cursor of the previous page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<BroadcasterSubscription, BroadcasterSubscriptionsBody>`

<details>
<summary>Fields of BroadcasterSubscription</summary>

| Name | Type | Description |
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

### Example

```ts
const page = await twitch.subscriptions.get();
console.log(page.total, page.raw.points);
for await (const sub of twitch.subscriptions.get()) console.log(sub.user_name, sub.tier);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-broadcaster-subscriptions)

## check

```ts nocheck
twitch.subscriptions.check(params, options?): Promise<UserSubscription | null>
```

Gets the subscription of a user to a channel, or `null` when the user is
not subscribed.

**Token:** user, scope `user:read:subscriptions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster the user may be subscribed to. Must be a partner or an affiliate. |
| `user_id` | `string` | User to check. Defaults to the user making the call. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<UserSubscription \| null>`

<details>
<summary>Fields of UserSubscription</summary>

| Name | Type | Description |
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

### Example

```ts
const sub = await twitch.subscriptions.check({ broadcaster_id: "141981764" });
if (sub) console.log(`Subscribed at tier ${sub.tier}`);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#check-user-subscription)
