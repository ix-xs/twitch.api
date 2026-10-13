---
title: twitch.channelPoints
description: "Points de chaîne : récompenses personnalisées et leurs utilisations."
sidebar:
  label: channelPoints
---

Toutes les méthodes de `twitch.channelPoints`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## createReward

```ts nocheck
twitch.channelPoints.createReward(params, options?): Promise<CustomReward>
```

Ajoute une récompense personnalisée à une chaîne. Une chaîne compte 50 récompenses au plus, récompenses désactivées comprises.

**Jeton :** utilisateur, scope `channel:manage:redemptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui reçoit la récompense. Par défaut, l'utilisateur qui fait l'appel. |
| `title` <small>requis</small> | `string` | Titre, 45 caractères au plus. Doit être unique parmi les récompenses de la chaîne. |
| `cost` <small>requis</small> | `number` | Prix en points de chaîne, 1 ou plus. |
| `prompt` | `string` | Texte présenté au spectateur au moment de l'utilisation, 200 caractères au plus. Va de pair avec `is_user_input_required`. |
| `is_enabled` | `boolean` | Indique si les spectateurs peuvent voir la récompense. Twitch prend `true` par défaut. |
| `background_color` | `string` | Couleur de fond sous forme de code hexadécimal, par exemple `"#9147FF"`. |
| `is_user_input_required` | `boolean` | Indique si le spectateur doit saisir un texte en utilisant la récompense. Twitch prend `false` par défaut. |
| `is_max_per_stream_enabled` | `boolean` | Active le plafond défini par `max_per_stream`. Twitch prend `false` par défaut. |
| `max_per_stream` | `number` | Nombre d'utilisations autorisées par stream, 1 ou plus. |
| `is_max_per_user_per_stream_enabled` | `boolean` | Active le plafond défini par `max_per_user_per_stream`. Twitch prend `false` par défaut. |
| `max_per_user_per_stream` | `number` | Nombre d'utilisations autorisées par spectateur et par stream, 1 ou plus. |
| `is_global_cooldown_enabled` | `boolean` | Active le temps d'attente défini par `global_cooldown_seconds`. Twitch prend `false` par défaut. |
| `global_cooldown_seconds` | `number` | Nombre de secondes entre deux utilisations, 1 ou plus. Les spectateurs ne le voient qu'à partir de 60. |
| `should_redemptions_skip_request_queue` | `boolean` | Marque aussitôt les utilisations comme `FULFILLED` au lieu de les mettre en file d'attente. Twitch prend `false` par défaut. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CustomReward>`

<details>
<summary>Champs de CustomReward</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient la récompense. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `id` | `string` | Identifiant de la récompense. |
| `title` | `string` | Titre de la récompense. |
| `prompt` | `string` | Texte présenté au spectateur quand la récompense demande une saisie. |
| `cost` | `number` | Prix en points de chaîne. |
| `image` | `CustomRewardImage \| null` | Icône mise en ligne par le diffuseur, ou `null` quand l'icône par défaut est utilisée. |
| `default_image` | `CustomRewardImage` | Icône que Twitch utilise à défaut. |
| `background_color` | `string` | Couleur de fond sous forme de code hexadécimal, par exemple `"#00E5CB"`. |
| `is_enabled` | `boolean` | Indique si les spectateurs peuvent voir la récompense. |
| `is_user_input_required` | `boolean` | Indique si le spectateur doit saisir un texte en utilisant la récompense. |
| `max_per_stream_setting` | `{ is_enabled: boolean; max_per_stream: number; }` | Plafond d'utilisations au cours d'un même stream. |
| `max_per_user_per_stream_setting` | `{ is_enabled: boolean; max_per_user_per_stream: number; }` | Plafond d'utilisations par spectateur au cours d'un même stream. |
| `global_cooldown_setting` | `{ is_enabled: boolean; global_cooldown_seconds: number; }` | Temps d'attente imposé entre deux utilisations. |
| `is_paused` | `boolean` | Indique si la récompense est en pause. Une récompense en pause ne peut pas être utilisée. |
| `is_in_stock` | `boolean` | Indique si la récompense peut encore être utilisée, compte tenu de ses plafonds. |
| `should_redemptions_skip_request_queue` | `boolean` | Indique si les utilisations sont aussitôt marquées comme `FULFILLED` au lieu d'attendre dans la file. |
| `redemptions_redeemed_current_stream` | `number \| null` | Nombre d'utilisations pendant le stream en cours. `null` quand la chaîne est hors ligne ou que le plafond par stream est désactivé. |
| `cooldown_expires_at` | `string \| null` | Moment où le temps d'attente en cours prend fin, sous forme d'horodatage RFC 3339. `null` quand il n'y en a aucun. |

