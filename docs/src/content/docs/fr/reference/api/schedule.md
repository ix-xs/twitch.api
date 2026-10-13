---
title: twitch.schedule
description: "Planning de diffusion : créneaux, vacances et flux iCalendar."
sidebar:
  label: schedule
---

Toutes les méthodes de `twitch.schedule`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## get

```ts nocheck
twitch.schedule.get(params, options?): Paginator<ScheduleSegment, ScheduleResponse>
```

Liste les diffusions prévues d'une chaîne. Les champs du diffuseur et des vacances accompagnent chaque page, sous `page.raw.data`. Échoue avec un 404 quand la chaîne n'a pas de planning.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on lit le planning. |
| `id` | `string \| readonly string[]` | Uniquement ces créneaux. Jusqu'à 100 identifiants. |
| `start_time` | `string \| Date` | Uniquement les créneaux qui commencent après ce moment. Twitch prend l'instant présent par défaut. |
| `first` | `number` | Éléments par page, de 1 à 25. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ScheduleSegment, ScheduleResponse>`

<details>
<summary>Champs de ScheduleSegment</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du créneau. |
| `start_time` | `string` | Début de la diffusion, sous forme d'horodatage RFC 3339. |
| `end_time` | `string` | Fin de la diffusion, sous forme d'horodatage RFC 3339. |
| `title` | `string` | Titre de la diffusion. |
| `canceled_until` | `string \| null` | Renseigné quand cette occurrence d'une diffusion récurrente a été annulée : il contient alors le même horodatage RFC 3339 que `end_time`. `null` sinon. |
| `category` | `ScheduleCategory \| null` | Catégorie prévue pour la diffusion, ou `null` quand aucune n'a été choisie. |
| `is_recurring` | `boolean` | Indique si la diffusion se répète chaque semaine. `false` pour une diffusion ponctuelle. |

</details>

### Exemple

```ts
const page = await twitch.schedule.get({ broadcaster_id: "141981764" });
console.log(page.raw.data.vacation);
for (const segment of page) console.log(segment.start_time, segment.title);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-stream-schedule)

## icalendar

```ts nocheck
twitch.schedule.icalendar(params, options?): Promise<string>
```

Renvoie le planning d'une chaîne sous forme de texte iCalendar, prêt à être enregistré dans un fichier `.ics`. Twitch ne demande pas de jeton ici, le client envoie quand même son jeton habituel.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on exporte le planning. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<string>`

### Exemple

```ts
const ics = await twitch.schedule.icalendar({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-icalendar)

## updateSettings

```ts nocheck
twitch.schedule.updateSettings(params?, options?): Promise<void>
```

Planifie ou annule les vacances d'une chaîne.

**Jeton :** utilisateur, scope `channel:manage:schedule`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient le planning. Par défaut, l'utilisateur qui fait l'appel. |
| `is_vacation_enabled` | `boolean` | `true` pour planifier des vacances aux dates ci-dessous, `false` pour annuler celles qui sont prévues. |
| `vacation_start_time` | `string \| Date` | Début des vacances. Obligatoire quand `is_vacation_enabled` vaut `true`. |
| `vacation_end_time` | `string \| Date` | Fin des vacances. Obligatoire quand `is_vacation_enabled` vaut `true`. |
| `timezone` | `string` | Fuseau horaire dans lequel le diffuseur streame, sous forme de nom IANA tel que `"Europe/Paris"`. Obligatoire quand `is_vacation_enabled` vaut `true`. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.schedule.updateSettings({
  is_vacation_enabled: true,
  vacation_start_time: "2026-08-01T00:00:00Z",
  vacation_end_time: "2026-08-15T00:00:00Z",
  timezone: "Europe/Paris",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-channel-stream-schedule)

## createSegment

```ts nocheck
twitch.schedule.createSegment(params, options?): Promise<Schedule>
```

Ajoute une diffusion ponctuelle ou hebdomadaire au planning d'une chaîne. Se résout avec le planning, dont `segments` ne contient que le nouveau créneau.

**Jeton :** utilisateur, scope `channel:manage:schedule`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient le planning. Par défaut, l'utilisateur qui fait l'appel. |
| `start_time` <small>requis</small> | `string \| Date` | Début de la diffusion. |
| `timezone` <small>requis</small> | `string` | Fuseau horaire de la diffusion, sous forme de nom IANA tel que `"Europe/Paris"`. |
| `duration` <small>requis</small> | `string` | Durée de la diffusion en minutes, écrite sous forme de chaîne : de `"30"` à `"1380"`. |
| `is_recurring` | `boolean` | Indique si la diffusion se répète chaque semaine. Les diffusions ponctuelles sont réservées aux affiliés et aux partenaires. |
| `category_id` | `string` | Identifiant de la catégorie prévue pour la diffusion. |
| `title` | `string` | Titre de la diffusion, 140 caractères au plus. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Schedule>`

