---
title: twitch.channels
description: "Chaînes : titre, catégorie et tags, éditeurs, abonnements suivis et followers."
sidebar:
  label: channels
---

Toutes les méthodes de `twitch.channels`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## get

```ts nocheck
twitch.channels.get(params, options?): Promise<ChannelInformation[]>
```

Renvoie le titre, la catégorie, la langue et les tags d'une ou de plusieurs chaînes. Les chaînes qui n'existent pas sont absentes du résultat.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string \| readonly string[]` | Identifiants des diffuseurs à récupérer. Autant que vous voulez : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChannelInformation[]>`

<details>
<summary>Champs de ChannelInformation</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_language` | `string` | Langue de la chaîne : un code ISO 639-1, ou `"other"`. |
| `game_name` | `string` | Nom de la catégorie actuelle ou de la dernière. Une chaîne vide quand la chaîne n'en a jamais eu. |
| `game_id` | `string` | Identifiant de la catégorie actuelle ou de la dernière. Une chaîne vide quand la chaîne n'en a jamais eu. |
| `title` | `string` | Titre du stream en cours ou du dernier. Une chaîne vide quand la chaîne n'a jamais diffusé. |
| `delay` | `number` | Délai du stream en secondes. Reste à `0` sauf si l'appel est fait avec le jeton de ce diffuseur, qui doit être partenaire et avoir réglé un délai. |
| `tags` | `string[]` | Tags appliqués à la chaîne. |
| `content_classification_labels` | `string[]` | Identifiants des étiquettes de classification du contenu appliquées à la chaîne. |
| `is_branded_content` | `boolean` | Indique si la chaîne est signalée comme diffusant du contenu sponsorisé. |

</details>

### Exemple

```ts
const [channel] = await twitch.channels.get({ broadcaster_id: "141981764" });
console.log(channel?.title, channel?.game_name);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-information)

## update

```ts nocheck
twitch.channels.update(params?, options?): Promise<void>
```

Modifie le titre, la catégorie, la langue, les tags, le délai ou les étiquettes de classification du contenu d'une chaîne. Seuls les champs que vous renseignez sont modifiés.

**Jeton :** utilisateur, scope `channel:manage:broadcast`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on met à jour la chaîne. Par défaut, l'utilisateur qui fait l'appel. |
| `game_id` | `string` | Identifiant de la catégorie à définir. `"0"` ou une chaîne vide la retire. |
| `broadcaster_language` | `string` | Langue de la chaîne : un code ISO 639-1, ou `"other"`. |
| `title` | `string` | Titre du stream, 140 caractères au plus. Ne peut pas être vide. |
| `delay` | `number` | Délai du stream en secondes, 900 au plus. Réservé aux partenaires. |
| `tags` | `readonly string[]` | Tags à appliquer, à la place des tags actuels. Jusqu'à 10, de 25 caractères au plus chacun, sans espaces ni caractères spéciaux. Un tableau vide les retire tous. |
| `content_classification_labels` | `readonly ChannelContentLabel[]` | Étiquettes à activer ou à désactiver. Celles que vous omettez gardent leur état actuel. |
| `is_branded_content` | `boolean` | Indique si la chaîne diffuse du contenu sponsorisé. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.channels.update({ title: "Speedrun practice", game_id: "33214", tags: ["Speedrun"] });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#modify-channel-information)

## editors

```ts nocheck
twitch.channels.editors(params?, options?): Promise<ChannelEditor[]>
```

Liste les éditeurs d'une chaîne.

**Jeton :** utilisateur, scope `channel:read:editors`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient la chaîne. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChannelEditor[]>`

<details>
<summary>Champs de ChannelEditor</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant de l'éditeur. |
| `user_name` | `string` | Nom d'affichage de l'éditeur. |
| `created_at` | `string` | Moment où l'utilisateur est devenu éditeur, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const editors = await twitch.channels.editors();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-editors)

## followed

```ts nocheck
twitch.channels.followed(params?, options?): Paginator<FollowedChannel>
```

Liste les chaînes qu'un utilisateur suit, de la plus récemment suivie à la plus ancienne. Avec `broadcaster_id`, indique si l'utilisateur suit cette chaîne en particulier.

**Jeton :** utilisateur, scope `user:read:follows`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Utilisateur dont on liste les chaînes suivies. Par défaut, l'utilisateur qui fait l'appel. |
| `broadcaster_id` | `string` | Uniquement ce diffuseur : la liste contient un élément quand l'utilisateur le suit, aucun sinon. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<FollowedChannel>`

<details>
<summary>Champs de FollowedChannel</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur suivi. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur suivi. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur suivi. |
| `followed_at` | `string` | Moment où l'utilisateur a commencé à suivre la chaîne, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
for await (const follow of twitch.channels.followed()) console.log(follow.broadcaster_name);
const count = await twitch.channels.followed().total();
const follows = (await twitch.channels.followed({ broadcaster_id: "141981764" })).data.length > 0;
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-followed-channels)

## followers

```ts nocheck
twitch.channels.followers(params, options?): Paginator<ChannelFollower>
```

Liste les followers d'une chaîne, du plus récent au plus ancien. La liste elle-même n'est renvoyée qu'au diffuseur ou à l'un de ses modérateurs, avec le scope `moderator:read:followers`. Tout autre jeton reçoit une liste vide, mais obtient quand même le nombre de followers, celui que lit `total()`. Avec `user_id`, indique si cet utilisateur en particulier suit la chaîne.

**Jeton :** application ou utilisateur. Scope `moderator:read:followers` pour obtenir la liste.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on liste les followers. |
| `user_id` | `string` | Uniquement cet utilisateur : la liste contient un élément quand il suit le diffuseur, aucun sinon. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ChannelFollower>`

<details>
<summary>Champs de ChannelFollower</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant du follower. |
| `user_login` | `string` | Nom de connexion du follower. |
| `user_name` | `string` | Nom d'affichage du follower. |
| `followed_at` | `string` | Moment où l'utilisateur a commencé à suivre la chaîne, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const latest = await twitch.channels.followers({ broadcaster_id: "141981764" }).take(10);
const count = await twitch.channels.followers({ broadcaster_id: "141981764" }).total();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-followers)
