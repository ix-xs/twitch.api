---
title: twitch.entitlements
description: "Drops entitlements: list them and mark them fulfilled."
sidebar:
  label: entitlements
---

Every method of `twitch.entitlements`, with its parameters, what it returns and the token it needs.

## drops

```ts nocheck
twitch.entitlements.drops(params?, options?): Paginator<DropsEntitlement>
```

Lists the Drops entitlements of your organization, in no particular
order. An app token reads those of every user, a user token only those of
its own user. Your client ID must belong to the organization that owns
the game.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string \| readonly string[]` | Only these entitlements. Up to 100 IDs. |
| `user_id` | `string` | Only entitlements of this user. App tokens only: a user token always reads its own user. |
| `game_id` | `string` | Only entitlements of this game. |
| `fulfillment_status` | `DropsFulfillmentStatus` | Only entitlements with this status. |
| `after` | `string` | Cursor of the next page. |
| `first` | `number` | Items per page, 1 to 1000. Twitch defaults to 20. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<DropsEntitlement>`

<details>
<summary>Fields of DropsEntitlement</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the entitlement. |
| `benefit_id` | `string` | ID of the reward. |
| `timestamp` | `string` | When the entitlement was granted, as an RFC 3339 timestamp. |
| `user_id` | `string` | ID of the user who earned the reward. |
| `game_id` | `string` | ID of the game the reward belongs to. |
| `fulfillment_status` | `DropsFulfillmentStatus` | Whether the reward was only claimed or already delivered. |
| `last_updated` | `string` | When the entitlement last changed, as an RFC 3339 timestamp. |

</details>

### Example

```ts
const claimed = twitch.entitlements.drops({ game_id: "33214", fulfillment_status: "CLAIMED" });
for await (const entitlement of claimed) console.log(entitlement.user_id, entitlement.benefit_id);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-drops-entitlements)

## updateDrops

```ts nocheck
twitch.entitlements.updateDrops(params?, options?): Promise<DropsEntitlementUpdate[]>
```

Sets the status of Drops entitlements, typically to `"FULFILLED"` once
the reward was delivered in game. The result groups the IDs by outcome, so
check it: a call can succeed for some entitlements only.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `entitlement_ids` | `readonly string[]` | IDs of the entitlements to change. Up to 100. |
| `fulfillment_status` | `DropsFulfillmentStatus` | Status to give them. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<DropsEntitlementUpdate[]>`

<details>
<summary>Fields of DropsEntitlementUpdate</summary>

| Name | Type | Description |
| --- | --- | --- |
| `status` | `"INVALID_ID" \| "NOT_FOUND" \| "SUCCESS" \| "UNAUTHORIZED" \| "UPDATE_FAILED"` | What happened to the entitlements listed in `ids`. `"UPDATE_FAILED"` is temporary: try those again later. |
| `ids` | `string[]` | IDs of the entitlements this status applies to. |

</details>

### Example

```ts
const results = await twitch.entitlements.updateDrops({
  entitlement_ids: ["0b6a2c1e-5d47-4f0a-9c3e-7a1d2e8f4b65"],
  fulfillment_status: "FULFILLED",
});
const failed = results.filter((result) => result.status !== "SUCCESS");
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-drops-entitlements)
