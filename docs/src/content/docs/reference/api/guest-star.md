---
title: twitch.guestStar
description: "Guest Star (beta): sessions, invites and slots."
sidebar:
  label: guestStar
---

Every method of `twitch.guestStar`, with its parameters, what it returns and the token it needs.

## settings

```ts nocheck
twitch.guestStar.settings(params, options?): Promise<GuestStarSettings>
```

Gets the Guest Star settings of a channel.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster whose settings to read. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<GuestStarSettings>`

<details>
<summary>Fields of GuestStarSettings</summary>

| Name | Type | Description |
| --- | --- | --- |
| `is_moderator_send_live_enabled` | `boolean` | Whether Guest Star moderators may decide if a guest in a slot is live. |
| `slot_count` | `number` | Number of slots the host can fill in a call, 1 to 6. |
| `is_browser_source_audio_enabled` | `boolean` | Whether browser sources of this channel play the audio of the session. |
| `group_layout` | `GuestStarGroupLayout` | How guests are arranged in the browser source. |
| `browser_source_token` | `string` | View only token used to build browser source URLs. |

</details>

### Example

```ts
const settings = await twitch.guestStar.settings({ broadcaster_id: "141981764" });
console.log(settings.slot_count, settings.group_layout);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-channel-guest-star-settings)

## updateSettings

```ts nocheck
twitch.guestStar.updateSettings(params?, options?): Promise<void>
```

Changes the Guest Star settings of a channel. Only the fields you pass
are touched.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose settings to change. Defaults to the user making the call. |
| `is_moderator_send_live_enabled` | `boolean` | Lets Guest Star moderators decide if a guest in a slot is live. |
| `slot_count` | `number` | Number of slots the host can fill in a call, 1 to 6. |
| `is_browser_source_audio_enabled` | `boolean` | Makes browser sources of this channel play the audio of the session. |
| `group_layout` | `GuestStarGroupLayout` | How guests are arranged in the browser source. |
| `regenerate_browser_sources` | `boolean` | Issues a new browser source token. Every browser source already set up in the streaming software stops working at once. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.guestStar.updateSettings({ slot_count: 4, group_layout: "TILED_LAYOUT" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-channel-guest-star-settings)

## session

```ts nocheck
twitch.guestStar.session(params, options?): Promise<GuestStarSession | null>
```

Gets the Guest Star session a channel is running, or `null` when there is
none. A guest can read it too, once invited or seated.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster who hosts the session. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<GuestStarSession \| null>`

<details>
<summary>Fields of GuestStarSession</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the session. |
| `guests` | `GuestStarGuest[]` | Everyone who holds a slot, the host included. |

</details>

### Example

```ts
const session = await twitch.guestStar.session({ broadcaster_id: "141981764" });
if (session) console.log(session.guests.map((guest) => guest.user_login));
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-guest-star-session)

## createSession

```ts nocheck
twitch.guestStar.createSession(params?, options?): Promise<GuestStarSession>
```

Starts a Guest Star session with the broadcaster as its only member. The
broadcaster has to be in the call interface, otherwise Twitch ends the
call by itself.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who will host the session. Defaults to the user making the call. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<GuestStarSession>`

<details>
<summary>Fields of GuestStarSession</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the session. |
| `guests` | `GuestStarGuest[]` | Everyone who holds a slot, the host included. |

</details>

### Example

```ts
const session = await twitch.guestStar.createSession();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#create-guest-star-session)

## endSession

```ts nocheck
twitch.guestStar.endSession(params, options?): Promise<GuestStarSession | null>
```

Ends a Guest Star session, like the host pressing "End Call". Resolves
with the session as it was at that moment, or `null` when Twitch sends
nothing back.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who hosts the session. Defaults to the user making the call. |
| `session_id` <small>required</small> | `string` | ID of the session to end. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<GuestStarSession \| null>`

<details>
<summary>Fields of GuestStarSession</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the session. |
| `guests` | `GuestStarGuest[]` | Everyone who holds a slot, the host included. |

</details>

### Example

```ts
await twitch.guestStar.endSession({ session_id: session.id });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#end-guest-star-session)

## invites

```ts nocheck
twitch.guestStar.invites(params, options?): Promise<GuestStarInvite[]>
```

