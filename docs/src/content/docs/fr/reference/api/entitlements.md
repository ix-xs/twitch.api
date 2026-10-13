---
title: twitch.entitlements
description: "Droits liés aux Drops : les lister et les marquer comme remis."
sidebar:
  label: entitlements
---

Toutes les méthodes de `twitch.entitlements`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## drops

```ts nocheck
twitch.entitlements.drops(params?, options?): Paginator<DropsEntitlement>
```

Liste les droits liés aux Drops de votre organisation, sans ordre particulier. Un jeton d'application lit ceux de tous les utilisateurs, un jeton utilisateur uniquement ceux de son propre utilisateur. Votre identifiant client doit appartenir à l'organisation propriétaire du jeu.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string \| readonly string[]` | Uniquement ces droits. Jusqu'à 100 identifiants. |
| `user_id` | `string` | Uniquement les droits de cet utilisateur. Réservé aux jetons d'application : un jeton utilisateur lit toujours ceux de son propre utilisateur. |
| `game_id` | `string` | Uniquement les droits de ce jeu. |
| `fulfillment_status` | `DropsFulfillmentStatus` | Uniquement les droits qui ont ce statut. |
| `after` | `string` | Curseur de la page suivante. |
| `first` | `number` | Éléments par page, de 1 à 1000. Twitch en renvoie 20 par défaut. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<DropsEntitlement>`

<details>
<summary>Champs de DropsEntitlement</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du droit. |
| `benefit_id` | `string` | Identifiant de la récompense. |
| `timestamp` | `string` | Moment où le droit a été accordé, sous forme d'horodatage RFC 3339. |
| `user_id` | `string` | Identifiant de l'utilisateur qui a gagné la récompense. |
| `game_id` | `string` | Identifiant du jeu auquel appartient la récompense. |
| `fulfillment_status` | `DropsFulfillmentStatus` | Indique si la récompense a seulement été réclamée ou si elle a déjà été remise. |
| `last_updated` | `string` | Moment de la dernière modification du droit, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const claimed = twitch.entitlements.drops({ game_id: "33214", fulfillment_status: "CLAIMED" });
for await (const entitlement of claimed) console.log(entitlement.user_id, entitlement.benefit_id);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-drops-entitlements)

## updateDrops

```ts nocheck
twitch.entitlements.updateDrops(params?, options?): Promise<DropsEntitlementUpdate[]>
```

Définit le statut de droits liés aux Drops, en général `"FULFILLED"` une fois la récompense remise en jeu. Le résultat regroupe les identifiants selon l'issue obtenue : vérifiez-le, car un appel peut ne réussir que pour certains droits.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `entitlement_ids` | `readonly string[]` | Identifiants des droits à modifier. Jusqu'à 100. |
| `fulfillment_status` | `DropsFulfillmentStatus` | Statut à leur donner. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<DropsEntitlementUpdate[]>`

<details>
<summary>Champs de DropsEntitlementUpdate</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `status` | `"INVALID_ID" \| "NOT_FOUND" \| "SUCCESS" \| "UNAUTHORIZED" \| "UPDATE_FAILED"` | Ce qu'il est advenu des droits listés dans `ids`. `"UPDATE_FAILED"` est temporaire : réessayez ceux-là plus tard. |
| `ids` | `string[]` | Identifiants des droits auxquels ce statut s'applique. |

</details>

### Exemple

```ts
const results = await twitch.entitlements.updateDrops({
  entitlement_ids: ["0b6a2c1e-5d47-4f0a-9c3e-7a1d2e8f4b65"],
  fulfillment_status: "FULFILLED",
});
const failed = results.filter((result) => result.status !== "SUCCESS");
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-drops-entitlements)
