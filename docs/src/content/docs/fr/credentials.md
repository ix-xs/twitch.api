---
title: "Obtenir vos identifiants"
description: "Enregistrez une application dans la console développeur de Twitch, retrouvez son identifiant client et son secret client, et gardez-les hors de votre code."
---

Chaque requête à l'API Twitch est faite au nom d'une application. En enregistrer une prend quelques minutes et vous donne deux valeurs : un identifiant client, et un secret client quand votre code tourne sur un serveur.

## Enregistrer une application

Connectez-vous à la [console développeur de Twitch](https://dev.twitch.tv/console/apps) avec votre compte Twitch et enregistrez une nouvelle application. Twitch vous demande d'abord d'activer l'authentification à deux facteurs sur le compte.

Le formulaire comporte quatre champs :

| Champ | Ce qu'il faut saisir |
| --- | --- |
| Name | Un nom unique sur tout Twitch. Les utilisateurs le voient sur l'écran de consentement quand ils autorisent votre application. |
| OAuth redirect URLs | Les adresses vers lesquelles Twitch peut renvoyer les utilisateurs après qu'ils ont autorisé votre application. Les URL doivent utiliser HTTPS, sauf celles en `http://localhost`. Si vous n'avez pas encore de serveur, `http://localhost:3000` fera l'affaire. Vous pouvez ajouter et modifier des URL plus tard. |
| Category | Le genre d'application : un bot de chat, une intégration à un site web, une intégration à un jeu, etc. Choisissez le plus proche. |
| Client type | Confidential quand votre code tourne sur un serveur que vous contrôlez et qui peut garder un secret. Public quand il tourne sur la machine de l'utilisateur : un navigateur, une application de bureau, une application mobile, un outil en ligne de commande. |

L'URL de redirection ne compte que pour le flux par code d'autorisation, où elle doit correspondre à celle qu'envoie votre code, au caractère près. Voir [Flux par code d'autorisation](/auth/authorization-code/).

## Trouver l'identifiant client et le secret client

Ouvrez l'application depuis la liste de la console. Sa page affiche l'identifiant client. Pour une application confidentielle, la même page vous permet de générer un secret client. Twitch n'affiche le secret qu'une fois, copiez-le donc tout de suite. Une application publique n'a pas de secret.

| Valeur | Ce que c'est | Ce qu'elle permet |
| --- | --- | --- |
| Identifiant client | L'identifiant public de votre application. Il est envoyé avec chaque requête et apparaît dans les URL d'autorisation. | À lui seul : le flux par code d'appareil, et les appels à l'API faits avec des jetons utilisateur. |
| Secret client | Le mot de passe de votre application. | Les jetons d'application, qui suffisent pour toutes les données publiques et pour les événements par webhook et par conduit. Il est aussi nécessaire pour terminer le flux par code d'autorisation. |

Avec les deux, le client peut appeler tout de suite chaque endpoint qui sert des données publiques, comme dans le [Démarrage rapide](/quick-start/). Les endpoints qui agissent pour quelqu'un (envoyer un message dans le chat, bannir un utilisateur, créer un sondage) demandent en plus un jeton utilisateur. La [Vue d'ensemble de l'authentification](/auth/overview/) explique les deux sortes de jeton.

## Les garder dans des variables d'environnement

N'écrivez pas ces valeurs dans votre code source. Placez-les dans un fichier `.env` :

```ini title=".env"
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
```

Node.js charge le fichier avec l'option `--env-file`, sans paquet supplémentaire :

```bash
node --env-file=.env index.mjs
```

Lisez les variables au moment de créer le client :

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
});
```

Le constructeur lève une `TwitchError` quand `clientId` est absent ou vide : une variable oubliée se remarque ainsi au démarrage et non au premier appel.

Gardez le fichier `.env` hors du contrôle de version. Ajoutez-le à `.gitignore` avant le premier commit, avec le fichier où vos jetons sont enregistrés si vous en utilisez un :

```ini title=".gitignore"
.env
tokens.json
```

Sur une plateforme d'hébergement, utilisez son propre stockage de secrets (les variables d'environnement du service, ou les secrets d'un Cloudflare Worker) plutôt qu'un fichier.

:::caution
Le secret client ne doit jamais atteindre un navigateur, une application mobile ou un dépôt public. Quiconque le possède peut demander des jetons au nom de votre application.
:::

## Quand le secret fuite

Générez un nouveau secret depuis la page de l'application dans la console. Le précédent cesse de fonctionner dès cet instant : mettez donc la variable à jour partout où votre code tourne, puis redémarrez-le.

Le client demande alors un nouveau jeton d'application avec le nouveau secret. Les jetons utilisateur sont eux aussi rafraîchis avec le secret, une raison de plus de le mettre à jour partout en même temps.

Si la fuite a aussi exposé des jetons utilisateur, par exemple un `tokens.json` ajouté au dépôt, révoquez-les et demandez aux utilisateurs d'autoriser de nouveau votre application :

```ts
await twitch.auth.revoke(accessToken);
```

## Travailler sans secret

Une application publique n'a qu'un identifiant client. Créez le client sans `clientSecret` et connectez les utilisateurs avec le flux par code d'appareil, qui n'en demande jamais :

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: process.env.TWITCH_CLIENT_ID! });

const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat", "user:write:chat"] });
console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
const user = await flow.wait();
```

Une fois cet utilisateur enregistré, les endpoints qui acceptent l'une ou l'autre sorte de jeton sont appelés avec le sien. Avec plusieurs utilisateurs enregistrés, indiquez qui agit, comme décrit dans [Agir au nom d'un utilisateur](/basics/acting-as-a-user/). Le flux lui-même est présenté dans [Flux par code d'appareil](/auth/device-code/).

Trois choses restent hors de portée sans secret :

- Lire des données publiques avant qu'un utilisateur se soit connecté. L'appel échoue avec une `TwitchAuthError` dont le message indique qu'il faut un jeton d'application, lequel exige un `clientSecret`.
- Les endpoints qui n'acceptent qu'un jeton d'application, comme le groupe des conduits et les abonnements par webhook.
- Le flux par code d'autorisation : `twitch.auth.exchangeCode` lève une `TwitchAuthError` sans secret.

## Voir aussi

- [Démarrage rapide](/quick-start/) : un premier programme avec ces deux valeurs.
- [Vue d'ensemble de l'authentification](/auth/overview/) : jetons d'application, jetons utilisateur et quel flux convient à votre application.
- [Stocker les jetons](/auth/storing-tokens/) : où vont les jetons utilisateur entre deux exécutions.
- [Runtimes](/basics/runtimes/) : pourquoi un navigateur ne doit jamais détenir le secret client.
