---
title: twitch.moderation
description: "Modération : bannissements, timeouts, avertissements, AutoMod, termes bloqués, modérateurs, VIP et Shield Mode."
sidebar:
  label: moderation
---

Toutes les méthodes de `twitch.moderation`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## checkAutoMod

```ts nocheck
twitch.moderation.checkAutoMod(params, options?): Promise<AutoModCheckResult[]>
```

Indique si AutoMod laisserait passer des messages sur une chaîne, sans les envoyer. Twitch limite ces vérifications par chaîne, de 5 par minute pour un compte ordinaire à 30 pour un partenaire.

**Jeton :** application ou utilisateur, scope `moderation:read`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont les réglages AutoMod et les termes bloqués s'appliquent. Par défaut, l'utilisateur qui fait l'appel. |
| `data` <small>requis</small> | `readonly AutoModCheckMessage[]` | Messages à vérifier, de 1 à 100. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AutoModCheckResult[]>`

<details>
<summary>Champs de AutoModCheckResult</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `msg_id` | `string` | L'identifiant que vous avez donné au message. |
| `is_permitted` | `boolean` | `true` quand le message irait directement dans le chat, `false` quand il serait retenu ou bloqué. |

</details>

### Exemple

```ts
const [result] = await twitch.moderation.checkAutoMod({
  data: [{ msg_id: "1", msg_text: "Hello chat" }],
});
if (!result?.is_permitted) console.log("AutoMod would hold this message");
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#check-automod-status)

## manageAutoModMessage

```ts nocheck
twitch.moderation.manageAutoModMessage(params, options?): Promise<void>
```

Approuve ou refuse un message qu'AutoMod retient pour examen.

**Jeton :** application ou utilisateur, scope `moderator:manage:automod`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Modérateur qui prend la décision. Par défaut, l'utilisateur qui fait l'appel. |
| `msg_id` <small>requis</small> | `string` | Identifiant du message retenu. |
| `action` <small>requis</small> | `"ALLOW" \| "DENY"` | `"ALLOW"` publie le message dans le chat, `"DENY"` l'écarte. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.manageAutoModMessage({ msg_id: "836013710", action: "ALLOW" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#manage-held-automod-messages)

## autoModSettings

```ts nocheck
twitch.moderation.autoModSettings(params, options?): Promise<AutoModSettings>
```

Renvoie les niveaux AutoMod d'une chaîne.

**Jeton :** application ou utilisateur, scope `moderator:read:automod_settings` ou `moderator:manage:automod_settings`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on lit les réglages. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AutoModSettings>`

<details>
<summary>Champs de AutoModSettings</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `moderator_id` | `string` | Identifiant du modérateur qui a fait l'appel. |
| `overall_level` | `number \| null` | Niveau global, de 0 à 4. `null` quand les catégories ont été réglées une à une. |
| `disability` | `number` | Niveau pour la discrimination liée au handicap. |
| `aggression` | `number` | Niveau pour l'hostilité agressive. |
| `sexuality_sex_or_gender` | `number` | Niveau pour la discrimination fondée sur la sexualité, le sexe ou le genre. |
| `misogyny` | `number` | Niveau pour la discrimination envers les femmes. |
| `bullying` | `number` | Niveau pour les injures et les insultes. |
| `swearing` | `number` | Niveau pour les grossièretés. |
| `race_ethnicity_or_religion` | `number` | Niveau pour la discrimination raciale, ethnique ou religieuse. |
| `sex_based_terms` | `number` | Niveau pour le contenu sexuel. |

</details>

### Exemple

```ts
const settings = await twitch.moderation.autoModSettings({ broadcaster_id: "141981764" });
console.log(settings.overall_level);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-automod-settings)

## updateAutoModSettings

```ts nocheck
twitch.moderation.updateAutoModSettings(params, options?): Promise<AutoModSettings>
```

Remplace les niveaux AutoMod d'une chaîne. Tout est écrasé : une catégorie que vous omettez revient à 0, envoyez donc tous les niveaux que vous voulez conserver.

