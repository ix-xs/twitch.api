---
title: twitch.conduits
description: "Conduits: the EventSub transport that spreads events over several shards."
sidebar:
  label: conduits
---

Toutes les méthodes de `twitch.conduits`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## list

```ts nocheck
twitch.conduits.list(options?): Promise<Conduit[]>
```

Lists the conduits of your application.

**Jeton:** app.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Conduit[]>`

<details>
<summary>Champs de Conduit</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the conduit. |
| `shard_count` | `number` | Number of shards the conduit has. |

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

Creates a conduit with the given number of shards.

**Jeton:** app.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `shard_count` <small>requis</small> | `number` | Number of shards to create. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Conduit>`

<details>
<summary>Champs de Conduit</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the conduit. |
| `shard_count` | `number` | Number of shards the conduit has. |

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

Changes the number of shards of a conduit.

**Jeton:** app.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `id` <small>requis</small> | `string` | ID of the conduit. |
| `shard_count` <small>requis</small> | `number` | New number of shards. Lowering it removes the shards with the highest IDs. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<Conduit>`

<details>
<summary>Champs de Conduit</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the conduit. |
| `shard_count` | `number` | Number of shards the conduit has. |

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

Deletes a conduit. Its subscriptions stop shortly after.

**Jeton:** app.

### Paramètres

`id`: `string`

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

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

Lists the shards of a conduit and where each one delivers events.

**Jeton:** app.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `conduit_id` <small>requis</small> | `string` | ID of the conduit. |
| `status` | `ConduitShardStatus` | Only shards in this state. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ConduitShard>`

<details>
<summary>Champs de ConduitShard</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the shard: its index, starting at `"0"`. |
| `status` | `ConduitShardStatus` | Current state of the shard. |
| `transport` | `ConduitShardTransport` | Where the shard delivers events. |

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

Points shards at a webhook callback or a WebSocket session. Shards that
could not be updated are reported in `errors` instead of throwing.

**Jeton:** app.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `conduit_id` <small>requis</small> | `string` | ID of the conduit. |
| `shards` <small>requis</small> | `readonly { id: string; transport: ConduitShardTransportInput; }[]` | Shards to update. Any number: long lists are split for you. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UpdateConduitShardsResult>`

<details>
<summary>Champs de UpdateConduitShardsResult</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `data` | `ConduitShard[]` | Shards that were updated. |
| `errors` | `ConduitShardError[]` | Shards that could not be updated. |

</details>

### Exemple

```ts
const { errors } = await twitch.conduits.updateShards({
  conduit_id: conduit.id,
  shards: [{ id: "0", transport: { method: "websocket", session_id } }],
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards)