<details>
<summary>Champs de Schedule</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `segments` | `ScheduleSegment[]` | Diffusions prévues. |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient le planning. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `vacation` | `ScheduleVacation \| null` | Vacances prévues, ou `null` quand le mode vacances est désactivé. |

</details>

### Exemple

```ts
const schedule = await twitch.schedule.createSegment({
  start_time: "2026-07-01T18:00:00Z",
  timezone: "Europe/Paris",
  duration: "120",
  is_recurring: true,
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-channel-stream-schedule-segment)

## updateSegment

```ts nocheck
twitch.schedule.updateSegment(params, options?): Promise<Schedule>
```

Modifie ou annule une diffusion prévue. Sur un créneau récurrent, le nouveau titre, la nouvelle catégorie, la nouvelle durée ou le nouveau fuseau horaire s'applique à toutes les occurrences. Se résout avec le planning, dont `segments` ne contient que le créneau modifié.

**Jeton :** utilisateur, scope `channel:manage:schedule`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient le planning. Par défaut, l'utilisateur qui fait l'appel. |
| `id` <small>requis</small> | `string` | Identifiant du créneau à modifier. |
| `start_time` | `string \| Date` | Nouveau début. Seuls les affiliés et les partenaires peuvent déplacer un créneau, et seulement un créneau ponctuel. |
| `duration` | `string` | Nouvelle durée en minutes, écrite sous forme de chaîne : de `"30"` à `"1380"`. |
| `category_id` | `string` | Identifiant de la nouvelle catégorie. |
| `title` | `string` | Nouveau titre, 140 caractères au plus. |
| `is_canceled` | `boolean` | `true` pour annuler la diffusion. Sur un créneau récurrent, cela annule la prochaine occurrence, quelle que soit celle que désigne `id`. |
| `timezone` | `string` | Nouveau fuseau horaire, sous forme de nom IANA tel que `"Europe/Paris"`. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Schedule>`

<details>
<summary>Champs de Schedule</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `segments` | `ScheduleSegment[]` | Diffusions prévues. |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient le planning. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `vacation` | `ScheduleVacation \| null` | Vacances prévues, ou `null` quand le mode vacances est désactivé. |

</details>

### Exemple

```ts
await twitch.schedule.updateSegment({ id: segment.id, duration: "90" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-channel-stream-schedule-segment)

## deleteSegment

```ts nocheck
twitch.schedule.deleteSegment(params, options?): Promise<void>
```

Supprime une diffusion prévue. Supprimer un créneau récurrent en supprime toutes les occurrences.

**Jeton :** utilisateur, scope `channel:manage:schedule`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient le planning. Par défaut, l'utilisateur qui fait l'appel. |
| `id` <small>requis</small> | `string` | Identifiant du créneau à supprimer. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.schedule.deleteSegment({ id: segment.id });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-channel-stream-schedule-segment)