</details>

### Exemple

```ts
const reward = await twitch.channelPoints.createReward({ title: "Hydrate", cost: 500 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-custom-rewards)

## deleteReward

```ts nocheck
twitch.channelPoints.deleteReward(params, options?): Promise<void>
```

Supprime une récompense personnalisée. Seule l'application qui a créé la récompense peut le faire. Les utilisations qui attendent encore dans la file sont marquées comme honorées.

**Jeton :** utilisateur, scope `channel:manage:redemptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient la récompense. Par défaut, l'utilisateur qui fait l'appel. |
| `id` <small>requis</small> | `string` | Identifiant de la récompense à supprimer. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.channelPoints.deleteReward({ id: "b045196d-9ce7-4a27-a9b9-279ed341ab28" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-custom-reward)

## rewards

```ts nocheck
twitch.channelPoints.rewards(params?, options?): Promise<CustomReward[]>
```

Liste les récompenses personnalisées d'une chaîne, triées par identifiant. Si tous les identifiants demandés se révèlent inconnus, l'appel échoue avec une erreur 404.

**Jeton :** utilisateur, scope `channel:read:redemptions` ou `channel:manage:redemptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on liste les récompenses. Par défaut, l'utilisateur qui fait l'appel. |
| `id` | `string \| readonly string[]` | Uniquement ces récompenses. Autant que vous voulez : les longues listes sont découpées pour vous. |
| `only_manageable_rewards` | `boolean` | Uniquement les récompenses que votre application a créées et qu'elle peut donc gérer. Twitch prend `false` par défaut. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CustomReward[]>`

<details>
<summary>Champs de CustomReward</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient la récompense. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `id` | `string` | Identifiant de la récompense. |
| `title` | `string` | Titre de la récompense. |
| `prompt` | `string` | Texte présenté au spectateur quand la récompense demande une saisie. |
| `cost` | `number` | Prix en points de chaîne. |
| `image` | `CustomRewardImage \| null` | Icône mise en ligne par le diffuseur, ou `null` quand l'icône par défaut est utilisée. |
| `default_image` | `CustomRewardImage` | Icône que Twitch utilise à défaut. |
| `background_color` | `string` | Couleur de fond sous forme de code hexadécimal, par exemple `"#00E5CB"`. |
| `is_enabled` | `boolean` | Indique si les spectateurs peuvent voir la récompense. |
| `is_user_input_required` | `boolean` | Indique si le spectateur doit saisir un texte en utilisant la récompense. |
| `max_per_stream_setting` | `{ is_enabled: boolean; max_per_stream: number; }` | Plafond d'utilisations au cours d'un même stream. |
| `max_per_user_per_stream_setting` | `{ is_enabled: boolean; max_per_user_per_stream: number; }` | Plafond d'utilisations par spectateur au cours d'un même stream. |
| `global_cooldown_setting` | `{ is_enabled: boolean; global_cooldown_seconds: number; }` | Temps d'attente imposé entre deux utilisations. |
| `is_paused` | `boolean` | Indique si la récompense est en pause. Une récompense en pause ne peut pas être utilisée. |
| `is_in_stock` | `boolean` | Indique si la récompense peut encore être utilisée, compte tenu de ses plafonds. |
| `should_redemptions_skip_request_queue` | `boolean` | Indique si les utilisations sont aussitôt marquées comme `FULFILLED` au lieu d'attendre dans la file. |
| `redemptions_redeemed_current_stream` | `number \| null` | Nombre d'utilisations pendant le stream en cours. `null` quand la chaîne est hors ligne ou que le plafond par stream est désactivé. |
| `cooldown_expires_at` | `string \| null` | Moment où le temps d'attente en cours prend fin, sous forme d'horodatage RFC 3339. `null` quand il n'y en a aucun. |

</details>

### Exemple

```ts
const rewards = await twitch.channelPoints.rewards();
const mine = await twitch.channelPoints.rewards({ only_manageable_rewards: true });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-custom-reward)

## redemptions

```ts nocheck
twitch.channelPoints.redemptions(params, options?): Paginator<CustomRewardRedemption>
```

Liste les utilisations d'une récompense personnalisée. Seule l'application qui a créé la récompense peut les lire.

**Jeton :** utilisateur, scope `channel:read:redemptions` ou `channel:manage:redemptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient la récompense. Par défaut, l'utilisateur qui fait l'appel. |
| `reward_id` <small>requis</small> | `string` | Identifiant de la récompense dont on liste les utilisations. |
| `status` | `CustomRewardRedemptionStatus` | Uniquement les utilisations qui ont ce statut. Obligatoire sauf si vous passez `id`. Les utilisations annulées et honorées ne restent listées que quelques jours. |
| `id` | `string \| readonly string[]` | Uniquement ces utilisations. Jusqu'à 50 identifiants. |
| `sort` | `"OLDEST" \| "NEWEST"` | Ordre de tri. Twitch prend `"OLDEST"` par défaut. |
| `first` | `number` | Éléments par page, de 1 à 50. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<CustomRewardRedemption>`

<details>
<summary>Champs de CustomRewardRedemption</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient la récompense. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `id` | `string` | Identifiant de l'utilisation. |
| `user_id` | `string` | Identifiant du spectateur qui a utilisé la récompense. |
| `user_login` | `string` | Nom de connexion du spectateur. |
| `user_name` | `string` | Nom d'affichage du spectateur. |
| `user_input` | `string` | Texte saisi par le spectateur. Une chaîne vide quand la récompense ne demande aucune saisie. |
| `status` | `CustomRewardRedemptionStatus` | Statut actuel de l'utilisation. |
| `redeemed_at` | `string` | Moment où la récompense a été utilisée, sous forme d'horodatage RFC 3339. |
| `reward` | `{ id: string; title: string; prompt: string; cost: number; }` | La récompense utilisée. |

</details>

### Exemple

```ts
const pending = twitch.channelPoints.redemptions({ reward_id: rewardId, status: "UNFULFILLED" });
for await (const redemption of pending) console.log(redemption.user_name, redemption.user_input);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-custom-reward-redemption)

