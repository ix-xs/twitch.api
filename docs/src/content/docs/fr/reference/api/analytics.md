---
title: twitch.analytics
description: "Analytics: downloadable reports for your extensions and games."
sidebar:
  label: analytics
---

Toutes les méthodes de `twitch.analytics`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## extensions

```ts nocheck
twitch.analytics.extensions(params?, options?): Paginator<ExtensionAnalyticsReport>
```

Lists the reports available for the extensions of the user making the
call. Each one is a link to a CSV file with one row per day of use.

**Jeton:** user, scope `analytics:read:extensions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` | `string` | Only this extension. Without it you get one report per extension the user owns. |
| `type` | `"overview_v2"` | Kind of report. |
| `started_at` | `string \| Date` | First day of the report, at midnight UTC. Goes with `ended_at`: set both or neither. Days before January 31, 2018 are not available. |
| `ended_at` | `string \| Date` | Last day of the report, at midnight UTC, included. Twitch pulls it back when it is too recent, since data takes up to two days to arrive. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20, and never sends more than 20 whatever you ask. |
| `after` | `string` | Cursor of the next page. Ignored when `extension_id` is set. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ExtensionAnalyticsReport>`

<details>
<summary>Champs de ExtensionAnalyticsReport</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` | `string` | ID of the extension the report is about. |
| `URL` | `string` | URL of the CSV file. It stops working after 5 minutes. |
| `type` | `"overview_v2"` | Kind of report. |
| `date_range` | `AnalyticsDateRange` | The days the report covers. |

</details>

### Exemple

```ts
const reports = await twitch.analytics.extensions().all();
for (const report of reports) console.log(report.extension_id, report.URL);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-extension-analytics)

## games

```ts nocheck
twitch.analytics.games(params?, options?): Paginator<GameAnalyticsReport>
```

Lists the reports available for the games of the user making the call.
Each one is a link to a CSV file with one row per day. A game needs at
least 5 hours of broadcast over the period to get a report.

**Jeton:** user, scope `analytics:read:games`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `game_id` | `string` | Only this game. Without it you get one report per game the user owns. |
| `type` | `"overview_v2"` | Kind of report. |
| `started_at` | `string \| Date` | First day of the report, at midnight UTC. Goes with `ended_at`: set both or neither. Days older than one year are not available. |
| `ended_at` | `string \| Date` | Last day of the report, at midnight UTC, included. Twitch pulls it back when it is too recent, since data takes up to two days to arrive. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20, and never sends more than 20 whatever you ask. |
| `after` | `string` | Cursor of the next page. Ignored when `game_id` is set. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<GameAnalyticsReport>`

<details>
<summary>Champs de GameAnalyticsReport</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `game_id` | `string` | ID of the game the report is about. |
| `URL` | `string` | URL of the CSV file. It stops working after 5 minutes. |
| `type` | `"overview_v2"` | Kind of report. |
| `date_range` | `AnalyticsDateRange` | The days the report covers. |

</details>

### Exemple

```ts
const [report] = (await twitch.analytics.games({ game_id: "493057" })).data;
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-game-analytics)
