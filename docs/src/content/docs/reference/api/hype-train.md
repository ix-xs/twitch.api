---
title: twitch.hypeTrain
description: "Hype Train: the current train and the channel records."
sidebar:
  label: hypeTrain
---

Every method of `twitch.hypeTrain`, with its parameters, what it returns and the token it needs.

## status

```ts nocheck
twitch.hypeTrain.status(params?, options?): Promise<HypeTrainStatus>
```

Gets the Hype Train running on a channel, if any, along with the records
of the channel.

**Token:** user, scope `channel:read:hype_train`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose Hype Train to read. Defaults to the user making the call. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<HypeTrainStatus>`

<details>
<summary>Fields of HypeTrainStatus</summary>

| Name | Type | Description |
| --- | --- | --- |
| `current` | `HypeTrain \| null` | The train in progress, or `null` when none is running. |
| `all_time_high` | `HypeTrainRecord \| null` | Record of the channel on its own trains, or `null` when it never had one. |
| `shared_all_time_high` | `HypeTrainRecord \| null` | Record of the channel on shared trains, or `null` when it never had one. |

</details>

### Example

```ts
const { current, all_time_high } = await twitch.hypeTrain.status();
if (current) console.log(`Level ${current.level}: ${current.progress} / ${current.goal}`);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-hype-train-status)
