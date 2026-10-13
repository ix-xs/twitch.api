---
title: twitch.guestStar
description: "Guest Star (bêta) : sessions, invitations et emplacements."
sidebar:
  label: guestStar
---

Toutes les méthodes de `twitch.guestStar`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## settings

```ts nocheck
twitch.guestStar.settings(params, options?): Promise<GuestStarSettings>
```

Renvoie les réglages Guest Star d'une chaîne.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` ou `moderator:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on lit les réglages. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<GuestStarSettings>`

<details>
<summary>Champs de GuestStarSettings</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `is_moderator_send_live_enabled` | `boolean` | Indique si les modérateurs Guest Star peuvent décider si l'invité d'un emplacement est à l'antenne. |
| `slot_count` | `number` | Nombre d'emplacements que l'hôte peut remplir dans un appel, de 1 à 6. |
| `is_browser_source_audio_enabled` | `boolean` | Indique si les sources navigateur de cette chaîne diffusent l'audio de la session. |
| `group_layout` | `GuestStarGroupLayout` | Disposition des invités dans la source navigateur. |
| `browser_source_token` | `string` | Jeton en lecture seule qui sert à construire les URL des sources navigateur. |

</details>

### Exemple

```ts
const settings = await twitch.guestStar.settings({ broadcaster_id: "141981764" });
console.log(settings.slot_count, settings.group_layout);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-guest-star-settings)

## updateSettings

```ts nocheck
twitch.guestStar.updateSettings(params?, options?): Promise<void>
```

Modifie les réglages Guest Star d'une chaîne. Seuls les champs que vous passez sont modifiés.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on modifie les réglages. Par défaut, l'utilisateur qui fait l'appel. |
| `is_moderator_send_live_enabled` | `boolean` | Permet aux modérateurs Guest Star de décider si l'invité d'un emplacement est à l'antenne. |
| `slot_count` | `number` | Nombre d'emplacements que l'hôte peut remplir dans un appel, de 1 à 6. |
| `is_browser_source_audio_enabled` | `boolean` | Fait diffuser l'audio de la session par les sources navigateur de cette chaîne. |
| `group_layout` | `GuestStarGroupLayout` | Disposition des invités dans la source navigateur. |
| `regenerate_browser_sources` | `boolean` | Émet un nouveau jeton de source navigateur. Toutes les sources navigateur déjà configurées dans le logiciel de streaming cessent aussitôt de fonctionner. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.guestStar.updateSettings({ slot_count: 4, group_layout: "TILED_LAYOUT" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-channel-guest-star-settings)

## session

```ts nocheck
twitch.guestStar.session(params, options?): Promise<GuestStarSession | null>
```

Renvoie la session Guest Star en cours sur une chaîne, ou `null` quand il n'y en a aucune. Un invité peut la lire aussi, dès qu'il est invité ou installé à un emplacement.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` ou `moderator:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur qui héberge la session. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<GuestStarSession \| null>`

<details>
<summary>Champs de GuestStarSession</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la session. |
| `guests` | `GuestStarGuest[]` | Toutes les personnes qui occupent un emplacement, hôte compris. |

</details>

### Exemple

```ts
const session = await twitch.guestStar.session({ broadcaster_id: "141981764" });
if (session) console.log(session.guests.map((guest) => guest.user_login));
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-guest-star-session)

## createSession

```ts nocheck
twitch.guestStar.createSession(params?, options?): Promise<GuestStarSession>
```

Lance une session Guest Star dont le diffuseur est le seul membre. Le diffuseur doit se trouver dans l'interface d'appel, sans quoi Twitch met fin à l'appel de lui-même.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui hébergera la session. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<GuestStarSession>`

<details>
<summary>Champs de GuestStarSession</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la session. |
| `guests` | `GuestStarGuest[]` | Toutes les personnes qui occupent un emplacement, hôte compris. |

</details>

### Exemple

```ts
const session = await twitch.guestStar.createSession();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#create-guest-star-session)

## endSession

```ts nocheck
twitch.guestStar.endSession(params, options?): Promise<GuestStarSession | null>
```

Met fin à une session Guest Star, comme si l'hôte appuyait sur « End Call ». Renvoie la session telle qu'elle était à ce moment-là, ou `null` quand Twitch ne renvoie rien.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui héberge la session. Par défaut, l'utilisateur qui fait l'appel. |
| `session_id` <small>requis</small> | `string` | Identifiant de la session à terminer. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<GuestStarSession \| null>`

<details>
<summary>Champs de GuestStarSession</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la session. |
| `guests` | `GuestStarGuest[]` | Toutes les personnes qui occupent un emplacement, hôte compris. |

</details>

### Exemple

```ts
await twitch.guestStar.endSession({ session_id: session.id });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#end-guest-star-session)

## invites

```ts nocheck
twitch.guestStar.invites(params, options?): Promise<GuestStarInvite[]>
```

Liste les invitations en attente d'une session, en indiquant où en est chaque utilisateur invité dans la salle d'attente.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star` ou `moderator:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur qui héberge la session. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `session_id` <small>requis</small> | `string` | Identifiant de la session dont on liste les invitations. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<GuestStarInvite[]>`

<details>
<summary>Champs de GuestStarInvite</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant de l'utilisateur invité. |
| `invited_at` | `string` | Moment où l'invitation a été envoyée, sous forme d'horodatage RFC 3339. |
| `status` | `"INVITED" \| "ACCEPTED" \| "READY"` | Étape où en est l'utilisateur pour rejoindre la session :`"INVITED"` tant qu'il n'a pas réagi, `"ACCEPTED"` une fois dans la salle d'attente, `"READY"` quand il a indiqué pouvoir rejoindre l'appel. |
| `is_video_enabled` | `boolean` | Indique si la caméra de l'utilisateur est allumée. |
| `is_audio_enabled` | `boolean` | Indique si le micro de l'utilisateur est activé. |
| `is_video_available` | `boolean` | Indique si l'utilisateur a une caméra à partager. |
| `is_audio_available` | `boolean` | Indique si l'utilisateur a un micro à partager. |

