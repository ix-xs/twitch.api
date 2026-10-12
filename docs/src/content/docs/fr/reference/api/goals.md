---
title: twitch.goals
description: "Creator goals of a channel."
sidebar:
  label: goals
---

Toutes les méthodes de `twitch.goals`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## get

```ts nocheck
twitch.goals.get(params?, options?): Promise<CreatorGoal[]>
```

Lists the active goals of a broadcaster with their current progress.

**Jeton:** user, scope `channel:read:goals`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who created the goals. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CreatorGoal[]>`

<details>
<summary>Champs de CreatorGoal</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the goal. |
| `broadcaster_id` | `string` | ID of the broadcaster who created the goal. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `type` | `CreatorGoalType` | What the goal counts. |
| `description` | `string` | Text of the goal. An empty string when the broadcaster wrote none. |
| `current_amount` | `number` | Where the count stands now. For `follower` this is the whole follower count of the channel. |
| `target_amount` | `number` | Value the broadcaster wants to reach. |
| `created_at` | `string` | When the goal was created, as an RFC 3339 timestamp. |

</details>

### Exemple

```ts
const goals = await twitch.goals.get();
for (const goal of goals) console.log(goal.type, goal.current_amount, goal.target_amount);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-creator-goals)
