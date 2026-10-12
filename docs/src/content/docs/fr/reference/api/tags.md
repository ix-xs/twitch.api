---
title: twitch.tags
description: "Stream tags (deprecated by Twitch, kept for completeness)."
sidebar:
  label: tags
---

Toutes les méthodes de `twitch.tags`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## all

```ts nocheck
twitch.tags.all(params?, options?): Paginator<StreamTag>
```

**Obsolète.** Twitch replaced these tags with free text ones in 2023 and
this endpoint no longer returns any.

Lists the stream tags defined by Twitch.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `tag_id` | `string \| readonly string[]` | Only these tags. Up to 100 IDs. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<StreamTag>`

<details>
<summary>Champs de StreamTag</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `tag_id` | `string` | ID of the tag. |
| `is_auto` | `boolean` | Whether Twitch applies the tag by itself. Broadcasters cannot add such a tag. |
| `localization_names` | `Record<string, string>` | Name of the tag in each language. Keys are locales such as `"en-us"`. |
| `localization_descriptions` | `Record<string, string>` | Description of the tag in each language. Keys are locales such as `"en-us"`. |

</details>

### Exemple

```ts
const tags = await twitch.tags.all().all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-all-stream-tags)

## ofChannel

```ts nocheck
twitch.tags.ofChannel(params, options?): Promise<StreamTag[]>
```

**Obsolète.** Twitch replaced these tags with free text ones in 2023. Read
the `tags` field of the channel information instead.

Lists the Twitch defined tags applied to a channel.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose tags to list. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<StreamTag[]>`

<details>
<summary>Champs de StreamTag</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `tag_id` | `string` | ID of the tag. |
| `is_auto` | `boolean` | Whether Twitch applies the tag by itself. Broadcasters cannot add such a tag. |
| `localization_names` | `Record<string, string>` | Name of the tag in each language. Keys are locales such as `"en-us"`. |
| `localization_descriptions` | `Record<string, string>` | Description of the tag in each language. Keys are locales such as `"en-us"`. |

</details>

### Exemple

```ts
const tags = await twitch.tags.ofChannel({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-stream-tags)
