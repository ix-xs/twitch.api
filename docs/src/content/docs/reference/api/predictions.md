---
title: twitch.predictions
description: "Predictions: create, read, lock and resolve them."
sidebar:
  label: predictions
---

Every method of `twitch.predictions`, with its parameters, what it returns and the token it needs.

## get

```ts nocheck
twitch.predictions.get(params?, options?): Paginator<Prediction>
```

Lists the predictions of a channel, most recent first.

**Token:** user, scope `channel:read:predictions` or `channel:manage:predictions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose predictions to list. Defaults to the user making the call. |
| `id` | `string \| readonly string[]` | Only these predictions. Up to 25 IDs. |
| `first` | `number` | Items per page, 1 to 25. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<Prediction>`

<details>
<summary>Fields of Prediction</summary>

| Name | Type | Description |
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

### Example

```ts
const latest = await twitch.predictions.get().first();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-predictions)

## create

```ts nocheck
twitch.predictions.create(params, options?): Promise<Prediction>
```

Starts a prediction in a channel. Bets open at once, and a channel can
only run one prediction at a time.

**Token:** user, scope `channel:manage:predictions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who runs the prediction. Defaults to the user making the call. |
| `title` <small>required</small> | `string` | Question the viewers bet on, 45 characters at most. |
| `outcomes` <small>required</small> | `readonly (string \| { title: string; })[]` | Two to ten outcomes, each 25 characters at most. Plain strings work too. |
| `prediction_window` <small>required</small> | `number` | How long viewers can bet, in seconds, 30 to 1800. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<Prediction>`

<details>
<summary>Fields of Prediction</summary>

| Name | Type | Description |
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

### Example

```ts
const prediction = await twitch.predictions.create({
  title: "Will the boss go down first try?",
  outcomes: ["Yes", "No"],
  prediction_window: 120,
});
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#create-prediction)

## end

```ts nocheck
twitch.predictions.end(params, options?): Promise<Prediction>
```

Locks, resolves or cancels a prediction. One left unresolved for 24 hours
after its window closed is canceled by Twitch and the points are refunded.

**Token:** user, scope `channel:manage:predictions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who runs the prediction. Defaults to the user making the call. |
| `id` <small>required</small> | `string` | ID of the prediction to update. |
| `status` <small>required</small> | `"CANCELED" \| "LOCKED" \| "RESOLVED"` | `"LOCKED"` closes the bets, `"RESOLVED"` pays out the winners, `"CANCELED"` refunds everyone. A locked prediction can still be resolved or canceled. |
| `winning_outcome_id` | `string` | ID of the outcome that won. Required when `status` is `"RESOLVED"`. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<Prediction>`

<details>
<summary>Fields of Prediction</summary>

| Name | Type | Description |
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

### Example

```ts
await twitch.predictions.end({ id: predictionId, status: "LOCKED" });
await twitch.predictions.end({ id: predictionId, status: "RESOLVED", winning_outcome_id: outcomeId });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#end-prediction)
