---
title: "Depuis la version 1"
description: "Ce qui a changé entre la version 1 et la version 2, pourquoi, et l'appel de la version 2 qui remplace chaque méthode de la version 1."
---

La version 2 est une réécriture. La version 1 enveloppait une douzaine d'endpoints en lecture seule avec un jeton d'application. La version 2 couvre toute l'API, les jetons utilisateur et EventSub, et sa forme a changé pour leur faire de la place. Aucun appel de la version 1 ne fonctionne tel quel, mais chacun a un remplaçant direct, et la conversion est mécanique.

## Avant et après

Le même programme dans les deux versions : chercher une chaîne, dire si elle est en direct, lister cinq clips.

```js title="before.js (version 1)"
const twitchAPI = require("@ix-xs/twitch.api");

const client = new twitchAPI({
  client_id: process.env.TWITCH_CLIENT_ID,
  client_secret: process.env.TWITCH_CLIENT_SECRET,
});

async function main() {
  await client.initialize();

  const users = await client.getUsers(["twitchdev"]);
  if (!users.ok) return console.error(users.statusText ?? users.error);
  console.log(users.result[0].display_name);

  const streams = await client.getStreams({ users_names: ["twitchdev"] });
  if (!streams.ok) return console.error(streams.statusText ?? streams.error);
  console.log(streams.result.length > 0 ? `Live: ${streams.result[0].title}` : "Offline");

  const clips = await client.getClips("twitchdev", { first: 5 });
  if (!clips.ok) return console.error(clips.statusText ?? clips.error);
  console.log(clips.result.map((clip) => clip.url));
}

main();
```

```ts title="after.ts (version 2)"
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("No such user");
console.log(user.display_name);

const [stream] = await twitch.streams.get({ user_id: user.id }).take(1);
console.log(stream ? `Live: ${stream.title}` : "Offline");

const clips = await twitch.clips.get({ broadcaster_id: user.id }).take(5);
console.log(clips.map((clip) => clip.url));
```

## Ce qui a changé et pourquoi

| | Version 1 | Version 2 | Pourquoi |
| --- | --- | --- | --- |
| Import | Le module est la classe | Un export nommé, `Twitch`, pour ESM et CommonJS | De la place à côté pour les classes d'erreur, les magasins et les types |
| Options | Documentées comme `clientId` et `clientSecret`, lues comme `client_id` et `client_secret` | `clientId` et `clientSecret` | Une seule écriture, celle qui est documentée |
| Démarrage | `await client.initialize()` | Rien | Les jetons sont demandés quand un appel en a besoin |
| Stockage des jetons | Un fichier `Token.json` écrit à l'intérieur de `node_modules` | Le jeton d'application reste en mémoire | Le fichier cassait sur les systèmes de fichiers en lecture seule, avec pnpm, dans les monorepos et à chaque réinstallation |
| Résultats | `{ ok: true, result }` ou `{ ok: false, ... }` | La valeur, ou une erreur levée | Une vérification de `ok` oubliée ne masque plus un échec |
| Identifiants | Noms de connexion et noms de jeux | Identifiants, comme l'API Twitch | Une seule requête par appel au lieu d'une recherche cachée au préalable, et la liste complète des paramètres de chaque endpoint |
| Listes | La première page, sous forme de tableau | Un paginateur | Toutes les pages sont accessibles, sans manipuler de curseurs |
| Méthodes | À plat : `client.getUsers` | Groupées : `twitch.users.get` | 155 méthodes ont besoin d'une table des matières |
| Runtime | CommonJS sur Node.js | Node.js 22 ou version suivante, Bun, Deno, Workers, navigateurs | Uniquement des API standard du web dans l'entrée principale |

## Mettre le paquet à jour

```bash
npm install @ix-xs/twitch.api@latest
```

La version 2 exige Node.js 22 ou une version suivante. Elle fournit ses propres déclarations de types et n'a aucune dépendance.

CommonJS fonctionne toujours. Seule la forme de l'import change :

```js
// Version 1
const twitchAPI = require("@ix-xs/twitch.api");

// Version 2
const { Twitch } = require("@ix-xs/twitch.api");
```