**Jeton :** application ou utilisateur, scope `moderator:manage:automod_settings`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on modifie les réglages. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `overall_level` | `number` | Niveau global, de 0 à 4. Twitch en déduit le niveau de chaque catégorie. |
| `disability` | `number` | Niveau pour la discrimination liée au handicap. |
| `aggression` | `number` | Niveau pour l'hostilité agressive. |
| `sexuality_sex_or_gender` | `number` | Niveau pour la discrimination fondée sur la sexualité, le sexe ou le genre. |
| `misogyny` | `number` | Niveau pour la discrimination envers les femmes. |
| `bullying` | `number` | Niveau pour les injures et les insultes. |
| `swearing` | `number` | Niveau pour les grossièretés. |
| `race_ethnicity_or_religion` | `number` | Niveau pour la discrimination raciale, ethnique ou religieuse. |
| `sex_based_terms` | `number` | Niveau pour le contenu sexuel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AutoModSettings>`

<details>
<summary>Champs de AutoModSettings</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `moderator_id` | `string` | Identifiant du modérateur qui a fait l'appel. |
| `overall_level` | `number \| null` | Niveau global, de 0 à 4. `null` quand les catégories ont été réglées une à une. |
| `disability` | `number` | Niveau pour la discrimination liée au handicap. |
| `aggression` | `number` | Niveau pour l'hostilité agressive. |
| `sexuality_sex_or_gender` | `number` | Niveau pour la discrimination fondée sur la sexualité, le sexe ou le genre. |
| `misogyny` | `number` | Niveau pour la discrimination envers les femmes. |
| `bullying` | `number` | Niveau pour les injures et les insultes. |
| `swearing` | `number` | Niveau pour les grossièretés. |
| `race_ethnicity_or_religion` | `number` | Niveau pour la discrimination raciale, ethnique ou religieuse. |
| `sex_based_terms` | `number` | Niveau pour le contenu sexuel. |

</details>

### Exemple

```ts
await twitch.moderation.updateAutoModSettings({ broadcaster_id: "141981764", overall_level: 3 });
await twitch.moderation.updateAutoModSettings({ broadcaster_id: "141981764", swearing: 2, bullying: 4 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-automod-settings)

## bans

```ts nocheck
twitch.moderation.bans(params?, options?): Paginator<BannedUser>
```

Liste les utilisateurs bannis ou sous timeout sur une chaîne.

**Jeton :** application ou utilisateur, scope `moderation:read` ou `moderator:manage:banned_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on liste les bannissements. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` | `string \| readonly string[]` | Uniquement ces utilisateurs, s'ils sont bannis ou sous timeout. Jusqu'à 100 identifiants. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |
| `before` | `string` | Curseur de la page précédente. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<BannedUser>`

<details>
<summary>Champs de BannedUser</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant de l'utilisateur banni. |
| `user_login` | `string` | Nom de connexion de l'utilisateur banni. |
| `user_name` | `string` | Nom d'affichage de l'utilisateur banni. |
| `expires_at` | `string` | Moment où le timeout prend fin, sous forme d'horodatage RFC 3339. Une chaîne vide pour un bannissement permanent. |
| `created_at` | `string` | Moment où le bannissement ou le timeout a été appliqué, sous forme d'horodatage RFC 3339. |
| `reason` | `string` | Raison donnée par le modérateur. Une chaîne vide quand il n'y en a pas. |
| `moderator_id` | `string` | Identifiant du modérateur qui a appliqué le bannissement ou le timeout. |
| `moderator_login` | `string` | Nom de connexion de ce modérateur. |
| `moderator_name` | `string` | Nom d'affichage de ce modérateur. |

</details>

### Exemple

```ts
for await (const banned of twitch.moderation.bans()) {
  console.log(banned.user_login, banned.expires_at || "permanent");
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-banned-users)

## ban

```ts nocheck
twitch.moderation.ban(params, options?): Promise<UserBan>
```

Bannit un utilisateur du chat d'une chaîne. Un timeout est un bannissement avec une `duration` : donnez le nombre de secondes et l'utilisateur est réadmis ensuite. Un nouvel appel sur un utilisateur sous timeout change la durée ou transforme le timeout en bannissement, mais un utilisateur banni doit être débanni avant de pouvoir recevoir un timeout.

**Jeton :** application ou utilisateur, scope `moderator:manage:banned_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur du chat dont l'utilisateur est exclu. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à bannir ou à mettre sous timeout. |
| `duration` | `number` | Durée du timeout en secondes, de 1 à 1209600 (deux semaines). Omettez-la pour un bannissement permanent. |
| `reason` | `string` | Raison montrée à l'utilisateur et aux autres modérateurs, 500 caractères au plus. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserBan>`

<details>
<summary>Champs de UserBan</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur du chat dont l'utilisateur a été exclu. |
| `moderator_id` | `string` | Identifiant du modérateur qui l'a appliqué. |
| `user_id` | `string` | Identifiant de l'utilisateur banni. |
| `created_at` | `string` | Moment où il a été appliqué, sous forme d'horodatage RFC 3339. |
| `end_time` | `string \| null` | Moment où le timeout prend fin, sous forme d'horodatage RFC 3339. `null` pour un bannissement permanent. |

</details>

### Exemple

```ts
await twitch.moderation.ban({ broadcaster_id: "141981764", user_id: "9876", reason: "Spam" });
const timeout = await twitch.moderation.ban({ broadcaster_id: "141981764", user_id: "9876", duration: 600 });
console.log(timeout.end_time);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#ban-user)

## unban

```ts nocheck
twitch.moderation.unban(params, options?): Promise<void>
```

Lève le bannissement ou le timeout d'un utilisateur.

**Jeton :** application ou utilisateur, scope `moderator:manage:banned_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur du chat dont l'utilisateur est banni. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à débannir. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.unban({ broadcaster_id: "141981764", user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#unban-user)

## unbanRequests

```ts nocheck
twitch.moderation.unbanRequests(params, options?): Paginator<UnbanRequest>
```

Liste les demandes de débannissement d'une chaîne qui sont dans un état donné.

**Jeton :** utilisateur, scope `moderator:read:unban_requests` ou `moderator:manage:unban_requests`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont la chaîne a reçu les demandes. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `status` <small>requis</small> | `UnbanRequestStatus` | Uniquement les demandes dans cet état. |
| `user_id` | `string` | Uniquement les demandes rédigées par cet utilisateur. |
| `first` | `number` | Éléments par page. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<UnbanRequest>`

<details>
<summary>Champs de UnbanRequest</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la demande. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui a reçu la demande. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `moderator_id` | `string` | Identifiant du modérateur qui a approuvé ou refusé la demande. |
| `moderator_login` | `string` | Nom de connexion de ce modérateur. |
| `moderator_name` | `string` | Nom d'affichage de ce modérateur. |
| `user_id` | `string` | Identifiant de l'utilisateur banni qui a rédigé la demande. |
| `user_login` | `string` | Nom de connexion de cet utilisateur. |
| `user_name` | `string` | Nom d'affichage de cet utilisateur. |
| `text` | `string` | Message rédigé par l'utilisateur. |
| `status` | `UnbanRequestStatus` | État d'avancement de la demande. |
| `created_at` | `string` | Moment où la demande a été envoyée, sous forme d'horodatage RFC 3339. |
| `resolved_at` | `string \| null` | Moment où la demande a été approuvée ou refusée, sous forme d'horodatage RFC 3339. `null` tant qu'elle est ouverte. |
| `resolution_text` | `string \| null` | Réponse rédigée par le modérateur. `null` tant que la demande est ouverte. |

</details>

### Exemple

```ts
const pending = await twitch.moderation.unbanRequests({ broadcaster_id: "141981764", status: "pending" }).all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-unban-requests)

