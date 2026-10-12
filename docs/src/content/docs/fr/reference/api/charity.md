---
title: twitch.charity
description: "Charity: the active campaign and its donations."
sidebar:
  label: charity
---

Toutes les méthodes de `twitch.charity`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## campaign

```ts nocheck
twitch.charity.campaign(params?, options?): Promise<CharityCampaign | null>
```

Gets the charity campaign a broadcaster is running, or `null` when there
is none. A campaign can no longer be read once it has ended.

**Jeton:** user, scope `channel:read:charity`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster running the campaign. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<CharityCampaign \| null>`

<details>
<summary>Champs de CharityCampaign</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the campaign. |
| `broadcaster_id` | `string` | ID of the broadcaster running the campaign. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `charity_name` | `string` | Name of the charity. |
| `charity_description` | `string` | What the charity does. |
| `charity_logo` | `string` | URL of the logo of the charity, a 100 by 100 pixels PNG. |
| `charity_website` | `string` | URL of the website of the charity. |
| `current_amount` | `CharityAmount` | Money raised so far. |
| `target_amount` | `CharityAmount \| null` | Money the broadcaster aims to raise, or `null` when no goal is set. |

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

Lists the donations made to the campaign a broadcaster is running. The
list is empty when no campaign is active.

**Jeton:** user, scope `channel:read:charity`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster running the campaign. Defaults to the user making the call. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<CharityDonation>`

<details>
<summary>Champs de CharityDonation</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the donation, unique across campaigns. |
| `campaign_id` | `string` | ID of the campaign the money went to. |
| `user_id` | `string` | ID of the donor. |
| `user_login` | `string` | Login name of the donor. |
| `user_name` | `string` | Display name of the donor. |
| `amount` | `CharityAmount` | Money given. |

</details>

### Exemple

```ts
for await (const donation of twitch.charity.donations()) {
  console.log(donation.user_name, donation.amount.value / 10 ** donation.amount.decimal_places);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-charity-campaign-donations)
