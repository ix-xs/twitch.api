---
title: twitch.teams
description: "Équipes : en retrouver une, lister celles d'une chaîne."
sidebar:
  label: teams
---

Toutes les méthodes de `twitch.teams`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## ofChannel

```ts nocheck
twitch.teams.ofChannel(params, options?): Promise<ChannelTeam[]>
```

Liste les équipes dont un diffuseur est membre. La liste est vide quand il n'y en a aucune.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on liste les équipes. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChannelTeam[]>`

<details>
<summary>Champs de ChannelTeam</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `background_image_url` | `string \| null` | URL de l'image d'arrière-plan, ou `null` quand l'équipe n'en a pas. |
| `banner` | `string \| null` | URL de la bannière, ou `null` quand l'équipe n'en a pas. |
| `created_at` | `string` | Date de création de l'équipe, sous forme d'horodatage RFC 3339. |
| `updated_at` | `string` | Date de dernière modification de l'équipe, sous forme d'horodatage RFC 3339. |
| `info` | `string` | Description de l'équipe. Peut contenir du HTML, du Markdown et des sauts de ligne. |
| `thumbnail_url` | `string` | URL du logo de l'équipe. |
| `team_name` | `string` | Nom de l'équipe : celui qui apparaît dans les URL. |
| `team_display_name` | `string` | Nom d'affichage de l'équipe. |
| `id` | `string` | Identifiant de l'équipe. |

</details>

### Exemple

```ts
const teams = await twitch.teams.ofChannel({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-teams)

## get

```ts nocheck
twitch.teams.get(params, options?): Promise<Team | null>
```

Renvoie une équipe et ses membres, d'après son nom ou son identifiant. Se résout avec `null` quand Twitch ne renvoie aucune équipe.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `name` | `string` | Nom de l'équipe. |
| `id` | `string` | Identifiant de l'équipe. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Team \| null>`

<details>
<summary>Champs de Team</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `users` | `TeamMember[]` | Membres de l'équipe. |
| `background_image_url` | `string \| null` | URL de l'image d'arrière-plan, ou `null` quand l'équipe n'en a pas. |
| `banner` | `string \| null` | URL de la bannière, ou `null` quand l'équipe n'en a pas. |
| `created_at` | `string` | Date de création de l'équipe, sous forme d'horodatage RFC 3339. |
| `updated_at` | `string` | Date de dernière modification de l'équipe, sous forme d'horodatage RFC 3339. |
| `info` | `string` | Description de l'équipe. Peut contenir du HTML, du Markdown et des sauts de ligne. |
| `thumbnail_url` | `string` | URL du logo de l'équipe. |
| `team_name` | `string` | Nom de l'équipe : celui qui apparaît dans les URL. |
| `team_display_name` | `string` | Nom d'affichage de l'équipe. |
| `id` | `string` | Identifiant de l'équipe. |

</details>

### Exemple

```ts
const team = await twitch.teams.get({ name: "livecoders" });
console.log(team?.users.length);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-teams)
