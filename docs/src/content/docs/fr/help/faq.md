---
title: "Questions et réponses"
description: "Des réponses courtes aux questions qui reviennent le plus : ce qu'est la bibliothèque, où elle tourne, quels identifiants il lui faut et comment faire les choses courantes."
---

Des réponses courtes, chacune avec un lien vers la page qui donne la réponse longue. Si vous avez un message d'erreur sous les yeux, [Dépannage](/help/troubleshooting/) est un meilleur point de départ.

## À propos de la bibliothèque

### Est-ce une bibliothèque officielle de Twitch ?

Non. C'est un projet open source indépendant, publié sous licence MIT et sans affiliation avec Twitch. Il dialogue avec les interfaces officielles et documentées : l'API Helix, le serveur OAuth et EventSub. Chaque méthode renvoie vers la page de la référence Twitch qu'elle implémente.

### Quelles versions de Node.js sont prises en charge ?

Node.js 22 et les versions suivantes. La bibliothèque n'a aucune dépendance et s'appuie sur ce que fournit le runtime (`fetch`, `AbortSignal`, Web Crypto, et le `WebSocket` global pour EventSub), que Node.js possède en entier à partir de cette version. Elle tourne aussi sur Bun, Deno et Cloudflare Workers : voir [Runtimes](/basics/runtimes/).

### Fonctionne-t-elle dans le navigateur ?

Oui. L'entrée principale n'utilise que des API standard du web : elle peut donc être intégrée à un bundle pour le navigateur. Deux règles s'y appliquent : construisez le client avec le `clientId` seul, parce que tout ce qui est livré à un navigateur peut être lu par ses utilisateurs, et obtenez un jeton utilisateur avec le flux par code d'appareil ou le flux implicite. Seul `@ix-xs/twitch.api/node`, qui contient le magasin de jetons fichier, est propre à Node.js.

### Prend-elle en charge CommonJS ?

Oui. Le paquet fournit une version ESM et une version CommonJS, chacune avec ses déclarations de types.

```js
const { Twitch } = require("@ix-xs/twitch.api");
const { FileTokenStore } = require("@ix-xs/twitch.api/node");

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  tokens: new FileTokenStore("./tokens.json"),
});
```

### Ai-je besoin de TypeScript ?

Non. Une fois installée, la bibliothèque est du JavaScript ordinaire. Ce sont les déclarations qui donnent à votre éditeur l'autocomplétion des noms de méthodes, des paramètres, des scopes et des types d'événements, et cela fonctionne aussi dans les fichiers JavaScript.

### Pourquoi les champs sont-ils en snake_case ?

Les paramètres et les champs des réponses portent les noms que Twitch leur donne : `broadcaster_id`, `viewer_count`, `started_at`. Ce que vous lisez dans la référence officielle, dans les messages d'erreur de Twitch et dans les exemples écrits pour d'autres outils s'applique tel quel, et rien n'est à traduire dans un sens ou dans l'autre. Le vocabulaire propre à la bibliothèque est en camelCase : les options du client, les champs d'un `UserToken`, les noms des méthodes.

```ts
const [stream] = await twitch.streams.get({ user_login: "twitchdev" }).take(1);
console.log(stream?.viewer_count, stream?.started_at);
```

## Jetons et limites

### Ai-je besoin d'un secret client ?

Cela dépend de l'endroit où tourne le code. Sur un serveur, oui : c'est le secret qui permet d'obtenir le jeton d'application, sur lequel reposent les données publiques, les webhooks, les conduits et le flux par code d'autorisation. Dans une CLI, une application de bureau ou un navigateur, non, et vous ne devez pas le livrer : connectez l'utilisateur avec le flux par code d'appareil et tous les endpoints qui prennent un jeton utilisateur fonctionnent. [Les jetons en un coup d'œil](/auth/overview/) donne le tableau.

### Dois-je rafraîchir les jetons moi-même ?

Non. Le jeton d'application est demandé quand un appel en a besoin et renouvelé avant d'expirer. Un jeton utilisateur enregistré avec son jeton de rafraîchissement est rafraîchi avant d'expirer et après un rejet de Twitch, et validé toutes les heures comme Twitch l'exige. Donnez au client un magasin de jetons et les jetons rafraîchis sont sauvegardés eux aussi : voir [Stocker les jetons](/auth/storing-tokens/).

### Comment les limites de débit sont-elles gérées ?

Le client lit les en-têtes `Ratelimit-*` de chaque réponse, tient un compartiment pour le jeton d'application et un par utilisateur, et retient une requête quand son compartiment est vide. Un `429` qui passe malgré tout est retenté une fois le compartiment rempli. Si vous préférez échouer plutôt qu'attendre, construisez le client avec `rateLimit: "throw"` et interceptez `TwitchRateLimitError`. Les détails se trouvent dans [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/).

### Quel jeton un appel utilise-t-il ?

