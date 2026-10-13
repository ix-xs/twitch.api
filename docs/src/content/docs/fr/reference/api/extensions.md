---
title: twitch.extensions
description: "Extensions : configuration, secrets, messages PubSub et de chat, produits Bits."
sidebar:
  label: extensions
---

Toutes les méthodes de `twitch.extensions`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## configuration

```ts nocheck
twitch.extensions.configuration(params, options?): Promise<ExtensionConfigurationSegment[]>
```

Lit un ou plusieurs segments de configuration d'une extension, dans l'ordre où vous les avez demandés. Limité à 20 lectures par minute pour chaque segment.

**Jeton :** JWT d'extension signé, passé avec l'option de requête `token`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension à laquelle appartiennent les segments. |
| `segment` <small>requis</small> | `ExtensionConfigurationSegmentName \| readonly ExtensionConfigurationSegmentName[]` | Segments à lire. Les doublons sont ignorés. |
| `broadcaster_id` | `string` | Diffuseur qui a installé l'extension. Obligatoire pour les segments du diffuseur et du développeur, à omettre quand vous ne lisez que le segment global. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionConfigurationSegment[]>`

<details>
<summary>Champs de ExtensionConfigurationSegment</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `segment` | `ExtensionConfigurationSegmentName` | Le segment dont il s'agit. |
| `broadcaster_id` | `string` | Identifiant du diffuseur auquel appartient le segment. Absent du segment global. |
| `content` | `string` | Contenu du segment : du texte brut, ou du JSON encodé dans une chaîne de caractères. |
| `version` | `string` | Version des données stockées, telle que l'extension l'a choisie. |

</details>

### Exemple

```ts
const [global] = await twitch.extensions.configuration(
  { extension_id, segment: "global" },
  { token: jwt },
);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-extension-configuration-segment)

## setConfiguration

```ts nocheck
twitch.extensions.setConfiguration(params, options?): Promise<void>
```

Écrit un segment de configuration. Les copies de l'extension déjà en cours d'exécution sur une chaîne ne reçoivent pas le nouveau contenu. Limité à 20 écritures par minute.

**Jeton :** JWT d'extension signé, passé avec l'option de requête `token`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension à mettre à jour. |
| `segment` <small>requis</small> | `ExtensionConfigurationSegmentName` | Segment à écrire. |
| `broadcaster_id` | `string` | Diffuseur qui a installé l'extension. Uniquement pour les segments du diffuseur et du développeur. |
| `content` | `string` | Nouveau contenu, 5 ko au plus : du texte brut, ou du JSON encodé dans une chaîne de caractères. |
| `version` | `string` | Version des données à écrire. Sans elle, la plus récente est remplacée. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.extensions.setConfiguration(
  { extension_id, segment: "global", version: "0.0.1", content: JSON.stringify({ theme: "dark" }) },
  { token: jwt },
);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#set-extension-configuration-segment)

## setRequiredConfiguration

```ts nocheck
twitch.extensions.setRequiredConfiguration(params, options?): Promise<void>
```

Définit, pour une chaîne, la chaîne de caractères de configuration requise, dans le cas des extensions que le diffuseur doit configurer avant de pouvoir les activer.

**Jeton :** JWT d'extension signé, passé avec l'option de requête `token`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur qui a installé l'extension sur sa chaîne. |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension à mettre à jour. |
| `extension_version` <small>requis</small> | `string` | Version de l'extension à mettre à jour. |
| `required_configuration` <small>requis</small> | `string` | La chaîne de caractères qui marque la chaîne comme configurée pour cette version. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.extensions.setRequiredConfiguration(
  { broadcaster_id: "141981764", extension_id, extension_version: "0.0.1", required_configuration: "v1" },
  { token: jwt },
);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#set-extension-required-configuration)

## sendPubSub

```ts nocheck
twitch.extensions.sendPubSub(params, options?): Promise<void>
```

Envoie un message aux copies d'une extension en cours d'exécution : sur une chaîne, sur toutes les chaînes, ou pour un seul spectateur. Limité à 100 messages par minute pour chaque chaîne.

**Jeton :** JWT d'extension signé, passé avec l'option de requête `token`. Ses revendications `channel_id` et `pubsub_perms` doivent autoriser les destinataires.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `target` <small>requis</small> | `readonly ExtensionPubSubTarget[]` | Destinataires. `"broadcast"` et `"global"` ne peuvent pas être combinés. |
| `broadcaster_id` | `string` | Chaîne à laquelle envoyer le message. À omettre quand `is_global_broadcast` vaut `true`. |
| `is_global_broadcast` | `boolean` | Envoie le message à toutes les chaînes sur lesquelles l'extension est active. `target` doit alors valoir `["global"]`. Twitch prend `false` par défaut. |
| `message` <small>requis</small> | `string` | Le message, 5 ko au plus : du texte brut, ou du JSON encodé dans une chaîne de caractères. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.extensions.sendPubSub(
  { broadcaster_id: "141981764", target: ["broadcast"], message: JSON.stringify({ round: 2 }) },
  { token: jwt },
);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-extension-pubsub-message)

## liveChannels

```ts nocheck
twitch.extensions.liveChannels(params, options?): Paginator<ExtensionLiveChannel>
```

Liste les chaînes en direct qui ont installé ou activé une extension. Une chaîne peut mettre quelques minutes à apparaître ou à disparaître.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension à rechercher. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ExtensionLiveChannel>`

