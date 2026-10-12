---
title: twitch.teams
description: "Teams: look one up, list the teams of a channel."
sidebar:
  label: teams
---

Toutes les méthodes de `twitch.teams`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## ofChannel

```ts nocheck
twitch.teams.ofChannel(params, options?): Promise<ChannelTeam[]>
```

Lists the teams a broadcaster is a member of. The list is empty when
there are none.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose teams to list. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChannelTeam[]>`

<details>
<summary>Champs de ChannelTeam</summary>

| Nom | Type | Description |
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

### Exemple

```ts
const teams = await twitch.teams.ofChannel({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-teams)

## get

```ts nocheck
twitch.teams.get(params, options?): Promise<Team | null>
```

Gets a team and its members, by name or by ID. Resolves with `null` when
Twitch returns no team.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `name` | `string` | Name of the team. |
| `id` | `string` | ID of the team. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Team \| null>`

<details>
<summary>Champs de Team</summary>

| Nom | Type | Description |
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

### Exemple

```ts
const team = await twitch.teams.get({ name: "livecoders" });
console.log(team?.users.length);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-teams)