</details>

### Exemple

```ts
const invites = await twitch.guestStar.invites({ broadcaster_id: "141981764", session_id: session.id });
const ready = invites.filter((invite) => invite.status === "READY");
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-guest-star-invites)

## invite

```ts nocheck
twitch.guestStar.invite(params, options?): Promise<void>
```

Invite un utilisateur à une session en cours.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:manage:guest_star` ou `moderator:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur qui héberge la session. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `session_id` <small>requis</small> | `string` | Identifiant de la session à laquelle inviter l'utilisateur. |
| `guest_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à inviter. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.guestStar.invite({ broadcaster_id: "141981764", session_id: session.id, guest_id: "144601104" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-guest-star-invite)

## deleteInvite

```ts nocheck
twitch.guestStar.deleteInvite(params, options?): Promise<void>
```

Retire une invitation à une session.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:manage:guest_star` ou `moderator:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur qui héberge la session. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `session_id` <small>requis</small> | `string` | Identifiant de la session pour laquelle l'invitation a été envoyée. |
| `guest_id` <small>requis</small> | `string` | Identifiant de l'utilisateur dont on retire l'invitation. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.guestStar.deleteInvite({ broadcaster_id: "141981764", session_id: session.id, guest_id: "144601104" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-guest-star-invite)

## assignSlot

```ts nocheck
twitch.guestStar.assignSlot(params, options?): Promise<void>
```

Installe un utilisateur invité à un emplacement de la session, une fois qu'il est prêt à la rejoindre.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:manage:guest_star` ou `moderator:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur qui héberge la session. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `session_id` <small>requis</small> | `string` | Identifiant de la session. |
| `guest_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à installer. Il doit être invité et prêt à rejoindre la session. |
| `slot_id` <small>requis</small> | `string` | Emplacement à lui attribuer : un nombre allant de `"1"` au nombre d'emplacements de la chaîne. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.guestStar.assignSlot({
  broadcaster_id: "141981764",
  session_id: session.id,
  guest_id: "144601104",
  slot_id: "1",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#assign-guest-star-slot)

## updateSlot

```ts nocheck
twitch.guestStar.updateSlot(params, options?): Promise<void>
```

Déplace un invité vers un autre emplacement. Quand celui-ci est occupé, les deux invités échangent leurs places.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:manage:guest_star` ou `moderator:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur qui héberge la session. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `session_id` <small>requis</small> | `string` | Identifiant de la session. |
| `source_slot_id` <small>requis</small> | `string` | Emplacement actuel de l'invité. |
| `destination_slot_id` | `string` | Emplacement vers lequel déplacer l'invité. Quand quelqu'un s'y trouve déjà, les deux échangent leurs places. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.guestStar.updateSlot({
  broadcaster_id: "141981764",
  session_id: session.id,
  source_slot_id: "1",
  destination_slot_id: "2",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-guest-star-slot)

## deleteSlot

```ts nocheck
twitch.guestStar.deleteSlot(params, options?): Promise<void>
```

Retire un invité de son emplacement. Il perd aussitôt l'accès à la session et ne peut plus en envoyer ni en recevoir l'audio et la vidéo.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:manage:guest_star` ou `moderator:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur qui héberge la session. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `session_id` <small>requis</small> | `string` | Identifiant de la session. |
| `guest_id` <small>requis</small> | `string` | Identifiant de l'invité à retirer. |
| `slot_id` <small>requis</small> | `string` | Emplacement de l'invité. |
| `should_reinvite_guest` | `boolean` | Renvoie l'invité dans la file des invitations au lieu de le sortir de la session. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.guestStar.deleteSlot({
  broadcaster_id: "141981764",
  session_id: session.id,
  guest_id: "144601104",
  slot_id: "1",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-guest-star-slot)

## updateSlotSettings

```ts nocheck
twitch.guestStar.updateSlotSettings(params, options?): Promise<void>
```

Modifie ce qu'un emplacement peut partager et la façon dont il apparaît dans le stream : audio, vidéo, passage à l'antenne et volume. Autoriser de nouveau l'audio ou la vidéo ne les active pas : l'invité est prévenu qu'il peut le faire.

Bêta : Twitch peut modifier cet endpoint.

**Jeton :** utilisateur, scope `channel:manage:guest_star` ou `moderator:manage:guest_star`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur qui héberge la session. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `session_id` <small>requis</small> | `string` | Identifiant de la session. |
| `slot_id` <small>requis</small> | `string` | Emplacement à modifier. |
| `is_audio_enabled` | `boolean` | Indique si l'emplacement peut partager de l'audio. `false` le rend muet pour tout le monde. |
| `is_video_enabled` | `boolean` | Indique si l'emplacement peut partager de la vidéo. `false` le masque pour tout le monde. |
| `is_live` | `boolean` | Indique si l'emplacement est visible et audible dans le stream, par l'intermédiaire de la source navigateur. |
| `volume` | `number` | Volume de l'emplacement dans le stream, de 0 à 100. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.guestStar.updateSlotSettings({
  broadcaster_id: "141981764",
  session_id: session.id,
  slot_id: "1",
  is_audio_enabled: false,
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-guest-star-slot-settings)
