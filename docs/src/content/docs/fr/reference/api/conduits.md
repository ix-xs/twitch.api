---
title: twitch.conduits
description: "Conduits : le transport EventSub qui répartit les événements sur plusieurs shards."
sidebar:
  label: conduits
---

Toutes les méthodes de `twitch.conduits`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## list

```ts nocheck
twitch.conduits.list(options?): Promise<Conduit[]>
```

Liste les conduits de votre application.

**Jeton :** application.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Conduit[]>`

<details>
<summary>Champs de Conduit</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du conduit. |
| `shard_count` | `number` | Nombre de shards du conduit. |

</details>

### Exemple

```ts
const conduits = await twitch.conduits.list();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-conduits)

## create

```ts nocheck
twitch.conduits.create(params, options?): Promise<Conduit>
```

Crée un conduit avec le nombre de shards donné.

**Jeton :** application.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `shard_count` <small>requis</small> | `number` | Nombre de shards à créer. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Conduit>`

<details>
<summary>Champs de Conduit</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du conduit. |
| `shard_count` | `number` | Nombre de shards du conduit. |

</details>

### Exemple

```ts
const conduit = await twitch.conduits.create({ shard_count: 2 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-conduits)

## update

```ts nocheck
twitch.conduits.update(params, options?): Promise<Conduit>
```

Change le nombre de shards d'un conduit.

**Jeton :** application.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `id` <small>requis</small> | `string` | Identifiant du conduit. |
| `shard_count` <small>requis</small> | `number` | Nouveau nombre de shards. Le réduire supprime les shards aux identifiants les plus élevés. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Conduit>`

<details>
<summary>Champs de Conduit</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du conduit. |
| `shard_count` | `number` | Nombre de shards du conduit. |

</details>

### Exemple

```ts
await twitch.conduits.update({ id: conduit.id, shard_count: 5 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-conduits)

## delete

```ts nocheck
twitch.conduits.delete(id, options?): Promise<void>
```

Supprime un conduit. Ses abonnements s'arrêtent peu après.

**Jeton :** application.

### Paramètres

`id` : `string`

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.conduits.delete(conduit.id);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-conduit)

## shards

```ts nocheck
twitch.conduits.shards(params, options?): Paginator<ConduitShard>
```

Liste les shards d'un conduit et l'endroit où chacun livre les événements.

**Jeton :** application.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `conduit_id` <small>requis</small> | `string` | Identifiant du conduit. |
| `status` | `ConduitShardStatus` | Uniquement les shards dans cet état. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ConduitShard>`

<details>
<summary>Champs de ConduitShard</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du shard : son indice, à partir de `"0"`. |
| `status` | `ConduitShardStatus` | État actuel du shard. |
| `transport` | `ConduitShardTransport` | Endroit où le shard livre les événements. |

</details>

### Exemple

```ts
const shards = await twitch.conduits.shards({ conduit_id: conduit.id }).all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-conduit-shards)

## updateShards

```ts nocheck
twitch.conduits.updateShards(params, options?): Promise<UpdateConduitShardsResult>
```

Dirige des shards vers un callback de webhook ou une session WebSocket. Les shards qui n'ont pas pu être mis à jour sont signalés dans `errors` au lieu de lever une erreur.

**Jeton :** application.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `conduit_id` <small>requis</small> | `string` | Identifiant du conduit. |
| `shards` <small>requis</small> | `readonly { id: string; transport: ConduitShardTransportInput; }[]` | Shards à mettre à jour. En nombre quelconque : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UpdateConduitShardsResult>`

<details>
<summary>Champs de UpdateConduitShardsResult</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `data` | `ConduitShard[]` | Shards mis à jour. |
| `errors` | `ConduitShardError[]` | Shards qui n'ont pas pu être mis à jour. |

</details>

### Exemple

```ts
const { errors } = await twitch.conduits.updateShards({
  conduit_id: conduit.id,
  shards: [{ id: "0", transport: { method: "websocket", session_id } }],
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards)
