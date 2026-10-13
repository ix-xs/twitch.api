---
title: twitch.raids
description: "Raids : en lancer un, annuler celui en attente."
sidebar:
  label: raids
---

Toutes les méthodes de `twitch.raids`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## start

```ts nocheck
twitch.raids.start(params, options?): Promise<PendingRaid>
```

Prépare un raid vers une autre chaîne. Les spectateurs ne partent que lorsque le diffuseur confirme dans l'interface de Twitch ou après un compte à rebours de 90 secondes : écoutez donc l'événement de raid de la chaîne pour savoir qu'il a eu lieu. Limité à 10 appels par tranche de 10 minutes.

**Jeton :** utilisateur, scope `channel:manage:raids`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `from_broadcaster_id` | `string` | Diffuseur qui envoie ses spectateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `to_broadcaster_id` <small>requis</small> | `string` | Identifiant du diffuseur visé par le raid. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<PendingRaid>`

<details>
<summary>Champs de PendingRaid</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `created_at` | `string` | Date de la demande de raid, sous forme d'horodatage RFC 3339. |
| `is_mature` | `boolean` | Obsolète. Toujours `false`. |

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

Annule un raid qui n'est pas encore parti. Limité à 10 appels par tranche de 10 minutes.

**Jeton :** utilisateur, scope `channel:manage:raids`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui a lancé le raid. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.raids.cancel();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#cancel-a-raid)
