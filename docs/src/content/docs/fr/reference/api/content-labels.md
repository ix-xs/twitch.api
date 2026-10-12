---
title: twitch.contentLabels
description: "Content classification labels and their localized names."
sidebar:
  label: contentLabels
---

Toutes les méthodes de `twitch.contentLabels`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## list

```ts nocheck
twitch.contentLabels.list(params?, options?): Promise<ContentLabel[]>
```

Lists every content classification label, with its name and description
in the language you ask for.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `locale` | `ContentLabelLocale` | Language of the names and descriptions. Twitch defaults to `"en-US"`. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ContentLabel[]>`

<details>
<summary>Champs de ContentLabel</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the label, such as `"Gambling"`. |
| `description` | `string` | What the label covers, in the requested language. |
| `name` | `string` | Name of the label, in the requested language. |

</details>

### Exemple

```ts
const labels = await twitch.contentLabels.list({ locale: "fr-FR" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-content-classification-labels)
