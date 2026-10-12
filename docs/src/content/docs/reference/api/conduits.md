---
title: twitch.conduits
description: "Conduits: the EventSub transport that spreads events over several shards."
sidebar:
  label: conduits
---

Every method of `twitch.conduits`, with its parameters, what it returns and the token it needs.

## list

```ts nocheck
twitch.conduits.list(options?): Promise<Conduit[]>
```

Lists the conduits of your application.

**Token:** app.

### Parameters

This method takes no parameters of its own.

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<Conduit[]>`

<details>
<summary>Fields of Conduit</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the conduit. |
| `shard_count` | `number` | Number of shards the conduit has. |

</details>

### Example

```ts
const conduits = await twitch.conduits.list();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-conduits)

## create

```ts nocheck
twitch.conduits.create(params, options?): Promise<Conduit>
```

Creates a conduit with the given number of shards.

**Token:** app.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `shard_count` <small>required</small> | `number` | Number of shards to create. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<Conduit>`

<details>
<summary>Fields of Conduit</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the conduit. |
| `shard_count` | `number` | Number of shards the conduit has. |

</details>

### Example

```ts
const conduit = await twitch.conduits.create({ shard_count: 2 });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#create-conduits)

## update

```ts nocheck
twitch.conduits.update(params, options?): Promise<Conduit>
```

Changes the number of shards of a conduit.

**Token:** app.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` <small>required</small> | `string` | ID of the conduit. |
| `shard_count` <small>required</small> | `number` | New number of shards. Lowering it removes the shards with the highest IDs. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<Conduit>`

<details>
<summary>Fields of Conduit</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the conduit. |
| `shard_count` | `number` | Number of shards the conduit has. |

</details>

### Example

```ts
await twitch.conduits.update({ id: conduit.id, shard_count: 5 });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-conduits)

## delete

```ts nocheck
twitch.conduits.delete(id, options?): Promise<void>
```

Deletes a conduit. Its subscriptions stop shortly after.

**Token:** app.

### Parameters

`id`: `string`

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.conduits.delete(conduit.id);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#delete-conduit)

## shards

```ts nocheck
twitch.conduits.shards(params, options?): Paginator<ConduitShard>
```

Lists the shards of a conduit and where each one delivers events.

**Token:** app.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `conduit_id` <small>required</small> | `string` | ID of the conduit. |
| `status` | `ConduitShardStatus` | Only shards in this state. |
| `after` | `string` | Cursor of the next page. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<ConduitShard>`

<details>
<summary>Fields of ConduitShard</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the shard: its index, starting at `"0"`. |
| `status` | `ConduitShardStatus` | Current state of the shard. |
| `transport` | `ConduitShardTransport` | Where the shard delivers events. |

</details>

### Example

```ts
const shards = await twitch.conduits.shards({ conduit_id: conduit.id }).all();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-conduit-shards)

## updateShards

```ts nocheck
twitch.conduits.updateShards(params, options?): Promise<UpdateConduitShardsResult>
```

Points shards at a webhook callback or a WebSocket session. Shards that
could not be updated are reported in `errors` instead of throwing.

**Token:** app.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `conduit_id` <small>required</small> | `string` | ID of the conduit. |
| `shards` <small>required</small> | `readonly { id: string; transport: ConduitShardTransportInput; }[]` | Shards to update. Any number: long lists are split for you. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<UpdateConduitShardsResult>`

<details>
<summary>Fields of UpdateConduitShardsResult</summary>

| Name | Type | Description |
| --- | --- | --- |
| `data` | `ConduitShard[]` | Shards that were updated. |
| `errors` | `ConduitShardError[]` | Shards that could not be updated. |

</details>

### Example

```ts
const { errors } = await twitch.conduits.updateShards({
  conduit_id: conduit.id,
  shards: [{ id: "0", transport: { method: "websocket", session_id } }],
});
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards)
