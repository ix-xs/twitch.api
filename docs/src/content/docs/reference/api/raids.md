---
title: twitch.raids
description: "Raids: start one, cancel a pending one."
sidebar:
  label: raids
---

Every method of `twitch.raids`, with its parameters, what it returns and the token it needs.

## start

```ts nocheck
twitch.raids.start(params, options?): Promise<PendingRaid>
```

Prepares a raid on another channel. The viewers only leave once the
broadcaster confirms in the Twitch interface or after a 90 second
countdown, so listen to the channel raid event to know that it happened.
Limited to 10 calls per 10 minutes.

**Token:** user, scope `channel:manage:raids`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `from_broadcaster_id` | `string` | Broadcaster who sends their viewers. Defaults to the user making the call. |
| `to_broadcaster_id` <small>required</small> | `string` | ID of the broadcaster to raid. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<PendingRaid>`

<details>
<summary>Fields of PendingRaid</summary>

| Name | Type | Description |
| --- | --- | --- |
| `created_at` | `string` | When the raid was requested, as an RFC 3339 timestamp. |
| `is_mature` | `boolean` | Deprecated. Always `false`. |

</details>

### Example

```ts
const raid = await twitch.raids.start({ to_broadcaster_id: "141981764" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#start-a-raid)

## cancel

```ts nocheck
twitch.raids.cancel(params?, options?): Promise<void>
```

Cancels a raid that has not left yet. Limited to 10 calls per 10 minutes.

**Token:** user, scope `channel:manage:raids`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who started the raid. Defaults to the user making the call. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.raids.cancel();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#cancel-a-raid)