## resolveUnbanRequest

```ts nocheck
twitch.moderation.resolveUnbanRequest(params, options?): Promise<UnbanRequest>
```

Approuve ou refuse une demande de débannissement. L'approuver débannit l'utilisateur.

**Jeton :** utilisateur, scope `moderator:manage:unban_requests`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont la chaîne a reçu la demande. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `unban_request_id` <small>requis</small> | `string` | Identifiant de la demande à traiter. |
| `status` <small>requis</small> | `"approved" \| "denied"` | La décision. |
| `resolution_text` | `string` | Réponse montrée à l'utilisateur, 500 caractères au plus. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UnbanRequest>`

<details>
<summary>Champs de UnbanRequest</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de la demande. |
| `broadcaster_id` | `string` | Identifiant du diffuseur qui a reçu la demande. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |
| `moderator_id` | `string` | Identifiant du modérateur qui a approuvé ou refusé la demande. |
| `moderator_login` | `string` | Nom de connexion de ce modérateur. |
| `moderator_name` | `string` | Nom d'affichage de ce modérateur. |
| `user_id` | `string` | Identifiant de l'utilisateur banni qui a rédigé la demande. |
| `user_login` | `string` | Nom de connexion de cet utilisateur. |
| `user_name` | `string` | Nom d'affichage de cet utilisateur. |
| `text` | `string` | Message rédigé par l'utilisateur. |
| `status` | `UnbanRequestStatus` | État d'avancement de la demande. |
| `created_at` | `string` | Moment où la demande a été envoyée, sous forme d'horodatage RFC 3339. |
| `resolved_at` | `string \| null` | Moment où la demande a été approuvée ou refusée, sous forme d'horodatage RFC 3339. `null` tant qu'elle est ouverte. |
| `resolution_text` | `string \| null` | Réponse rédigée par le modérateur. `null` tant que la demande est ouverte. |

