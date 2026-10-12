---
title: twitch.whispers
description: "Whispers: send a private message to a user."
sidebar:
  label: whispers
---

Toutes les méthodes de `twitch.whispers`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## send

```ts nocheck
twitch.whispers.send(params, options?): Promise<void>
```

Sends a whisper to a user. Twitch can discard a whisper it finds
suspicious and still report success, so a resolved call is no proof of
delivery. Limited to 40 different recipients per day, 3 whispers per
second and 100 per minute.

**Jeton:** user, scope `user:manage:whispers`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `from_user_id` | `string` | User who sends the whisper. Their account needs a verified phone number. Defaults to the user making the call. |
| `to_user_id` <small>requis</small> | `string` | User who receives the whisper. |
| `message` <small>requis</small> | `string` | Text of the whisper. Twitch cuts it at 500 characters when the recipient never whispered the sender, at 10,000 otherwise. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.whispers.send({ to_user_id: "198704263", message: "Thanks for the raid" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-whisper)
