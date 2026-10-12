---
title: twitch.ads
description: "Ads: run commercials, read the ad schedule, snooze the next ad."
sidebar:
  label: ads
---

Every method of `twitch.ads`, with its parameters, what it returns and the token it needs.

## startCommercial

```ts nocheck
twitch.ads.startCommercial(params, options?): Promise<CommercialStatus>
```

Starts a commercial break on a channel. The broadcaster must be a partner
or an affiliate and must be live. With an app token, the broadcaster must
have granted the scope to your application.

**Token:** app or user, scope `channel:edit:commercial`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who runs the commercial. Defaults to the user making the call. |
| `length` <small>required</small> | `number` | Wanted length in seconds, 180 at most. The ad that is served can be a little shorter or longer. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<CommercialStatus>`

<details>
<summary>Fields of CommercialStatus</summary>

| Name | Type | Description |
| --- | --- | --- |
| `length` | `number` | Length of the commercial that was requested, in seconds. Capped at 180. |
| `message` | `string` | Tells whether Twitch could serve an ad. Often an empty string. |
| `retry_after` | `number` | Seconds to wait before another commercial can be started. |

</details>

### Example

```ts
const { retry_after } = await twitch.ads.startCommercial({ broadcaster_id: "141981764", length: 60 });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#start-commercial)

## schedule

```ts nocheck
twitch.ads.schedule(params?, options?): Promise<AdSchedule>
```

Gets the ad schedule of a channel: next and last ad, snoozes left and
remaining time without pre-rolls. With an app token, the broadcaster must
have granted the scope to your application.

**Token:** app or user, scope `channel:read:ads`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose schedule to read. Defaults to the user making the call. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<AdSchedule>`

<details>
<summary>Fields of AdSchedule</summary>

| Name | Type | Description |
| --- | --- | --- |
| `snooze_count` | `number` | Number of snoozes the broadcaster has left. |
| `snooze_refresh_at` | `AdTimestamp` | When the broadcaster gets one more snooze. See &#123;@link AdTimestamp}. |
| `next_ad_at` | `AdTimestamp` | When the next ad is due. Empty or `0` when none is scheduled or the channel is offline. See &#123;@link AdTimestamp}. |
| `duration` | `number` | Length of the next ad break, in seconds. |
| `last_ad_at` | `AdTimestamp` | When the last ad break ran. Empty or `0` when there was none or the channel is offline. See &#123;@link AdTimestamp}. |
| `preroll_free_time` | `number` | Seconds left without pre-roll ads. `0` when pre-rolls are being shown. |

</details>

### Example

```ts
const schedule = await twitch.ads.schedule({ broadcaster_id: "141981764" });
console.log(schedule.next_ad_at, schedule.snooze_count);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-ad-schedule)

## snooze

```ts nocheck
twitch.ads.snooze(params?, options?): Promise<AdSnooze>
```

Pushes the next automatic mid-roll ad back by five minutes, at the cost
of one snooze. With an app token, the broadcaster must have granted the
scope to your application.

**Token:** app or user, scope `channel:manage:ads`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose ad to push back. Defaults to the user making the call. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<AdSnooze>`

<details>
<summary>Fields of AdSnooze</summary>

| Name | Type | Description |
| --- | --- | --- |
| `snooze_count` | `number` | Number of snoozes the broadcaster has left. |
| `snooze_refresh_at` | `AdTimestamp` | When the broadcaster gets one more snooze. See &#123;@link AdTimestamp}. |
| `next_ad_at` | `AdTimestamp` | New time of the next ad. See &#123;@link AdTimestamp}. |

</details>

### Example

```ts
const { next_ad_at } = await twitch.ads.snooze({ broadcaster_id: "141981764" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#snooze-next-ad)