<details>
<summary>Champs de ExtensionLiveChannel</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `game_name` | `string` | Nom de la catégorie en cours de diffusion. |
| `game_id` | `string` | Identifiant de la catégorie en cours de diffusion. |
| `title` | `string` | Titre du stream. Une chaîne vide quand aucun n'est défini. |

</details>

### Exemple

```ts
for await (const channel of twitch.extensions.liveChannels({ extension_id })) {
  console.log(channel.broadcaster_name, channel.title);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-extension-live-channels)

## secrets

```ts nocheck
twitch.extensions.secrets(params, options?): Promise<ExtensionSecrets>
```

Renvoie les secrets partagés d'une extension.

**Jeton :** JWT d'extension signé, passé avec l'option de requête `token`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension dont on lit les secrets. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionSecrets>`

<details>
<summary>Champs de ExtensionSecrets</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `format_version` | `number` | Version du format de cet objet. |
| `secrets` | `ExtensionSecret[]` | Les secrets. Plusieurs coexistent pendant le déploiement d'un nouveau. |

</details>

### Exemple

```ts
const { secrets } = await twitch.extensions.secrets({ extension_id }, { token: jwt });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-extension-secrets)

## createSecret

```ts nocheck
twitch.extensions.createSecret(params, options?): Promise<ExtensionSecrets>
```

Crée un nouveau secret partagé. Les secrets en cours sont retirés dès que le nouveau devient actif : n'appelez donc cette méthode que lorsque vous êtes prêt à basculer.

**Jeton :** JWT d'extension signé, passé avec l'option de requête `token`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension qui reçoit le nouveau secret. |
| `delay` | `number` | Nombre de secondes à attendre avant que le nouveau secret devienne actif, pour laisser aux copies de l'extension en cours d'exécution le temps de basculer. 300 au moins, ce qui est aussi la valeur par défaut. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionSecrets>`

<details>
<summary>Champs de ExtensionSecrets</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `format_version` | `number` | Version du format de cet objet. |
| `secrets` | `ExtensionSecret[]` | Les secrets. Plusieurs coexistent pendant le déploiement d'un nouveau. |

</details>

### Exemple

```ts
const { secrets } = await twitch.extensions.createSecret({ extension_id, delay: 600 }, { token: jwt });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-extension-secret)

## sendChatMessage

```ts nocheck
twitch.extensions.sendChatMessage(params, options?): Promise<void>
```

Publie un message dans le chat d'une chaîne sous le nom de l'extension. L'extension doit disposer de la capacité de chat. Limité à 12 messages par minute pour chaque chaîne.

**Jeton :** JWT d'extension signé, passé avec l'option de requête `token`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur chez qui l'extension est active, et dont le chat reçoit le message. |
| `text` <small>requis</small> | `string` | Le message, 280 caractères au plus. |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension qui envoie le message. |
| `extension_version` <small>requis</small> | `string` | Version de l'extension. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.extensions.sendChatMessage(
  { broadcaster_id: "141981764", text: "The poll is open.", extension_id, extension_version: "0.0.9" },
  { token: jwt },
);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-extension-chat-message)

## get

```ts nocheck
twitch.extensions.get(params, options?): Promise<ExtensionDetails | null>
```

Renvoie la description d'une extension, publiée ou non. Renvoie `null` quand aucune version n'est indiquée et que l'extension n'a jamais été publiée.

**Jeton :** JWT d'extension signé, passé avec l'option de requête `token`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension à récupérer. |
| `extension_version` | `string` | Version à récupérer. Par défaut, la dernière publiée : il faut donc l'indiquer pour une extension qui n'a jamais été publiée. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionDetails \| null>`

