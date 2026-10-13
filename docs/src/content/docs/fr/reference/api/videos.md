---
title: twitch.videos
description: "Vidéos : rediffusions, temps forts et mises en ligne."
sidebar:
  label: videos
---

Toutes les méthodes de `twitch.videos`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## get

```ts nocheck
twitch.videos.get(params, options?): Paginator<Video>
```

Renvoie des vidéos d'après leur identifiant, ou liste les vidéos d'un utilisateur ou d'une catégorie. Les filtres ne s'appliquent qu'aux listes par utilisateur ou par catégorie.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string \| readonly string[]` | Ces vidéos. Jusqu'à 100 identifiants. |
| `user_id` | `string` | Vidéos de cet utilisateur. |
| `game_id` | `string` | Vidéos de cette catégorie. Twitch en renvoie 500 au plus. |
| `language` | `string` | Uniquement les vidéos dans cette langue : un code ISO 639-1, ou `"other"`. Uniquement avec `game_id`. |
| `period` | `"day" \| "week" \| "month" \| "all"` | Uniquement les vidéos publiées pendant cette période. Twitch prend `"all"` par défaut. Uniquement avec `game_id` ou `user_id`. |
| `sort` | `"time" \| "trending" \| "views"` | Ordre des résultats : les plus récentes d'abord, celles qui progressent le plus vite d'abord ou les plus vues d'abord. Twitch prend `"time"` par défaut. Uniquement avec `game_id` ou `user_id`. |
| `type` | `"archive" \| "highlight" \| "upload" \| "all"` | Uniquement les vidéos de ce type. Twitch prend `"all"` par défaut. Uniquement avec `game_id` ou `user_id`. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. Uniquement avec `game_id` ou `user_id`. |
| `after` | `string` | Curseur de la page suivante. Uniquement avec `user_id`. |
| `before` | `string` | Curseur de la page précédente. Uniquement avec `user_id`. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Video>`

<details>
<summary>Champs de Video</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la vidéo. |
| `stream_id` | `string \| null` | Identifiant du stream dont la vidéo est l'enregistrement. `null` sauf si `type` vaut `"archive"`. |
| `user_id` | `string` | Identifiant du diffuseur à qui appartient la vidéo. |
| `user_login` | `string` | Nom de connexion du diffuseur. |
| `user_name` | `string` | Nom d'affichage du diffuseur. |
| `title` | `string` | Titre de la vidéo. |
| `description` | `string` | Description de la vidéo. |
| `created_at` | `string` | Date de création de la vidéo, sous forme d'horodatage RFC 3339. |
| `published_at` | `string` | Date de publication de la vidéo, sous forme d'horodatage RFC 3339. |
| `url` | `string` | URL de la page de la vidéo. |
| `thumbnail_url` | `string` | URL d'une image d'aperçu. Remplacez `%&#123;width}` et `%&#123;height}` par la taille voulue, en pixels. Twitch ne sert pour l'instant que du 320 par 180. |
| `viewable` | `"public"` | Qui peut regarder la vidéo. Toujours `"public"`. |
| `view_count` | `number` | Nombre de vues. |
| `language` | `string` | Langue de la vidéo : un code ISO 639-1, ou `"other"`. |
| `type` | `"archive" \| "highlight" \| "upload"` | Type de vidéo : une rediffusion, un temps fort ou une mise en ligne. |
| `duration` | `string` | Durée de la vidéo, écrite sous la forme `"3m21s"`. |
| `muted_segments` | `VideoMutedSegment[] \| null` | Passages rendus muets par Twitch, ou `null` quand il n'y en a pas. |

</details>

### Exemple

```ts
const [video] = (await twitch.videos.get({ id: "1234567890" })).data;
for await (const vod of twitch.videos.get({ user_id: "141981764", type: "archive" })) {
  console.log(vod.title, vod.duration);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-videos)

## delete

```ts nocheck
twitch.videos.delete(params, options?): Promise<string[]>
```

Supprime des vidéos et se résout avec les identifiants supprimés. Twitch accepte 5 identifiants par requête : les listes plus longues partent donc en plusieurs requêtes, l'une après l'autre. Dans une même requête, une seule vidéo que l'utilisateur n'a pas le droit de supprimer empêche la suppression des 5.

**Jeton :** utilisateur, scope `channel:manage:videos`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `id` <small>requis</small> | `string \| readonly string[]` | Identifiants des vidéos à supprimer. Autant que vous voulez : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<string[]>`

### Exemple

```ts
const deleted = await twitch.videos.delete({ id: ["1234567890", "1234567891"] });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-videos)
