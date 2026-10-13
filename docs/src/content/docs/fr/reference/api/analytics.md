---
title: twitch.analytics
description: "Rapports téléchargeables pour vos extensions et vos jeux."
sidebar:
  label: analytics
---

Toutes les méthodes de `twitch.analytics`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## extensions

```ts nocheck
twitch.analytics.extensions(params?, options?): Paginator<ExtensionAnalyticsReport>
```

Liste les rapports disponibles pour les extensions de l'utilisateur qui fait l'appel. Chacun est un lien vers un fichier CSV qui compte une ligne par jour d'utilisation.

**Jeton :** utilisateur, scope `analytics:read:extensions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` | `string` | Uniquement cette extension. Sans lui, vous obtenez un rapport par extension appartenant à l'utilisateur. |
| `type` | `"overview_v2"` | Type de rapport. |
| `started_at` | `string \| Date` | Premier jour du rapport, à minuit UTC. Va de pair avec `ended_at` : renseignez les deux ou aucun. Les jours antérieurs au 31 janvier 2018 ne sont pas disponibles. |
| `ended_at` | `string \| Date` | Dernier jour du rapport, à minuit UTC, inclus. Twitch le ramène en arrière quand il est trop récent, car les données mettent jusqu'à deux jours à arriver. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut, et jamais plus de 20 quoi que vous demandiez. |
| `after` | `string` | Curseur de la page suivante. Ignoré quand `extension_id` est renseigné. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ExtensionAnalyticsReport>`

<details>
<summary>Champs de ExtensionAnalyticsReport</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` | `string` | Identifiant de l'extension sur laquelle porte le rapport. |
| `URL` | `string` | URL du fichier CSV. Elle cesse de fonctionner au bout de 5 minutes. |
| `type` | `"overview_v2"` | Type de rapport. |
| `date_range` | `AnalyticsDateRange` | Les jours couverts par le rapport. |

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

Liste les rapports disponibles pour les jeux de l'utilisateur qui fait l'appel. Chacun est un lien vers un fichier CSV qui compte une ligne par jour. Un jeu doit totaliser au moins 5 heures de diffusion sur la période pour avoir un rapport.

**Jeton :** utilisateur, scope `analytics:read:games`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `game_id` | `string` | Uniquement ce jeu. Sans lui, vous obtenez un rapport par jeu appartenant à l'utilisateur. |
| `type` | `"overview_v2"` | Type de rapport. |
| `started_at` | `string \| Date` | Premier jour du rapport, à minuit UTC. Va de pair avec `ended_at` : renseignez les deux ou aucun. Les jours qui remontent à plus d'un an ne sont pas disponibles. |
| `ended_at` | `string \| Date` | Dernier jour du rapport, à minuit UTC, inclus. Twitch le ramène en arrière quand il est trop récent, car les données mettent jusqu'à deux jours à arriver. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut, et jamais plus de 20 quoi que vous demandiez. |
| `after` | `string` | Curseur de la page suivante. Ignoré quand `game_id` est renseigné. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<GameAnalyticsReport>`

<details>
<summary>Champs de GameAnalyticsReport</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `game_id` | `string` | Identifiant du jeu sur lequel porte le rapport. |
| `URL` | `string` | URL du fichier CSV. Elle cesse de fonctionner au bout de 5 minutes. |
| `type` | `"overview_v2"` | Type de rapport. |
| `date_range` | `AnalyticsDateRange` | Les jours couverts par le rapport. |

</details>

### Exemple

```ts
const [report] = (await twitch.analytics.games({ game_id: "493057" })).data;
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-game-analytics)