Celui dont l'endpoint a besoin. Les endpoints de données publiques utilisent le jeton d'application. Les endpoints qui agissent au nom de quelqu'un utilisent le jeton de l'utilisateur désigné par la requête (son `broadcaster_id`, son `moderator_id`), ou celui du seul utilisateur enregistré. Quand plusieurs utilisateurs sont enregistrés et que l'appel ne dit pas qui agit, désignez-en un avec `{ as: userId }`. Pour utiliser le jeton d'application là où celui d'un utilisateur serait choisi, passez `{ as: "app" }`. [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) donne l'ordre exact.

## Au quotidien

### Comment obtenir un identifiant à partir d'un nom de connexion ?

Demandez-le à `users.getByLogin`. La méthode renvoie l'utilisateur, ou `null` quand personne ne porte ce nom de connexion. Pour plusieurs noms de connexion, `users.get` prend une liste. Les identifiants sont des chaînes et, contrairement aux noms de connexion, ils ne changent jamais : ce sont donc eux qu'il faut stocker.

```ts
const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("No such user");
console.log(user.id);

const users = await twitch.users.get({ login: ["twitchdev", "twitch"] });
```

### Prend-elle en charge le chat IRC ?

Non, et elle n'en a pas besoin. Le chat passe désormais par l'API : vous lisez les messages avec l'événement `channel.chat.message` d'EventSub, et vous les envoyez avec [chat.send](/reference/api/chat/#send), l'endpoint Send Chat Message. Un bot a besoin des scopes `user:read:chat` et `user:write:chat`. [Un bot de chat](/recipes/chat-bot/) en construit un du début à la fin.

```ts
events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.message.text === "!ping") {
    await twitch.chat.send({ broadcaster_id: event.broadcaster_user_id, message: "pong" });
  }
});
```

### Comment utiliser un endpoint plus récent que ma version ?

Mettez d'abord le paquet à jour, au cas où l'endpoint aurait été ajouté depuis. Si ce n'est pas le cas, `twitch.request()` et `twitch.paginate()` envoient n'importe quel chemin par le même circuit que les méthodes intégrées, avec le choix du jeton, la limite de débit, les nouvelles tentatives et les erreurs typées. Les types d'événements plus récents que la bibliothèque fonctionnent en écrivant leur version après un `@`. Voir [Options de requête](/basics/request-options/) et [Événements typés](/events/typed-events/).

```ts
const body = await twitch.request<{ data: { id: string }[] }>({
  path: "some/new/endpoint",
  query: { broadcaster_id },
  auth: "user",
  context: "broadcaster_id",
});

events.on("some.new.type@1", { broadcaster_user_id: channelId }, (event) => console.log(event));
```

### Comment la simuler dans les tests ?

Donnez au client votre propre `fetch`. Chaque requête, vers l'API comme vers le serveur OAuth, passe par lui : un test ne touche donc jamais au réseau.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const paths: string[] = [];
const fakeFetch: typeof fetch = async (input) => {
  const url = new URL(String(input));
  paths.push(url.pathname);
  if (url.hostname === "id.twitch.tv") {
    return Response.json({ access_token: "test-token", expires_in: 3600, token_type: "bearer" });
  }
  return Response.json({ data: [{ id: "141981764", login: "twitchdev" }] });
};

const twitch = new Twitch({ clientId: "test", clientSecret: "test", fetch: fakeFetch, retries: 0 });

const user = await twitch.users.getByLogin("twitchdev");
console.log(user?.id, paths); // "141981764" [ "/oauth2/token", "/helix/users" ]
```

Trois choses aident à aller plus loin. Enregistrer un utilisateur en donnant `userId` et `scopes` ne fait aucune requête : c'est ainsi que vous mettez en place un faux utilisateur. Les outils qui remplacent le `fetch` global fonctionnent aussi, puisque le client appelle celui-ci au moment de la requête quand vous n'en passez aucun. Et pour des tests contre un serveur qui se comporte comme Twitch, faites pointer `baseUrl` et `authUrl` vers le serveur simulé de la CLI Twitch, comme décrit dans [Runtimes](/basics/runtimes/).

### Comment tout arrêter proprement ?

Appelez `twitch.close()`. La méthode arrête le minuteur de la validation horaire et ferme les écouteurs WebSocket et conduit créés à partir du client, qui sont ce qui maintient un processus en vie. Pour fermer un seul écouteur et garder les autres, appelez son propre `close()`. Un écouteur webhook ne garde rien d'ouvert en dehors de votre serveur HTTP, et un programme qui ne fait que des appels à l'API s'arrête de lui-même quand son dernier appel se termine.

```ts
twitch.close();
```

## Voir aussi

- [Dépannage](/help/troubleshooting/) : en partant d'un message d'erreur.
- [Démarrage rapide](/quick-start/) : le premier appel en quelques lignes.
- [Les jetons en un coup d'œil](/auth/overview/) : le jeton et le flux qu'il vous faut.
- [Référence](/reference/overview/) : chaque méthode, chaque type d'événement, chaque scope et chaque erreur.
