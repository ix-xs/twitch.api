---
title: twitch.analytics
description: "Analytics: downloadable reports for your extensions and games."
sidebar:
  label: analytics
---

Every method of `twitch.analytics`, with its parameters, what it returns and the token it needs.

## extensions

```ts nocheck
twitch.analytics.extensions(params?, options?): Paginator<ExtensionAnalyticsReport>
```

Lists the reports available for the extensions of the user making the
call. Each one is a link to a CSV file with one row per day of use.

**Token:** user, scope `analytics:read:extensions`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extension_id` | `string` | Only this extension. Without it you get one report per extension the user owns. |
| `type` | `"overview_v2"` | Kind of report. |
| `started_at` | `string \| Date` | First day of the report, at midnight UTC. Goes with `ended_at`: set both or neither. Days before January 31, 2018 are not available. |
| `ended_at` | `string \| Date` | Last day of the report, at midnight UTC, included. Twitch pulls it back when it is too recent, since data takes up to two days to arrive. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20, and never sends more than 20 whatever you ask. |
| `after` | `string` | Cursor of the next page. Ignored when `extension_id` is set. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<ExtensionAnalyticsReport>`

<details>
<summary>Fields of ExtensionAnalyticsReport</summary>

| Name | Type | Description |
| --- | --- | --- |
| `extension_id` | `string` | ID of the extension the report is about. |
| `URL` | `string` | URL of the CSV file. It stops working after 5 minutes. |
| `type` | `"overview_v2"` | Kind of report. |
| `date_range` | `AnalyticsDateRange` | The days the report covers. |

</details>

### Example

```ts
const reports = await twitch.analytics.extensions().all();
for (const report of reports) console.log(report.extension_id, report.URL);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-extension-analytics)

## games

```ts nocheck
twitch.analytics.games(params?, options?): Paginator<GameAnalyticsReport>
```

Lists the reports available for the games of the user making the call.
Each one is a link to a CSV file with one row per day. A game needs at
least 5 hours of broadcast over the period to get a report.

**Token:** user, scope `analytics:read:games`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `game_id` | `string` | Only this game. Without it you get one report per game the user owns. |
| `type` | `"overview_v2"` | Kind of report. |
| `started_at` | `string \| Date` | First day of the report, at midnight UTC. Goes with `ended_at`: set both or neither. Days older than one year are not available. |
| `ended_at` | `string \| Date` | Last day of the report, at midnight UTC, included. Twitch pulls it back when it is too recent, since data takes up to two days to arrive. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20, and never sends more than 20 whatever you ask. |
| `after` | `string` | Cursor of the next page. Ignored when `game_id` is set. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<GameAnalyticsReport>`

<details>
<summary>Fields of GameAnalyticsReport</summary>

| Name | Type | Description |
| --- | --- | --- |
| `game_id` | `string` | ID of the game the report is about. |
| `URL` | `string` | URL of the CSV file. It stops working after 5 minutes. |
| `type` | `"overview_v2"` | Kind of report. |
| `date_range` | `AnalyticsDateRange` | The days the report covers. |

</details>

### Example

```ts
const [report] = (await twitch.analytics.games({ game_id: "493057" })).data;
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-game-analytics)
