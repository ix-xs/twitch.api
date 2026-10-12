---
title: twitch.clips
description: "Clips: create, look up and download clips."
sidebar:
  label: clips
---

Toutes les méthodes de `twitch.clips`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## create

```ts nocheck
twitch.clips.create(params, options?): Promise<CreatedClip>
```

Clips the last seconds of a live stream. The clip is made in the
background: look it up with `get` to know when it is ready,
and consider it failed when it is still missing after 60 seconds.

**Jeton:** user, scope `clips:edit`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose live stream to clip. |
| `title` | `string` | Title of the clip. Twitch picks one when left out. |
| `duration` | `number` | Length of the clip in seconds, 5 to 60 with one decimal. Twitch defaults to 30. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CreatedClip>`

<details>
<summary>Champs de CreatedClip</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the clip. |
| `edit_url` | `string` | URL of the page where the clip can be trimmed, renamed and published. |

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

Clips a passage of a video, as the broadcaster or one of the channel's
editors. It also works on the video of a stream that is still live.

**Jeton:** app or user, scope `editor:manage:clips` or `channel:manage:clips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `editor_id` | `string` | Editor of the channel who creates the clip, or the broadcaster. Defaults to the user making the call. |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the video. |
| `vod_id` <small>requis</small> | `string` | ID of the video to clip. |
| `vod_offset` <small>requis</small> | `number` | Where the clip ends, in seconds from the start of the video. The clip covers the `duration` seconds before this point, so it cannot be smaller than `duration`. |
| `duration` | `number` | Length of the clip in seconds, 5 to 60 with one decimal. Twitch defaults to 30. |
| `title` <small>requis</small> | `string` | Title of the clip. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CreatedClip>`

<details>
<summary>Champs de CreatedClip</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the clip. |
| `edit_url` | `string` | URL of the page where the clip can be trimmed, renamed and published. |

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

Lists the clips of a broadcaster or of a category, most viewed first, or
gets clips by ID. Twitch stops paging after about 1000 results: narrow the
dates to reach more.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Clips taken from the streams of this broadcaster. |
| `game_id` | `string` | Clips taken from streams in this category. |
| `id` | `string \| readonly string[]` | These clips. Up to 100 IDs. |
| `started_at` | `string \| Date` | Only clips created from this moment on. |
| `ended_at` | `string \| Date` | Only clips created before this moment. Twitch defaults to one week after `started_at`. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `before` | `string` | Cursor of the previous page. |
| `after` | `string` | Cursor of the next page. |
| `is_featured` | `boolean` | `true` for featured clips only, `false` for the others only. Both kinds when left out. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Clip>`

<details>
<summary>Champs de Clip</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the clip. |
| `url` | `string` | URL of the clip page. |
| `embed_url` | `string` | URL to put in an iframe to embed the clip. |
| `broadcaster_id` | `string` | ID of the broadcaster the clip was taken from. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `creator_id` | `string` | ID of the user who made the clip. |
| `creator_name` | `string` | Display name of the user who made the clip. |
| `video_id` | `string` | ID of the video the clip comes from. An empty string when the video is gone. |
| `game_id` | `string` | ID of the category that was being streamed. |
| `language` | `string` | Language of the broadcaster: an ISO 639-1 code, or `"other"`. |
| `title` | `string` | Title of the clip. |
| `view_count` | `number` | Number of views. |
| `created_at` | `string` | When the clip was created, as an RFC 3339 timestamp. |
| `thumbnail_url` | `string` | URL of a preview image. |
| `duration` | `number` | Length of the clip in seconds, with one decimal. |
| `vod_offset` | `number \| null` | Where the clip starts in the video, in seconds. `null` when the video is not available, and for the first minutes after a clip is made live. |
| `is_featured` | `boolean` | Whether the broadcaster featured the clip. |

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

Gets temporary links to the video files of clips, as the broadcaster or
one of the channel's editors.

**Jeton:** app or user, scope `editor:manage:clips` or `channel:manage:clips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `editor_id` | `string` | Editor of the channel who asks for the files, or the broadcaster. Defaults to the user making the call. |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the clips. |
| `clip_id` <small>requis</small> | `string \| readonly string[]` | IDs of the clips to download. Any number: long lists are split for you. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ClipDownload[]>`

<details>
<summary>Champs de ClipDownload</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `clip_id` | `string` | ID of the clip. |
| `landscape_download_url` | `string \| null` | URL of the landscape video file, or `null` when there is none. |
| `portrait_download_url` | `string \| null` | URL of the portrait video file, or `null` when there is none. |

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
