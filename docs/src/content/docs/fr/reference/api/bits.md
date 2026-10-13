---
title: twitch.bits
description: "Bits : classement, Cheermotes, Power-ups personnalisés et transactions d'extension."
sidebar:
  label: bits
---

Toutes les méthodes de `twitch.bits`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## leaderboard

```ts nocheck
twitch.bits.leaderboard(params?, options?): Promise<BitsLeaderboard>
```

Renvoie le classement des Bits de la chaîne de l'utilisateur qui fait l'appel, depuis sa création ou sur un jour, une semaine, un mois ou une année donnés.

**Jeton :** utilisateur, scope `bits:read`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `count` | `number` | Nombre d'entrées à renvoyer, de 1 à 100. Twitch en renvoie 10 par défaut. |
| `period` | `"day" \| "week" \| "month" \| "year" \| "all"` | Durée de la période à classer, comptée à l'heure du Pacifique. Twitch prend `"all"` par défaut, soit toute l'existence de la chaîne. |
| `started_at` | `string \| Date` | Un moment situé dans la période à classer. Nécessaire pour toute `period` sauf `"all"`. Twitch le convertit à l'heure du Pacifique avant de retenir le jour, la semaine, le mois ou l'année où il tombe. |
| `user_id` | `string` | Centre le résultat sur cet utilisateur, avec les rangs juste au-dessus et juste en dessous quand `count` le permet. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<BitsLeaderboard>`

<details>
<summary>Champs de BitsLeaderboard</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `data` | `BitsLeaderboardEntry[]` | Utilisateurs classés, du plus gros donateur de Bits au plus petit. Vide quand personne n'a envoyé de Bits. |
| `date_range` | `{ started_at: string; ended_at: string; }` | La période couverte par le classement. Les deux champs sont des chaînes vides quand `started_at` n'a pas été fourni. |
| `total` | `number` | Nombre d'entrées dans `data`. |

</details>

### Exemple

```ts
const top = await twitch.bits.leaderboard({ count: 5 });
for (const entry of top.data) console.log(entry.rank, entry.user_name, entry.score);
const week = await twitch.bits.leaderboard({ period: "week", started_at: new Date() });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-bits-leaderboard)

## cheermotes

```ts nocheck
twitch.bits.cheermotes(params?, options?): Promise<Cheermote[]>
```

Liste les Cheermotes utilisables sur toutes les chaînes, ainsi que les Cheermotes personnalisés d'un diffuseur quand vous en indiquez un.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Inclut aussi les Cheermotes personnalisés de ce diffuseur. Sans lui, seuls les Cheermotes globaux sont renvoyés. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Cheermote[]>`

<details>
<summary>Champs de Cheermote</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `prefix` | `string` | Texte saisi avant le montant. `Cheer` donne `Cheer100`. |
| `tiers` | `CheermoteTier[]` | Paliers du Cheermote, chacun avec ses propres images. |
| `type` | `"global_first_party" \| "global_third_party" \| "channel_custom" \| "display_only" \| "sponsored"` | Origine du Cheermote : Twitch (`global_first_party` dans la carte des Bits, `global_third_party` en dehors), un diffuseur (`channel_custom`) ou un sponsor qui ajoute des Bits en plus (`sponsored`). `display_only` est interne à Twitch. |
| `order` | `number` | Position dans la carte des Bits. Unique au sein d'un même `type` seulement, et pas toujours consécutive. |
| `last_updated` | `string` | Moment de la dernière modification du Cheermote, sous forme d'horodatage RFC 3339. |
| `is_charitable` | `boolean` | Indique si les Bits envoyés avec lui sont complétés par une contribution pendant les collectes caritatives. |

</details>

### Exemple

```ts
const cheermotes = await twitch.bits.cheermotes({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-cheermotes)

## customPowerUps

```ts nocheck
twitch.bits.customPowerUps(params?, options?): Promise<CustomPowerUp[]>
```

Liste les Power-ups personnalisés créés par un diffuseur, activés ou non. Demander des identifiants dont aucun n'existe échoue avec une erreur 404.

**Jeton :** utilisateur, scope `bits:read`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui a créé les Power-ups. Par défaut, l'utilisateur qui fait l'appel. |
| `id` | `string \| readonly string[]` | Uniquement ces Power-ups. En nombre quelconque : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CustomPowerUp[]>`

