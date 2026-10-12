---
title: twitch.raids
description: "Raids: start one, cancel a pending one."
sidebar:
  label: raids
---

Toutes les méthodes de `twitch.raids`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## start

```ts nocheck
twitch.raids.start(params, options?): Promise<PendingRaid>
```

Prepares a raid on another channel. The viewers only leave once the
broadcaster confirms in the Twitch interface or after a 90 second
countdown, so listen to the channel raid event to know that it happened.
Limited to 10 calls per 10 minutes.

**Jeton:** user, scope `channel:manage:raids`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `from_broadcaster_id` | `string` | Broadcaster who sends their viewers. Defaults to the user making the call. |
| `to_broadcaster_id` <small>requis</small> | `string` | ID of the broadcaster to raid. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<PendingRaid>`

<details>
<summary>Champs de PendingRaid</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `created_at` | `string` | When the raid was requested, as an RFC 3339 timestamp. |
| `is_mature` | `boolean` | Deprecated. Always `false`. |

</details>

### Exemple

```ts
const raid = await twitch.raids.start({ to_broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#start-a-raid)

## cancel

```ts nocheck
twitch.raids.cancel(params?, options?): Promise<void>
```

Cancels a raid that has not left yet. Limited to 10 calls per 10 minutes.

**Jeton:** user, scope `channel:manage:raids`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who started the raid. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.raids.cancel();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#cancel-a-raid)
