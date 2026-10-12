---
title: twitch.extensions
description: "Extensions: configuration, secrets, PubSub and chat messages, Bits products."
sidebar:
  label: extensions
---

Toutes les méthodes de `twitch.extensions`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## configuration

```ts nocheck
twitch.extensions.configuration(params, options?): Promise<ExtensionConfigurationSegment[]>
```

Reads one or more configuration segments of an extension, in the order
you asked for them. Limited to 20 reads per minute for each segment.

**Jeton:** signed extension JWT, passed with the `token` request option.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | ID of the extension that owns the segments. |
| `segment` <small>requis</small> | `ExtensionConfigurationSegmentName \| readonly ExtensionConfigurationSegmentName[]` | Segments to read. Duplicates are ignored. |
| `broadcaster_id` | `string` | Broadcaster who installed the extension. Required for the broadcaster and developer segments, leave it out when you only read the global one. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionConfigurationSegment[]>`

<details>
<summary>Champs de ExtensionConfigurationSegment</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `segment` | `ExtensionConfigurationSegmentName` | Which segment this is. |
| `broadcaster_id` | `string` | ID of the broadcaster the segment belongs to. Absent on the global segment. |
| `content` | `string` | What the segment holds: plain text, or JSON encoded as a string. |
| `version` | `string` | Version of the stored data, as chosen by the extension. |

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

Writes a configuration segment. Copies of the extension that are already
running on a channel do not get the new content. Limited to 20 writes per
minute.

**Jeton:** signed extension JWT, passed with the `token` request option.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | ID of the extension to update. |
| `segment` <small>requis</small> | `ExtensionConfigurationSegmentName` | Segment to write. |
| `broadcaster_id` | `string` | Broadcaster who installed the extension. Only for the broadcaster and developer segments. |
| `content` | `string` | New content, 5 KB at most: plain text, or JSON encoded as a string. |
| `version` | `string` | Version of the data to write. Without it the latest one is replaced. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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

Sets the required configuration string of a channel, for extensions that
must be configured by the broadcaster before they can be activated.

**Jeton:** signed extension JWT, passed with the `token` request option.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who installed the extension on their channel. |
| `extension_id` <small>requis</small> | `string` | ID of the extension to update. |
| `extension_version` <small>requis</small> | `string` | Version of the extension to update. |
| `required_configuration` <small>requis</small> | `string` | The string that marks the channel as configured for this version. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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

Pushes a message to the running copies of an extension: on one channel,
on every channel, or for a single viewer. Limited to 100 messages per
minute for each channel.

**Jeton:** signed extension JWT, passed with the `token` request option. Its `channel_id` and `pubsub_perms` claims must allow the targets.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `target` <small>requis</small> | `readonly ExtensionPubSubTarget[]` | Recipients. `"broadcast"` and `"global"` cannot be combined. |
| `broadcaster_id` | `string` | Channel to send the message to. Leave it out when `is_global_broadcast` is `true`. |
| `is_global_broadcast` | `boolean` | Sends the message to every channel the extension is active on. `target` must then be `["global"]`. Twitch defaults to `false`. |
| `message` <small>requis</small> | `string` | The message, 5 KB at most: plain text, or JSON encoded as a string. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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

Lists the channels that are live with an extension installed or
activated. A channel can take a few minutes to appear or disappear.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | ID of the extension to look for. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ExtensionLiveChannel>`

<details>
<summary>Champs de ExtensionLiveChannel</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `game_name` | `string` | Name of the category being streamed. |
| `game_id` | `string` | ID of the category being streamed. |
| `title` | `string` | Title of the stream. An empty string when none is set. |

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

Gets the shared secrets of an extension.

