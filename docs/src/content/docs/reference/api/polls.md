---
title: twitch.polls
description: "Polls: create, read and end them."
sidebar:
  label: polls
---

Every method of `twitch.polls`, with its parameters, what it returns and the token it needs.

## get

```ts nocheck
twitch.polls.get(params?, options?): Paginator<Poll>
```

Lists the polls of a channel, most recent first. Twitch keeps them for 90
days.

**Token:** user, scope `channel:read:polls` or `channel:manage:polls`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose polls to list. Defaults to the user making the call. |
| `id` | `string \| readonly string[]` | Only these polls. Up to 20 IDs. |
| `first` | `number` | Items per page, 1 to 20. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<Poll>`

<details>
<summary>Fields of Poll</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the poll. |
| `broadcaster_id` | `string` | ID of the broadcaster who ran the poll. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `title` | `string` | Question put to the viewers, 60 characters at most. |
| `choices` | `PollChoice[]` | Choices of the poll, two to five of them. |
| `bits_voting_enabled` | `boolean` | Deprecated. Always `false`. Bits voting no longer exists. |
| `bits_per_vote` | `number` | Deprecated. Always 0. Bits voting no longer exists. |
| `channel_points_voting_enabled` | `boolean` | Whether viewers can buy extra votes with Channel Points. |
| `channel_points_per_vote` | `number` | Price of one extra vote, in Channel Points. |
| `status` | `PollStatus` | State of the poll: `ACTIVE` while it runs, `COMPLETED` when it reached its end, `TERMINATED` when it was stopped early, `ARCHIVED` when it is hidden from the channel, `MODERATED` when it was deleted, `INVALID` when Twitch could not work it out. |
| `duration` | `number` | Planned length of the poll, in seconds. |
| `started_at` | `string` | When the poll started, as an RFC 3339 timestamp. |
| `ended_at` | `string` | When the poll ended, as an RFC 3339 timestamp. `null` or absent while it is running. |

</details>

### Example

```ts
const latest = await twitch.polls.get().first();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-polls)

## create

```ts nocheck
twitch.polls.create(params, options?): Promise<Poll>
```

Starts a poll in a channel. It opens at once, and a channel can only run
one poll at a time.

**Token:** user, scope `channel:manage:polls`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who runs the poll. Defaults to the user making the call. |
| `title` <small>required</small> | `string` | Question put to the viewers, 60 characters at most. |
| `choices` <small>required</small> | `readonly (string \| { title: string; })[]` | Two to five choices, each 25 characters at most. Plain strings work too. |
| `duration` <small>required</small> | `number` | Length of the poll in seconds, 15 to 1800. |
| `channel_points_voting_enabled` | `boolean` | Lets viewers buy extra votes with Channel Points. Twitch defaults to `false`. |
| `channel_points_per_vote` | `number` | Price of one extra vote in Channel Points, 1 to 1000000. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<Poll>`

<details>
<summary>Fields of Poll</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the poll. |
| `broadcaster_id` | `string` | ID of the broadcaster who ran the poll. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `title` | `string` | Question put to the viewers, 60 characters at most. |
| `choices` | `PollChoice[]` | Choices of the poll, two to five of them. |
| `bits_voting_enabled` | `boolean` | Deprecated. Always `false`. Bits voting no longer exists. |
| `bits_per_vote` | `number` | Deprecated. Always 0. Bits voting no longer exists. |
| `channel_points_voting_enabled` | `boolean` | Whether viewers can buy extra votes with Channel Points. |
| `channel_points_per_vote` | `number` | Price of one extra vote, in Channel Points. |
| `status` | `PollStatus` | State of the poll: `ACTIVE` while it runs, `COMPLETED` when it reached its end, `TERMINATED` when it was stopped early, `ARCHIVED` when it is hidden from the channel, `MODERATED` when it was deleted, `INVALID` when Twitch could not work it out. |
| `duration` | `number` | Planned length of the poll, in seconds. |
| `started_at` | `string` | When the poll started, as an RFC 3339 timestamp. |
| `ended_at` | `string` | When the poll ended, as an RFC 3339 timestamp. `null` or absent while it is running. |

</details>

### Example

```ts
const poll = await twitch.polls.create({
  title: "Which game next?",
  choices: ["Celeste", "Hades", "Outer Wilds"],
  duration: 120,
});
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#create-poll)

## end

```ts nocheck
twitch.polls.end(params, options?): Promise<Poll>
```

Ends a running poll before its time is up, and optionally hides it.

**Token:** user, scope `channel:manage:polls`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who runs the poll. Defaults to the user making the call. |
| `id` <small>required</small> | `string` | ID of the poll to end. |
| `status` <small>required</small> | `"TERMINATED" \| "ARCHIVED"` | `"TERMINATED"` leaves the results on screen, `"ARCHIVED"` also hides the poll. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<Poll>`

<details>
<summary>Fields of Poll</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the poll. |
| `broadcaster_id` | `string` | ID of the broadcaster who ran the poll. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `title` | `string` | Question put to the viewers, 60 characters at most. |
| `choices` | `PollChoice[]` | Choices of the poll, two to five of them. |
| `bits_voting_enabled` | `boolean` | Deprecated. Always `false`. Bits voting no longer exists. |
| `bits_per_vote` | `number` | Deprecated. Always 0. Bits voting no longer exists. |
| `channel_points_voting_enabled` | `boolean` | Whether viewers can buy extra votes with Channel Points. |
| `channel_points_per_vote` | `number` | Price of one extra vote, in Channel Points. |
| `status` | `PollStatus` | State of the poll: `ACTIVE` while it runs, `COMPLETED` when it reached its end, `TERMINATED` when it was stopped early, `ARCHIVED` when it is hidden from the channel, `MODERATED` when it was deleted, `INVALID` when Twitch could not work it out. |
| `duration` | `number` | Planned length of the poll, in seconds. |
| `started_at` | `string` | When the poll started, as an RFC 3339 timestamp. |
| `ended_at` | `string` | When the poll ended, as an RFC 3339 timestamp. `null` or absent while it is running. |

</details>

### Example

```ts
const poll = await twitch.polls.end({ id: pollId, status: "TERMINATED" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#end-poll)
