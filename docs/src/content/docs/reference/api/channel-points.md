---
title: twitch.channelPoints
description: "Channel Points: custom rewards and their redemptions."
sidebar:
  label: channelPoints
---

Every method of `twitch.channelPoints`, with its parameters, what it returns and the token it needs.

## createReward

```ts nocheck
twitch.channelPoints.createReward(params, options?): Promise<CustomReward>
```

Adds a custom reward to a channel. A channel holds 50 rewards at most,
disabled ones included.

**Token:** user, scope `channel:manage:redemptions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who gets the reward. Defaults to the user making the call. |
| `title` <small>required</small> | `string` | Title, 45 characters at most. Must be unique among the rewards of the channel. |
| `cost` <small>required</small> | `number` | Price in Channel Points, 1 or more. |
| `prompt` | `string` | Text shown to the viewer when redeeming, 200 characters at most. Goes with `is_user_input_required`. |
| `is_enabled` | `boolean` | Whether viewers can see the reward. Twitch defaults to `true`. |
| `background_color` | `string` | Background colour as a hex code, for example `"#9147FF"`. |
| `is_user_input_required` | `boolean` | Whether the viewer has to type something when redeeming. Twitch defaults to `false`. |
| `is_max_per_stream_enabled` | `boolean` | Turns on the cap set by `max_per_stream`. Twitch defaults to `false`. |
| `max_per_stream` | `number` | Redemptions allowed per stream, 1 or more. |
| `is_max_per_user_per_stream_enabled` | `boolean` | Turns on the cap set by `max_per_user_per_stream`. Twitch defaults to `false`. |
| `max_per_user_per_stream` | `number` | Redemptions allowed per viewer per stream, 1 or more. |
| `is_global_cooldown_enabled` | `boolean` | Turns on the cooldown set by `global_cooldown_seconds`. Twitch defaults to `false`. |
| `global_cooldown_seconds` | `number` | Seconds between two redemptions, 1 or more. Viewers only see it from 60 up. |
| `should_redemptions_skip_request_queue` | `boolean` | Marks redemptions `FULFILLED` right away instead of queueing them. Twitch defaults to `false`. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<CustomReward>`

<details>
<summary>Fields of CustomReward</summary>

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the reward. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `id` | `string` | ID of the reward. |
| `title` | `string` | Title of the reward. |
| `prompt` | `string` | Text shown to the viewer when the reward asks for input. |
| `cost` | `number` | Price in Channel Points. |
| `image` | `CustomRewardImage \| null` | Icon uploaded by the broadcaster, or `null` when the default one is used. |
| `default_image` | `CustomRewardImage` | Icon Twitch falls back to. |
| `background_color` | `string` | Background colour as a hex code, for example `"#00E5CB"`. |
| `is_enabled` | `boolean` | Whether viewers can see the reward. |
| `is_user_input_required` | `boolean` | Whether the viewer has to type something when redeeming. |
| `max_per_stream_setting` | `{ is_enabled: boolean; max_per_stream: number; }` | Cap on redemptions during one stream. |
| `max_per_user_per_stream_setting` | `{ is_enabled: boolean; max_per_user_per_stream: number; }` | Cap on redemptions by one viewer during one stream. |
| `global_cooldown_setting` | `{ is_enabled: boolean; global_cooldown_seconds: number; }` | Waiting time imposed between two redemptions. |
| `is_paused` | `boolean` | Whether the reward is paused. A paused reward cannot be redeemed. |
| `is_in_stock` | `boolean` | Whether the reward can still be redeemed, given its caps. |
| `should_redemptions_skip_request_queue` | `boolean` | Whether redemptions are marked `FULFILLED` right away instead of waiting in the queue. |
| `redemptions_redeemed_current_stream` | `number \| null` | Redemptions made during the current stream. `null` when the channel is offline or the per stream cap is off. |
| `cooldown_expires_at` | `string \| null` | When the running cooldown ends, as an RFC 3339 timestamp. `null` when there is none. |

</details>

### Example

