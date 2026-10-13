---
title: twitch.search
description: "Recherche de catégories et de chaînes."
sidebar:
  label: search
---

Toutes les méthodes de `twitch.search`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## categories

```ts nocheck
twitch.search.categories(params, options?): Paginator<CategorySearchResult>
```

Trouve les catégories dont le nom contient tous les mots de la recherche, dans n'importe quel ordre et sans tenir compte de la casse.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `query` <small>requis</small> | `string` | Texte à rechercher. Passez-le tel quel, il est encodé pour l'URL à votre place. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<CategorySearchResult>`

<details>
<summary>Champs de CategorySearchResult</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la catégorie. |
| `name` | `string` | Nom de la catégorie. |
| `box_art_url` | `string` | URL de la jaquette. |

</details>

### Exemple

```ts
const categories = await twitch.search.categories({ query: "fort" }).take(5);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#search-categories)

## channels

```ts nocheck
twitch.search.channels(params, options?): Paginator<ChannelSearchResult>
```

Trouve les chaînes qui ont streamé au cours des six derniers mois. La recherche porte sur le début du nom de connexion ou, avec `live_only`, sur le début du nom du diffuseur et du nom de la catégorie.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `query` <small>requis</small> | `string` | Texte à rechercher. Passez-le tel quel, il est encodé pour l'URL à votre place. |
| `live_only` | `boolean` | `true` pour ne garder que les chaînes en direct. Twitch prend `false` par défaut. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ChannelSearchResult>`

<details>
<summary>Champs de ChannelSearchResult</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_language` | `string` | Langue du diffuseur : un code ISO 639-1, ou `"other"`. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `display_name` | `string` | Nom d'affichage du diffuseur. |
| `game_id` | `string` | Identifiant de la catégorie en cours de diffusion, ou de la dernière diffusée. |
| `game_name` | `string` | Nom de la catégorie en cours de diffusion, ou de la dernière diffusée. |
| `id` | `string` | Identifiant du diffuseur. |
| `is_live` | `boolean` | Indique si la chaîne est en direct en ce moment. |
| `tag_ids` | `string[]` | Obsolète. Toujours vide. Utilisez `tags`. |
| `tags` | `string[]` | Tags appliqués à la chaîne. |
| `thumbnail_url` | `string` | URL de la photo de profil du diffuseur. |
| `title` | `string` | Titre du stream. Une chaîne vide quand aucun n'est défini. |
| `started_at` | `string` | Début du stream, sous forme d'horodatage RFC 3339. Une chaîne vide quand la chaîne est hors ligne. |

</details>

### Exemple

```ts
for await (const channel of twitch.search.channels({ query: "speedrun", live_only: true })) {
  console.log(channel.display_name, channel.title);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#search-channels)
