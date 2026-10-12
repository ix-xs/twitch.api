---
title: twitch.whispers
description: "Whispers: send a private message to a user."
sidebar:
  label: whispers
---

Every method of `twitch.whispers`, with its parameters, what it returns and the token it needs.

## send

```ts nocheck
twitch.whispers.send(params, options?): Promise<void>
```

Sends a whisper to a user. Twitch can discard a whisper it finds
suspicious and still report success, so a resolved call is no proof of
delivery. Limited to 40 different recipients per day, 3 whispers per
second and 100 per minute.

**Token:** user, scope `user:manage:whispers`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `from_user_id` | `string` | User who sends the whisper. Their account needs a verified phone number. Defaults to the user making the call. |
| `to_user_id` <small>required</small> | `string` | User who receives the whisper. |
| `message` <small>required</small> | `string` | Text of the whisper. Twitch cuts it at 500 characters when the recipient never whispered the sender, at 10,000 otherwise. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.whispers.send({ to_user_id: "198704263", message: "Thanks for the raid" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#send-whisper)