Lists the pending invitations of a session, with how far each invited
user is in the waiting room.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` or `moderator:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster who hosts the session. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `session_id` <small>required</small> | `string` | ID of the session whose invitations to list. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<GuestStarInvite[]>`

<details>
<summary>Fields of GuestStarInvite</summary>

| Name | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the invited user. |
| `invited_at` | `string` | When the invitation was sent, as an RFC 3339 timestamp. |
| `status` | `"INVITED" \| "ACCEPTED" \| "READY"` | How far the user is in joining: `"INVITED"` when they have not reacted yet, `"ACCEPTED"` once they are in the waiting room, `"READY"` when they said they can join the call. |
| `is_video_enabled` | `boolean` | Whether the user has their camera turned on. |
| `is_audio_enabled` | `boolean` | Whether the user has their microphone turned on. |
| `is_video_available` | `boolean` | Whether the user has a camera to share. |
| `is_audio_available` | `boolean` | Whether the user has a microphone to share. |

</details>

### Example

```ts
const invites = await twitch.guestStar.invites({ broadcaster_id: "141981764", session_id: session.id });
const ready = invites.filter((invite) => invite.status === "READY");
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-guest-star-invites)

## invite

```ts nocheck
twitch.guestStar.invite(params, options?): Promise<void>
```

Invites a user to a session in progress.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster who hosts the session. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `session_id` <small>required</small> | `string` | ID of the session to invite the user to. |
| `guest_id` <small>required</small> | `string` | ID of the user to invite. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.guestStar.invite({ broadcaster_id: "141981764", session_id: session.id, guest_id: "144601104" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#send-guest-star-invite)

## deleteInvite

```ts nocheck
twitch.guestStar.deleteInvite(params, options?): Promise<void>
```

Takes back an invitation to a session.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster who hosts the session. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `session_id` <small>required</small> | `string` | ID of the session the invitation was sent for. |
| `guest_id` <small>required</small> | `string` | ID of the user whose invitation to take back. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.guestStar.deleteInvite({ broadcaster_id: "141981764", session_id: session.id, guest_id: "144601104" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#delete-guest-star-invite)

## assignSlot

```ts nocheck
twitch.guestStar.assignSlot(params, options?): Promise<void>
```

Seats an invited user in a slot of the session, once they are ready to
join.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster who hosts the session. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `session_id` <small>required</small> | `string` | ID of the session. |
| `guest_id` <small>required</small> | `string` | ID of the user to seat. They must be invited and ready to join. |
| `slot_id` <small>required</small> | `string` | Slot to give them: a number from `"1"` up to the slot count of the channel. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.guestStar.assignSlot({
  broadcaster_id: "141981764",
  session_id: session.id,
  guest_id: "144601104",
  slot_id: "1",
});
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#assign-guest-star-slot)

## updateSlot

```ts nocheck
twitch.guestStar.updateSlot(params, options?): Promise<void>
```

Moves a guest to another slot. When the destination is taken, the two
guests swap places.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster who hosts the session. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `session_id` <small>required</small> | `string` | ID of the session. |
| `source_slot_id` <small>required</small> | `string` | Slot the guest is in now. |
| `destination_slot_id` | `string` | Slot to move the guest to. When someone is already there, the two swap places. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.guestStar.updateSlot({
  broadcaster_id: "141981764",
  session_id: session.id,
  source_slot_id: "1",
  destination_slot_id: "2",
});
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-guest-star-slot)

## deleteSlot

```ts nocheck
twitch.guestStar.deleteSlot(params, options?): Promise<void>
```

Removes a guest from their slot. They lose access to the session at once
and can no longer send or receive its audio and video.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster who hosts the session. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `session_id` <small>required</small> | `string` | ID of the session. |
| `guest_id` <small>required</small> | `string` | ID of the guest to remove. |
| `slot_id` <small>required</small> | `string` | Slot the guest is in. |
| `should_reinvite_guest` | `boolean` | Sends the guest back to the invitation queue instead of out of the session. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.guestStar.deleteSlot({
  broadcaster_id: "141981764",
  session_id: session.id,
  guest_id: "144601104",
  slot_id: "1",
});
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#delete-guest-star-slot)

## updateSlotSettings

```ts nocheck
twitch.guestStar.updateSlotSettings(params, options?): Promise<void>
```

Changes what a slot may share and how it comes out on stream: audio,
video, live state and volume. Allowing audio or video again does not turn
it on, the guest is told they can do so.

Beta: Twitch may change this endpoint.

**Token:** user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster who hosts the session. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `session_id` <small>required</small> | `string` | ID of the session. |
| `slot_id` <small>required</small> | `string` | Slot to change. |
| `is_audio_enabled` | `boolean` | Whether the slot may share audio. `false` mutes it for everyone. |
| `is_video_enabled` | `boolean` | Whether the slot may share video. `false` hides it for everyone. |
| `is_live` | `boolean` | Whether the slot is shown and heard on stream, through the browser source. |
| `volume` | `number` | Volume of the slot on stream, 0 to 100. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.guestStar.updateSlotSettings({
  broadcaster_id: "141981764",
  session_id: session.id,
  slot_id: "1",
  is_audio_enabled: false,
});
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-guest-star-slot-settings)
