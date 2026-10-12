---
title: twitch.bits
description: "Bits: leaderboard, Cheermotes, custom Power-ups and extension transactions."
sidebar:
  label: bits
---

Every method of `twitch.bits`, with its parameters, what it returns and the token it needs.

## leaderboard

```ts nocheck
twitch.bits.leaderboard(params?, options?): Promise<BitsLeaderboard>
```

Gets the Bits leaderboard of the channel of the user making the call,
over its whole life or over a given day, week, month or year.

**Token:** user, scope `bits:read`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `count` | `number` | Number of entries to return, 1 to 100. Twitch defaults to 10. |
| `period` | `"day" \| "week" \| "month" \| "year" \| "all"` | Length of the period to rank, counted in Pacific time. Twitch defaults to `"all"`, the whole life of the channel. |
| `started_at` | `string \| Date` | A moment inside the period to rank. Needed for every `period` except `"all"`. Twitch converts it to Pacific time before picking the day, week, month or year it falls in. |
| `user_id` | `string` | Centers the result on this user, with the ranks just above and below when `count` allows. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<BitsLeaderboard>`

<details>
<summary>Fields of BitsLeaderboard</summary>

| Name | Type | Description |
| --- | --- | --- |
| `data` | `BitsLeaderboardEntry[]` | Ranked users, biggest cheerer first. Empty when nobody cheered. |
| `date_range` | `{ started_at: string; ended_at: string; }` | The period the ranking covers. Both fields are empty strings when `started_at` was not given. |
| `total` | `number` | Number of entries in `data`. |

</details>

### Example

```ts
const top = await twitch.bits.leaderboard({ count: 5 });
for (const entry of top.data) console.log(entry.rank, entry.user_name, entry.score);
const week = await twitch.bits.leaderboard({ period: "week", started_at: new Date() });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-bits-leaderboard)

## cheermotes

```ts nocheck
twitch.bits.cheermotes(params?, options?): Promise<Cheermote[]>
```

Lists the Cheermotes usable in every channel, plus the custom ones of a
broadcaster when you name one.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Also include the custom Cheermotes of this broadcaster. Without it only the global ones are returned. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<Cheermote[]>`

<details>
<summary>Fields of Cheermote</summary>

| Name | Type | Description |
| --- | --- | --- |
| `prefix` | `string` | Text typed before the amount. `Cheer` gives `Cheer100`. |
| `tiers` | `CheermoteTier[]` | Levels of the Cheermote, each with its own images. |
| `type` | `"global_first_party" \| "global_third_party" \| "channel_custom" \| "display_only" \| "sponsored"` | Where the Cheermote comes from: Twitch (`global_first_party` in the Bits card, `global_third_party` outside of it), a broadcaster (`channel_custom`) or a sponsor who adds Bits on top (`sponsored`). `display_only` is internal to Twitch. |
| `order` | `number` | Position in the Bits card. Unique within one `type` only, and not always consecutive. |
| `last_updated` | `string` | When the Cheermote was last changed, as an RFC 3339 timestamp. |
| `is_charitable` | `boolean` | Whether cheering with it is matched by a contribution during charity campaigns. |

</details>

### Example

```ts
const cheermotes = await twitch.bits.cheermotes({ broadcaster_id: "141981764" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-cheermotes)

## customPowerUps

```ts nocheck
twitch.bits.customPowerUps(params?, options?): Promise<CustomPowerUp[]>
```

Lists the custom Power-ups a broadcaster created, enabled or not. Asking
for IDs of which none exists fails with a 404.

**Token:** user, scope `bits:read`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who created the Power-ups. Defaults to the user making the call. |
| `id` | `string \| readonly string[]` | Only these Power-ups. Any number: long lists are split for you. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<CustomPowerUp[]>`

<details>
<summary>Fields of CustomPowerUp</summary>

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `id` | `string` | ID of the Power-up. |
| `title` | `string` | Title of the Power-up. |
| `prompt` | `string` | Question shown to the viewer when `is_user_input_required` is `true`. |
| `bits` | `number` | Price in Bits. |
| `image` | `CustomPowerUpImage \| null` | Images uploaded by the broadcaster, or `null` when there are none. |
| `default_image` | `CustomPowerUpImage` | Images Twitch falls back to. |
| `background_color` | `string` | Background color as a hex code, such as `#00E5CB`. |
| `is_enabled` | `boolean` | Whether the Power-up is enabled. Disabled ones are hidden from viewers. |
| `is_user_input_required` | `boolean` | Whether the viewer has to type something when redeeming. |
| `max_per_stream_setting` | `{ is_enabled: boolean; max_per_stream: number; }` | Cap on redemptions per live stream. |
| `max_per_user_per_stream_setting` | `{ is_enabled: boolean; max_per_user_per_stream: number; }` | Cap on redemptions per viewer per live stream. |
| `global_cooldown_setting` | `{ is_enabled: boolean; global_cooldown_seconds: number; }` | Pause imposed between two redemptions. |
| `is_paused` | `boolean` | Whether the Power-up is paused. Paused ones cannot be redeemed. |
| `is_in_stock` | `boolean` | Whether the Power-up is in stock. Out of stock ones cannot be redeemed. |
| `redemptions_redeemed_current_stream` | `number \| null` | Redemptions counted against the per stream cap so far, or `null` when the channel is offline or the cap is off. |
| `cooldown_expires_at` | `string \| null` | When the cooldown ends, as an RFC 3339 timestamp, or `null` when none is running. |

</details>

### Example

```ts
const powerUps = await twitch.bits.customPowerUps();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-custom-power-up)

## extensionTransactions

```ts nocheck
twitch.bits.extensionTransactions(params, options?): Paginator<ExtensionTransaction>
```

Lists the purchases made with Bits inside an extension. Only works with
the app token of the extension itself.

**Token:** app.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extension_id` <small>required</small> | `string` | ID of the extension. It must be the client ID the app token was issued for. |
| `id` | `string \| readonly string[]` | Only these transactions. Up to 100 IDs. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<ExtensionTransaction>`

<details>
<summary>Fields of ExtensionTransaction</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the transaction. |
| `timestamp` | `string` | When the purchase was made, as an RFC 3339 timestamp. |
| `broadcaster_id` | `string` | ID of the broadcaster on whose channel the purchase was made. |
| `broadcaster_login` | `string` | Login name of that broadcaster. |
| `broadcaster_name` | `string` | Display name of that broadcaster. |
| `user_id` | `string` | ID of the buyer. |
| `user_login` | `string` | Login name of the buyer. |
| `user_name` | `string` | Display name of the buyer. |
| `product_type` | `"BITS_IN_EXTENSION"` | Kind of transaction. |
| `product_data` | `{ sku: string; domain: string; cost: { amount: number; type: "bits"; }; inDevelopment: boolean; displayName: string; expiration: string; broadcast: boolean; }` | The product that was bought. |

</details>

### Example

```ts
for await (const transaction of twitch.bits.extensionTransactions({ extension_id: "uo6dggojyb8d6soh92zknwmi5ej1q2" })) {
  console.log(transaction.user_name, transaction.product_data.sku);
}
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-extension-transactions)
