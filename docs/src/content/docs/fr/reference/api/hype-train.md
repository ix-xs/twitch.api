---
title: twitch.hypeTrain
description: "Hype Train : le train en cours et les records de la chaîne."
sidebar:
  label: hypeTrain
---

Toutes les méthodes de `twitch.hypeTrain`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## status

```ts nocheck
twitch.hypeTrain.status(params?, options?): Promise<HypeTrainStatus>
```

Renvoie le Hype Train en cours sur une chaîne, s'il y en a un, ainsi que les records de la chaîne.

**Jeton :** utilisateur, scope `channel:read:hype_train`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on lit le Hype Train. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<HypeTrainStatus>`

<details>
<summary>Champs de HypeTrainStatus</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `current` | `HypeTrain \| null` | Le train en cours, ou `null` quand il n'y en a pas. |
| `all_time_high` | `HypeTrainRecord \| null` | Record de la chaîne sur ses propres trains, ou `null` quand elle n'en a jamais eu. |
| `shared_all_time_high` | `HypeTrainRecord \| null` | Record de la chaîne sur les trains partagés, ou `null` quand elle n'en a jamais eu. |

</details>

### Exemple

```ts
const { current, all_time_high } = await twitch.hypeTrain.status();
if (current) console.log(`Level ${current.level}: ${current.progress} / ${current.goal}`);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-hype-train-status)
