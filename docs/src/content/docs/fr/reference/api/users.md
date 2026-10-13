---
title: twitch.users
description: "Utilisateurs : profils, liste de blocage et extensions installées."
sidebar:
  label: users
---

Toutes les méthodes de `twitch.users`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## get

```ts nocheck
twitch.users.get(params, options?): Promise<User[]>
```

Renvoie des utilisateurs d'après leur identifiant, leur nom de connexion, ou les deux. Les utilisateurs qui n'existent pas sont absents du résultat.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string \| readonly string[]` | Identifiants des utilisateurs à récupérer. Autant que vous voulez : les longues listes sont découpées pour vous. |
| `login` | `string \| readonly string[]` | Noms de connexion des utilisateurs à récupérer. Autant que vous voulez : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<User[]>`

<details>
<summary>Champs de User</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'utilisateur. |
| `login` | `string` | Nom de connexion : en minuscules, celui qui apparaît dans les URL. |
| `display_name` | `string` | Nom d'affichage, avec les majuscules choisies par l'utilisateur. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Rôle au sein du personnel de Twitch. Une chaîne vide pour un utilisateur ordinaire. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Statut de monétisation. Une chaîne vide pour un diffuseur ordinaire. |
| `description` | `string` | Description de la chaîne rédigée par l'utilisateur. |
| `profile_image_url` | `string` | URL de la photo de profil. |
| `offline_image_url` | `string` | URL de l'image affichée quand la chaîne est hors ligne. |
| `view_count` | `number` | Obsolète. Twitch ne renseigne plus ce champ. |
| `email` | `string` | Adresse e-mail vérifiée. Présente uniquement quand l'appel est fait avec un jeton de cet utilisateur doté du scope `user:read:email`. |
| `created_at` | `string` | Date de création du compte, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const users = await twitch.users.get({ login: ["twitchdev", "twitch"] });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-users)

## getById

```ts nocheck
twitch.users.getById(id, options?): Promise<User | null>
```

Renvoie un utilisateur d'après son identifiant, ou `null` quand il n'existe pas. Les appels faits dans le même tick sont fusionnés en une seule requête.

**Jeton :** application ou utilisateur.

### Paramètres

`id` : `string`

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<User \| null>`

<details>
<summary>Champs de User</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'utilisateur. |
| `login` | `string` | Nom de connexion : en minuscules, celui qui apparaît dans les URL. |
| `display_name` | `string` | Nom d'affichage, avec les majuscules choisies par l'utilisateur. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Rôle au sein du personnel de Twitch. Une chaîne vide pour un utilisateur ordinaire. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Statut de monétisation. Une chaîne vide pour un diffuseur ordinaire. |
| `description` | `string` | Description de la chaîne rédigée par l'utilisateur. |
| `profile_image_url` | `string` | URL de la photo de profil. |
| `offline_image_url` | `string` | URL de l'image affichée quand la chaîne est hors ligne. |
| `view_count` | `number` | Obsolète. Twitch ne renseigne plus ce champ. |
| `email` | `string` | Adresse e-mail vérifiée. Présente uniquement quand l'appel est fait avec un jeton de cet utilisateur doté du scope `user:read:email`. |
| `created_at` | `string` | Date de création du compte, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const user = await twitch.users.getById("141981764");
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-users)

## getByLogin

```ts nocheck
twitch.users.getByLogin(login, options?): Promise<User | null>
```

Renvoie un utilisateur d'après son nom de connexion, ou `null` quand il n'existe pas. Les appels faits dans le même tick sont fusionnés en une seule requête.

**Jeton :** application ou utilisateur.

### Paramètres

`login` : `string`

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<User \| null>`

<details>
<summary>Champs de User</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'utilisateur. |
| `login` | `string` | Nom de connexion : en minuscules, celui qui apparaît dans les URL. |
| `display_name` | `string` | Nom d'affichage, avec les majuscules choisies par l'utilisateur. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Rôle au sein du personnel de Twitch. Une chaîne vide pour un utilisateur ordinaire. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Statut de monétisation. Une chaîne vide pour un diffuseur ordinaire. |
| `description` | `string` | Description de la chaîne rédigée par l'utilisateur. |
| `profile_image_url` | `string` | URL de la photo de profil. |
| `offline_image_url` | `string` | URL de l'image affichée quand la chaîne est hors ligne. |
| `view_count` | `number` | Obsolète. Twitch ne renseigne plus ce champ. |
| `email` | `string` | Adresse e-mail vérifiée. Présente uniquement quand l'appel est fait avec un jeton de cet utilisateur doté du scope `user:read:email`. |
| `created_at` | `string` | Date de création du compte, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const user = await twitch.users.getByLogin("twitchdev");
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-users)