<details>
<summary>Champs de ExtensionDetails</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `author_name` | `string` | Nom de l'utilisateur ou de l'organisation à qui appartient l'extension. |
| `bits_enabled` | `boolean` | Indique si l'extension a des fonctionnalités qui utilisent les Bits. |
| `can_install` | `boolean` | Indique si un utilisateur peut l'installer. Généralement `false` tant qu'elle est testée avec une liste d'autorisation. |
| `configuration_location` | `"none" \| "hosted" \| "custom"` | Emplacement de la configuration : `"hosted"` chez Twitch, `"custom"` sur le backend de l'extension, ou `"none"` quand il n'y a rien à configurer. |
| `description` | `string` | Description longue, affichée sur la page de détails. |
| `eula_tos_url` | `string` | URL des conditions d'utilisation. |
| `has_chat_support` | `boolean` | Indique si l'extension peut écrire dans le chat des chaînes sur lesquelles elle est installée. |
| `icon_url` | `string` | URL de l'icône par défaut. |
| `icon_urls` | `Record<string, string>` | URL de l'icône en plusieurs tailles, indexées par taille, par exemple `"24x24"`. |
| `id` | `string` | Identifiant de l'extension. |
| `name` | `string` | Nom de l'extension. |
| `privacy_policy_url` | `string` | URL de la politique de confidentialité. |
| `request_identity_link` | `boolean` | Indique si l'extension demande aux spectateurs de partager leur identité Twitch. |
| `screenshot_urls` | `string[]` | URL des captures d'écran affichées dans la place de marché. |
| `state` | `ExtensionState` | Étape où se trouve l'extension dans son cycle de validation et de publication. |
| `subscriptions_support_level` | `"none" \| "optional"` | Indique si l'extension peut voir le niveau d'abonnement du spectateur sur la chaîne. |
| `summary` | `string` | Description courte présentée aux streamers dans l'Extension Manager. |
| `support_email` | `string` | Adresse e-mail à laquelle les utilisateurs peuvent écrire pour obtenir de l'aide. |
| `version` | `string` | Numéro de version de l'extension. |
| `viewer_summary` | `string` | Description courte présentée aux spectateurs sur la chaîne. |
| `views` | `ExtensionViews` | Façon dont l'extension s'affiche à chacun des emplacements qu'elle prend en charge. |
| `allowlisted_config_urls` | `string[]` | URL autorisées à afficher la page de configuration. |
| `allowlisted_panel_urls` | `string[]` | URL autorisées à afficher le panneau. |

</details>

### Exemple

```ts
const extension = await twitch.extensions.get({ extension_id, extension_version: "0.0.9" }, { token: jwt });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-extensions)

## released

```ts nocheck
twitch.extensions.released(params, options?): Promise<ExtensionDetails>
```

Renvoie la description d'une extension publiée. Échoue avec une erreur 404 quand l'extension n'existe pas ou n'est pas publiée.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | Identifiant de l'extension à récupérer. |
| `extension_version` | `string` | Version à récupérer. Par défaut, la plus récente. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionDetails>`

<details>
<summary>Champs de ExtensionDetails</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `author_name` | `string` | Nom de l'utilisateur ou de l'organisation à qui appartient l'extension. |
| `bits_enabled` | `boolean` | Indique si l'extension a des fonctionnalités qui utilisent les Bits. |
| `can_install` | `boolean` | Indique si un utilisateur peut l'installer. Généralement `false` tant qu'elle est testée avec une liste d'autorisation. |
| `configuration_location` | `"none" \| "hosted" \| "custom"` | Emplacement de la configuration : `"hosted"` chez Twitch, `"custom"` sur le backend de l'extension, ou `"none"` quand il n'y a rien à configurer. |
| `description` | `string` | Description longue, affichée sur la page de détails. |
| `eula_tos_url` | `string` | URL des conditions d'utilisation. |
| `has_chat_support` | `boolean` | Indique si l'extension peut écrire dans le chat des chaînes sur lesquelles elle est installée. |
| `icon_url` | `string` | URL de l'icône par défaut. |
| `icon_urls` | `Record<string, string>` | URL de l'icône en plusieurs tailles, indexées par taille, par exemple `"24x24"`. |
| `id` | `string` | Identifiant de l'extension. |
| `name` | `string` | Nom de l'extension. |
| `privacy_policy_url` | `string` | URL de la politique de confidentialité. |
| `request_identity_link` | `boolean` | Indique si l'extension demande aux spectateurs de partager leur identité Twitch. |
| `screenshot_urls` | `string[]` | URL des captures d'écran affichées dans la place de marché. |
| `state` | `ExtensionState` | Étape où se trouve l'extension dans son cycle de validation et de publication. |
| `subscriptions_support_level` | `"none" \| "optional"` | Indique si l'extension peut voir le niveau d'abonnement du spectateur sur la chaîne. |
| `summary` | `string` | Description courte présentée aux streamers dans l'Extension Manager. |
| `support_email` | `string` | Adresse e-mail à laquelle les utilisateurs peuvent écrire pour obtenir de l'aide. |
| `version` | `string` | Numéro de version de l'extension. |
| `viewer_summary` | `string` | Description courte présentée aux spectateurs sur la chaîne. |
| `views` | `ExtensionViews` | Façon dont l'extension s'affiche à chacun des emplacements qu'elle prend en charge. |
| `allowlisted_config_urls` | `string[]` | URL autorisées à afficher la page de configuration. |
| `allowlisted_panel_urls` | `string[]` | URL autorisées à afficher le panneau. |

