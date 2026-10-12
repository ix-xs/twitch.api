---
title: twitch.schedule
description: "Stream schedule: segments, vacation and the iCalendar feed."
sidebar:
  label: schedule
---

Toutes les méthodes de `twitch.schedule`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## get

```ts nocheck
twitch.schedule.get(params, options?): Paginator<ScheduleSegment, ScheduleResponse>
```

Lists the planned broadcasts of a channel. The broadcaster and vacation
fields come with every page, under `page.raw.data`. Fails with a 404 when
the channel has no schedule.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose schedule to read. |
| `id` | `string \| readonly string[]` | Only these segments. Up to 100 IDs. |
| `start_time` | `string \| Date` | Only segments that start after this moment. Twitch defaults to now. |
| `first` | `number` | Items per page, 1 to 25. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ScheduleSegment, ScheduleResponse>`

<details>
<summary>Champs de ScheduleSegment</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the segment. |
| `start_time` | `string` | When the broadcast starts, as an RFC 3339 timestamp. |
| `end_time` | `string` | When the broadcast ends, as an RFC 3339 timestamp. |
| `title` | `string` | Title of the broadcast. |
| `canceled_until` | `string \| null` | Set when this occurrence of a recurring broadcast was canceled: it then holds the same RFC 3339 timestamp as `end_time`. `null` otherwise. |
| `category` | `ScheduleCategory \| null` | Category planned for the broadcast, or `null` when none was chosen. |
| `is_recurring` | `boolean` | Whether the broadcast repeats every week. `false` for a one-time broadcast. |

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

Gets the schedule of a channel as iCalendar text, ready to be saved as an
`.ics` file. Twitch does not ask for a token here, the client sends its
usual one anyway.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose schedule to export. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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

Plans or cancels the vacation of a channel.

**Jeton:** user, scope `channel:manage:schedule`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the schedule. Defaults to the user making the call. |
| `is_vacation_enabled` | `boolean` | `true` to plan a vacation with the dates below, `false` to cancel the planned one. |
| `vacation_start_time` | `string \| Date` | When the vacation starts. Required when `is_vacation_enabled` is `true`. |
| `vacation_end_time` | `string \| Date` | When the vacation ends. Required when `is_vacation_enabled` is `true`. |
| `timezone` | `string` | Time zone the broadcaster streams from, as an IANA name such as `"Europe/Paris"`. Required when `is_vacation_enabled` is `true`. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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

Adds a one-time or weekly broadcast to the schedule of a channel. Resolves
with the schedule, whose `segments` hold only the new one.

**Jeton:** user, scope `channel:manage:schedule`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the schedule. Defaults to the user making the call. |
| `start_time` <small>requis</small> | `string \| Date` | When the broadcast starts. |
| `timezone` <small>requis</small> | `string` | Time zone of the broadcast, as an IANA name such as `"Europe/Paris"`. |
| `duration` <small>requis</small> | `string` | Length of the broadcast in minutes, written as a string: `"30"` to `"1380"`. |
| `is_recurring` | `boolean` | Whether the broadcast repeats every week. One-time broadcasts are reserved to affiliates and partners. |
| `category_id` | `string` | ID of the category planned for the broadcast. |
| `title` | `string` | Title of the broadcast, 140 characters at most. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Schedule>`

<details>
<summary>Champs de Schedule</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `segments` | `ScheduleSegment[]` | Planned broadcasts. |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the schedule. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `vacation` | `ScheduleVacation \| null` | Planned vacation, or `null` when vacation mode is off. |

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

Changes or cancels a planned broadcast. On a recurring segment, a new
title, category, duration or time zone applies to every occurrence.
Resolves with the schedule, whose `segments` hold only the changed one.

**Jeton:** user, scope `channel:manage:schedule`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the schedule. Defaults to the user making the call. |
| `id` <small>requis</small> | `string` | ID of the segment to change. |
| `start_time` | `string \| Date` | New start. Only affiliates and partners can move a segment, and only a one-time one. |
| `duration` | `string` | New length in minutes, written as a string: `"30"` to `"1380"`. |
| `category_id` | `string` | ID of the new category. |
| `title` | `string` | New title, 140 characters at most. |
| `is_canceled` | `boolean` | `true` to cancel the broadcast. On a recurring segment this cancels the next occurrence, whichever occurrence `id` points to. |
| `timezone` | `string` | New time zone, as an IANA name such as `"Europe/Paris"`. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Schedule>`

<details>
<summary>Champs de Schedule</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `segments` | `ScheduleSegment[]` | Planned broadcasts. |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the schedule. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `vacation` | `ScheduleVacation \| null` | Planned vacation, or `null` when vacation mode is off. |

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

Removes a planned broadcast. Removing a recurring segment removes every
occurrence of it.

**Jeton:** user, scope `channel:manage:schedule`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the schedule. Defaults to the user making the call. |
| `id` <small>requis</small> | `string` | ID of the segment to remove. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.schedule.deleteSegment({ id: segment.id });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-channel-stream-schedule-segment)
