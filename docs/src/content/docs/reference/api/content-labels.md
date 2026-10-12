---
title: twitch.contentLabels
description: "Content classification labels and their localized names."
sidebar:
  label: contentLabels
---

Every method of `twitch.contentLabels`, with its parameters, what it returns and the token it needs.

## list

```ts nocheck
twitch.contentLabels.list(params?, options?): Promise<ContentLabel[]>
```

Lists every content classification label, with its name and description
in the language you ask for.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `locale` | `ContentLabelLocale` | Language of the names and descriptions. Twitch defaults to `"en-US"`. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<ContentLabel[]>`

<details>
<summary>Fields of ContentLabel</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the label, such as `"Gambling"`. |
| `description` | `string` | What the label covers, in the requested language. |
| `name` | `string` | Name of the label, in the requested language. |

</details>

### Example

```ts
const labels = await twitch.contentLabels.list({ locale: "fr-FR" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-content-classification-labels)
