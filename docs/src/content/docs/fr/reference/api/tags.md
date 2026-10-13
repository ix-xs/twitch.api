---
title: twitch.tags
description: "Tags de stream (abandonnés par Twitch, conservés par souci d'exhaustivité)."
sidebar:
  label: tags
---

Toutes les méthodes de `twitch.tags`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## all

```ts nocheck
twitch.tags.all(params?, options?): Paginator<StreamTag>
```

**Obsolète.** Twitch a remplacé ces tags par des tags en texte libre en 2023 et cet endpoint n'en renvoie plus aucun.

Liste les tags de stream définis par Twitch.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `tag_id` | `string \| readonly string[]` | Uniquement ces tags. Jusqu'à 100 identifiants. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<StreamTag>`

<details>
<summary>Champs de StreamTag</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `tag_id` | `string` | Identifiant du tag. |
| `is_auto` | `boolean` | Indique si Twitch applique le tag de lui-même. Les diffuseurs ne peuvent pas ajouter un tel tag. |
| `localization_names` | `Record<string, string>` | Nom du tag dans chaque langue. Les clés sont des codes de langue tels que `"en-us"`. |
| `localization_descriptions` | `Record<string, string>` | Description du tag dans chaque langue. Les clés sont des codes de langue tels que `"en-us"`. |

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

**Obsolète.** Twitch a remplacé ces tags par des tags en texte libre en 2023. Lisez plutôt le champ `tags` des informations de la chaîne.

Liste les tags définis par Twitch appliqués à une chaîne.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on liste les tags. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<StreamTag[]>`

<details>
<summary>Champs de StreamTag</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `tag_id` | `string` | Identifiant du tag. |
| `is_auto` | `boolean` | Indique si Twitch applique le tag de lui-même. Les diffuseurs ne peuvent pas ajouter un tel tag. |
| `localization_names` | `Record<string, string>` | Nom du tag dans chaque langue. Les clés sont des codes de langue tels que `"en-us"`. |
| `localization_descriptions` | `Record<string, string>` | Description du tag dans chaque langue. Les clés sont des codes de langue tels que `"en-us"`. |

</details>

### Exemple

```ts
const tags = await twitch.tags.ofChannel({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-stream-tags)