**Jeton:** signed extension JWT, passed with the `token` request option.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | ID of the extension whose secrets to read. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionSecrets>`

<details>
<summary>Champs de ExtensionSecrets</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `format_version` | `number` | Version of the layout of this object. |
| `secrets` | `ExtensionSecret[]` | The secrets. Several overlap while a new one is being rolled out. |

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

Creates a new shared secret. The current ones are retired once the new
one becomes active, so call this only when you are ready to switch.

**Jeton:** signed extension JWT, passed with the `token` request option.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | ID of the extension that gets the new secret. |
| `delay` | `number` | Seconds to wait before the new secret becomes active, so that running copies of the extension have time to switch. 300 at least, which is also the default. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionSecrets>`

<details>
<summary>Champs de ExtensionSecrets</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `format_version` | `number` | Version of the layout of this object. |
| `secrets` | `ExtensionSecret[]` | The secrets. Several overlap while a new one is being rolled out. |

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

Posts a message in a channel's chat under the name of the extension. The
extension needs the chat capability. Limited to 12 messages per minute
for each channel.

**Jeton:** signed extension JWT, passed with the `token` request option.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who has the extension active, and whose chat receives the message. |
| `text` <small>requis</small> | `string` | The message, 280 characters at most. |
| `extension_id` <small>requis</small> | `string` | ID of the extension that sends the message. |
| `extension_version` <small>requis</small> | `string` | Version of the extension. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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

Gets the description of an extension, released or not. Resolves with
`null` when no version is given and the extension was never released.

**Jeton:** signed extension JWT, passed with the `token` request option.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | ID of the extension to get. |
| `extension_version` | `string` | Version to get. Defaults to the latest released one, so it is needed for an extension that was never released. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionDetails \| null>`

<details>
<summary>Champs de ExtensionDetails</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `author_name` | `string` | Name of the user or organisation that owns the extension. |
| `bits_enabled` | `boolean` | Whether the extension has features that use Bits. |
| `can_install` | `boolean` | Whether a user can install it. Usually `false` while it is tested with an allowlist. |
| `configuration_location` | `"none" \| "hosted" \| "custom"` | Where the configuration lives: `"hosted"` by Twitch, `"custom"` on the extension's own backend, or `"none"` when there is nothing to configure. |
| `description` | `string` | Long description, shown on the details page. |
| `eula_tos_url` | `string` | URL of the terms of service. |
| `has_chat_support` | `boolean` | Whether the extension can talk in the chat of the channels it is installed on. |
| `icon_url` | `string` | URL of the default icon. |
| `icon_urls` | `Record<string, string>` | URLs of the icon in several sizes, keyed by size such as `"24x24"`. |
| `id` | `string` | ID of the extension. |
| `name` | `string` | Name of the extension. |
| `privacy_policy_url` | `string` | URL of the privacy policy. |
| `request_identity_link` | `boolean` | Whether the extension asks viewers to share their Twitch identity. |
| `screenshot_urls` | `string[]` | URLs of the screenshots shown in the marketplace. |
| `state` | `ExtensionState` | Where the extension is in its review and release cycle. |
| `subscriptions_support_level` | `"none" \| "optional"` | Whether the extension can see the viewer's subscription level on the channel. |
| `summary` | `string` | Short description shown to streamers in the Extension Manager. |
| `support_email` | `string` | Email address users can write to for support. |
| `version` | `string` | Version number of the extension. |
| `viewer_summary` | `string` | Short description shown to viewers on the channel. |
| `views` | `ExtensionViews` | How the extension is displayed in each place it supports. |
| `allowlisted_config_urls` | `string[]` | URLs allowed to display the configuration page. |
| `allowlisted_panel_urls` | `string[]` | URLs allowed to display the panel. |

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

Gets the description of a released extension. Fails with a 404 when the
extension does not exist or is not released.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `extension_id` <small>requis</small> | `string` | ID of the extension to get. |
| `extension_version` | `string` | Version to get. Defaults to the latest one. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionDetails>`

