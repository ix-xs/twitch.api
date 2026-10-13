---
title: twitch.goals
description: "Objectifs de créateur d'une chaîne."
sidebar:
  label: goals
---

Toutes les méthodes de `twitch.goals`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## get

```ts nocheck
twitch.goals.get(params?, options?): Promise<CreatorGoal[]>
```

Liste les objectifs actifs d'un diffuseur avec leur progression actuelle.

**Jeton :** utilisateur, scope `channel:read:goals`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui a créé les objectifs. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CreatorGoal[]>`

<details>
<summary>Champs de CreatorGoal</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'objectif. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui a créé l'objectif. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `type` | `CreatorGoalType` | Ce que compte l'objectif. |
| `description` | `string` | Texte de l'objectif. Une chaîne vide quand le diffuseur n'en a pas écrit. |
| `current_amount` | `number` | Valeur actuelle du compteur. Pour `follower`, c'est le nombre total de followers de la chaîne. |
| `target_amount` | `number` | Valeur que le diffuseur veut atteindre. |
| `created_at` | `string` | Date de création de l'objectif, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const goals = await twitch.goals.get();
for (const goal of goals) console.log(goal.type, goal.current_amount, goal.target_amount);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-creator-goals)
