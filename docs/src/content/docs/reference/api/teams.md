---
title: twitch.teams
description: "Teams: look one up, list the teams of a channel."
sidebar:
  label: teams
---

Every method of `twitch.teams`, with its parameters, what it returns and the token it needs.

## ofChannel

```ts nocheck
twitch.teams.ofChannel(params, options?): Promise<ChannelTeam[]>
```

Lists the teams a broadcaster is a member of. The list is empty when
there are none.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster whose teams to list. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<ChannelTeam[]>`

<details>
<summary>Fields of ChannelTeam</summary>

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `background_image_url` | `string \| null` | URL of the background image, or `null` when the team has none. |
| `banner` | `string \| null` | URL of the banner, or `null` when the team has none. |
| `created_at` | `string` | When the team was created, as an RFC 3339 timestamp. |
| `updated_at` | `string` | When the team was last changed, as an RFC 3339 timestamp. |
| `info` | `string` | Description of the team. May hold HTML, Markdown and line breaks. |
| `thumbnail_url` | `string` | URL of the team logo. |
| `team_name` | `string` | Name of the team: the one that appears in URLs. |
| `team_display_name` | `string` | Display name of the team. |
| `id` | `string` | ID of the team. |

</details>

### Example

```ts
const teams = await twitch.teams.ofChannel({ broadcaster_id: "141981764" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-channel-teams)

## get

```ts nocheck
twitch.teams.get(params, options?): Promise<Team | null>
```

Gets a team and its members, by name or by ID. Resolves with `null` when
Twitch returns no team.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `string` | Name of the team. |
| `id` | `string` | ID of the team. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<Team \| null>`

<details>
<summary>Fields of Team</summary>

| Name | Type | Description |
| --- | --- | --- |
| `users` | `TeamMember[]` | Members of the team. |
| `background_image_url` | `string \| null` | URL of the background image, or `null` when the team has none. |
| `banner` | `string \| null` | URL of the banner, or `null` when the team has none. |
| `created_at` | `string` | When the team was created, as an RFC 3339 timestamp. |
| `updated_at` | `string` | When the team was last changed, as an RFC 3339 timestamp. |
| `info` | `string` | Description of the team. May hold HTML, Markdown and line breaks. |
| `thumbnail_url` | `string` | URL of the team logo. |
| `team_name` | `string` | Name of the team: the one that appears in URLs. |
| `team_display_name` | `string` | Display name of the team. |
| `id` | `string` | ID of the team. |

</details>

### Example

```ts
const team = await twitch.teams.get({ name: "livecoders" });
console.log(team?.users.length);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-teams)
