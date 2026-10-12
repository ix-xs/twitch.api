---
title: twitch.streams
description: "Streams: who is live, stream keys and markers."
sidebar:
  label: streams
---

Every method of `twitch.streams`, with its parameters, what it returns and the token it needs.

## get

```ts nocheck
twitch.streams.get(params?, options?): Paginator<Stream>
```

Lists live streams, most viewers first. Without filters this is every
stream on Twitch. Viewer counts move while you page, so a stream can show
up twice or be skipped.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user_id` | `string \| readonly string[]` | Only streams of these users. Up to 100 IDs. |
| `user_login` | `string \| readonly string[]` | Only streams of these users. Up to 100 login names. |
| `game_id` | `string \| readonly string[]` | Only streams in these categories. Up to 100 IDs. |
| `type` | `"live" \| "all"` | Kind of stream. Twitch defaults to `"all"`. |
| `language` | `string \| readonly string[]` | Only streams in these languages: ISO 639-1 codes, or `"other"`. Up to 100. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `before` | `string` | Cursor of the previous page. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<Stream>`

<details>
<summary>Fields of Stream</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the stream. The VOD of the broadcast can be looked up with it later. |
| `user_id` | `string` | ID of the broadcaster. |
| `user_login` | `string` | Login name of the broadcaster. |
| `user_name` | `string` | Display name of the broadcaster. |
| `game_id` | `string` | ID of the category being streamed. An empty string when none is set. |
| `game_name` | `string` | Name of the category being streamed. An empty string when none is set. |
| `type` | `"" \| "live"` | `"live"`, or an empty string when Twitch hit an error. |
| `title` | `string` | Title of the stream. An empty string when none is set. |
| `tags` | `string[]` | Tags applied to the stream. |
| `viewer_count` | `number` | Number of viewers right now. |
| `started_at` | `string` | When the broadcast started, as an RFC 3339 timestamp. |
| `language` | `string` | Language of the stream: an ISO 639-1 code, or `"other"`. |
| `thumbnail_url` | `string` | URL of a recent frame of the stream. Replace `&#123;width}` and `&#123;height}` with the size you want, in pixels. |
| `tag_ids` | `string[]` | Deprecated. Always empty. Use `tags`. |
| `is_mature` | `boolean` | Deprecated. Always `false`. |

</details>

### Example

```ts
const live = await twitch.streams.get({ user_login: ["twitchdev"] });
for await (const stream of twitch.streams.get({ language: "fr" })) {
  console.log(stream.user_name, stream.viewer_count);
}
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-streams)

## followed

```ts nocheck
twitch.streams.followed(params?, options?): Paginator<Stream>
```

Lists the live streams of the channels a user follows, most viewers first.

**Token:** user, scope `user:read:follows`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | User whose followed channels to check. Defaults to the user making the call. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 100. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<Stream>`

<details>
<summary>Fields of Stream</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the stream. The VOD of the broadcast can be looked up with it later. |
| `user_id` | `string` | ID of the broadcaster. |
| `user_login` | `string` | Login name of the broadcaster. |
| `user_name` | `string` | Display name of the broadcaster. |
| `game_id` | `string` | ID of the category being streamed. An empty string when none is set. |
| `game_name` | `string` | Name of the category being streamed. An empty string when none is set. |
| `type` | `"" \| "live"` | `"live"`, or an empty string when Twitch hit an error. |
| `title` | `string` | Title of the stream. An empty string when none is set. |
| `tags` | `string[]` | Tags applied to the stream. |
| `viewer_count` | `number` | Number of viewers right now. |
| `started_at` | `string` | When the broadcast started, as an RFC 3339 timestamp. |
| `language` | `string` | Language of the stream: an ISO 639-1 code, or `"other"`. |
| `thumbnail_url` | `string` | URL of a recent frame of the stream. Replace `&#123;width}` and `&#123;height}` with the size you want, in pixels. |
| `tag_ids` | `string[]` | Deprecated. Always empty. Use `tags`. |
| `is_mature` | `boolean` | Deprecated. Always `false`. |

</details>

### Example

```ts
const streams = await twitch.streams.followed().all();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-followed-streams)

## key

```ts nocheck
twitch.streams.key(params?, options?): Promise<string>
```

Gets the stream key of a channel. Treat it like a password.

**Token:** user, scope `channel:read:stream_key`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the channel. Defaults to the user making the call. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<string>`

### Example

```ts
const key = await twitch.streams.key();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-stream-key)

## createMarker

```ts nocheck
twitch.streams.createMarker(params?, options?): Promise<StreamMarker>
```

Marks the current position of a live stream. Fails when the channel is
offline, has VODs disabled or is airing a rerun.

**Token:** user, scope `channel:manage:broadcast`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Broadcaster who is live. Defaults to the user making the call. |
| `description` | `string` | Note to attach to the marker, 140 characters at most. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<StreamMarker>`

<details>
<summary>Fields of StreamMarker</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the marker. |
| `created_at` | `string` | When the marker was created, as an RFC 3339 timestamp. |
| `position_seconds` | `number` | Offset of the marker from the start of the stream, in seconds. |
| `description` | `string` | Note attached to the marker. An empty string when there is none. |

</details>

### Example

```ts
const marker = await twitch.streams.createMarker({ description: "Boss fight" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#create-stream-marker)

## markers

```ts nocheck
twitch.streams.markers(params, options?): Paginator<StreamMarkerGroup>
```

Lists the markers of a user's most recent video, or of a given video.

**Token:** user, scope `user:read:broadcast` or `channel:manage:broadcast`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Reads the markers of this user's most recent video. |
| `video_id` | `string` | Reads the markers of this video. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `before` | `string` | Cursor of the previous page. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<StreamMarkerGroup>`

<details>
<summary>Fields of StreamMarkerGroup</summary>

| Name | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the user who created the markers. |
| `user_name` | `string` | Display name of that user. |
| `user_login` | `string` | Login name of that user. |
| `videos` | `{ video_id: string; markers: VideoStreamMarker[]; }[]` | Videos that contain markers. Holds a single video. |

</details>

### Example

```ts
const [group] = (await twitch.streams.markers({ video_id: "1234567890" })).data;
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-stream-markers)