## Le constructeur

Renommez la classe et les deux options. Tout le reste de `TwitchOptions` est facultatif, voir [Options du client](/reference/client-options/).

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});
```

La version 1 lisait `client_id` et `client_secret`, quoi qu'en dise son README. La version 2 lit `clientId` et `clientSecret`, et lève une erreur immédiatement quand `clientId` est absent.

## Plus de initialize()

Supprimez l'appel. Dans la version 1, `initialize()` chargeait ou demandait le jeton d'application, le validait et démarrait une validation horaire. Dans la version 2 :

- le jeton d'application est demandé par le premier appel qui en a besoin et renouvelé avant d'expirer ;
- un jeton que Twitch rejette est remplacé et l'appel est renvoyé ;
- rien n'est écrit sur le disque, `Token.json` peut donc disparaître ;
- aucun minuteur ne maintient le processus en vie, un script se termine donc quand son travail est fini.

Les autres méthodes de jeton de la version 1 (`generateToken`, `isExpiredToken`, `refreshToken`, `validateToken`, `updateTokenFile`, `startPeriodicValidation`) n'ont pas de remplaçant parce qu'il ne leur reste rien à faire. Si vous avez besoin du jeton d'application pour un autre outil, `await twitch.auth.appToken()` en renvoie un valide.

## Des erreurs à la place de ok

La version 1 ne levait jamais d'erreur : chaque méthode renvoyait un objet à inspecter. La version 2 renvoie les données et lève des erreurs typées.

```ts
import { TwitchApiError, TwitchError } from "@ix-xs/twitch.api";

try {
  const games = await twitch.games.get({ name: ["Fortnite", "Minecraft"] });
  console.log(games.map((game) => game.id));
} catch (error) {
  if (error instanceof TwitchApiError) console.error(`Twitch answered ${error.status}: ${error.message}`);
  else if (error instanceof TwitchError) console.error(error.message);
  else throw error;
}
```

Trois choses remplacent les anciennes vérifications de `ok` :

- **Ne rien trouver n'est pas une erreur.** `users.getByLogin` et `users.getById` renvoient `null`. Les méthodes qui renvoient des tableaux omettent ce qui n'existe pas : `users.get({ login: ["nobody-has-this-login"] })` renvoie donc `[]`.
- **Un échec lève une erreur.** `TwitchApiError` porte le `status` que la version 1 réduisait à un `statusText`, ainsi que le message de Twitch et le corps de la réponse.
- **Les limites de débit et les pannes sont traitées d'abord.** Un `429` attend puis retente, un `5xx` sur une lecture est retenté. Vous ne voyez l'erreur que si cela n'a pas suffi.

[Erreurs](/basics/errors/) présente les classes et la façon de les distinguer.

## Des identifiants à la place des noms de connexion

La version 1 prenait des noms de connexion et des noms de jeux, et cherchait les identifiants dans votre dos, au prix d'une requête de plus par appel. La version 2 prend ce que prend l'API Twitch. Résolvez le nom de connexion une fois, puis réutilisez l'identifiant :

```ts
const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("No such user");

