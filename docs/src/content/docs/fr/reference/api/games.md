---
title: twitch.games
description: "Jeux et catégories : les retrouver, lister les plus regardés."
sidebar:
  label: games
---

Toutes les méthodes de `twitch.games`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## top

```ts nocheck
twitch.games.top(params?, options?): Paginator<Game>
```

Liste les catégories qui ont le plus de spectateurs en ce moment, en commençant par les plus regardées.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |
| `before` | `string` | Curseur de la page précédente. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Game>`

<details>
<summary>Champs de Game</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la catégorie. |
| `name` | `string` | Nom de la catégorie. |
| `box_art_url` | `string` | URL de la jaquette. Remplacez `&#123;width}` et `&#123;height}` par la taille voulue, en pixels. |
| `igdb_id` | `string` | Identifiant du jeu sur IGDB. Une chaîne vide quand Twitch ne le connaît pas. |

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

Renvoie des catégories d'après leur identifiant, leur nom exact, leur identifiant IGDB, ou n'importe quelle combinaison des trois. Les catégories qui n'existent pas sont absentes du résultat.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string \| readonly string[]` | Identifiants des catégories à récupérer. Autant que vous voulez : les longues listes sont découpées pour vous. |
| `name` | `string \| readonly string[]` | Noms exacts des catégories à récupérer. Autant que vous voulez : les longues listes sont découpées pour vous. |
| `igdb_id` | `string \| readonly string[]` | Identifiants IGDB des jeux à récupérer. Autant que vous voulez : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Game[]>`

<details>
<summary>Champs de Game</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la catégorie. |
| `name` | `string` | Nom de la catégorie. |
| `box_art_url` | `string` | URL de la jaquette. Remplacez `&#123;width}` et `&#123;height}` par la taille voulue, en pixels. |
| `igdb_id` | `string` | Identifiant du jeu sur IGDB. Une chaîne vide quand Twitch ne le connaît pas. |

</details>

### Exemple

```ts
const [game] = await twitch.games.get({ name: "Fortnite" });
const games = await twitch.games.get({ id: ["33214", "509658"] });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-games)
