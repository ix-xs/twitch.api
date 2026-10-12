---
title: "Démarrage rapide"
description: "Installez la bibliothèque, créez un client et faites vos premiers appels à l'API Twitch. Les données publiques ne demandent rien de plus qu'un identifiant client et un secret client."
---

Cette page vous mène d'un dossier vide à un programme qui lit un profil utilisateur et liste des streams en direct. Elle n'utilise que des données publiques : vous n'avez donc pas encore besoin d'un jeton utilisateur.

## Installer

```bash
npm install @ix-xs/twitch.api
```

La bibliothèque demande Node.js 22 ou une version ultérieure. Elle fonctionne aussi sur Bun, Deno et Cloudflare Workers, voir [Runtimes](/basics/runtimes/). Elle n'a aucune dépendance.

## Créer le client

L'identifiant client et le secret client proviennent d'une application que vous enregistrez dans la console développeur de Twitch : [Obtenir vos identifiants](/credentials/) détaille la marche à suivre. Placez-les dans un fichier `.env` à côté de votre code :

```ini title=".env"
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
```

Créez ensuite le client. Une seule instance couvre toute l'API, et vous pouvez la garder pendant toute la durée de vie de votre programme.

```ts title="index.mjs"
import { Twitch } from "@ix-xs/twitch.api";

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;
if (!TWITCH_CLIENT_ID) throw new Error("TWITCH_CLIENT_ID is not set");

const twitch = new Twitch({
  clientId: TWITCH_CLIENT_ID,
  clientSecret: TWITCH_CLIENT_SECRET,
});
```

Créer le client n'envoie rien à Twitch. La première requête part avec votre premier appel.

## Faire un premier appel

Chaque endpoint est une méthode d'un groupe du client. `users.getByLogin` recherche un utilisateur par son nom de connexion et renvoie `null` quand personne ne porte ce nom.

```ts
const user = await twitch.users.getByLogin("twitchdev");

if (user) {
  console.log(user.id, user.display_name, user.created_at);
}
```

Conservez l'`id` : la plus grande partie de l'API Twitch travaille avec des identifiants d'utilisateur, pas avec des noms de connexion.

## Lire une liste

Les endpoints qui renvoient une liste vous donnent un paginateur. Parcourez-le avec `for await` pour obtenir tous les éléments, page après page, ou demandez les premiers avec `take()`.

```ts
// Tous les streams en direct en français, les plus regardés d'abord.
for await (const stream of twitch.streams.get({ language: "fr" })) {
  console.log(stream.user_name, stream.viewer_count);
  if (stream.viewer_count < 1000) break; // sortir de la boucle arrête la pagination
}

// Les dix streams les plus regardés, en une seule requête.
const top = await twitch.streams.get().take(10);
console.log(top.map((stream) => stream.user_login));
```

[Pagination](/basics/pagination/) présente les autres façons de lire une liste : une page à la fois, tout dans un tableau, ou seulement le total.

## Lancer le programme

Voici le programme complet.

```ts title="index.mjs"
import { Twitch } from "@ix-xs/twitch.api";

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;
if (!TWITCH_CLIENT_ID) throw new Error("TWITCH_CLIENT_ID is not set");

const twitch = new Twitch({
  clientId: TWITCH_CLIENT_ID,
  clientSecret: TWITCH_CLIENT_SECRET,
});

const user = await twitch.users.getByLogin("twitchdev");
if (user) console.log(user.id, user.display_name, user.created_at);

const top = await twitch.streams.get().take(10);
for (const stream of top) {
  console.log(stream.user_name, stream.game_name, stream.viewer_count);
}
```

```bash
node --env-file=.env index.mjs
```

Les exemples de ce site sont écrits en TypeScript. Celui-ci ne contient aucune annotation de type, il s'exécute donc aussi comme du JavaScript ordinaire.

## Ce qui s'est passé en coulisses

Vous avez écrit deux appels. Le client a fait le reste :

- Il a demandé un jeton d'application avec votre identifiant client et votre secret client quand le premier appel en a eu besoin, et il réutilise ce jeton jusqu'à ce qu'il soit sur le point d'expirer.
- Il a envoyé le jeton et l'identifiant client avec chaque requête, et lu les en-têtes de limite de débit de chaque réponse. Quand la limite est atteinte, les requêtes attendent sa réinitialisation au lieu d'échouer.
- Il a demandé la bonne taille de page : 10 éléments pour `take(10)`, des pages de 100 pour la boucle `for await`.
- Il aurait transformé un échec en erreur typée, par exemple une `TwitchApiError` avec le statut et le message envoyés par Twitch. Voir [Erreurs](/basics/errors/).

## Utiliser CommonJS

Le paquet est livré à la fois en modules ES et en CommonJS. Avec `require`, placez vos appels dans une fonction `async`, puisque CommonJS n'a pas d'`await` au niveau supérieur.

```js title="index.cjs"
const { Twitch } = require("@ix-xs/twitch.api");

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
});

async function main() {
  const user = await twitch.users.getByLogin("twitchdev");
  console.log(user?.display_name);
}

main();
```

## Voir aussi

- [Appeler l'API](/basics/calling-the-api/) : les groupes, les paramètres et ce que renvoie chaque sorte de méthode.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : envoyer des messages dans le chat, modérer et lancer des sondages avec des jetons utilisateur.
- [Vue d'ensemble des événements](/events/overview/) : recevoir les messages de chat, les follows et les passages en direct au moment où ils se produisent.
- [Bot de chat](/recipes/chat-bot/) : un programme complet à copier.
- [Référence](/reference/overview/) : chaque méthode, groupe par groupe.
