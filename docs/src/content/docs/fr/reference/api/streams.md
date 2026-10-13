---
title: twitch.streams
description: "Streams : qui est en direct, clés de stream et marqueurs."
sidebar:
  label: streams
---

Toutes les méthodes de `twitch.streams`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## get

```ts nocheck
twitch.streams.get(params?, options?): Paginator<Stream>
```

Liste les streams en direct, en commençant par ceux qui ont le plus de spectateurs. Sans filtre, ce sont tous les streams de Twitch. Les nombres de spectateurs bougent pendant que vous parcourez les pages : un stream peut donc apparaître deux fois ou être sauté.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string \| readonly string[]` | Uniquement les streams de ces utilisateurs. Jusqu'à 100 identifiants. |
| `user_login` | `string \| readonly string[]` | Uniquement les streams de ces utilisateurs. Jusqu'à 100 noms de connexion. |
| `game_id` | `string \| readonly string[]` | Uniquement les streams de ces catégories. Jusqu'à 100 identifiants. |
| `type` | `"live" \| "all"` | Type de stream. Twitch prend `"all"` par défaut. |
| `language` | `string \| readonly string[]` | Uniquement les streams dans ces langues : des codes ISO 639-1, ou `"other"`. Jusqu'à 100. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `before` | `string` | Curseur de la page précédente. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Stream>`

<details>
<summary>Champs de Stream</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du stream. Il permet de retrouver plus tard la rediffusion correspondante. |
| `user_id` | `string` | Identifiant du diffuseur. |
| `user_login` | `string` | Nom de connexion du diffuseur. |
| `user_name` | `string` | Nom d'affichage du diffuseur. |
| `game_id` | `string` | Identifiant de la catégorie en cours de diffusion. Une chaîne vide quand aucune n'est définie. |
| `game_name` | `string` | Nom de la catégorie en cours de diffusion. Une chaîne vide quand aucune n'est définie. |
| `type` | `"" \| "live"` | `"live"`, ou une chaîne vide quand Twitch a rencontré une erreur. |
| `title` | `string` | Titre du stream. Une chaîne vide quand aucun n'est défini. |
| `tags` | `string[]` | Tags appliqués au stream. |
| `viewer_count` | `number` | Nombre de spectateurs en ce moment. |
| `started_at` | `string` | Début de la diffusion, sous forme d'horodatage RFC 3339. |
| `language` | `string` | Langue du stream : un code ISO 639-1, ou `"other"`. |
| `thumbnail_url` | `string` | URL d'une image récente du stream. Remplacez `&#123;width}` et `&#123;height}` par la taille voulue, en pixels. |
| `tag_ids` | `string[]` | Obsolète. Toujours vide. Utilisez `tags`. |
| `is_mature` | `boolean` | Obsolète. Toujours `false`. |

</details>

### Exemple

```ts
const live = await twitch.streams.get({ user_login: ["twitchdev"] });
for await (const stream of twitch.streams.get({ language: "fr" })) {
  console.log(stream.user_name, stream.viewer_count);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-streams)

## followed

```ts nocheck
twitch.streams.followed(params?, options?): Paginator<Stream>
```

Liste les streams en direct des chaînes que suit un utilisateur, en commençant par ceux qui ont le plus de spectateurs.

**Jeton :** utilisateur, scope `user:read:follows`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Utilisateur dont on consulte les chaînes suivies. Par défaut, l'utilisateur qui fait l'appel. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 100 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Stream>`

<details>
<summary>Champs de Stream</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du stream. Il permet de retrouver plus tard la rediffusion correspondante. |
| `user_id` | `string` | Identifiant du diffuseur. |
| `user_login` | `string` | Nom de connexion du diffuseur. |
| `user_name` | `string` | Nom d'affichage du diffuseur. |
| `game_id` | `string` | Identifiant de la catégorie en cours de diffusion. Une chaîne vide quand aucune n'est définie. |
| `game_name` | `string` | Nom de la catégorie en cours de diffusion. Une chaîne vide quand aucune n'est définie. |
| `type` | `"" \| "live"` | `"live"`, ou une chaîne vide quand Twitch a rencontré une erreur. |
| `title` | `string` | Titre du stream. Une chaîne vide quand aucun n'est défini. |
| `tags` | `string[]` | Tags appliqués au stream. |
| `viewer_count` | `number` | Nombre de spectateurs en ce moment. |
| `started_at` | `string` | Début de la diffusion, sous forme d'horodatage RFC 3339. |
| `language` | `string` | Langue du stream : un code ISO 639-1, ou `"other"`. |
| `thumbnail_url` | `string` | URL d'une image récente du stream. Remplacez `&#123;width}` et `&#123;height}` par la taille voulue, en pixels. |
| `tag_ids` | `string[]` | Obsolète. Toujours vide. Utilisez `tags`. |
| `is_mature` | `boolean` | Obsolète. Toujours `false`. |

</details>

### Exemple

```ts
const streams = await twitch.streams.followed().all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-followed-streams)

## key

```ts nocheck
twitch.streams.key(params?, options?): Promise<string>
```

Renvoie la clé de stream d'une chaîne. Traitez-la comme un mot de passe.

**Jeton :** utilisateur, scope `channel:read:stream_key`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient la chaîne. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<string>`

### Exemple

```ts
const key = await twitch.streams.key();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-stream-key)

## createMarker

```ts nocheck
twitch.streams.createMarker(params?, options?): Promise<StreamMarker>
```

Marque la position actuelle d'un stream en direct. Échoue quand la chaîne est hors ligne, ne conserve pas les enregistrements de ses streams ou diffuse une rediffusion.

**Jeton :** utilisateur, scope `channel:manage:broadcast`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Diffuseur en direct. Par défaut, l'utilisateur qui fait l'appel. |
| `description` | `string` | Note à associer au marqueur, 140 caractères au plus. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<StreamMarker>`

<details>
<summary>Champs de StreamMarker</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du marqueur. |
| `created_at` | `string` | Date de création du marqueur, sous forme d'horodatage RFC 3339. |
| `position_seconds` | `number` | Position du marqueur depuis le début du stream, en secondes. |
| `description` | `string` | Note associée au marqueur. Une chaîne vide quand il n'y en a pas. |

</details>

### Exemple

```ts
const marker = await twitch.streams.createMarker({ description: "Boss fight" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-stream-marker)

## markers

```ts nocheck
twitch.streams.markers(params, options?): Paginator<StreamMarkerGroup>
```

Liste les marqueurs de la vidéo la plus récente d'un utilisateur, ou d'une vidéo donnée.

**Jeton :** utilisateur, scope `user:read:broadcast` ou `channel:manage:broadcast`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Lit les marqueurs de la vidéo la plus récente de cet utilisateur. |
| `video_id` | `string` | Lit les marqueurs de cette vidéo. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `before` | `string` | Curseur de la page précédente. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<StreamMarkerGroup>`

<details>
<summary>Champs de StreamMarkerGroup</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant de l'utilisateur qui a créé les marqueurs. |
| `user_name` | `string` | Nom d'affichage de cet utilisateur. |
| `user_login` | `string` | Nom de connexion de cet utilisateur. |
| `videos` | `{ video_id: string; markers: VideoStreamMarker[]; }[]` | Vidéos qui contiennent des marqueurs. Contient une seule vidéo. |

</details>

### Exemple

```ts
const [group] = (await twitch.streams.markers({ video_id: "1234567890" })).data;
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-stream-markers)
