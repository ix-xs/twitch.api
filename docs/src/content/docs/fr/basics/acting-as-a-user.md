---
title: "Agir au nom d'un utilisateur"
description: "Enregistrez les jetons utilisateur une fois et laissez le client choisir le bon pour chaque appel. Cette page donne les règles exactes de ce choix, et comment passer outre."
sidebar:
  order: 2
---

Envoyer un message dans le chat, bannir quelqu'un ou lancer un sondage se fait au nom d'un utilisateur Twitch, avec un jeton que cet utilisateur a accordé à votre application. Vous enregistrez le jeton une fois. Ensuite, chaque appel trouve le jeton dont il a besoin, et le champ qui indique qui agit se remplit tout seul.

## Un premier exemple

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

// Enregistrer le jeton du compte de votre bot.
const bot = await twitch.auth.addUser({ accessToken, refreshToken });
console.log(bot.userId, bot.login, bot.scopes);

// Les deux appels sont faits avec le jeton du bot.
await twitch.chat.send({ broadcaster_id: channelId, message: "Hello chat" });
await twitch.moderation.ban({ broadcaster_id: channelId, user_id: "9876", duration: 600, reason: "Spam" });
```

Aucun des deux appels ne dit qui agit. `sender_id` et `moderator_id` reçoivent l'identifiant du bot, parce que le bot est le seul utilisateur enregistré.

## Enregistrer un jeton utilisateur

`twitch.auth.addUser` prend un jeton d'accès et, quand vous en avez un, le jeton de rafraîchissement qui permet au client de le renouveler. Sauf si vous les fournissez vous-même, la méthode demande à Twitch à qui appartient le jeton et quels scopes il possède. Elle renvoie un `UserToken` : `userId`, `login`, `scopes`, `accessToken`, `refreshToken`, `expiresAt`.

Dans une application terminée, vous l'appelez rarement à la main :

- Les flux de connexion enregistrent l'utilisateur pour vous. Voir [Flux par code d'autorisation](/auth/authorization-code/) et [Flux par code d'appareil](/auth/device-code/).
- Un magasin de jetons ramène les utilisateurs enregistrés après un redémarrage. Voir [Stocker les jetons](/auth/storing-tokens/).

[Gérer les utilisateurs](/auth/managing-users/) liste tout ce que `addUser` accepte, et comment lister, rafraîchir et retirer des utilisateurs.

## Laisser l'utilisateur qui agit par défaut

Beaucoup d'endpoints ont un paramètre qui désigne l'utilisateur qui agit. Il est facultatif dans cette bibliothèque, et sa documentation indique « Defaults to the user making the call » (par défaut, l'utilisateur qui fait l'appel).

| Appel | Champ rempli |
| --- | --- |
| `chat.send` | `sender_id` |
| `moderation.ban`, `moderation.warn`, `chat.announce`, `chat.chatters` | `moderator_id` |
| `polls.create`, `channels.update`, `subscriptions.get`, `moderation.bans` | `broadcaster_id` |
| `channels.followed`, `streams.followed`, `subscriptions.check` | `user_id` |
| `clips.downloads` | `editor_id` |

Quand vous omettez le champ, il reçoit l'identifiant de l'utilisateur dont le jeton a été choisi pour l'appel. Vous pouvez toujours l'écrire vous-même, et avec plusieurs utilisateurs enregistrés, c'est ainsi que le client sait quel jeton utiliser.

```ts
declare const streamerId: string; // les deux utilisateurs sont enregistrés
declare const botId: string;

// Le jeton du diffuseur : `broadcaster_id` désigne un utilisateur enregistré.
await twitch.polls.create({
  broadcaster_id: streamerId,
  title: "Next game?",
  choices: ["Hades", "Celeste"],
  duration: 120,
});

