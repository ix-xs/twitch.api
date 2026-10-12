---
title: "Les jetons en un coup d'œil"
description: "Les deux sortes de jetons Twitch, le flux qui convient à votre application, et ce que la bibliothèque fait des jetons pour que vous n'ayez pas à le faire."
sidebar:
  order: 1
---

Chaque requête à l'API Twitch porte un jeton d'accès. Il en existe deux sortes : le jeton d'application, qui identifie votre application, et le jeton utilisateur, qu'un utilisateur accorde à votre application pour qu'elle agisse en son nom. Cette page vous dit lequel il vous faut, comment l'obtenir, et ce que le client en fait ensuite.

## Un premier exemple

Avec un identifiant client et un secret client, le client demande lui-même le jeton d'application. Enregistrer un jeton utilisateur donne accès aux endpoints qui agissent au nom de cet utilisateur.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// Données publiques : le jeton d'application est demandé lors de ce premier appel.
const user = await twitch.users.getByLogin("twitchdev");

// Agir au nom de quelqu'un : enregistrez son jeton une fois.
const broadcaster = await twitch.auth.addUser({ accessToken, refreshToken });
await twitch.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });
```

## Jetons d'application et jetons utilisateur

| | Jeton d'application | Jeton utilisateur |
| --- | --- | --- |
| Identifie | Votre application | Un utilisateur qui a autorisé votre application |
| S'obtient avec | L'identifiant client et le secret client | Un flux dans lequel l'utilisateur approuve une liste de scopes |
| Sert à | Les données publiques (`users.get`, `streams.get`, `games.top`, `search.channels`), les abonnements par webhook et par conduit, les quelques endpoints réservés aux applications (`conduits.list`, `users.authorization`) | Tout ce qui lit des données privées ou agit au nom de l'utilisateur (`users.me`, `streams.followed`, `polls.create`, `channels.update`), et les abonnements par WebSocket |
| Scopes | Aucun | Ceux que l'utilisateur a accordés, listés dans [Scopes](/reference/scopes/) |
| Renouvellement | Demandé de nouveau avec le secret client | Rafraîchi avec son jeton de rafraîchissement |
| Limite de débit | Un compartiment pour l'application | Un compartiment par utilisateur |

Chaque endpoint accepte un jeton d'application, un jeton utilisateur, ou l'un comme l'autre. La page de référence de chaque méthode l'indique sous « Jeton », par exemple [users.me](/reference/api/users/#me). Vous ne passez jamais le jeton vous-même : le client lit ce que l'endpoint accepte et en choisit un. Sur un endpoint qui accepte les deux sortes, `{ as: "app" }` impose le jeton d'application. Les règles se trouvent dans [Agir au nom d'un utilisateur](/basics/acting-as-a-user/).

## Choisir un flux

Un flux est la façon dont un utilisateur remet un jeton à votre application. Choisissez-le d'après l'endroit où tourne votre code.

| Votre application | Flux | Secret client | Comment |
| --- | --- | --- | --- |
| Serveur web | Code d'autorisation | Obligatoire | [Flux par code d'autorisation](/auth/authorization-code/) |
| CLI, application de bureau, bot sur votre propre machine | Code d'appareil | Inutile | [Flux par code d'appareil](/auth/device-code/) |
| Application qui tourne uniquement dans le navigateur, sans backend | Code d'appareil, ou implicite | Ne doit pas s'y trouver | [Flux par code d'appareil](/auth/device-code/), ou le flux implicite ci-dessous |
| Tâche de backend sans utilisateur | Aucun, le jeton d'application suffit | Obligatoire | Construisez le client avec `clientId` et `clientSecret` |

Un bot qui tourne toujours sous le même compte correspond à la deuxième ligne : connectez-vous une fois avec le flux par code d'appareil, gardez le jeton dans un magasin, et le bot démarre sans rien redemander. Voir [Stocker les jetons](/auth/storing-tokens/).

### Le flux implicite

Le flux implicite renvoie un jeton d'accès dans le fragment de l'URL de redirection, sans jeton de rafraîchissement. `authorizeUrl` construit son URL quand vous donnez à `responseType` la valeur `"token"`, et `addUser` enregistre le jeton qu'il renvoie.

```ts
const url = twitch.auth.authorizeUrl({
  redirectUri: "https://example.com/",
  scopes: ["user:read:follows"],
  responseType: "token",
  state,
});

