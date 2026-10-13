---
title: twitch.charity
description: "Collectes caritatives : la campagne en cours et ses dons."
sidebar:
  label: charity
---

Toutes les méthodes de `twitch.charity`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## campaign

```ts nocheck
twitch.charity.campaign(params?, options?): Promise<CharityCampaign | null>
```

Renvoie la collecte caritative que mène un diffuseur, ou `null` quand il n'y en a pas. Une collecte ne peut plus être lue une fois terminée.

**Jeton :** utilisateur, scope `channel:read:charity`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui mène la collecte. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CharityCampaign \| null>`

<details>
<summary>Champs de CharityCampaign</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la collecte. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui mène la collecte. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `charity_name` | `string` | Nom de l'association caritative. |
| `charity_description` | `string` | Ce que fait l'association caritative. |
| `charity_logo` | `string` | URL du logo de l'association caritative, un PNG de 100 pixels sur 100. |
| `charity_website` | `string` | URL du site web de l'association caritative. |
| `current_amount` | `CharityAmount` | Somme récoltée jusqu'ici. |
| `target_amount` | `CharityAmount \| null` | Somme que le diffuseur vise à récolter, ou `null` quand aucun objectif n'est fixé. |

</details>

### Exemple

```ts
const campaign = await twitch.charity.campaign();
if (campaign) console.log(campaign.charity_name, campaign.current_amount.value);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign)

## donations

```ts nocheck
twitch.charity.donations(params?, options?): Paginator<CharityDonation>
```

Liste les dons faits à la collecte que mène un diffuseur. La liste est vide quand aucune collecte n'est en cours.

**Jeton :** utilisateur, scope `channel:read:charity`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui mène la collecte. Par défaut, l'utilisateur qui fait l'appel. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<CharityDonation>`

<details>
<summary>Champs de CharityDonation</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant du don, unique d'une collecte à l'autre. |
| `campaign_id` | `string` | Identifiant de la collecte à laquelle l'argent a été versé. |
| `user_id` | `string` | Identifiant du donateur. |
| `user_login` | `string` | Nom de connexion du donateur. |
| `user_name` | `string` | Nom d'affichage du donateur. |
| `amount` | `CharityAmount` | Somme donnée. |

</details>

### Exemple

```ts
for await (const donation of twitch.charity.donations()) {
  console.log(donation.user_name, donation.amount.value / 10 ** donation.amount.decimal_places);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign-donations)