## updateReward

```ts nocheck
twitch.channelPoints.updateReward(params, options?): Promise<CustomReward>
```

Modifie une récompense personnalisée. Seule l'application qui a créé la récompense peut le faire.

**Jeton :** utilisateur, scope `channel:manage:redemptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient la récompense. Par défaut, l'utilisateur qui fait l'appel. |
| `id` <small>requis</small> | `string` | Identifiant de la récompense à modifier. |
| `title` | `string` | Nouveau titre, 45 caractères au plus. Doit être unique parmi les récompenses de la chaîne. |
| `prompt` | `string` | Texte présenté au spectateur au moment de l'utilisation, 200 caractères au plus. Va de pair avec `is_user_input_required`. |
| `cost` | `number` | Nouveau prix en points de chaîne, 1 ou plus. |
| `background_color` | `string` | Couleur de fond sous forme de code hexadécimal, par exemple `"#00E5CB"`. |
| `is_enabled` | `boolean` | Indique si les spectateurs peuvent voir la récompense. |
| `is_user_input_required` | `boolean` | Indique si le spectateur doit saisir un texte en utilisant la récompense. |
| `is_max_per_stream_enabled` | `boolean` | Active ou désactive le plafond défini par `max_per_stream`. |
| `max_per_stream` | `number` | Nombre d'utilisations autorisées par stream, 1 ou plus. |
| `is_max_per_user_per_stream_enabled` | `boolean` | Active ou désactive le plafond défini par `max_per_user_per_stream`. |
| `max_per_user_per_stream` | `number` | Nombre d'utilisations autorisées par spectateur et par stream, 1 ou plus. |
| `is_global_cooldown_enabled` | `boolean` | Active ou désactive le temps d'attente défini par `global_cooldown_seconds`. |
| `global_cooldown_seconds` | `number` | Nombre de secondes entre deux utilisations, de 1 à 604800. Les spectateurs ne le voient qu'à partir de 60. |
| `is_paused` | `boolean` | Met la récompense en pause ou la réactive. Une récompense en pause ne peut pas être utilisée. |
| `should_redemptions_skip_request_queue` | `boolean` | Marque aussitôt les utilisations comme `FULFILLED` au lieu de les mettre en file d'attente. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CustomReward>`

