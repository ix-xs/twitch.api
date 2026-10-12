---
title: twitch.predictions
description: "Predictions: create, read, lock and resolve them."
sidebar:
  label: predictions
---

Toutes les méthodes de `twitch.predictions`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## get

```ts nocheck
twitch.predictions.get(params?, options?): Paginator<Prediction>
```

Lists the predictions of a channel, most recent first.

**Jeton:** user, scope `channel:read:predictions` or `channel:manage:predictions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose predictions to list. Defaults to the user making the call. |
| `id` | `string \| readonly string[]` | Only these predictions. Up to 25 IDs. |
| `first` | `number` | Items per page, 1 to 25. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Prediction>`

<details>
<summary>Champs de Prediction</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the prediction. |
| `broadcaster_id` | `string` | ID of the broadcaster who ran the prediction. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `title` | `string` | Question the viewers bet on. |
| `winning_outcome_id` | `string \| null` | ID of the outcome that won. `null` until the prediction is resolved. |
| `outcomes` | `PredictionOutcome[]` | Outcomes viewers can pick. |
| `prediction_window` | `number` | How long viewers can bet, in seconds. |
| `status` | `PredictionStatus` | State of the prediction: `ACTIVE` while bets are open, `LOCKED` once they are closed, `RESOLVED` when a winner was picked and points paid out, `CANCELED` when everyone was refunded. |
| `created_at` | `string` | When the prediction started, as an RFC 3339 timestamp. |
| `ended_at` | `string \| null` | When the prediction ended, as an RFC 3339 timestamp. `null` while it is active. |
| `locked_at` | `string \| null` | When bets were closed, as an RFC 3339 timestamp. `null` when the prediction is not locked. |

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

Starts a prediction in a channel. Bets open at once, and a channel can
only run one prediction at a time.

**Jeton:** user, scope `channel:manage:predictions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who runs the prediction. Defaults to the user making the call. |
| `title` <small>requis</small> | `string` | Question the viewers bet on, 45 characters at most. |
| `outcomes` <small>requis</small> | `readonly (string \| { title: string; })[]` | Two to ten outcomes, each 25 characters at most. Plain strings work too. |
| `prediction_window` <small>requis</small> | `number` | How long viewers can bet, in seconds, 30 to 1800. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Prediction>`

<details>
<summary>Champs de Prediction</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the prediction. |
| `broadcaster_id` | `string` | ID of the broadcaster who ran the prediction. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `title` | `string` | Question the viewers bet on. |
| `winning_outcome_id` | `string \| null` | ID of the outcome that won. `null` until the prediction is resolved. |
| `outcomes` | `PredictionOutcome[]` | Outcomes viewers can pick. |
| `prediction_window` | `number` | How long viewers can bet, in seconds. |
| `status` | `PredictionStatus` | State of the prediction: `ACTIVE` while bets are open, `LOCKED` once they are closed, `RESOLVED` when a winner was picked and points paid out, `CANCELED` when everyone was refunded. |
| `created_at` | `string` | When the prediction started, as an RFC 3339 timestamp. |
| `ended_at` | `string \| null` | When the prediction ended, as an RFC 3339 timestamp. `null` while it is active. |
| `locked_at` | `string \| null` | When bets were closed, as an RFC 3339 timestamp. `null` when the prediction is not locked. |

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

Locks, resolves or cancels a prediction. One left unresolved for 24 hours
after its window closed is canceled by Twitch and the points are refunded.

**Jeton:** user, scope `channel:manage:predictions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who runs the prediction. Defaults to the user making the call. |
| `id` <small>requis</small> | `string` | ID of the prediction to update. |
| `status` <small>requis</small> | `"CANCELED" \| "LOCKED" \| "RESOLVED"` | `"LOCKED"` closes the bets, `"RESOLVED"` pays out the winners, `"CANCELED"` refunds everyone. A locked prediction can still be resolved or canceled. |
| `winning_outcome_id` | `string` | ID of the outcome that won. Required when `status` is `"RESOLVED"`. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Prediction>`

<details>
<summary>Champs de Prediction</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the prediction. |
| `broadcaster_id` | `string` | ID of the broadcaster who ran the prediction. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `title` | `string` | Question the viewers bet on. |
| `winning_outcome_id` | `string \| null` | ID of the outcome that won. `null` until the prediction is resolved. |
| `outcomes` | `PredictionOutcome[]` | Outcomes viewers can pick. |
| `prediction_window` | `number` | How long viewers can bet, in seconds. |
| `status` | `PredictionStatus` | State of the prediction: `ACTIVE` while bets are open, `LOCKED` once they are closed, `RESOLVED` when a winner was picked and points paid out, `CANCELED` when everyone was refunded. |
| `created_at` | `string` | When the prediction started, as an RFC 3339 timestamp. |
| `ended_at` | `string \| null` | When the prediction ended, as an RFC 3339 timestamp. `null` while it is active. |
| `locked_at` | `string \| null` | When bets were closed, as an RFC 3339 timestamp. `null` when the prediction is not locked. |

</details>

### Exemple

```ts
await twitch.predictions.end({ id: predictionId, status: "LOCKED" });
await twitch.predictions.end({ id: predictionId, status: "RESOLVED", winning_outcome_id: outcomeId });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#end-prediction)