// Le jeton du bot : `moderator_id` et `sender_id` le désignent.
await twitch.moderation.ban({ broadcaster_id: streamerId, moderator_id: botId, user_id: "9876" });
await twitch.chat.send({ broadcaster_id: streamerId, sender_id: botId, message: "Poll is open" });
```

## Comment le jeton est choisi

Chaque endpoint sait trois choses sur lui-même : s'il prend uniquement un jeton utilisateur, uniquement le jeton d'application, ou les deux ; quel paramètre désigne l'utilisateur qui agit, s'il y en a un ; et quels scopes un jeton utilisateur doit avoir. À partir de cela et de ce que vous avez passé, le client parcourt ces étapes et s'arrête à la première qui s'applique :

1. Vous avez passé `{ token }` dans les options de requête : ce jeton est envoyé tel quel. Rien de ce qui suit ne s'applique. Voir [Options de requête](/basics/request-options/).
2. Vous avez demandé le jeton d'application, avec `{ as: "app" }` ou en appelant à travers `twitch.as("app")`, et l'endpoint n'est pas réservé aux utilisateurs : le jeton d'application.
3. Vous avez désigné un utilisateur, avec `{ as: userId }` ou en appelant à travers `twitch.as(userId)`, et l'endpoint n'est pas réservé à l'application : le jeton de cet utilisateur.
4. Le paramètre de l'utilisateur qui agit contient, dans la requête, l'identifiant d'un utilisateur enregistré, et l'endpoint n'est pas réservé à l'application : le jeton de cet utilisateur.
5. L'endpoint prend uniquement un jeton utilisateur : le jeton de l'utilisateur enregistré s'il y en a exactement un. Sinon, l'appel échoue avec une `TwitchAuthError`.
6. L'endpoint prend les deux sortes et a un paramètre de l'utilisateur qui agit que vous avez omis : le jeton de l'utilisateur enregistré s'il y en a exactement un.
7. Le client a un secret client : le jeton d'application.
8. Pas de secret client, et l'endpoint prend les deux sortes : le jeton de l'utilisateur enregistré s'il y en a exactement un.
9. Rien ne convient : l'appel échoue avec une `TwitchAuthError`.

« Enregistré » inclut les utilisateurs sauvegardés dans le magasin de jetons que vous avez donné au client : ils sont chargés avant qu'un utilisateur soit choisi.

Une fois un jeton utilisateur choisi, il est d'abord renouvelé s'il expire dans la minute qui suit et s'il a un jeton de rafraîchissement, puis ses scopes sont vérifiés.

Si le paramètre de l'utilisateur qui agit est toujours vide après le choix et que le jeton n'est pas celui d'un utilisateur enregistré (étapes 1, 2 et 7), il n'y a personne pour le remplir. L'appel échoue avec une `TwitchAuthError` avant l'envoi de toute requête. La section « Quand aucun jeton ne convient » ci-dessous liste les messages.

## Dire qui agit

Quand la requête seule ne permet pas de trancher, désignez l'utilisateur. Pour un appel, passez `as` dans les options de requête, le dernier argument de chaque méthode :

```ts
await twitch.chat.announce({ broadcaster_id: channelId, message: "Stream starts in 5" }, { as: botId });

const me = await twitch.users.me({ as: userId });
```

Pour de nombreux appels, `twitch.as(userId)` renvoie une vue du client qui fait chaque appel au nom de cet utilisateur :

```ts
const asBot = twitch.as(botId);