## me

```ts nocheck
twitch.users.me(options?): Promise<User>
```

Renvoie l'utilisateur à qui appartient le jeton utilisé pour l'appel. Inclut `email` quand le jeton a le scope `user:read:email`.

**Jeton :** utilisateur.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<User>`

<details>
<summary>Champs de User</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'utilisateur. |
| `login` | `string` | Nom de connexion : en minuscules, celui qui apparaît dans les URL. |
| `display_name` | `string` | Nom d'affichage, avec les majuscules choisies par l'utilisateur. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Rôle au sein du personnel de Twitch. Une chaîne vide pour un utilisateur ordinaire. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Statut de monétisation. Une chaîne vide pour un diffuseur ordinaire. |
| `description` | `string` | Description de la chaîne rédigée par l'utilisateur. |
| `profile_image_url` | `string` | URL de la photo de profil. |
| `offline_image_url` | `string` | URL de l'image affichée quand la chaîne est hors ligne. |
| `view_count` | `number` | Obsolète. Twitch ne renseigne plus ce champ. |
| `email` | `string` | Adresse e-mail vérifiée. Présente uniquement quand l'appel est fait avec un jeton de cet utilisateur doté du scope `user:read:email`. |
| `created_at` | `string` | Date de création du compte, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const me = await twitch.users.me();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-users)

## update

```ts nocheck
twitch.users.update(params, options?): Promise<User>
```

Met à jour la description de l'utilisateur qui fait l'appel.

**Jeton :** utilisateur, scope `user:edit`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `description` | `string` | Nouvelle description de la chaîne, 300 caractères au plus. Une chaîne vide la supprime. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<User>`

<details>
<summary>Champs de User</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'utilisateur. |
| `login` | `string` | Nom de connexion : en minuscules, celui qui apparaît dans les URL. |
| `display_name` | `string` | Nom d'affichage, avec les majuscules choisies par l'utilisateur. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Rôle au sein du personnel de Twitch. Une chaîne vide pour un utilisateur ordinaire. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Statut de monétisation. Une chaîne vide pour un diffuseur ordinaire. |
| `description` | `string` | Description de la chaîne rédigée par l'utilisateur. |
| `profile_image_url` | `string` | URL de la photo de profil. |
| `offline_image_url` | `string` | URL de l'image affichée quand la chaîne est hors ligne. |
| `view_count` | `number` | Obsolète. Twitch ne renseigne plus ce champ. |
| `email` | `string` | Adresse e-mail vérifiée. Présente uniquement quand l'appel est fait avec un jeton de cet utilisateur doté du scope `user:read:email`. |
| `created_at` | `string` | Date de création du compte, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
await twitch.users.update({ description: "Live every evening." });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-user)

## authorization

```ts nocheck
twitch.users.authorization(params, options?): Promise<UserAuthorization[]>
```

Indique quels scopes les utilisateurs donnés ont accordés à votre application.

**Jeton :** application.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` <small>requis</small> | `string \| readonly string[]` | Identifiants des utilisateurs à vérifier. Autant que vous voulez : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserAuthorization[]>`

<details>
<summary>Champs de UserAuthorization</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant de l'utilisateur. |
| `user_name` | `string` | Nom d'affichage de l'utilisateur. |
| `user_login` | `string` | Nom de connexion de l'utilisateur. |
| `scopes` | `string[]` | Tous les scopes que l'utilisateur a accordés à votre identifiant client. |
| `has_authorized` | `boolean` | Indique si l'utilisateur a autorisé votre application, même sans aucun scope. |

</details>

### Exemple

```ts
const [auth] = await twitch.users.authorization({ user_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-authorization-by-user)

## blocks

```ts nocheck
twitch.users.blocks(params?, options?): Paginator<BlockedUser>
```

Liste les utilisateurs bloqués par un diffuseur, du plus récent au plus ancien.

**Jeton :** utilisateur, scope `user:read:blocked_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Diffuseur dont on lit la liste de blocage. Par défaut, l'utilisateur qui fait l'appel. |
| `first` | `number` | Éléments par page, de 1 à 100. Twitch en renvoie 20 par défaut. |
| `after` | `string` | Curseur de la page à récupérer. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<BlockedUser>`

<details>
<summary>Champs de BlockedUser</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant de l'utilisateur bloqué. |
| `user_login` | `string` | Nom de connexion de l'utilisateur bloqué. |
| `display_name` | `string` | Nom d'affichage de l'utilisateur bloqué. |

</details>

### Exemple

```ts
for await (const blocked of twitch.users.blocks()) console.log(blocked.user_login);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-user-block-list)

