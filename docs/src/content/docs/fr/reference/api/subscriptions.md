---
title: twitch.subscriptions
description: "Abonnements : les abonnés d'une chaîne, et savoir si un utilisateur l'est."
sidebar:
  label: subscriptions
---

Toutes les méthodes de `twitch.subscriptions`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## get

```ts nocheck
twitch.subscriptions.get(params?, options?): Paginator<BroadcasterSubscription, BroadcasterSubscriptionsBody>
```

Liste les abonnés d'une chaîne. Chaque page porte aussi les points d'abonnés de la chaîne, dans `page.raw.points`.

**Jeton :** utilisateur, scope `channel:read:subscriptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on liste les abonnés. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` | `string \| readonly string[]` | Uniquement ces abonnés. Jusqu'à 100 identifiants. Ne peut pas être combiné avec un curseur. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |
| `before` | `string` | Curseur de la page précédente. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<BroadcasterSubscription, BroadcasterSubscriptionsBody>`

<details>
<summary>Champs de BroadcasterSubscription</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `gifter_id` | `string` | Identifiant de l'utilisateur qui a offert l'abonnement. Une chaîne vide quand l'abonnement n'a pas été offert. |
| `gifter_login` | `string` | Nom de connexion de cet utilisateur. Une chaîne vide quand l'abonnement n'a pas été offert. |
| `gifter_name` | `string` | Nom d'affichage de cet utilisateur. Une chaîne vide quand l'abonnement n'a pas été offert. |
| `is_gift` | `boolean` | Indique si l'abonnement a été offert par quelqu'un d'autre. |
| `plan_name` | `string` | Nom de la formule d'abonnement. |
| `tier` | `SubscriptionTier` | Niveau de l'abonnement. |
| `user_id` | `string` | Identifiant de l'abonné. |
| `user_name` | `string` | Nom d'affichage de l'abonné. |
| `user_login` | `string` | Nom de connexion de l'abonné. |

</details>

### Exemple

```ts
const page = await twitch.subscriptions.get();
console.log(page.total, page.raw.points);
for await (const sub of twitch.subscriptions.get()) console.log(sub.user_name, sub.tier);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-broadcaster-subscriptions)

## check

```ts nocheck
twitch.subscriptions.check(params, options?): Promise<UserSubscription | null>
```

Renvoie l'abonnement d'un utilisateur à une chaîne, ou `null` quand il n'y est pas abonné.

**Jeton :** utilisateur, scope `user:read:subscriptions`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur auquel l'utilisateur est peut-être abonné. Doit être partenaire ou affilié. |
| `user_id` | `string` | Utilisateur à vérifier. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserSubscription \| null>`

<details>
<summary>Champs de UserSubscription</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `gifter_id` | `string` | Identifiant de l'utilisateur qui a offert l'abonnement. Présent uniquement sur un abonnement offert. |
| `gifter_login` | `string` | Nom de connexion de cet utilisateur. Présent uniquement sur un abonnement offert. |
| `gifter_name` | `string` | Nom d'affichage de cet utilisateur. Présent uniquement sur un abonnement offert. |
| `is_gift` | `boolean` | Indique si l'abonnement a été offert par quelqu'un d'autre. |
| `tier` | `SubscriptionTier` | Niveau de l'abonnement. |

</details>

### Exemple

```ts
const sub = await twitch.subscriptions.check({ broadcaster_id: "141981764" });
if (sub) console.log(`Subscribed at tier ${sub.tier}`);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#check-user-subscription)