</details>

### Exemple

```ts
const request = await twitch.moderation.resolveUnbanRequest({
  broadcaster_id: "141981764",
  unban_request_id: "92af127c-7326-4483-a52b-b0da0be61c01",
  status: "approved",
  resolution_text: "Welcome back.",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#resolve-unban-requests)

## blockedTerms

```ts nocheck
twitch.moderation.blockedTerms(params, options?): Paginator<BlockedTerm>
```

Liste les termes bloqués d'une chaîne, du plus récent au plus ancien. Les termes privés ne sont pas compris.

**Jeton :** application ou utilisateur, scope `moderator:read:blocked_terms` ou `moderator:manage:blocked_terms`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartient la liste. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<BlockedTerm>`

<details>
<summary>Champs de BlockedTerm</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient la liste. |
| `moderator_id` | `string` | Identifiant du modérateur qui a bloqué le terme. |
| `id` | `string` | Identifiant du terme bloqué. |
| `text` | `string` | Le mot ou l'expression bloqués. |
| `created_at` | `string` | Moment où le terme a été bloqué, sous forme d'horodatage RFC 3339. |
| `updated_at` | `string` | Moment de la dernière modification du terme, sous forme d'horodatage RFC 3339. Change chaque fois qu'AutoMod le refuse de nouveau. |
| `expires_at` | `string \| null` | Moment où le blocage prend fin, sous forme d'horodatage RFC 3339. `null` pour un terme ajouté à la main ou bloqué définitivement par AutoMod. |

</details>

### Exemple

```ts
const terms = await twitch.moderation.blockedTerms({ broadcaster_id: "141981764" }).all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-blocked-terms)

## addBlockedTerm

```ts nocheck
twitch.moderation.addBlockedTerm(params, options?): Promise<BlockedTerm>
```

Bloque un mot ou une expression dans le chat d'une chaîne. Quand le terme est déjà bloqué, l'entrée existante est renvoyée.

**Jeton :** application ou utilisateur, scope `moderator:manage:blocked_terms`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartient la liste. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `text` <small>requis</small> | `string` | Mot ou expression à bloquer, de 2 à 500 caractères. Un `*` au début ou à la fin d'un mot sert de joker, comme dans `"foo*"`. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<BlockedTerm>`

<details>
<summary>Champs de BlockedTerm</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient la liste. |
| `moderator_id` | `string` | Identifiant du modérateur qui a bloqué le terme. |
| `id` | `string` | Identifiant du terme bloqué. |
| `text` | `string` | Le mot ou l'expression bloqués. |
| `created_at` | `string` | Moment où le terme a été bloqué, sous forme d'horodatage RFC 3339. |
| `updated_at` | `string` | Moment de la dernière modification du terme, sous forme d'horodatage RFC 3339. Change chaque fois qu'AutoMod le refuse de nouveau. |
| `expires_at` | `string \| null` | Moment où le blocage prend fin, sous forme d'horodatage RFC 3339. `null` pour un terme ajouté à la main ou bloqué définitivement par AutoMod. |

</details>

### Exemple