```ts
const reward = await twitch.channelPoints.createReward({ title: "Hydrate", cost: 500 });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#create-custom-rewards)

## deleteReward

```ts nocheck
twitch.channelPoints.deleteReward(params, options?): Promise<void>
```

Deletes a custom reward. Only the application that created the reward can
do it. Redemptions still waiting in the queue are marked as fulfilled.

**Token:** user, scope `channel:manage:redemptions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the reward. Defaults to the user making the call. |
| `id` <small>required</small> | `string` | ID of the reward to delete. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.channelPoints.deleteReward({ id: "b045196d-9ce7-4a27-a9b9-279ed341ab28" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#delete-custom-reward)

## rewards

```ts nocheck
twitch.channelPoints.rewards(params?, options?): Promise<CustomReward[]>
```

Lists the custom rewards of a channel, sorted by ID. Asking for IDs that
all turn out to be unknown fails with a 404.

**Token:** user, scope `channel:read:redemptions` or `channel:manage:redemptions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose rewards to list. Defaults to the user making the call. |
| `id` | `string \| readonly string[]` | Only these rewards. Any number: long lists are split for you. |
| `only_manageable_rewards` | `boolean` | Only the rewards your application created and can therefore manage. Twitch defaults to `false`. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<CustomReward[]>`

<details>
<summary>Fields of CustomReward</summary>

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the reward. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `id` | `string` | ID of the reward. |
| `title` | `string` | Title of the reward. |
| `prompt` | `string` | Text shown to the viewer when the reward asks for input. |
| `cost` | `number` | Price in Channel Points. |
| `image` | `CustomRewardImage \| null` | Icon uploaded by the broadcaster, or `null` when the default one is used. |
| `default_image` | `CustomRewardImage` | Icon Twitch falls back to. |
| `background_color` | `string` | Background colour as a hex code, for example `"#00E5CB"`. |
| `is_enabled` | `boolean` | Whether viewers can see the reward. |
| `is_user_input_required` | `boolean` | Whether the viewer has to type something when redeeming. |
| `max_per_stream_setting` | `{ is_enabled: boolean; max_per_stream: number; }` | Cap on redemptions during one stream. |
| `max_per_user_per_stream_setting` | `{ is_enabled: boolean; max_per_user_per_stream: number; }` | Cap on redemptions by one viewer during one stream. |
| `global_cooldown_setting` | `{ is_enabled: boolean; global_cooldown_seconds: number; }` | Waiting time imposed between two redemptions. |
| `is_paused` | `boolean` | Whether the reward is paused. A paused reward cannot be redeemed. |
| `is_in_stock` | `boolean` | Whether the reward can still be redeemed, given its caps. |
| `should_redemptions_skip_request_queue` | `boolean` | Whether redemptions are marked `FULFILLED` right away instead of waiting in the queue. |
| `redemptions_redeemed_current_stream` | `number \| null` | Redemptions made during the current stream. `null` when the channel is offline or the per stream cap is off. |
| `cooldown_expires_at` | `string \| null` | When the running cooldown ends, as an RFC 3339 timestamp. `null` when there is none. |

</details>

### Example

```ts
const rewards = await twitch.channelPoints.rewards();
const mine = await twitch.channelPoints.rewards({ only_manageable_rewards: true });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-custom-reward)

## redemptions

```ts nocheck
twitch.channelPoints.redemptions(params, options?): Paginator<CustomRewardRedemption>
```

Lists the redemptions of a custom reward. Only the application that
created the reward can read them.

**Token:** user, scope `channel:read:redemptions` or `channel:manage:redemptions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the reward. Defaults to the user making the call. |
| `reward_id` <small>required</small> | `string` | ID of the reward whose redemptions to list. |
| `status` | `CustomRewardRedemptionStatus` | Only redemptions with this status. Required unless you pass `id`. Canceled and fulfilled redemptions stay listed for a few days only. |
| `id` | `string \| readonly string[]` | Only these redemptions. Up to 50 IDs. |
| `sort` | `"OLDEST" \| "NEWEST"` | Sort order. Twitch defaults to `"OLDEST"`. |
| `first` | `number` | Items per page, 1 to 50. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<CustomRewardRedemption>`

<details>
<summary>Fields of CustomRewardRedemption</summary>

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the reward. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `id` | `string` | ID of the redemption. |
| `user_id` | `string` | ID of the viewer who redeemed the reward. |
| `user_login` | `string` | Login name of the viewer. |
| `user_name` | `string` | Display name of the viewer. |
| `user_input` | `string` | What the viewer typed. An empty string when the reward asks for no input. |
| `status` | `CustomRewardRedemptionStatus` | Current status of the redemption. |
| `redeemed_at` | `string` | When the reward was redeemed, as an RFC 3339 timestamp. |
| `reward` | `{ id: string; title: string; prompt: string; cost: number; }` | The reward that was redeemed. |

</details>

### Example

```ts
const pending = twitch.channelPoints.redemptions({ reward_id: rewardId, status: "UNFULFILLED" });
for await (const redemption of pending) console.log(redemption.user_name, redemption.user_input);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-custom-reward-redemption)

## updateReward

```ts nocheck
twitch.channelPoints.updateReward(params, options?): Promise<CustomReward>
```

Changes a custom reward. Only the application that created the reward can
do it.

**Token:** user, scope `channel:manage:redemptions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the reward. Defaults to the user making the call. |
| `id` <small>required</small> | `string` | ID of the reward to update. |
| `title` | `string` | New title, 45 characters at most. Must be unique among the rewards of the channel. |
| `prompt` | `string` | Text shown to the viewer when redeeming, 200 characters at most. Goes with `is_user_input_required`. |
| `cost` | `number` | New price in Channel Points, 1 or more. |
| `background_color` | `string` | Background colour as a hex code, for example `"#00E5CB"`. |
| `is_enabled` | `boolean` | Whether viewers can see the reward. |
| `is_user_input_required` | `boolean` | Whether the viewer has to type something when redeeming. |
| `is_max_per_stream_enabled` | `boolean` | Turns the cap set by `max_per_stream` on or off. |
| `max_per_stream` | `number` | Redemptions allowed per stream, 1 or more. |
| `is_max_per_user_per_stream_enabled` | `boolean` | Turns the cap set by `max_per_user_per_stream` on or off. |
| `max_per_user_per_stream` | `number` | Redemptions allowed per viewer per stream, 1 or more. |
| `is_global_cooldown_enabled` | `boolean` | Turns the cooldown set by `global_cooldown_seconds` on or off. |
| `global_cooldown_seconds` | `number` | Seconds between two redemptions, 1 to 604800. Viewers only see it from 60 up. |
| `is_paused` | `boolean` | Pauses or resumes the reward. A paused reward cannot be redeemed. |
| `should_redemptions_skip_request_queue` | `boolean` | Marks redemptions `FULFILLED` right away instead of queueing them. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<CustomReward>`

<details>
<summary>Fields of CustomReward</summary>

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the reward. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `id` | `string` | ID of the reward. |
| `title` | `string` | Title of the reward. |
| `prompt` | `string` | Text shown to the viewer when the reward asks for input. |
| `cost` | `number` | Price in Channel Points. |
| `image` | `CustomRewardImage \| null` | Icon uploaded by the broadcaster, or `null` when the default one is used. |
| `default_image` | `CustomRewardImage` | Icon Twitch falls back to. |
| `background_color` | `string` | Background colour as a hex code, for example `"#00E5CB"`. |
| `is_enabled` | `boolean` | Whether viewers can see the reward. |
| `is_user_input_required` | `boolean` | Whether the viewer has to type something when redeeming. |
| `max_per_stream_setting` | `{ is_enabled: boolean; max_per_stream: number; }` | Cap on redemptions during one stream. |
| `max_per_user_per_stream_setting` | `{ is_enabled: boolean; max_per_user_per_stream: number; }` | Cap on redemptions by one viewer during one stream. |
| `global_cooldown_setting` | `{ is_enabled: boolean; global_cooldown_seconds: number; }` | Waiting time imposed between two redemptions. |
| `is_paused` | `boolean` | Whether the reward is paused. A paused reward cannot be redeemed. |
| `is_in_stock` | `boolean` | Whether the reward can still be redeemed, given its caps. |
| `should_redemptions_skip_request_queue` | `boolean` | Whether redemptions are marked `FULFILLED` right away instead of waiting in the queue. |
| `redemptions_redeemed_current_stream` | `number \| null` | Redemptions made during the current stream. `null` when the channel is offline or the per stream cap is off. |
| `cooldown_expires_at` | `string \| null` | When the running cooldown ends, as an RFC 3339 timestamp. `null` when there is none. |

</details>

### Example

```ts
const reward = await twitch.channelPoints.updateReward({ id: rewardId, is_paused: true });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-custom-reward)

## updateRedemptions

```ts nocheck
twitch.channelPoints.updateRedemptions(params, options?): Promise<CustomRewardRedemption[]>
```

Fulfills or cancels redemptions that are still waiting in the queue, and
returns them. Only the application that created the reward can do it.

**Token:** user, scope `channel:manage:redemptions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the reward. Defaults to the user making the call. |
| `reward_id` <small>required</small> | `string` | ID of the reward that was redeemed. |
| `id` <small>required</small> | `string \| readonly string[]` | Redemptions to update. Up to 50 IDs. |
| `status` <small>required</small> | `"CANCELED" \| "FULFILLED"` | New status. `"CANCELED"` gives the viewer their points back. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<CustomRewardRedemption[]>`

<details>
<summary>Fields of CustomRewardRedemption</summary>

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the reward. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `id` | `string` | ID of the redemption. |
| `user_id` | `string` | ID of the viewer who redeemed the reward. |
| `user_login` | `string` | Login name of the viewer. |
| `user_name` | `string` | Display name of the viewer. |
| `user_input` | `string` | What the viewer typed. An empty string when the reward asks for no input. |
| `status` | `CustomRewardRedemptionStatus` | Current status of the redemption. |
| `redeemed_at` | `string` | When the reward was redeemed, as an RFC 3339 timestamp. |
| `reward` | `{ id: string; title: string; prompt: string; cost: number; }` | The reward that was redeemed. |

</details>

### Example

```ts
await twitch.channelPoints.updateRedemptions({
  reward_id: redemption.reward.id,
  id: redemption.id,
  status: "FULFILLED",
});
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-redemption-status)