<details>
<summary>Champs de ExtensionDetails</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `author_name` | `string` | Name of the user or organisation that owns the extension. |
| `bits_enabled` | `boolean` | Whether the extension has features that use Bits. |
| `can_install` | `boolean` | Whether a user can install it. Usually `false` while it is tested with an allowlist. |
| `configuration_location` | `"none" \| "hosted" \| "custom"` | Where the configuration lives: `"hosted"` by Twitch, `"custom"` on the extension's own backend, or `"none"` when there is nothing to configure. |
| `description` | `string` | Long description, shown on the details page. |
| `eula_tos_url` | `string` | URL of the terms of service. |
| `has_chat_support` | `boolean` | Whether the extension can talk in the chat of the channels it is installed on. |
| `icon_url` | `string` | URL of the default icon. |
| `icon_urls` | `Record<string, string>` | URLs of the icon in several sizes, keyed by size such as `"24x24"`. |
| `id` | `string` | ID of the extension. |
| `name` | `string` | Name of the extension. |
| `privacy_policy_url` | `string` | URL of the privacy policy. |
| `request_identity_link` | `boolean` | Whether the extension asks viewers to share their Twitch identity. |
| `screenshot_urls` | `string[]` | URLs of the screenshots shown in the marketplace. |
| `state` | `ExtensionState` | Where the extension is in its review and release cycle. |
| `subscriptions_support_level` | `"none" \| "optional"` | Whether the extension can see the viewer's subscription level on the channel. |
| `summary` | `string` | Short description shown to streamers in the Extension Manager. |
| `support_email` | `string` | Email address users can write to for support. |
| `version` | `string` | Version number of the extension. |
| `viewer_summary` | `string` | Short description shown to viewers on the channel. |
| `views` | `ExtensionViews` | How the extension is displayed in each place it supports. |
| `allowlisted_config_urls` | `string[]` | URLs allowed to display the configuration page. |
| `allowlisted_panel_urls` | `string[]` | URLs allowed to display the panel. |

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

Lists the Bits products of the extension your client ID belongs to,
sorted by SKU.

**Jeton:** app, issued for the client ID of the extension.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `should_include_all` | `boolean` | Also lists disabled and expired products. Twitch defaults to `false`. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionBitsProduct[]>`

<details>
<summary>Champs de ExtensionBitsProduct</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `sku` | `string` | SKU of the product, unique within the extension. |
| `cost` | `ExtensionBitsProductCost` | Price of the product. |
| `in_development` | `boolean` | Whether the product is still in development, and so hidden from the public. |
| `display_name` | `string` | Name of the product as the extension displays it. |
| `expiration` | `string` | When the product stops being sold, as an RFC 3339 timestamp. |
| `is_broadcast` | `boolean` | Whether a purchase is announced to every instance of the extension on the channel. |

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

Creates a Bits product, or updates the one that already has this SKU.

**Jeton:** app, issued for the client ID of the extension.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `sku` <small>requis</small> | `string` | SKU of the product to create or update, 255 characters at most: letters, digits, dashes, underscores and full stops. It can never be changed. |
| `cost` <small>requis</small> | `ExtensionBitsProductCost` | Price of the product. |
| `display_name` <small>requis</small> | `string` | Name of the product as the extension displays it, 255 characters at most. |
| `in_development` | `boolean` | Keeps the product hidden from the public. Twitch defaults to `false`. |
| `expiration` | `string \| Date` | When the product expires. Never, when left out. A date in the past disables it. |
| `is_broadcast` | `boolean` | Announces purchases to every instance of the extension on the channel. Twitch defaults to `false`. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ExtensionBitsProduct>`

<details>
<summary>Champs de ExtensionBitsProduct</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `sku` | `string` | SKU of the product, unique within the extension. |
| `cost` | `ExtensionBitsProductCost` | Price of the product. |
| `in_development` | `boolean` | Whether the product is still in development, and so hidden from the public. |
| `display_name` | `string` | Name of the product as the extension displays it. |
| `expiration` | `string` | When the product stops being sold, as an RFC 3339 timestamp. |
| `is_broadcast` | `boolean` | Whether a purchase is announced to every instance of the extension on the channel. |

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