```ts
const term = await twitch.moderation.addBlockedTerm({ broadcaster_id: "141981764", text: "spoil*" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#add-blocked-term)

## removeBlockedTerm

```ts nocheck
twitch.moderation.removeBlockedTerm(params, options?): Promise<void>
```

Retire un terme des termes bloqués d'une chaîne. Un identifiant qui n'existe pas n'est pas une erreur.

**Jeton :** application ou utilisateur, scope `moderator:manage:blocked_terms`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartient la liste. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `id` <small>requis</small> | `string` | Identifiant du terme bloqué à retirer. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.removeBlockedTerm({ broadcaster_id: "141981764", id: term.id });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#remove-blocked-term)

## deleteMessages

```ts nocheck
twitch.moderation.deleteMessages(params, options?): Promise<void>
```

Supprime un message du chat d'une chaîne, ou tous les messages quand aucun `message_id` n'est donné.

**Jeton :** application ou utilisateur, scope `moderator:manage:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartient le chat. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `message_id` | `string` | Identifiant du message à supprimer. Il doit avoir moins de 6 heures et n'avoir été écrit ni par le diffuseur ni par un modérateur. Omettez-le pour vider le chat. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.deleteMessages({ broadcaster_id: "141981764", message_id: "abc-123-def" });
await twitch.moderation.deleteMessages({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-chat-messages)

## moderatedChannels

```ts nocheck
twitch.moderation.moderatedChannels(params?, options?): Paginator<ModeratedChannel>
```

Liste les chaînes dont un utilisateur est modérateur.

**Jeton :** application ou utilisateur, scope `user:read:moderated_channels`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Utilisateur dont on liste les chaînes modérées. Par défaut, l'utilisateur qui fait l'appel. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ModeratedChannel>`

<details>
<summary>Champs de ModeratedChannel</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur de la chaîne. |
| `broadcaster_login` | `string` | Nom de connexion du diffuseur. |
| `broadcaster_name` | `string` | Nom d'affichage du diffuseur. |

</details>

### Exemple

```ts
for await (const channel of twitch.moderation.moderatedChannels()) {
  console.log(channel.broadcaster_login);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-moderated-channels)

## moderators

```ts nocheck
twitch.moderation.moderators(params?, options?): Paginator<ChannelModerator>
```

Liste les modérateurs d'une chaîne.

**Jeton :** utilisateur, scope `moderation:read` ou `channel:manage:moderators`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on liste les modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` | `string \| readonly string[]` | Uniquement ces utilisateurs, s'ils sont modérateurs. Jusqu'à 100 identifiants. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ChannelModerator>`

<details>
<summary>Champs de ChannelModerator</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant du modérateur. |
| `user_login` | `string` | Nom de connexion du modérateur. |
| `user_name` | `string` | Nom d'affichage du modérateur. |

</details>

### Exemple

```ts
const mods = await twitch.moderation.moderators().all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-moderators)

## addModerator

```ts nocheck
twitch.moderation.addModerator(params, options?): Promise<void>
```

Nomme un utilisateur modérateur de la chaîne. Un VIP doit d'abord perdre ce statut. Twitch autorise 10 ajouts par tranche de 10 secondes.

**Jeton :** utilisateur, scope `channel:manage:moderators`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient le chat. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à nommer modérateur. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.addModerator({ user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#add-channel-moderator)

## removeModerator

```ts nocheck
twitch.moderation.removeModerator(params, options?): Promise<void>
```

Retire le rôle de modérateur à un utilisateur. Twitch autorise 10 retraits par tranche de 10 secondes.

**Jeton :** utilisateur, scope `channel:manage:moderators`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur à qui appartient le chat. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` <small>requis</small> | `string` | Identifiant du modérateur à retirer. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.removeModerator({ user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#remove-channel-moderator)

## vips

```ts nocheck
twitch.moderation.vips(params?, options?): Paginator<ChannelVip>
```

Liste les VIP d'une chaîne.

**Jeton :** utilisateur, scope `channel:read:vips` ou `channel:manage:vips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on liste les VIP. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` | `string \| readonly string[]` | Uniquement ces utilisateurs, s'ils sont VIP. Jusqu'à 100 identifiants. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ChannelVip>`

<details>
<summary>Champs de ChannelVip</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant du VIP. |
| `user_name` | `string` | Nom d'affichage du VIP. |
| `user_login` | `string` | Nom de connexion du VIP. |

</details>

### Exemple

```ts
const vips = await twitch.moderation.vips().all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-vips)

## addVip

```ts nocheck
twitch.moderation.addVip(params, options?): Promise<void>
```

Nomme un utilisateur VIP de la chaîne. Un modérateur doit d'abord perdre ce rôle, et la chaîne doit avoir une place de VIP libre. Twitch autorise 10 ajouts par tranche de 10 secondes.

**Jeton :** utilisateur, scope `channel:manage:vips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur qui accorde le statut. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à nommer VIP. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.addVip({ user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#add-channel-vip)

## removeVip

```ts nocheck
twitch.moderation.removeVip(params, options?): Promise<void>
```

Retire le statut VIP à un utilisateur. Un VIP peut aussi renoncer lui-même à son statut : passez la chaîne dans `broadcaster_id` et faites l'appel en tant que ce VIP. Twitch autorise 10 retraits par tranche de 10 secondes.

**Jeton :** utilisateur, scope `channel:manage:vips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur de la chaîne où l'utilisateur est VIP. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` <small>requis</small> | `string` | Identifiant du VIP à retirer. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.removeVip({ user_id: "9876" });
await twitch.moderation.removeVip({ broadcaster_id: "141981764", user_id: "9876" }, { as: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#remove-channel-vip)

## updateShieldMode

```ts nocheck
twitch.moderation.updateShieldMode(params, options?): Promise<ShieldModeStatus>
```

Active ou désactive le Shield Mode sur une chaîne. Tant qu'il est activé, les règles de chat plus strictes que le diffuseur a préparées pour lui s'appliquent.

**Jeton :** application ou utilisateur, scope `moderator:manage:shield_mode`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on bascule le Shield Mode. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `is_active` <small>requis</small> | `boolean` | `true` active le Shield Mode, `false` le désactive. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ShieldModeStatus>`

<details>
<summary>Champs de ShieldModeStatus</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `is_active` | `boolean` | Indique si le Shield Mode est activé. |
| `moderator_id` | `string` | Identifiant du modérateur qui l'a activé en dernier. Une chaîne vide quand il n'a jamais été activé. |
| `moderator_login` | `string` | Nom de connexion de ce modérateur. Une chaîne vide quand il n'a jamais été activé. |
| `moderator_name` | `string` | Nom d'affichage de ce modérateur. Une chaîne vide quand il n'a jamais été activé. |
| `last_activated_at` | `string` | Moment de sa dernière activation, sous forme d'horodatage RFC 3339. Une chaîne vide quand il n'a jamais été activé. |

</details>

### Exemple

```ts
const status = await twitch.moderation.updateShieldMode({ broadcaster_id: "141981764", is_active: true });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-shield-mode-status)

## shieldMode

```ts nocheck
twitch.moderation.shieldMode(params, options?): Promise<ShieldModeStatus>
```

Indique si le Shield Mode est activé sur une chaîne et qui l'a activé en dernier.

**Jeton :** application ou utilisateur, scope `moderator:read:shield_mode` ou `moderator:manage:shield_mode`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on lit le Shield Mode. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ShieldModeStatus>`

<details>
<summary>Champs de ShieldModeStatus</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `is_active` | `boolean` | Indique si le Shield Mode est activé. |
| `moderator_id` | `string` | Identifiant du modérateur qui l'a activé en dernier. Une chaîne vide quand il n'a jamais été activé. |
| `moderator_login` | `string` | Nom de connexion de ce modérateur. Une chaîne vide quand il n'a jamais été activé. |
| `moderator_name` | `string` | Nom d'affichage de ce modérateur. Une chaîne vide quand il n'a jamais été activé. |
| `last_activated_at` | `string` | Moment de sa dernière activation, sous forme d'horodatage RFC 3339. Une chaîne vide quand il n'a jamais été activé. |

</details>

### Exemple

```ts
const { is_active } = await twitch.moderation.shieldMode({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-shield-mode-status)

## warn

```ts nocheck
twitch.moderation.warn(params, options?): Promise<UserWarning>
```

Envoie un avertissement à un utilisateur du chat, qui ne peut plus y écrire tant qu'il n'en a pas pris acte. Un nouvel avertissement remplace celui qui est en attente.

**Jeton :** application ou utilisateur, scope `moderator:manage:warnings`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur de la chaîne à laquelle l'avertissement s'applique. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à avertir. |
| `reason` <small>requis</small> | `string` | Motif de l'avertissement, 500 caractères au plus. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserWarning>`

<details>
<summary>Champs de UserWarning</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur de la chaîne à laquelle l'avertissement s'applique. |
| `user_id` | `string` | Identifiant de l'utilisateur averti. |
| `moderator_id` | `string` | Identifiant du modérateur qui a envoyé l'avertissement. |
| `reason` | `string` | Raison donnée avec l'avertissement. |

</details>

### Exemple

```ts
await twitch.moderation.warn({ broadcaster_id: "141981764", user_id: "9876", reason: "Keep it friendly." });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#warn-chat-user)

## addSuspiciousStatus

```ts nocheck
twitch.moderation.addSuspiciousStatus(params, options?): Promise<SuspiciousUser>
```

Signale comme suspect un spectateur présent dans le chat d'une chaîne, soit pour le surveiller, soit pour restreindre ses messages.

**Jeton :** application ou utilisateur, scope `moderator:manage:suspicious_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur de la chaîne à laquelle le statut s'applique. |
| `moderator_id` | `string` | Modérateur qui attribue le statut. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` <small>requis</small> | `string` | Identifiant du spectateur à signaler. |
| `status` <small>requis</small> | `"ACTIVE_MONITORING" \| "RESTRICTED"` | `"ACTIVE_MONITORING"` surveille l'utilisateur, `"RESTRICTED"` masque en plus ses messages dans le chat. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<SuspiciousUser>`

<details>
<summary>Champs de SuspiciousUser</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant du spectateur présent dans le chat. |
| `broadcaster_id` | `string` | Identifiant du diffuseur de la chaîne. |
| `moderator_id` | `string` | Identifiant du modérateur qui a modifié le statut en dernier. |
| `updated_at` | `string` | Moment de la dernière modification du statut, sous forme d'horodatage RFC 3339. |
| `status` | `SuspiciousUserStatus` | Traitement en cours. `"NO_TREATMENT"` une fois le statut retiré. |
| `types` | `SuspiciousUserType[]` | Raisons pour lesquelles l'utilisateur est jugé suspect. |

</details>

### Exemple

```ts
const flagged = await twitch.moderation.addSuspiciousStatus({
  broadcaster_id: "141981764",
  user_id: "9876",
  status: "RESTRICTED",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#add-suspicious-status-to-chat-user)

## removeSuspiciousStatus

```ts nocheck
twitch.moderation.removeSuspiciousStatus(params, options?): Promise<SuspiciousUser>
```

Retire le statut suspect d'un spectateur présent dans le chat d'une chaîne.

**Jeton :** application ou utilisateur, scope `moderator:manage:suspicious_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur de la chaîne à laquelle le statut s'applique. |
| `moderator_id` | `string` | Modérateur qui retire le statut. Par défaut, l'utilisateur qui fait l'appel. |
| `user_id` <small>requis</small> | `string` | Identifiant du spectateur dont on retire le statut. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<SuspiciousUser>`

<details>
<summary>Champs de SuspiciousUser</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant du spectateur présent dans le chat. |
| `broadcaster_id` | `string` | Identifiant du diffuseur de la chaîne. |
| `moderator_id` | `string` | Identifiant du modérateur qui a modifié le statut en dernier. |
| `updated_at` | `string` | Moment de la dernière modification du statut, sous forme d'horodatage RFC 3339. |
| `status` | `SuspiciousUserStatus` | Traitement en cours. `"NO_TREATMENT"` une fois le statut retiré. |
| `types` | `SuspiciousUserType[]` | Raisons pour lesquelles l'utilisateur est jugé suspect. |

</details>

### Exemple

```ts
await twitch.moderation.removeSuspiciousStatus({ broadcaster_id: "141981764", user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#remove-suspicious-status-from-chat-user)
