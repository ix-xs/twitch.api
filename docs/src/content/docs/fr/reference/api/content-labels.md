---
title: twitch.contentLabels
description: "Étiquettes de classification du contenu et leurs noms traduits."
sidebar:
  label: contentLabels
---

Toutes les méthodes de `twitch.contentLabels`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## list

```ts nocheck
twitch.contentLabels.list(params?, options?): Promise<ContentLabel[]>
```

Liste toutes les étiquettes de classification du contenu, avec leur nom et leur description dans la langue demandée.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `locale` | `ContentLabelLocale` | Langue des noms et des descriptions. Twitch prend `"en-US"` par défaut. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ContentLabel[]>`

<details>
<summary>Champs de ContentLabel</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'étiquette, par exemple `"Gambling"`. |
| `description` | `string` | Ce que couvre l'étiquette, dans la langue demandée. |
| `name` | `string` | Nom de l'étiquette, dans la langue demandée. |

</details>

### Exemple

```ts
const labels = await twitch.contentLabels.list({ locale: "fr-FR" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-content-classification-labels)
