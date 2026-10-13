---
title: twitch.whispers
description: "Chuchotements : envoyer un message privé à un utilisateur."
sidebar:
  label: whispers
---

Toutes les méthodes de `twitch.whispers`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## send

```ts nocheck
twitch.whispers.send(params, options?): Promise<void>
```

Envoie un chuchotement à un utilisateur. Twitch peut écarter un chuchotement qu'il juge suspect tout en signalant un succès : un appel résolu ne prouve donc pas que le message a été remis. Limité à 40 destinataires différents par jour, 3 chuchotements par seconde et 100 par minute.

**Jeton :** utilisateur, scope `user:manage:whispers`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `from_user_id` | `string` | Utilisateur qui envoie le chuchotement. Son compte doit avoir un numéro de téléphone vérifié. Par défaut, l'utilisateur qui fait l'appel. |
| `to_user_id` <small>requis</small> | `string` | Utilisateur qui reçoit le chuchotement. |
| `message` <small>requis</small> | `string` | Texte du chuchotement. Twitch le coupe à 500 caractères quand le destinataire n'a jamais envoyé de chuchotement à l'expéditeur, à 10 000 sinon. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.whispers.send({ to_user_id: "198704263", message: "Thanks for the raid" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-whisper)
