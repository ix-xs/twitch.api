---
title: twitch.polls
description: "Sondages : créer, lire et clore."
sidebar:
  label: polls
---

Toutes les méthodes de `twitch.polls`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## get

```ts nocheck
twitch.polls.get(params?, options?): Paginator<Poll>
```

Liste les sondages d'une chaîne, du plus récent au plus ancien. Twitch les conserve 90 jours.

**Jeton :** utilisateur, scope `channel:read:polls` ou `channel:manage:polls`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on liste les sondages. Par défaut, l'utilisateur qui fait l'appel. |
| `id` | `string \| readonly string[]` | Uniquement ces sondages. Jusqu'à 20 identifiants. |
| `first` | `number` | Éléments par page, de 1 à 20. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Poll>`

<details>
<summary>Champs de Poll</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du sondage. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui a organisé le sondage. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `title` | `string` | Question posée aux spectateurs, 60 caractères au plus. |
| `choices` | `PollChoice[]` | Choix du sondage, de deux à cinq. |
| `bits_voting_enabled` | `boolean` | Obsolète. Toujours `false`. Le vote avec des Bits n'existe plus. |
| `bits_per_vote` | `number` | Obsolète. Toujours 0. Le vote avec des Bits n'existe plus. |
| `channel_points_voting_enabled` | `boolean` | Indique si les spectateurs peuvent acheter des votes supplémentaires avec des points de chaîne. |
| `channel_points_per_vote` | `number` | Prix d'un vote supplémentaire, en points de chaîne. |
| `status` | `PollStatus` | État du sondage : `ACTIVE` tant qu'il est en cours, `COMPLETED` quand il est arrivé à son terme, `TERMINATED` quand il a été arrêté avant la fin, `ARCHIVED` quand il est masqué sur la chaîne, `MODERATED` quand il a été supprimé, `INVALID` quand Twitch n'a pas pu le déterminer. |
| `duration` | `number` | Durée prévue du sondage, en secondes. |
| `started_at` | `string` | Début du sondage, sous forme d'horodatage RFC 3339. |
| `ended_at` | `string` | Fin du sondage, sous forme d'horodatage RFC 3339. `null` ou absent tant qu'il est en cours. |

</details>

### Exemple

```ts
const latest = await twitch.polls.get().first();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-polls)

## create

```ts nocheck
twitch.polls.create(params, options?): Promise<Poll>
```

Lance un sondage sur une chaîne. Il ouvre aussitôt, et une chaîne ne peut avoir qu'un sondage en cours à la fois.

**Jeton :** utilisateur, scope `channel:manage:polls`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui organise le sondage. Par défaut, l'utilisateur qui fait l'appel. |
| `title` <small>requis</small> | `string` | Question posée aux spectateurs, 60 caractères au plus. |
| `choices` <small>requis</small> | `readonly (string \| { title: string; })[]` | De deux à cinq choix, de 25 caractères au plus chacun. De simples chaînes de caractères conviennent aussi. |
| `duration` <small>requis</small> | `number` | Durée du sondage en secondes, de 15 à 1800. |
| `channel_points_voting_enabled` | `boolean` | Permet aux spectateurs d'acheter des votes supplémentaires avec des points de chaîne. Twitch prend `false` par défaut. |
| `channel_points_per_vote` | `number` | Prix d'un vote supplémentaire en points de chaîne, de 1 à 1000000. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Poll>`

<details>
<summary>Champs de Poll</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du sondage. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui a organisé le sondage. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `title` | `string` | Question posée aux spectateurs, 60 caractères au plus. |
| `choices` | `PollChoice[]` | Choix du sondage, de deux à cinq. |
| `bits_voting_enabled` | `boolean` | Obsolète. Toujours `false`. Le vote avec des Bits n'existe plus. |
| `bits_per_vote` | `number` | Obsolète. Toujours 0. Le vote avec des Bits n'existe plus. |
| `channel_points_voting_enabled` | `boolean` | Indique si les spectateurs peuvent acheter des votes supplémentaires avec des points de chaîne. |
| `channel_points_per_vote` | `number` | Prix d'un vote supplémentaire, en points de chaîne. |
| `status` | `PollStatus` | État du sondage : `ACTIVE` tant qu'il est en cours, `COMPLETED` quand il est arrivé à son terme, `TERMINATED` quand il a été arrêté avant la fin, `ARCHIVED` quand il est masqué sur la chaîne, `MODERATED` quand il a été supprimé, `INVALID` quand Twitch n'a pas pu le déterminer. |
| `duration` | `number` | Durée prévue du sondage, en secondes. |
| `started_at` | `string` | Début du sondage, sous forme d'horodatage RFC 3339. |
| `ended_at` | `string` | Fin du sondage, sous forme d'horodatage RFC 3339. `null` ou absent tant qu'il est en cours. |

</details>

### Exemple

```ts
const poll = await twitch.polls.create({
  title: "Which game next?",
  choices: ["Celeste", "Hades", "Outer Wilds"],
  duration: 120,
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-poll)

## end

```ts nocheck
twitch.polls.end(params, options?): Promise<Poll>
```

Clôt un sondage en cours avant la fin de sa durée et, si vous le demandez, le masque.

**Jeton :** utilisateur, scope `channel:manage:polls`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui organise le sondage. Par défaut, l'utilisateur qui fait l'appel. |
| `id` <small>requis</small> | `string` | Identifiant du sondage à clore. |
| `status` <small>requis</small> | `"TERMINATED" \| "ARCHIVED"` | `"TERMINATED"` laisse les résultats à l'écran, `"ARCHIVED"` masque en plus le sondage. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Poll>`

<details>
<summary>Champs de Poll</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du sondage. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui a organisé le sondage. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `title` | `string` | Question posée aux spectateurs, 60 caractères au plus. |
| `choices` | `PollChoice[]` | Choix du sondage, de deux à cinq. |
| `bits_voting_enabled` | `boolean` | Obsolète. Toujours `false`. Le vote avec des Bits n'existe plus. |
| `bits_per_vote` | `number` | Obsolète. Toujours 0. Le vote avec des Bits n'existe plus. |
| `channel_points_voting_enabled` | `boolean` | Indique si les spectateurs peuvent acheter des votes supplémentaires avec des points de chaîne. |
| `channel_points_per_vote` | `number` | Prix d'un vote supplémentaire, en points de chaîne. |
| `status` | `PollStatus` | État du sondage : `ACTIVE` tant qu'il est en cours, `COMPLETED` quand il est arrivé à son terme, `TERMINATED` quand il a été arrêté avant la fin, `ARCHIVED` quand il est masqué sur la chaîne, `MODERATED` quand il a été supprimé, `INVALID` quand Twitch n'a pas pu le déterminer. |
| `duration` | `number` | Durée prévue du sondage, en secondes. |
| `started_at` | `string` | Début du sondage, sous forme d'horodatage RFC 3339. |
| `ended_at` | `string` | Fin du sondage, sous forme d'horodatage RFC 3339. `null` ou absent tant qu'il est en cours. |

</details>

### Exemple

```ts
const poll = await twitch.polls.end({ id: pollId, status: "TERMINATED" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#end-poll)
