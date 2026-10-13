---
title: twitch.predictions
description: "Prédictions : créer, lire, verrouiller et résoudre."
sidebar:
  label: predictions
---

Toutes les méthodes de `twitch.predictions`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## get

```ts nocheck
twitch.predictions.get(params?, options?): Paginator<Prediction>
```

Liste les prédictions d'une chaîne, de la plus récente à la plus ancienne.

**Jeton :** utilisateur, scope `channel:read:predictions` ou `channel:manage:predictions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on liste les prédictions. Par défaut, l'utilisateur qui fait l'appel. |
| `id` | `string \| readonly string[]` | Uniquement ces prédictions. Jusqu'à 25 identifiants. |
| `first` | `number` | Éléments par page, de 1 à 25. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Prediction>`

<details>
<summary>Champs de Prediction</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la prédiction. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui a organisé la prédiction. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `title` | `string` | Question sur laquelle les spectateurs parient. |
| `winning_outcome_id` | `string \| null` | Identifiant de l'issue gagnante. `null` tant que la prédiction n'est pas résolue. |
| `outcomes` | `PredictionOutcome[]` | Issues que les spectateurs peuvent choisir. |
| `prediction_window` | `number` | Durée pendant laquelle les spectateurs peuvent parier, en secondes. |
| `status` | `PredictionStatus` | État de la prédiction : `ACTIVE` tant que les paris sont ouverts, `LOCKED` une fois qu'ils sont fermés, `RESOLVED` quand une issue gagnante a été choisie et les points versés, `CANCELED` quand tout le monde a été remboursé. |
| `created_at` | `string` | Début de la prédiction, sous forme d'horodatage RFC 3339. |
| `ended_at` | `string \| null` | Fin de la prédiction, sous forme d'horodatage RFC 3339. `null` tant qu'elle est active. |
| `locked_at` | `string \| null` | Moment où les paris ont été fermés, sous forme d'horodatage RFC 3339. `null` quand la prédiction n'est pas verrouillée. |

</details>

### Exemple

```ts
const latest = await twitch.predictions.get().first();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-predictions)

## create

```ts nocheck
twitch.predictions.create(params, options?): Promise<Prediction>
```

Lance une prédiction sur une chaîne. Les paris ouvrent aussitôt, et une chaîne ne peut avoir qu'une prédiction en cours à la fois.

**Jeton :** utilisateur, scope `channel:manage:predictions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui organise la prédiction. Par défaut, l'utilisateur qui fait l'appel. |
| `title` <small>requis</small> | `string` | Question sur laquelle les spectateurs parient, 45 caractères au plus. |
| `outcomes` <small>requis</small> | `readonly (string \| { title: string; })[]` | De deux à dix issues, de 25 caractères au plus chacune. De simples chaînes de caractères conviennent aussi. |
| `prediction_window` <small>requis</small> | `number` | Durée pendant laquelle les spectateurs peuvent parier, en secondes, de 30 à 1800. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Prediction>`

<details>
<summary>Champs de Prediction</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la prédiction. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui a organisé la prédiction. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `title` | `string` | Question sur laquelle les spectateurs parient. |
| `winning_outcome_id` | `string \| null` | Identifiant de l'issue gagnante. `null` tant que la prédiction n'est pas résolue. |
| `outcomes` | `PredictionOutcome[]` | Issues que les spectateurs peuvent choisir. |
| `prediction_window` | `number` | Durée pendant laquelle les spectateurs peuvent parier, en secondes. |
| `status` | `PredictionStatus` | État de la prédiction : `ACTIVE` tant que les paris sont ouverts, `LOCKED` une fois qu'ils sont fermés, `RESOLVED` quand une issue gagnante a été choisie et les points versés, `CANCELED` quand tout le monde a été remboursé. |
| `created_at` | `string` | Début de la prédiction, sous forme d'horodatage RFC 3339. |
| `ended_at` | `string \| null` | Fin de la prédiction, sous forme d'horodatage RFC 3339. `null` tant qu'elle est active. |
| `locked_at` | `string \| null` | Moment où les paris ont été fermés, sous forme d'horodatage RFC 3339. `null` quand la prédiction n'est pas verrouillée. |

</details>

### Exemple

```ts
const prediction = await twitch.predictions.create({
  title: "Will the boss go down first try?",
  outcomes: ["Yes", "No"],
  prediction_window: 120,
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-prediction)

## end

```ts nocheck
twitch.predictions.end(params, options?): Promise<Prediction>
```

Verrouille, résout ou annule une prédiction. Une prédiction restée sans résolution 24 heures après la fermeture des paris est annulée par Twitch, et les points sont remboursés.

**Jeton :** utilisateur, scope `channel:manage:predictions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui organise la prédiction. Par défaut, l'utilisateur qui fait l'appel. |
| `id` <small>requis</small> | `string` | Identifiant de la prédiction à mettre à jour. |
| `status` <small>requis</small> | `"CANCELED" \| "LOCKED" \| "RESOLVED"` | `"LOCKED"` ferme les paris, `"RESOLVED"` paie les gagnants, `"CANCELED"` rembourse tout le monde. Une prédiction verrouillée peut encore être résolue ou annulée. |
| `winning_outcome_id` | `string` | Identifiant de l'issue gagnante. Obligatoire quand `status` vaut `"RESOLVED"`. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Prediction>`

<details>
<summary>Champs de Prediction</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la prédiction. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui a organisé la prédiction. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `title` | `string` | Question sur laquelle les spectateurs parient. |
| `winning_outcome_id` | `string \| null` | Identifiant de l'issue gagnante. `null` tant que la prédiction n'est pas résolue. |
| `outcomes` | `PredictionOutcome[]` | Issues que les spectateurs peuvent choisir. |
| `prediction_window` | `number` | Durée pendant laquelle les spectateurs peuvent parier, en secondes. |
| `status` | `PredictionStatus` | État de la prédiction : `ACTIVE` tant que les paris sont ouverts, `LOCKED` une fois qu'ils sont fermés, `RESOLVED` quand une issue gagnante a été choisie et les points versés, `CANCELED` quand tout le monde a été remboursé. |
| `created_at` | `string` | Début de la prédiction, sous forme d'horodatage RFC 3339. |
| `ended_at` | `string \| null` | Fin de la prédiction, sous forme d'horodatage RFC 3339. `null` tant qu'elle est active. |
| `locked_at` | `string \| null` | Moment où les paris ont été fermés, sous forme d'horodatage RFC 3339. `null` quand la prédiction n'est pas verrouillée. |

</details>

### Exemple

```ts
await twitch.predictions.end({ id: predictionId, status: "LOCKED" });
await twitch.predictions.end({ id: predictionId, status: "RESOLVED", winning_outcome_id: outcomeId });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#end-prediction)
