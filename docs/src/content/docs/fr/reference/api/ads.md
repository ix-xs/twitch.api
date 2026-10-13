---
title: twitch.ads
description: "Publicités : lancer une coupure, lire le planning, repousser la prochaine."
sidebar:
  label: ads
---

Toutes les méthodes de `twitch.ads`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## startCommercial

```ts nocheck
twitch.ads.startCommercial(params, options?): Promise<CommercialStatus>
```

Lance une coupure publicitaire sur une chaîne. Le diffuseur doit être partenaire ou affilié, et en direct. Avec un jeton d'application, le diffuseur doit avoir accordé le scope à votre application.

**Jeton :** application ou utilisateur, scope `channel:edit:commercial`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui lance la coupure publicitaire. Par défaut, l'utilisateur qui fait l'appel. |
| `length` <small>requis</small> | `number` | Durée voulue en secondes, 180 au plus. La publicité diffusée peut être un peu plus courte ou un peu plus longue. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CommercialStatus>`

<details>
<summary>Champs de CommercialStatus</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `length` | `number` | Durée de la coupure publicitaire demandée, en secondes. Plafonnée à 180. |
| `message` | `string` | Indique si Twitch a pu diffuser une publicité. Souvent une chaîne vide. |
| `retry_after` | `number` | Secondes à attendre avant de pouvoir lancer une autre coupure publicitaire. |

</details>

### Exemple

```ts
const { retry_after } = await twitch.ads.startCommercial({ broadcaster_id: "141981764", length: 60 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#start-commercial)

## schedule

```ts nocheck
twitch.ads.schedule(params?, options?): Promise<AdSchedule>
```

Renvoie le planning publicitaire d'une chaîne : prochaine et dernière publicité, reports restants et temps restant sans pre-roll. Avec un jeton d'application, le diffuseur doit avoir accordé le scope à votre application.

**Jeton :** application ou utilisateur, scope `channel:read:ads`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on lit le planning. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AdSchedule>`

<details>
<summary>Champs de AdSchedule</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `snooze_count` | `number` | Nombre de reports qu'il reste au diffuseur. |
| `snooze_refresh_at` | `AdTimestamp` | Moment où le diffuseur regagne un report. Voir &#123;@link AdTimestamp}. |
| `next_ad_at` | `AdTimestamp` | Moment prévu pour la prochaine publicité. Vide ou `0` quand aucune n'est programmée ou que la chaîne est hors ligne. Voir &#123;@link AdTimestamp}. |
| `duration` | `number` | Durée de la prochaine coupure publicitaire, en secondes. |
| `last_ad_at` | `AdTimestamp` | Moment de la dernière coupure publicitaire. Vide ou `0` quand il n'y en a pas eu ou que la chaîne est hors ligne. Voir &#123;@link AdTimestamp}. |
| `preroll_free_time` | `number` | Secondes restantes sans publicité pre-roll. `0` quand les pre-rolls sont diffusés. |

</details>

### Exemple

```ts
const schedule = await twitch.ads.schedule({ broadcaster_id: "141981764" });
console.log(schedule.next_ad_at, schedule.snooze_count);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-ad-schedule)

## snooze

```ts nocheck
twitch.ads.snooze(params?, options?): Promise<AdSnooze>
```

Repousse de cinq minutes la prochaine publicité mid-roll automatique, au prix d'un report. Avec un jeton d'application, le diffuseur doit avoir accordé le scope à votre application.

**Jeton :** application ou utilisateur, scope `channel:manage:ads`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on repousse la publicité. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AdSnooze>`

<details>
<summary>Champs de AdSnooze</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `snooze_count` | `number` | Nombre de reports qu'il reste au diffuseur. |
| `snooze_refresh_at` | `AdTimestamp` | Moment où le diffuseur regagne un report. Voir &#123;@link AdTimestamp}. |
| `next_ad_at` | `AdTimestamp` | Nouvelle heure de la prochaine publicité. Voir &#123;@link AdTimestamp}. |

</details>

### Exemple

```ts
const { next_ad_at } = await twitch.ads.snooze({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#snooze-next-ad)