<details>
<summary>Champs de CustomReward</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient la récompense. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `id` | `string` | Identifiant de la récompense. |
| `title` | `string` | Titre de la récompense. |
| `prompt` | `string` | Texte présenté au spectateur quand la récompense demande une saisie. |
| `cost` | `number` | Prix en points de chaîne. |
| `image` | `CustomRewardImage \| null` | Icône mise en ligne par le diffuseur, ou `null` quand l'icône par défaut est utilisée. |
| `default_image` | `CustomRewardImage` | Icône que Twitch utilise à défaut. |
| `background_color` | `string` | Couleur de fond sous forme de code hexadécimal, par exemple `"#00E5CB"`. |
| `is_enabled` | `boolean` | Indique si les spectateurs peuvent voir la récompense. |
| `is_user_input_required` | `boolean` | Indique si le spectateur doit saisir un texte en utilisant la récompense. |
| `max_per_stream_setting` | `{ is_enabled: boolean; max_per_stream: number; }` | Plafond d'utilisations au cours d'un même stream. |
| `max_per_user_per_stream_setting` | `{ is_enabled: boolean; max_per_user_per_stream: number; }` | Plafond d'utilisations par spectateur au cours d'un même stream. |
| `global_cooldown_setting` | `{ is_enabled: boolean; global_cooldown_seconds: number; }` | Temps d'attente imposé entre deux utilisations. |
| `is_paused` | `boolean` | Indique si la récompense est en pause. Une récompense en pause ne peut pas être utilisée. |
| `is_in_stock` | `boolean` | Indique si la récompense peut encore être utilisée, compte tenu de ses plafonds. |
| `should_redemptions_skip_request_queue` | `boolean` | Indique si les utilisations sont aussitôt marquées comme `FULFILLED` au lieu d'attendre dans la file. |
| `redemptions_redeemed_current_stream` | `number \| null` | Nombre d'utilisations pendant le stream en cours. `null` quand la chaîne est hors ligne ou que le plafond par stream est désactivé. |
| `cooldown_expires_at` | `string \| null` | Moment où le temps d'attente en cours prend fin, sous forme d'horodatage RFC 3339. `null` quand il n'y en a aucun. |

</details>

### Exemple

```ts
const reward = await twitch.channelPoints.updateReward({ id: rewardId, is_paused: true });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-custom-reward)

## updateRedemptions

```ts nocheck
twitch.channelPoints.updateRedemptions(params, options?): Promise<CustomRewardRedemption[]>
```

Honore ou annule des utilisations qui attendent encore dans la file, et les renvoie. Seule l'application qui a créé la récompense peut le faire.

**Jeton :** utilisateur, scope `channel:manage:redemptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient la récompense. Par défaut, l'utilisateur qui fait l'appel. |
| `reward_id` <small>requis</small> | `string` | Identifiant de la récompense utilisée. |
| `id` <small>requis</small> | `string \| readonly string[]` | Utilisations à mettre à jour. Jusqu'à 50 identifiants. |
| `status` <small>requis</small> | `"CANCELED" \| "FULFILLED"` | Nouveau statut. `"CANCELED"` rend ses points au spectateur. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CustomRewardRedemption[]>`

<details>
<summary>Champs de CustomRewardRedemption</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient la récompense. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `id` | `string` | Identifiant de l'utilisation. |
| `user_id` | `string` | Identifiant du spectateur qui a utilisé la récompense. |
| `user_login` | `string` | Nom de connexion du spectateur. |
| `user_name` | `string` | Nom d'affichage du spectateur. |
| `user_input` | `string` | Texte saisi par le spectateur. Une chaîne vide quand la récompense ne demande aucune saisie. |
| `status` | `CustomRewardRedemptionStatus` | Statut actuel de l'utilisation. |
| `redeemed_at` | `string` | Moment où la récompense a été utilisée, sous forme d'horodatage RFC 3339. |
| `reward` | `{ id: string; title: string; prompt: string; cost: number; }` | La récompense utilisée. |

</details>

### Exemple

```ts
await twitch.channelPoints.updateRedemptions({
  reward_id: redemption.reward.id,
  id: redemption.id,
  status: "FULFILLED",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-redemption-status)
