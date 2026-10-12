---
title: twitch.hypeTrain
description: "Hype Train: the current train and the channel records."
sidebar:
  label: hypeTrain
---

Toutes les méthodes de `twitch.hypeTrain`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## status

```ts nocheck
twitch.hypeTrain.status(params?, options?): Promise<HypeTrainStatus>
```

Gets the Hype Train running on a channel, if any, along with the records
of the channel.

**Jeton:** user, scope `channel:read:hype_train`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose Hype Train to read. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<HypeTrainStatus>`

<details>
<summary>Champs de HypeTrainStatus</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `current` | `HypeTrain \| null` | The train in progress, or `null` when none is running. |
| `all_time_high` | `HypeTrainRecord \| null` | Record of the channel on its own trains, or `null` when it never had one. |
| `shared_all_time_high` | `HypeTrainRecord \| null` | Record of the channel on shared trains, or `null` when it never had one. |

</details>

### Exemple

```ts
const { current, all_time_high } = await twitch.hypeTrain.status();
if (current) console.log(`Level ${current.level}: ${current.progress} / ${current.goal}`);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-hype-train-status)