// De retour sur votre page : #access_token=...&scope=...&state=...
const fragment = new URLSearchParams(location.hash.slice(1));
if (fragment.get("state") !== state) throw new Error("State mismatch");
const user = await twitch.auth.addUser({ accessToken: fragment.get("access_token")! });
```

Un tel jeton ne peut pas être renouvelé. Quand il expire, l'utilisateur est retiré et doit se reconnecter : c'est pourquoi le flux par code d'appareil est le meilleur choix dès que vous pouvez afficher un code.

## Ce que la bibliothèque fait pour vous

Une fois que le client connaît vos identifiants et vos utilisateurs, les jetons ne vous demandent plus aucun code.

- **Jeton d'application à la demande.** Le premier appel qui en a besoin le demande, et les appels faits au même moment partagent cette unique requête. Il est gardé en mémoire, demandé de nouveau 60 secondes avant son expiration, et demandé de nouveau si Twitch le rejette. La requête elle-même est retentée après une panne réseau ou un `5xx`.
- **Rafraîchissement avant l'expiration.** Un jeton utilisateur qui expire dans les 60 secondes est rafraîchi avant l'envoi de la requête, à condition d'avoir un jeton de rafraîchissement. Les appels qui ont besoin du même rafraîchissement partagent une seule requête à Twitch.
- **Rafraîchissement après un vrai 401.** Quand Twitch répond `401`, le client demande à Twitch si le jeton est encore valide. Un jeton mort est renouvelé et l'appel est envoyé une seconde fois. Un jeton valide signifie que le `401` concerne autre chose, et l'erreur vous parvient telle quelle. [Erreurs](/basics/errors/) donne les détails.
- **Validation horaire.** Twitch exige des applications qui conservent des sessions utilisateur qu'elles valident leurs jetons toutes les heures. Un minuteur s'en charge dès qu'un utilisateur est enregistré, et il ne maintient jamais le processus en vie. Désactivez-le avec `validateTokens: false`.
- **Persistance.** Avec un magasin `tokens`, les utilisateurs sont restaurés à la première utilisation et chaque jeton nouveau ou rafraîchi y est réécrit. Sans magasin, les jetons vivent en mémoire.
- **Vérification des scopes.** Un jeton utilisateur auquel il manque le scope exigé par un endpoint échoue avec une `TwitchScopeError` avant l'envoi de toute requête.
- **Un jeton mort est signalé une seule fois.** Quand un jeton ne peut pas être renouvelé, l'utilisateur est retiré et l'événement `tokenInvalid` est émis. [Gérer les utilisateurs](/auth/managing-users/) montre comment réagir.

## Travailler sans secret client

Un client construit avec un `clientId` seul est un client public. Il ne peut pas demander de jeton d'application, et il n'en a pas besoin pour la plupart des usages.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: process.env.TWITCH_CLIENT_ID! });
await twitch.auth.addUser({ accessToken, refreshToken });

// Accepte les deux sortes de jeton : celui de l'utilisateur enregistré est utilisé.
const streams = await twitch.streams.get({ game_id: "509658" }).take(10);
```

| Ce que vous appelez | Sans secret client |
| --- | --- |
| Le flux par code d'appareil, le rafraîchissement, la validation, la révocation | Fonctionne |
| Un endpoint qui accepte les deux sortes de jeton | Utilise le jeton de l'utilisateur enregistré quand il y en a exactement un, ou de celui que vous désignez avec `{ as }`. Avec plusieurs utilisateurs et personne de désigné, l'appel échoue avec une `TwitchAuthError` qui vous demande de choisir |
| Un endpoint réservé aux applications, les webhooks, les conduits | Échoue avec une `TwitchAuthError` indiquant que l'appel « needs an app access token, which requires a clientSecret » |
| `twitch.auth.exchangeCode()` | Échoue avec `A clientSecret is required to exchange an authorization code.` |

:::caution
Gardez le secret client sur un serveur. Tout ce qui est livré à un navigateur, à une application de bureau ou à une CLI peut être lu par ses utilisateurs : construisez ces clients avec le `clientId` seul.
:::

## Utiliser un jeton que vous gérez vous-même

Quand un jeton vient d'ailleurs et que vous ne voulez pas que le client le gère, passez-le pour un seul appel avec l'option de requête `token`. Il est envoyé tel quel : pas de rafraîchissement, pas de vérification des scopes, pas de choix d'utilisateur.

```ts
const me = await twitch.users.me({ token: accessToken });
```

Pour lire le jeton d'application que détient le client, à l'intention d'un autre outil qui en a besoin, appelez `twitch.auth.appToken()`. La méthode renvoie un jeton valide et en demande un nouveau si nécessaire.

## Voir aussi

- [Flux par code d'autorisation](/auth/authorization-code/) : connecter des utilisateurs depuis un serveur web.
- [Flux par code d'appareil](/auth/device-code/) : se connecter depuis une CLI ou une application de bureau, sans secret.
- [Stocker les jetons](/auth/storing-tokens/) : conserver les utilisateurs d'un redémarrage à l'autre.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : comment le jeton de chaque appel est choisi.
- [Obtenir vos identifiants](/credentials/) : d'où viennent l'identifiant client et le secret client.