const settings = await twitch.chat.settings({ broadcaster_id: user.id });
const { data: emotes } = await twitch.chat.channelEmotes({ broadcaster_id: user.id });
const badges = await twitch.chat.channelBadges({ broadcaster_id: user.id });
```

Pour plusieurs noms de connexion, un seul appel renvoie tous les utilisateurs :

```ts
const users = await twitch.users.get({ login: ["twitchdev", "twitch"] });
const colors = await twitch.chat.colors({ user_id: users.map((user) => user.id) });
```

Les jeux fonctionnent de la même façon, par le nom d'abord :

```ts
const games = await twitch.games.get({ name: ["Fortnite", "Minecraft"] });
const page = await twitch.streams.get({ game_id: games.map((game) => game.id), first: 50 });
console.log(page.data.length);
```

Un identifiant d'utilisateur ne change jamais, un nom de connexion le peut. Si vous stockez des chaînes, stockez leurs identifiants.

Deux raccourcis vous épargnent la recherche : `streams.get` accepte toujours des noms de connexion directement dans `user_login`, et les appels à `getByLogin` faits au même moment sont fusionnés en une seule requête.

## Méthode par méthode

| Version 1 | Version 2 | Renvoie |
| --- | --- | --- |
| `client.getUsers(["twitchdev"])` | [`twitch.users.get({ login: ["twitchdev"] })`](/reference/api/users/#get) | `User[]` |
| `client.getStreams({ users_names })` | [`twitch.streams.get({ user_login })`](/reference/api/streams/#get) | Un paginateur de `Stream` |
| `client.getStreams({ games_names })` | [`twitch.games.get({ name })`](/reference/api/games/#get), puis [`twitch.streams.get({ game_id })`](/reference/api/streams/#get) | Un paginateur de `Stream` |
| `client.getCheermotes()` | [`twitch.bits.cheermotes()`](/reference/api/bits/#cheermotes) | `Cheermote[]` |
| `client.getChatEmotes()` | [`twitch.chat.globalEmotes()`](/reference/api/chat/#globalemotes) | `{ data, template }` |
| `client.getChatEmotes(login)` | [`twitch.chat.channelEmotes({ broadcaster_id })`](/reference/api/chat/#channelemotes) | `{ data, template }` |
| `client.getChatBadges()` | [`twitch.chat.globalBadges()`](/reference/api/chat/#globalbadges) | `ChatBadgeSet[]` |
| `client.getChatBadges(login)` | [`twitch.chat.channelBadges({ broadcaster_id })`](/reference/api/chat/#channelbadges) | `ChatBadgeSet[]` |
| `client.getChatSettings(login)` | [`twitch.chat.settings({ broadcaster_id })`](/reference/api/chat/#settings) | Un seul `ChatSettings` |
| `client.getUsersChatColor(logins)` | [`twitch.chat.colors({ user_id })`](/reference/api/chat/#colors) | `UserChatColor[]` |
| `client.getClips(login)` | [`twitch.clips.get({ broadcaster_id })`](/reference/api/clips/#get) | Un paginateur de `Clip` |
| `client.getTopGames()` | [`twitch.games.top()`](/reference/api/games/#top) | Un paginateur de `Game` |
| `client.getGames(names)` | [`twitch.games.get({ name })`](/reference/api/games/#get) | `Game[]` |
| `client.getVideos(login)` | [`twitch.videos.get({ user_id })`](/reference/api/videos/#get) | Un paginateur de `Video` |

Les autres paramètres ont gardé les noms que Twitch leur donne. Pour `getStreams`, cela signifie que `languages` est devenu `language`, tandis que `type`, `first`, `before` et `after` n'ont pas bougé. Le filtre `game_name` de `getVideos` est devenu `game_id`.

Deux valeurs de retour ont changé de forme, au-delà de la perte de l'enveloppe `{ ok, result }`. Les méthodes d'emotes renvoient un objet qui contient les emotes dans `data` et, à côté, le gabarit d'URL d'image `template`. `chat.settings` renvoie l'objet de réglages lui-même, pas un tableau d'un seul élément.

## Les listes sont désormais des paginateurs

`getStreams`, `getClips`, `getTopGames` et `getVideos` renvoyaient une seule page. Leurs remplaçants renvoient un paginateur, qui ne récupère rien tant que vous n'avez pas dit combien vous en voulez.

```ts
// Une seule page, comme dans la version 1.
const page = await twitch.games.top({ first: 20 });
console.log(page.data);

// Un nombre fixe d'éléments, quel que soit le nombre de pages nécessaires.
const top = await twitch.games.top().take(250);

// Tous les éléments, une page à la fois.
for await (const video of twitch.videos.get({ user_id: userId })) {
  console.log(video.title);
}
```

[Pagination](/basics/pagination/) traite du reste.

## Voir aussi

- [Démarrage rapide](/quick-start/) : la version 2 à partir d'un dossier vide.
- [Appeler l'API](/basics/calling-the-api/) : groupes, paramètres et formes de retour.
- [Erreurs](/basics/errors/) : ce qui remplace `{ ok, result }`.
- [Référence](/reference/overview/) : toutes les méthodes de la version 2.
