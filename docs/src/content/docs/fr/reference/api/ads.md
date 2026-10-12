---
title: twitch.ads
description: "Ads: run commercials, read the ad schedule, snooze the next ad."
sidebar:
  label: ads
---

Toutes les méthodes de `twitch.ads`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## startCommercial

```ts nocheck
twitch.ads.startCommercial(params, options?): Promise<CommercialStatus>
```

Starts a commercial break on a channel. The broadcaster must be a partner
or an affiliate and must be live. With an app token, the broadcaster must
have granted the scope to your application.

**Jeton:** app or user, scope `channel:edit:commercial`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who runs the commercial. Defaults to the user making the call. |
| `length` <small>requis</small> | `number` | Wanted length in seconds, 180 at most. The ad that is served can be a little shorter or longer. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CommercialStatus>`

<details>
<summary>Champs de CommercialStatus</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `length` | `number` | Length of the commercial that was requested, in seconds. Capped at 180. |
| `message` | `string` | Tells whether Twitch could serve an ad. Often an empty string. |
| `retry_after` | `number` | Seconds to wait before another commercial can be started. |

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

Gets the ad schedule of a channel: next and last ad, snoozes left and
remaining time without pre-rolls. With an app token, the broadcaster must
have granted the scope to your application.

**Jeton:** app or user, scope `channel:read:ads`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose schedule to read. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AdSchedule>`

<details>
<summary>Champs de AdSchedule</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `snooze_count` | `number` | Number of snoozes the broadcaster has left. |
| `snooze_refresh_at` | `AdTimestamp` | When the broadcaster gets one more snooze. See &#123;@link AdTimestamp}. |
| `next_ad_at` | `AdTimestamp` | When the next ad is due. Empty or `0` when none is scheduled or the channel is offline. See &#123;@link AdTimestamp}. |
| `duration` | `number` | Length of the next ad break, in seconds. |
| `last_ad_at` | `AdTimestamp` | When the last ad break ran. Empty or `0` when there was none or the channel is offline. See &#123;@link AdTimestamp}. |
| `preroll_free_time` | `number` | Seconds left without pre-roll ads. `0` when pre-rolls are being shown. |

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

Pushes the next automatic mid-roll ad back by five minutes, at the cost
of one snooze. With an app token, the broadcaster must have granted the
scope to your application.

**Jeton:** app or user, scope `channel:manage:ads`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose ad to push back. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AdSnooze>`

<details>
<summary>Champs de AdSnooze</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `snooze_count` | `number` | Number of snoozes the broadcaster has left. |
| `snooze_refresh_at` | `AdTimestamp` | When the broadcaster gets one more snooze. See &#123;@link AdTimestamp}. |
| `next_ad_at` | `AdTimestamp` | New time of the next ad. See &#123;@link AdTimestamp}. |

</details>

### Exemple

```ts
const { next_ad_at } = await twitch.ads.snooze({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#snooze-next-ad)
