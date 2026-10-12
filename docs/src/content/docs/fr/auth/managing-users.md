---
title: "Gérer les utilisateurs"
description: "Tout ce que twitch.auth fait des jetons utilisateur une fois que vous les avez : enregistrer, consulter, rafraîchir, valider, révoquer et retirer, et ce qui se passe quand un jeton meurt."
sidebar:
  order: 5
---

Pour le client, un utilisateur est un jeton utilisateur qu'on lui a confié : un jeton d'accès, le plus souvent un jeton de rafraîchissement, les scopes et le propriétaire. C'est avec `twitch.auth` que vous les enregistrez, les inspectez et les retirez. Les flux ([code d'autorisation](/auth/authorization-code/), [code d'appareil](/auth/device-code/)) enregistrent l'utilisateur pour vous. Cette page traite de tout le reste.

## Un premier exemple

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const bot = await twitch.auth.addUser({ accessToken, refreshToken });
console.log(bot.userId, bot.login, bot.scopes);

console.log(twitch.auth.hasUser(bot.userId)); // true
console.log(twitch.auth.users.length); // 1

await twitch.auth.removeUser(bot.userId, { revoke: true });
```

## Enregistrer un jeton

`twitch.auth.addUser(input)` enregistre un jeton utilisateur et renvoie le `UserToken` qui en résulte. Seul `accessToken` est obligatoire.

| Champ | Type | Signification |
| --- | --- | --- |
| `accessToken` | `string` | Le jeton d'accès. Obligatoire. |
| `refreshToken` | `string` | Le jeton de rafraîchissement. Sans lui, le jeton d'accès ne peut pas être renouvelé. |
| `userId` | `string` | Propriétaire du jeton. Demandé à Twitch quand il est omis. |
| `login` | `string` | Nom de connexion du propriétaire. |
| `scopes` | `string[]` | Scopes du jeton. Demandés à Twitch quand ils sont omis. |
| `expiresAt` | `number` ou `Date` | Le moment où le jeton d'accès expire : des millisecondes depuis l'époque Unix ou une `Date`. |
| `expiresIn` | `number` | Durée de vie en secondes, telle que Twitch la renvoie. Utilisée quand `expiresAt` est absent. |

Ce qui se passe dépend de ce que vous donnez.

```ts
import type { UserToken } from "@ix-xs/twitch.api";

declare const response: { access_token: string; refresh_token: string; expires_in: number };
declare const saved: UserToken;

// Un jeton d'accès seul. Le client demande à Twitch à qui il appartient, avec quels scopes, jusqu'à quand.
await twitch.auth.addUser({ accessToken });

// Avec un jeton de rafraîchissement, pour que le client puisse le renouveler.
await twitch.auth.addUser({ accessToken, refreshToken });

// La réponse de l'endpoint des jetons de Twitch, champ par champ.
await twitch.auth.addUser({
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  expiresIn: response.expires_in,
});

// Un jeton que vous avez sauvegardé plus tôt, propriétaire et scopes compris. Aucune requête n'est faite.
await twitch.auth.addUser(saved);

// La même chose, écrite en entier.
await twitch.auth.addUser({
  userId: "141981764",
  login: "twitchdev",
  accessToken,
  refreshToken,
  scopes: ["user:read:chat", "user:write:chat"],
  expiresAt: new Date("2026-10-12T18:00:00Z"),
});
```

Les règles derrière ces formes :

- Quand `userId` ou `scopes` manque, le client valide le jeton auprès de Twitch et tire de la réponse le propriétaire, le nom de connexion et les scopes, ainsi que l'expiration si vous n'en avez pas donné.
- Quand cette validation indique que le jeton d'accès est mort et que vous avez donné un jeton de rafraîchissement, le jeton est rafraîchi sur-le-champ. Le `UserToken` que vous recevez contient le nouveau jeton d'accès et le nouveau jeton de rafraîchissement.
- Quand vous donnez à la fois `userId` et `scopes`, le jeton est accepté tel quel et rien n'est envoyé. La vérification des scopes s'appuie alors sur la liste que vous avez donnée : passez donc la vraie.
- Un jeton dont l'expiration est inconnue n'est pas rafraîchi à l'avance. Il est rafraîchi quand Twitch le rejette, et la validation horaire renseigne l'expiration.
- Enregistrer un utilisateur déjà enregistré remplace son jeton.
- Le jeton est sauvegardé dans votre magasin, si vous en avez configuré un.

`addUser` échoue dans les cas suivants :

| Erreur | Quand |
| --- | --- |
| `TwitchApiError` de statut `401` | Le jeton d'accès est invalide et il n'y a pas de jeton de rafraîchissement pour le renouveler. |
| `TwitchApiError` | Le rafraîchissement tenté sur-le-champ a été refusé. |
| `TwitchAuthError: This is an app access token, not a user access token.` | Le jeton n'appartient à aucun utilisateur. |
| `TwitchAuthError: This token was issued to another application (client ID ...), so it cannot be used with client ID ....` | Le jeton a été accordé à un autre identifiant client que celui avec lequel le client a été construit. |
| `TwitchNetworkError` ou `TwitchTimeoutError` | Twitch était injoignable pour valider le jeton. |

Toutes viennent de l'étape de validation. Un jeton enregistré avec `userId` et `scopes` saute cette étape, et un jeton d'une autre application n'est alors découvert que lorsque Twitch refuse le premier appel.

## Consulter les utilisateurs

Trois membres synchrones lisent les utilisateurs chargés dans le client.

```ts
const everyone = twitch.auth.users; // UserToken[]
const token = twitch.auth.getUser("141981764"); // UserToken | undefined
const known = twitch.auth.hasUser("141981764"); // boolean

if (token && !token.scopes.includes("user:write:chat")) {
  console.log(`${token.login} has to sign in again to let the bot talk.`);
}
```

Ils ne voient que ce qui est en mémoire. Avec un magasin de jetons, les utilisateurs sont chargés à la première requête ou au premier `twitch.auth.restore()`, pas à la construction du client. Voir [Stocker les jetons](/auth/storing-tokens/).

Pour savoir ce qu'un utilisateur a autorisé sans détenir son jeton, une application peut le demander à Twitch avec [users.authorization](/reference/api/users/#authorization), qui utilise le jeton d'application.

## Rafraîchir, valider et révoquer

Vous avez rarement besoin de ces trois méthodes : le client rafraîchit et valide de lui-même. Elles existent pour les moments où vous voulez décider.

`twitch.auth.refresh(userId)` renouvelle le jeton d'accès tout de suite et renvoie le nouveau `UserToken`. Les appels faits au même moment pour le même utilisateur partagent une seule requête. Le nouveau jeton est sauvegardé dans le magasin et annoncé par l'événement `tokenRefresh`. La requête à Twitch est envoyée une fois et jamais répétée, parce qu'un jeton de rafraîchissement peut être à usage unique.

Avec un magasin de jetons, `refresh` lit d'abord le magasin. Quand le jeton qui y est sauvegardé diffère de celui en mémoire, un autre processus l'a déjà renouvelé : `refresh` renvoie ce jeton et n'envoie rien. [Stocker les jetons](/auth/storing-tokens/) explique comment des processus partagent un magasin.

```ts
const fresh = await twitch.auth.refresh(userId);
console.log(new Date(fresh.expiresAt ?? 0));
```

`twitch.auth.validate(token)` interroge Twitch sur n'importe quel jeton d'accès, enregistré ou non, et renvoie un `TokenInfo`. Elle lève une `TwitchApiError` de statut `401` quand le jeton n'est pas valide. La requête est retentée après une panne réseau ou un `5xx`, comme celle du jeton d'application.

```ts
const info = await twitch.auth.validate(accessToken);

console.log(info.userId, info.login); // null et null pour un jeton d'application
console.log(info.scopes, info.clientId);
console.log(`${info.expiresIn} seconds left`);
```

| Champ | Type | Contenu |
| --- | --- | --- |
| `clientId` | `string` | Identifiant client auquel le jeton a été délivré. |
| `userId` | `string` ou `null` | Propriétaire du jeton. `null` pour un jeton d'application. |
| `login` | `string` ou `null` | Nom de connexion du propriétaire. `null` pour un jeton d'application. |
| `scopes` | `string[]` | Scopes accordés au jeton. |
| `expiresIn` | `number` | Secondes restantes. `0` signifie que le jeton n'expire jamais. |
| `expiresAt` | `number`, facultatif | Expiration en millisecondes depuis l'époque Unix. Absent quand le jeton n'expire jamais. |

`twitch.auth.revoke(token)` invalide un jeton d'accès auprès de Twitch. Elle ne touche pas aux utilisateurs du client : pour révoquer et oublier quelqu'un en un seul appel, utilisez `removeUser` avec `revoke`.

## Retirer un utilisateur

`twitch.auth.removeUser(userId)` oublie un utilisateur : le jeton quitte la mémoire du client et votre magasin. Avec `{ revoke: true }`, le jeton d'accès est aussi révoqué auprès de Twitch, ce que doit faire un bouton « se déconnecter » ou « dissocier ».

```ts
await twitch.auth.removeUser(userId, { revoke: true });
```

- Retirer quelqu'un qui n'est pas enregistré ne fait rien.
- Un échec de la révocation est ignoré : l'utilisateur est retiré dans tous les cas.
- `tokenInvalid` n'est pas émis. Cet événement concerne les jetons qui sont morts, pas ceux que vous avez retirés.
- Un rafraîchissement en cours pour cet utilisateur échoue avec une `TwitchAuthError` au lieu de faire revenir l'utilisateur.

## La validation horaire

Twitch exige des applications qui gardent des utilisateurs connectés qu'elles valident leurs jetons toutes les heures, afin qu'un utilisateur qui déconnecte votre application soit repéré dans l'heure. Le client le fait pour vous.

- Le minuteur démarre quand le premier utilisateur est enregistré ou restauré, et s'arrête quand le dernier est retiré ou quand vous appelez `twitch.close()`.
- Il ne maintient jamais le processus en vie.
- Chaque passage est un `twitch.auth.validateAll()` : chaque jeton chargé est validé, ses scopes et son expiration sont mis à jour d'après la réponse de Twitch.
- Un jeton que Twitch déclare invalide est rafraîchi quand il a un jeton de rafraîchissement, et retiré quand il n'en a pas.
- Un passage qui ne peut pas joindre Twitch ne change rien. Le suivant réessaie.

Désactivez le minuteur avec `validateTokens: false` quand vous voulez lancer la validation selon votre propre calendrier, par exemple sur une plateforme sans processus de longue durée.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret, validateTokens: false });

// Plus tard, depuis votre propre planificateur :
await twitch.auth.validateAll();
```

## Quand un jeton meurt

Un jeton meurt quand son utilisateur déconnecte votre application dans ses paramètres Twitch ou change de mot de passe, quand un jeton de rafraîchissement d'un client public reste inutilisé pendant 30 jours, ou quand un jeton sans jeton de rafraîchissement expire. Le client s'en aperçoit à l'un de ces trois endroits :

| Où | Condition | Erreur |
| --- | --- | --- |
| Un rafraîchissement | Twitch répond que le jeton de rafraîchissement est invalide, et le magasin n'en contient pas de plus récent | `Twitch rejected the refresh token of user 123: ... The user has to authorize the app again.` |
| Un appel qui reçoit un `401` | Le jeton est mort et n'a pas de jeton de rafraîchissement | `The access token of user 123 is no longer valid and there is no refresh token to renew it. The user has to authorize the app again.` |
| La validation horaire | Le jeton est mort et n'a pas de jeton de rafraîchissement | `The token of user 123 is no longer valid.` |

À chaque fois, il se passe la même chose : l'utilisateur est retiré du client, le jeton est supprimé du magasin, et `tokenInvalid` est émis avec l'identifiant de l'utilisateur et une `TwitchAuthError`. Dans les deux premiers cas, l'appel qui est tombé sur le jeton mort est rejeté avec cette même erreur, dont le champ `userId` désigne l'utilisateur.

```ts
declare function askToSignInAgain(userId: string, reason: string): void;

twitch.on("tokenInvalid", (userId, error) => {
  askToSignInAgain(userId, error.message);
});
```

Ensuite, un appel pour cet utilisateur échoue avec `No token is registered for user 123. Add it with twitch.auth.addUser().` jusqu'à ce qu'il se reconnecte. Twitch révoque aussi les abonnements aux événements qui dépendaient de l'autorisation, ce que les écouteurs signalent par `onRevocation` : voir [Gérer les abonnements](/events/managing-subscriptions/).

Un rafraîchissement qui échoue pour une autre raison (le réseau, un `5xx`, une erreur qui ne concerne pas le jeton de rafraîchissement) est levé tel quel et l'utilisateur est conservé : une panne chez Twitch ne déconnecte donc personne.

## Plusieurs utilisateurs à la fois

Enregistrez autant d'utilisateurs qu'il vous en faut. Chacun a son propre jeton, ses propres scopes et son propre compartiment de limite de débit.

```ts
declare const botTokens: { accessToken: string; refreshToken: string };

const broadcaster = await twitch.auth.addUser({ accessToken, refreshToken });
const bot = await twitch.auth.addUser(botTokens);

// Le broadcaster_id désigne un utilisateur enregistré : son jeton est utilisé.
await twitch.polls.create({
  broadcaster_id: broadcaster.userId,
  title: "Next game?",
  choices: ["Hades", "Celeste"],
  duration: 120,
});

// Rien dans cet appel ne dit qui envoie le message : désignez le bot.
await twitch.chat.send(
  { broadcaster_id: broadcaster.userId, message: "The poll is open" },
  { as: bot.userId },
);
```

Avec un seul utilisateur enregistré, les appels qui ont besoin d'un jeton utilisateur utilisent cet utilisateur. Avec plusieurs, le client lit la requête pour trouver le jeton qui convient. Quand il ne peut pas trancher, l'appel échoue avec une `TwitchAuthError` qui vous demande de choisir avec `{ as: userId }` ou `twitch.as(userId)`. Sans le `{ as: bot.userId }` ci-dessus, le message serait :

```text
POST /chat/messages does not say who is acting and several users are registered. Set "sender_id", or choose a user with { as: userId } or twitch.as(userId).
```

L'ordre exact se trouve dans [Agir au nom d'un utilisateur](/basics/acting-as-a-user/).

Pour faire la même chose pour tout le monde, parcourez les utilisateurs et désignez chacun d'eux :

```ts
for (const user of twitch.auth.users) {
  const live = await twitch.streams.followed({}, { as: user.userId }).take(5);
  console.log(user.login, live.map((stream) => stream.user_name));
}
```

## Voir aussi

- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : comment le jeton de chaque appel est choisi.
- [Stocker les jetons](/auth/storing-tokens/) : conserver les utilisateurs d'un redémarrage à l'autre.
- [Observabilité](/basics/observability/) : les événements `tokenRefresh` et `tokenInvalid`.
- [Erreurs](/reference/errors/) : `TwitchAuthError` et `TwitchScopeError` en détail.
- [Scopes](/reference/scopes/) : ce que chaque scope débloque.