</details>

### Exemple

```ts
const extension = await twitch.extensions.released({ extension_id: "pgn0bjv51epi7eaekt53tovjnc82qo" });
console.log(extension.name, extension.version);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-released-extensions)

## bitsProducts

```ts nocheck
twitch.extensions.bitsProducts(params?, options?): Promise<ExtensionBitsProduct[]>
```

Liste les produits Bits de l'extension à laquelle appartient votre identifiant client, triés par SKU.

**Jeton :** application, émis pour l'identifiant client de l'extension.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `should_include_all` | `boolean` | Liste aussi les produits désactivés et expirés. Twitch prend `false` par défaut. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionBitsProduct[]>`

<details>
<summary>Champs de ExtensionBitsProduct</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `sku` | `string` | SKU du produit, unique au sein de l'extension. |
| `cost` | `ExtensionBitsProductCost` | Prix du produit. |
| `in_development` | `boolean` | Indique si le produit est encore en développement, et donc caché du public. |
| `display_name` | `string` | Nom du produit tel que l'extension l'affiche. |
| `expiration` | `string` | Moment où le produit cesse d'être vendu, sous forme d'horodatage RFC 3339. |
| `is_broadcast` | `boolean` | Indique si un achat est annoncé à toutes les instances de l'extension sur la chaîne. |

</details>

### Exemple

```ts
const products = await twitch.extensions.bitsProducts({ should_include_all: true });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-extension-bits-products)

## updateBitsProduct

```ts nocheck
twitch.extensions.updateBitsProduct(params, options?): Promise<ExtensionBitsProduct>
```

Crée un produit Bits, ou met à jour celui qui porte déjà ce SKU.

**Jeton :** application, émis pour l'identifiant client de l'extension.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `sku` <small>requis</small> | `string` | SKU du produit à créer ou à mettre à jour, 255 caractères au plus : lettres, chiffres, tirets, tirets bas et points. Il ne peut jamais être modifié. |
| `cost` <small>requis</small> | `ExtensionBitsProductCost` | Prix du produit. |
| `display_name` <small>requis</small> | `string` | Nom du produit tel que l'extension l'affiche, 255 caractères au plus. |
| `in_development` | `boolean` | Garde le produit caché du public. Twitch prend `false` par défaut. |
| `expiration` | `string \| Date` | Moment où le produit expire. Jamais, si la valeur est omise. Une date passée le désactive. |
| `is_broadcast` | `boolean` | Annonce les achats à toutes les instances de l'extension sur la chaîne. Twitch prend `false` par défaut. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionBitsProduct>`

<details>
<summary>Champs de ExtensionBitsProduct</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `sku` | `string` | SKU du produit, unique au sein de l'extension. |
| `cost` | `ExtensionBitsProductCost` | Prix du produit. |
| `in_development` | `boolean` | Indique si le produit est encore en développement, et donc caché du public. |
| `display_name` | `string` | Nom du produit tel que l'extension l'affiche. |
| `expiration` | `string` | Moment où le produit cesse d'être vendu, sous forme d'horodatage RFC 3339. |
| `is_broadcast` | `boolean` | Indique si un achat est annoncé à toutes les instances de l'extension sur la chaîne. |

</details>

### Exemple

```ts
const product = await twitch.extensions.updateBitsProduct({
  sku: "rusty-crate",
  cost: { amount: 990, type: "bits" },
  display_name: "Rusty Crate",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-extension-bits-product)