<details>
<summary>Champs de CustomPowerUp</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `id` | `string` | Identifiant du Power-up. |
| `title` | `string` | Titre du Power-up. |
| `prompt` | `string` | Question posée au spectateur quand `is_user_input_required` vaut `true`. |
| `bits` | `number` | Prix en Bits. |
| `image` | `CustomPowerUpImage \| null` | Images mises en ligne par le diffuseur, ou `null` quand il n'y en a pas. |
| `default_image` | `CustomPowerUpImage` | Images que Twitch utilise à défaut. |
| `background_color` | `string` | Couleur de fond sous forme de code hexadécimal, par exemple `#00E5CB`. |
| `is_enabled` | `boolean` | Indique si le Power-up est activé. Les Power-ups désactivés sont cachés aux spectateurs. |
| `is_user_input_required` | `boolean` | Indique si le spectateur doit saisir un texte en utilisant la récompense. |
| `max_per_stream_setting` | `{ is_enabled: boolean; max_per_stream: number; }` | Plafond d'utilisations par stream. |
| `max_per_user_per_stream_setting` | `{ is_enabled: boolean; max_per_user_per_stream: number; }` | Plafond d'utilisations par spectateur et par stream. |
| `global_cooldown_setting` | `{ is_enabled: boolean; global_cooldown_seconds: number; }` | Pause imposée entre deux utilisations. |
| `is_paused` | `boolean` | Indique si le Power-up est en pause. Les Power-ups en pause ne peuvent pas être utilisés. |
| `is_in_stock` | `boolean` | Indique si le Power-up est en stock. Les Power-ups en rupture de stock ne peuvent pas être utilisés. |
| `redemptions_redeemed_current_stream` | `number \| null` | Utilisations déjà décomptées du plafond par stream, ou `null` quand la chaîne est hors ligne ou que le plafond est désactivé. |
| `cooldown_expires_at` | `string \| null` | Moment où la pause prend fin, sous forme d'horodatage RFC 3339, ou `null` quand aucune n'est en cours. |

</details>

### Exemple

```ts
const powerUps = await twitch.bits.customPowerUps();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-custom-power-up)

## extensionTransactions

```ts nocheck
twitch.bits.extensionTransactions(params, options?): Paginator<ExtensionTransaction>
```

Liste les achats faits en Bits dans une extension. Ne fonctionne qu'avec le jeton d'application de l'extension elle-même.

**Jeton :** application.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension. Ce doit être l'identifiant client pour lequel le jeton d'application a été émis. |
| `id` | `string \| readonly string[]` | Uniquement ces transactions. Jusqu'à 100 identifiants. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ExtensionTransaction>`

<details>
<summary>Champs de ExtensionTransaction</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la transaction. |
| `timestamp` | `string` | Moment où l'achat a été fait, sous forme d'horodatage RFC 3339. |
| `broadcaster_id` | `string` | Identifiant du diffuseur sur la chaîne duquel l'achat a été fait. |
| `broadcaster_login` | `string` | Nom de connexion de ce diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage de ce diffuseur. |
| `user_id` | `string` | Identifiant de l'acheteur. |
| `user_login` | `string` | Nom de connexion de l'acheteur. |
| `user_name` | `string` | Nom d'affichage de l'acheteur. |
| `product_type` | `"BITS_IN_EXTENSION"` | Type de transaction. |
| `product_data` | `{ sku: string; domain: string; cost: { amount: number; type: "bits"; }; inDevelopment: boolean; displayName: string; expiration: string; broadcast: boolean; }` | Le produit acheté. |

</details>

### Exemple

```ts
for await (const transaction of twitch.bits.extensionTransactions({ extension_id: "uo6dggojyb8d6soh92zknwmi5ej1q2" })) {
  console.log(transaction.user_name, transaction.product_data.sku);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-extension-transactions)