await asBot.chat.send({ broadcaster_id: channelId, message: "Hello" });
await asBot.chat.setColor({ color: "blue_violet" });
console.log(asBot.userId); // l'identifiant du bot
```

Une vue est un client complet : mêmes groupes, mêmes méthodes. Elle partage les jetons, les limites de débit et les écouteurs du client dont elle est issue : en créer une ne coûte presque rien, et vous pouvez le faire partout où vous en avez besoin. `as` dans les options de requête d'un appel l'emporte sur la vue.

Aucune des deux formes ne vérifie l'utilisateur au moment où vous l'écrivez. Si aucun jeton n'est enregistré pour cet identifiant, c'est l'appel lui-même qui échoue avec `No token is registered for user 123. Add it with twitch.auth.addUser().`

## Les endpoints qui acceptent les deux sortes de jeton

Lire des données publiques (`users.get`, `streams.get`, `channels.get`, `chat.settings`) fonctionne avec l'une ou l'autre sorte. D'après l'étape 7, un tel appel part avec le jeton d'application même quand des utilisateurs sont enregistrés, ce qui évite de consommer les limites de débit des utilisateurs.

Certains de ces endpoints répondent davantage à un utilisateur. `users.get` n'inclut `email` que pour un jeton de ce même utilisateur doté du scope `user:read:email`. Désignez l'utilisateur pour l'obtenir :

```ts
const [profile] = await twitch.users.get({ id: userId }, { as: userId });
console.log(profile?.email);
```

Un endpoint le fait de lui-même. `channels.followers` ne renvoie la liste des followers qu'au diffuseur ou à un modérateur : il utilise donc l'utilisateur enregistré quand il y en a exactement un, et le jeton d'application sinon. Le nombre de followers revient avec n'importe quel jeton.

Des endpoints comme `chat.send` et `moderation.ban` acceptent aussi les deux sortes, et ont un paramètre de l'utilisateur qui agit. Les étapes 4 et 6 leur donnent un jeton utilisateur quand l'utilisateur qui agit que vous avez écrit est enregistré, ou quand vous l'avez omis et qu'un seul utilisateur est enregistré. D'après l'étape 7, ils partent avec le jeton d'application quand vous écrivez un utilisateur qui agit dont le jeton n'est pas enregistré.

### Forcer le jeton d'application

Pour utiliser le jeton d'application sur l'un de ces endpoints alors que l'utilisateur qui agit est enregistré, demandez-le par son nom. `"app"` se place là où irait un identifiant d'utilisateur : dans les options de requête d'un appel, ou dans une vue.

```ts
// Le jeton du bot est enregistré, mais ce message part avec le jeton d'application.
await twitch.chat.send(
  { broadcaster_id: channelId, sender_id: botId, message: "Sent with the app token" },
  { as: "app" },
);

const asApp = twitch.as("app");
const [profile] = await asApp.users.get({ id: botId });
```

Trois choses à savoir :

- Le jeton d'application n'appartient à aucun utilisateur : un paramètre de l'utilisateur qui agit n'est donc pas rempli. Écrivez-le, comme `sender_id` ci-dessus.
- Il lui faut un secret client, comme pour tout usage du jeton d'application.
- Un endpoint réservé aux utilisateurs le refuse : l'appel échoue avec une `TwitchAuthError`.

## Les endpoints réservés à l'application

Quelques endpoints ne prennent que le jeton d'application : le groupe `conduits`, `users.authorization`, `bits.extensionTransactions`, les produits Bits du groupe `extensions`, et les abonnements EventSub livrés à un webhook ou à un conduit. Ils utilisent le jeton d'application quel que soit celui qui agit, y compris dans une vue et avec `{ as }` :

```ts
const asBot = twitch.as(botId);

await asBot.conduits.list(); // jeton d'application
await asBot.chat.send({ broadcaster_id: channelId, message: "Hello" }); // le jeton du bot
```

Une vue peut donc être confiée à du code qui mélange les deux sortes d'appels.

## Les scopes sont vérifiés d'abord

Quand un jeton utilisateur est choisi et que l'endpoint liste des scopes, le client les compare aux scopes du jeton avant d'envoyer quoi que ce soit. Un seul scope correspondant suffit. Si aucun ne correspond, l'appel lève une `TwitchScopeError` :

```
TwitchScopeError: The token of user 123 is missing the "moderator:manage:banned_users" scope required by POST /moderation/bans.
```

L'erreur porte ce qu'il vous faut pour renvoyer l'utilisateur vers l'autorisation :

```ts
import { TwitchScopeError } from "@ix-xs/twitch.api";

