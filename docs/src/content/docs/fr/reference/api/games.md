---
title: twitch.games
description: "Games and categories: look them up, list the most watched."
sidebar:
  label: games
---

Toutes les méthodes de `twitch.games`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## top

```ts nocheck
twitch.games.top(params?, options?): Paginator<Game>
```

Lists the categories with the most viewers right now, most watched first.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |
| `before` | `string` | Cursor of the previous page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Game>`

<details>
<summary>Champs de Game</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the category. |
| `name` | `string` | Name of the category. |
| `box_art_url` | `string` | URL of the box art. Replace `&#123;width}` and `&#123;height}` with the size you want, in pixels. |
| `igdb_id` | `string` | ID of the game on IGDB. An empty string when Twitch does not know it. |

</details>

### Exemple

```ts
const top = await twitch.games.top().take(10);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-top-games)

## get

```ts nocheck
twitch.games.get(params, options?): Promise<Game[]>
```

Gets categories by ID, by exact name, by IGDB ID, or any mix of them.
Categories that do not exist are left out of the result.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string \| readonly string[]` | IDs of the categories to get. Any number: long lists are split for you. |
| `name` | `string \| readonly string[]` | Exact names of the categories to get. Any number: long lists are split for you. |
| `igdb_id` | `string \| readonly string[]` | IGDB IDs of the games to get. Any number: long lists are split for you. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Game[]>`

<details>
<summary>Champs de Game</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the category. |
| `name` | `string` | Name of the category. |
| `box_art_url` | `string` | URL of the box art. Replace `&#123;width}` and `&#123;height}` with the size you want, in pixels. |
| `igdb_id` | `string` | ID of the game on IGDB. An empty string when Twitch does not know it. |

</details>

### Exemple

```ts
const [game] = await twitch.games.get({ name: "Fortnite" });
const games = await twitch.games.get({ id: ["33214", "509658"] });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-games)
