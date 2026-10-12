---
title: twitch.videos
description: "Videos: VODs, highlights and uploads."
sidebar:
  label: videos
---

Every method of `twitch.videos`, with its parameters, what it returns and the token it needs.

## get

```ts nocheck
twitch.videos.get(params, options?): Paginator<Video>
```

Gets videos by ID, or lists the videos of a user or of a category. The
filters only apply when listing by user or by category.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string \| readonly string[]` | These videos. Up to 100 IDs. |
| `user_id` | `string` | Videos of this user. |
| `game_id` | `string` | Videos in this category. Twitch returns 500 of them at most. |
| `language` | `string` | Only videos in this language: an ISO 639-1 code, or `"other"`. Only with `game_id`. |
| `period` | `"day" \| "week" \| "month" \| "all"` | Only videos published within this period. Twitch defaults to `"all"`. Only with `game_id` or `user_id`. |
| `sort` | `"time" \| "trending" \| "views"` | Order of the results: newest first, fastest growing first or most viewed first. Twitch defaults to `"time"`. Only with `game_id` or `user_id`. |
| `type` | `"archive" \| "highlight" \| "upload" \| "all"` | Only videos of this kind. Twitch defaults to `"all"`. Only with `game_id` or `user_id`. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. Only with `game_id` or `user_id`. |
| `after` | `string` | Cursor of the next page. Only with `user_id`. |
| `before` | `string` | Cursor of the previous page. Only with `user_id`. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<Video>`

<details>
<summary>Fields of Video</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the video. |
| `stream_id` | `string \| null` | ID of the stream the video was recorded from. `null` unless `type` is `"archive"`. |
| `user_id` | `string` | ID of the broadcaster who owns the video. |
| `user_login` | `string` | Login name of the broadcaster. |
| `user_name` | `string` | Display name of the broadcaster. |
| `title` | `string` | Title of the video. |
| `description` | `string` | Description of the video. |
| `created_at` | `string` | When the video was created, as an RFC 3339 timestamp. |
| `published_at` | `string` | When the video was published, as an RFC 3339 timestamp. |
| `url` | `string` | URL of the video page. |
| `thumbnail_url` | `string` | URL of a preview image. Replace `%&#123;width}` and `%&#123;height}` with the size you want, in pixels. Twitch currently only serves 320 by 180. |
| `viewable` | `"public"` | Who can watch the video. Always `"public"`. |
| `view_count` | `number` | Number of views. |
| `language` | `string` | Language of the video: an ISO 639-1 code, or `"other"`. |
| `type` | `"archive" \| "highlight" \| "upload"` | Kind of video: a past broadcast, a highlight or an upload. |
| `duration` | `string` | Length of the video, written like `"3m21s"`. |
| `muted_segments` | `VideoMutedSegment[] \| null` | Passages muted by Twitch, or `null` when there are none. |

</details>

### Example

```ts
const [video] = (await twitch.videos.get({ id: "1234567890" })).data;
for await (const vod of twitch.videos.get({ user_id: "141981764", type: "archive" })) {
  console.log(vod.title, vod.duration);
}
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-videos)

## delete

```ts nocheck
twitch.videos.delete(params, options?): Promise<string[]>
```

Deletes videos and resolves with the IDs that were deleted. Twitch takes
5 IDs per request, so longer lists go out as several requests, one after
the other. Within one request, a single video the user may not delete
keeps all 5 from being deleted.

**Token:** user, scope `channel:manage:videos`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` <small>required</small> | `string \| readonly string[]` | IDs of the videos to delete. Any number: long lists are split for you. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<string[]>`

### Example

```ts
const deleted = await twitch.videos.delete({ id: ["1234567890", "1234567891"] });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#delete-videos)