try {
  await twitch.moderation.ban({ broadcaster_id: channelId, user_id: "9876" });
} catch (error) {
  if (!(error instanceof TwitchScopeError)) throw error;
  console.log(error.userId); // à qui appartenait le jeton
  console.log(error.required); // les scopes qui conviendraient, un seul suffit
  console.log(error.granted); // les scopes que possède le jeton
}
```

La vérification ne s'exécute que pour les jetons utilisateur enregistrés. Avec le jeton d'application ou un jeton passé avec `{ token }`, c'est Twitch qui vérifie, et une permission manquante revient sous la forme d'une `TwitchApiError`. Le scope nécessaire à chaque méthode figure dans sa documentation et dans la [liste des scopes](/reference/scopes/).

## Quand aucun jeton ne convient

Le message de l'erreur indique dans quel cas vous vous trouvez.

| Situation | Message |
| --- | --- |
| Un endpoint réservé aux utilisateurs, aucun utilisateur enregistré | `GET /users needs a user access token and no user is registered. Add one with twitch.auth.addUser().` |
| Un endpoint réservé aux utilisateurs, plusieurs utilisateurs enregistrés, aucun désigné | `GET /users needs a user access token and several users are registered. Choose one with { as: userId } or twitch.as(userId).` |
| Un endpoint réservé aux utilisateurs, plusieurs utilisateurs enregistrés, la requête en désigne un autre | `GET /polls needs the token of user 123, which is not registered. Add it with twitch.auth.addUser() or choose a user with { as: userId }.` |
| `as` désigne un utilisateur sans jeton | `No token is registered for user 123. Add it with twitch.auth.addUser().` |
| Un endpoint qui prend les deux sortes, son paramètre de l'utilisateur qui agit omis, plusieurs utilisateurs enregistrés | `POST /chat/messages does not say who is acting and several users are registered. Set "sender_id", or choose a user with { as: userId } or twitch.as(userId).` |
| Le même appel fait avec le jeton d'application alors qu'aucun utilisateur n'est enregistré, ou avec `{ as: "app" }` | `POST /chat/messages needs "sender_id": the call is made with the app token, which belongs to no user. Set "sender_id", or register the acting user with twitch.auth.addUser().` |
| Pas de secret client, un endpoint qui prend les deux sortes, plusieurs utilisateurs enregistrés | `GET /streams can use a user token, but several users are registered. Choose one with { as: userId } or twitch.as(userId).` |
| Pas de secret client, un endpoint qui prend les deux sortes, aucun utilisateur enregistré | `GET /streams needs an app access token, which requires a clientSecret (or a registered user token).` |
| Un endpoint réservé à l'application, pas de secret client | `GET /eventsub/conduits needs an app access token, which requires a clientSecret.` |

Toutes sont des `TwitchAuthError`, levées avant l'envoi de toute requête. Avec exactement un utilisateur enregistré, un endpoint réservé aux utilisateurs utilise toujours cet utilisateur, même quand la requête désigne quelqu'un d'autre. Twitch répond alors par un `401` indiquant que l'identifiant doit correspondre au jeton, que le client lève sous la forme d'une `TwitchApiError`. Voir [Erreurs](/basics/errors/).

## Voir aussi

- [Vue d'ensemble de l'authentification](/auth/overview/) : jetons d'application, jetons utilisateur et comment les obtenir.
- [Gérer les utilisateurs](/auth/managing-users/) : ajouter, lister, rafraîchir et retirer des utilisateurs enregistrés.
- [Options de requête](/basics/request-options/) : `as`, `token` et les autres réglages par appel.
- [Scopes](/reference/scopes/) : chaque scope et les méthodes qu'il débloque.
- [Dépannage](/help/troubleshooting/) : les erreurs ci-dessus, symptôme par symptôme.
