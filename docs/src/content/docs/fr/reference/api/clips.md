---
title: twitch.clips
description: "Clips : créer, retrouver et télécharger."
sidebar:
  label: clips
---

Toutes les méthodes de `twitch.clips`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## create

```ts nocheck
twitch.clips.create(params, options?): Promise<CreatedClip>
```

Met en clip les dernières secondes d'un stream en direct. Le clip est créé en arrière-plan : recherchez-le avec `get` pour savoir quand il est prêt, et considérez qu'il a échoué s'il reste introuvable après 60 secondes.

**Jeton :** utilisateur, scope `clips:edit`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on met en clip le stream en direct. |
| `title` | `string` | Titre du clip. Twitch en choisit un s'il est omis. |
| `duration` | `number` | Durée du clip en secondes, de 5 à 60 avec une décimale. Twitch prend 30 par défaut. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CreatedClip>`

<details>
<summary>Champs de CreatedClip</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du clip. |
| `edit_url` | `string` | URL de la page où le clip peut être raccourci, renommé et publié. |

</details>

### Exemple

```ts
const clip = await twitch.clips.create({ broadcaster_id: "141981764", title: "What a save" });
console.log(clip.edit_url);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-clip)

## createFromVod

```ts nocheck
twitch.clips.createFromVod(params, options?): Promise<CreatedClip>
```

Met en clip un passage d'une vidéo, en tant que diffuseur ou éditeur de la chaîne. Fonctionne aussi sur la vidéo d'un stream encore en direct.

**Jeton :** application ou utilisateur, scope `editor:manage:clips` ou `channel:manage:clips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `editor_id` | `string` | Éditeur de la chaîne qui crée le clip, ou le diffuseur. Par défaut, l'utilisateur qui fait l'appel. |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartient la vidéo. |
| `vod_id` <small>requis</small> | `string` | Identifiant de la vidéo à mettre en clip. |
| `vod_offset` <small>requis</small> | `number` | Point où le clip se termine, en secondes depuis le début de la vidéo. Le clip couvre les `duration` secondes qui précèdent ce point, qui ne peut donc pas être inférieur à `duration`. |
| `duration` | `number` | Durée du clip en secondes, de 5 à 60 avec une décimale. Twitch prend 30 par défaut. |
| `title` <small>requis</small> | `string` | Titre du clip. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CreatedClip>`

<details>
<summary>Champs de CreatedClip</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du clip. |
| `edit_url` | `string` | URL de la page où le clip peut être raccourci, renommé et publié. |

</details>

### Exemple

```ts
const clip = await twitch.clips.createFromVod({
  editor_id: "141981764",
  broadcaster_id: "141981764",
  vod_id: "2301456789",
  vod_offset: 600,
  title: "Opening",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-clip-from-vod)

## get

```ts nocheck
twitch.clips.get(params, options?): Paginator<Clip>
```

Liste les clips d'un diffuseur ou d'une catégorie, du plus vu au moins vu, ou renvoie des clips d'après leur identifiant. Twitch arrête la pagination après environ 1000 résultats : resserrez les dates pour en atteindre davantage.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Clips tirés des streams de ce diffuseur. |
| `game_id` | `string` | Clips tirés de streams de cette catégorie. |
| `id` | `string \| readonly string[]` | Ces clips. Jusqu'à 100 identifiants. |
| `started_at` | `string \| Date` | Uniquement les clips créés à partir de ce moment. |
| `ended_at` | `string \| Date` | Uniquement les clips créés avant ce moment. Par défaut, Twitch prend une semaine après `started_at`. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `before` | `string` | Curseur de la page précédente. |
| `after` | `string` | Curseur de la page suivante. |
| `is_featured` | `boolean` | `true` pour ne garder que les clips mis en avant, `false` pour ne garder que les autres. Les deux si la valeur est omise. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Clip>`

<details>
<summary>Champs de Clip</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du clip. |
| `url` | `string` | URL de la page du clip. |
| `embed_url` | `string` | URL à placer dans une iframe pour intégrer le clip. |
| `broadcaster_id` | `string` | Identifiant du diffuseur chez qui le clip a été pris. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `creator_id` | `string` | Identifiant de l'utilisateur qui a créé le clip. |
| `creator_name` | `string` | Nom d'affichage de l'utilisateur qui a créé le clip. |
| `video_id` | `string` | Identifiant de la vidéo d'où vient le clip. Une chaîne vide quand la vidéo n'existe plus. |
| `game_id` | `string` | Identifiant de la catégorie alors diffusée. |
| `language` | `string` | Langue du diffuseur : un code ISO 639-1, ou `"other"`. |
| `title` | `string` | Titre du clip. |
| `view_count` | `number` | Nombre de vues. |
| `created_at` | `string` | Moment où le clip a été créé, sous forme d'horodatage RFC 3339. |
| `thumbnail_url` | `string` | URL d'une image d'aperçu. |
| `duration` | `number` | Durée du clip en secondes, avec une décimale. |
| `vod_offset` | `number \| null` | Point où le clip commence dans la vidéo, en secondes. `null` quand la vidéo n'est pas disponible, et pendant les premières minutes qui suivent la création d'un clip sur un stream en direct. |
| `is_featured` | `boolean` | Indique si le diffuseur a mis le clip en avant. |

</details>

### Exemple

```ts
const top = await twitch.clips.get({ broadcaster_id: "141981764" }).take(10);
const [clip] = (await twitch.clips.get({ id: "BraveQuietHeronPogChamp" })).data;
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-clips)

## downloads

```ts nocheck
twitch.clips.downloads(params, options?): Promise<ClipDownload[]>
```

Renvoie des liens temporaires vers les fichiers vidéo de clips, en tant que diffuseur ou éditeur de la chaîne.

**Jeton :** application ou utilisateur, scope `editor:manage:clips` ou `channel:manage:clips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `editor_id` | `string` | Éditeur de la chaîne qui demande les fichiers, ou le diffuseur. Par défaut, l'utilisateur qui fait l'appel. |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartiennent les clips. |
| `clip_id` <small>requis</small> | `string \| readonly string[]` | Identifiants des clips à télécharger. Autant que vous voulez : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ClipDownload[]>`

<details>
<summary>Champs de ClipDownload</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `clip_id` | `string` | Identifiant du clip. |
| `landscape_download_url` | `string \| null` | URL du fichier vidéo au format paysage, ou `null` quand il n'y en a pas. |
| `portrait_download_url` | `string \| null` | URL du fichier vidéo au format portrait, ou `null` quand il n'y en a pas. |

</details>

### Exemple

```ts
const [file] = await twitch.clips.downloads({
  editor_id: "141981764",
  broadcaster_id: "141981764",
  clip_id: "BraveQuietHeronPogChamp",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-clips-download)
