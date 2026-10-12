---
title: twitch.search
description: "Search for categories and channels."
sidebar:
  label: search
---

Every method of `twitch.search`, with its parameters, what it returns and the token it needs.

## categories

```ts nocheck
twitch.search.categories(params, options?): Paginator<CategorySearchResult>
```

Finds the categories whose name contains every word of the query, in any
order and whatever the case.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `query` <small>required</small> | `string` | Text to look for. Pass it as is, it is URL encoded for you. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<CategorySearchResult>`

<details>
<summary>Fields of CategorySearchResult</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the category. |
| `name` | `string` | Name of the category. |
| `box_art_url` | `string` | URL of the box art. |

</details>

### Example

```ts
const categories = await twitch.search.categories({ query: "fort" }).take(5);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#search-categories)

## channels

```ts nocheck
twitch.search.channels(params, options?): Paginator<ChannelSearchResult>
```

Finds channels that streamed in the last six months. The query is matched
against the start of the login name, or with `live_only` against the start
of the broadcaster's name and of the category name.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `query` <small>required</small> | `string` | Text to look for. Pass it as is, it is URL encoded for you. |
| `live_only` | `boolean` | `true` to keep only channels that are live. Twitch defaults to `false`. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<ChannelSearchResult>`

<details>
<summary>Fields of ChannelSearchResult</summary>

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_language` | `string` | Language of the broadcaster: an ISO 639-1 code, or `"other"`. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `display_name` | `string` | Display name of the broadcaster. |
| `game_id` | `string` | ID of the category being streamed, or of the last one that was. |
| `game_name` | `string` | Name of the category being streamed, or of the last one that was. |
| `id` | `string` | ID of the broadcaster. |
| `is_live` | `boolean` | Whether the channel is live right now. |
| `tag_ids` | `string[]` | Deprecated. Always empty. Use `tags`. |
| `tags` | `string[]` | Tags applied to the channel. |
| `thumbnail_url` | `string` | URL of the broadcaster's profile picture. |
| `title` | `string` | Title of the stream. An empty string when none is set. |
| `started_at` | `string` | When the stream started, as an RFC 3339 timestamp. An empty string when the channel is offline. |

</details>

### Example

```ts
for await (const channel of twitch.search.channels({ query: "speedrun", live_only: true })) {
  console.log(channel.display_name, channel.title);
}
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#search-channels)
