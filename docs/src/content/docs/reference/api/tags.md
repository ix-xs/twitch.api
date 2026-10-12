---
title: twitch.tags
description: "Stream tags (deprecated by Twitch, kept for completeness)."
sidebar:
  label: tags
---

Every method of `twitch.tags`, with its parameters, what it returns and the token it needs.

## all

```ts nocheck
twitch.tags.all(params?, options?): Paginator<StreamTag>
```

**Deprecated.** Twitch replaced these tags with free text ones in 2023 and
this endpoint no longer returns any.

Lists the stream tags defined by Twitch.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `tag_id` | `string \| readonly string[]` | Only these tags. Up to 100 IDs. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<StreamTag>`

<details>
<summary>Fields of StreamTag</summary>

| Name | Type | Description |
| --- | --- | --- |
| `tag_id` | `string` | ID of the tag. |
| `is_auto` | `boolean` | Whether Twitch applies the tag by itself. Broadcasters cannot add such a tag. |
| `localization_names` | `Record<string, string>` | Name of the tag in each language. Keys are locales such as `"en-us"`. |
| `localization_descriptions` | `Record<string, string>` | Description of the tag in each language. Keys are locales such as `"en-us"`. |

</details>

### Example

```ts
const tags = await twitch.tags.all().all();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-all-stream-tags)

## ofChannel

```ts nocheck
twitch.tags.ofChannel(params, options?): Promise<StreamTag[]>
```

**Deprecated.** Twitch replaced these tags with free text ones in 2023. Read
the `tags` field of the channel information instead.

Lists the Twitch defined tags applied to a channel.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>required</small> | `string` | Broadcaster whose tags to list. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<StreamTag[]>`

<details>
<summary>Fields of StreamTag</summary>

| Name | Type | Description |
| --- | --- | --- |
| `tag_id` | `string` | ID of the tag. |
| `is_auto` | `boolean` | Whether Twitch applies the tag by itself. Broadcasters cannot add such a tag. |
| `localization_names` | `Record<string, string>` | Name of the tag in each language. Keys are locales such as `"en-us"`. |
| `localization_descriptions` | `Record<string, string>` | Description of the tag in each language. Keys are locales such as `"en-us"`. |

</details>

### Example

```ts
const tags = await twitch.tags.ofChannel({ broadcaster_id: "141981764" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-stream-tags)