## block

```ts nocheck
twitch.users.block(params, options?): Promise<void>
```

Bloque un utilisateur au nom de l'utilisateur qui fait l'appel.

**Jeton :** utilisateur, scope `user:manage:blocked_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `target_user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à bloquer. |
| `source_context` | `"chat" \| "whisper"` | Endroit où s'est produit le comportement qui motive le blocage. |
| `reason` | `"harassment" \| "spam" \| "other"` | Raison du blocage de l'utilisateur. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.users.block({ target_user_id: "198704263", reason: "spam" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#block-user)

## unblock

```ts nocheck
twitch.users.unblock(params, options?): Promise<void>
```

Lève un blocage posé par l'utilisateur qui fait l'appel.

**Jeton :** utilisateur, scope `user:manage:blocked_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `target_user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à débloquer. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.users.unblock({ target_user_id: "198704263" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#unblock-user)

## extensions

```ts nocheck
twitch.users.extensions(options?): Promise<UserExtension[]>
```

Liste les extensions installées par l'utilisateur qui fait l'appel. Les extensions inactives ne sont incluses qu'avec le scope `user:edit:broadcast`.

**Jeton :** utilisateur, scope `user:read:broadcast` ou `user:edit:broadcast`.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserExtension[]>`

<details>
<summary>Champs de UserExtension</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'extension. |
| `version` | `string` | Version installée. |
| `name` | `string` | Nom de l'extension. |
| `can_activate` | `boolean` | Indique si l'extension est configurée et prête à être activée. |
| `type` | `ExtensionType[]` | Emplacements dans lesquels cette extension peut être activée. |

</details>

### Exemple

```ts
const extensions = await twitch.users.extensions();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-user-extensions)

## activeExtensions

```ts nocheck
twitch.users.activeExtensions(params?, options?): Promise<ActiveExtensions>
```

Renvoie les extensions actives d'un diffuseur, emplacement par emplacement.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Diffuseur à lire. Facultatif avec un jeton utilisateur, obligatoire avec un jeton d'application. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ActiveExtensions>`

<details>
<summary>Champs de ActiveExtensions</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `panel` | `Record<string, ExtensionSlot>` | Extensions de type panneau, affichées sous la vidéo. |
| `overlay` | `Record<string, ExtensionSlot>` | Extensions de type overlay, affichées par-dessus toute la vidéo. |
| `component` | `Record<string, ComponentExtensionSlot>` | Extensions de type composant, affichées par-dessus une partie de la vidéo. |

</details>

### Exemple

```ts
const active = await twitch.users.activeExtensions({ user_id: "141981764" });
console.log(active.panel["1"]);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-user-active-extensions)

## updateExtensions

```ts nocheck
twitch.users.updateExtensions(params, options?): Promise<ActiveExtensions>
```

Active, désactive ou déplace les extensions de l'utilisateur qui fait l'appel.

**Jeton :** utilisateur, scope `user:edit:broadcast`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `data` <small>requis</small> | `{ panel?: Record<string, ExtensionSlot> \| undefined; overlay?: Record<string, ExtensionSlot> \| undefined; component?: Record<string, ComponentExtensionSlot> \| undefined; }` | Emplacements à modifier, par type puis par numéro d'emplacement. Ceux que vous omettez restent tels quels. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ActiveExtensions>`

<details>
<summary>Champs de ActiveExtensions</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `panel` | `Record<string, ExtensionSlot>` | Extensions de type panneau, affichées sous la vidéo. |
| `overlay` | `Record<string, ExtensionSlot>` | Extensions de type overlay, affichées par-dessus toute la vidéo. |
| `component` | `Record<string, ComponentExtensionSlot>` | Extensions de type composant, affichées par-dessus une partie de la vidéo. |

</details>

### Exemple

```ts
await twitch.users.updateExtensions({
  data: { panel: { "1": { active: true, id: "rh6jq1q334hqc2rr1qlzqbvwlfl3x0", version: "1.1.0" } } },
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-user-extensions)
