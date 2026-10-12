---
title: "Runtimes"
description: "Où la bibliothèque fonctionne (Node.js, Bun, Deno, Cloudflare Workers, navigateurs), comment elle est empaquetée, et les options qui remplacent fetch, WebSocket et les URL de Twitch."
sidebar:
  order: 8
---

L'entrée principale de la bibliothèque n'utilise que des API standard du web : `fetch`, `AbortSignal`, `URL`, Web Crypto et, pour l'écouteur WebSocket, le `WebSocket` global. Elle n'importe aucun module intégré de Node.js et n'a aucune dépendance : le même code fonctionne donc sur des serveurs, sur des plateformes edge et dans des navigateurs.

## Un premier exemple

Voici l'intégralité d'un Cloudflare Worker qui répond avec un profil Twitch. Les trois mêmes lignes de code client fonctionnent dans tous les runtimes ci-dessous.

```ts title="src/worker.ts"
import { Twitch } from "@ix-xs/twitch.api";

interface Env {
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
}

let twitch: Twitch | undefined;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Créé une fois, puis réutilisé par les requêtes suivantes.
    twitch ??= new Twitch({ clientId: env.TWITCH_CLIENT_ID, clientSecret: env.TWITCH_CLIENT_SECRET });

    const login = new URL(request.url).searchParams.get("login") ?? "twitchdev";
    const user = await twitch.users.getByLogin(login);
    return user ? Response.json(user) : new Response("No such user", { status: 404 });
  },
};
```

## Ce qui fonctionne où

| Runtime | Appels à l'API | Événements par WebSocket | Événements par webhook | `FileTokenStore` |
| --- | --- | --- | --- | --- |
| [Node.js](https://nodejs.org) 22 ou ultérieur | Oui | Oui | Oui | Oui |
| [Bun](https://bun.sh) | Oui | Oui | Oui | Oui |
| [Deno](https://deno.com) | Oui | Oui | Oui | Oui |
| [Cloudflare Workers](https://workers.cloudflare.com) | Oui | Utilisez les webhooks | Oui | Pas de système de fichiers |
| Navigateurs | Oui, sans secret client | Oui | Pas de serveur à appeler | Pas de système de fichiers |

### Node.js

Node.js 22 est le minimum, et le champ `engines` du paquet l'indique. C'est la première version qui fournit `fetch`, `AbortSignal.any` et `WebSocket` comme globaux sans option.

```bash
npm install @ix-xs/twitch.api
```

### Bun et Deno

Installez le même paquet depuis npm. Les imports ne changent pas.

```bash
bun add @ix-xs/twitch.api
deno add npm:@ix-xs/twitch.api
```

Les deux runtimes implémentent le module de système de fichiers de Node.js : `FileTokenStore` y fonctionne donc aussi. Avec Deno, autorisez l'accès au réseau quand vous lancez votre programme, ainsi que l'accès aux fichiers si vous utilisez ce magasin de jetons.

### Cloudflare Workers

Créer un client n'envoie aucune requête : vous pouvez donc sans risque en créer un à la première requête et le garder dans une variable de module, comme dans l'exemple ci-dessus. Trois choses diffèrent d'un serveur :

- Rien ne survit longtemps en mémoire. Gardez les jetons utilisateur dans un magasin de jetons adossé à KV ou à une base de données, voir [Stocker les jetons](/auth/storing-tokens/).
- Un Worker ne reste pas en vie entre deux requêtes : il ne peut donc pas garder ouvert un écouteur WebSocket. Recevez les événements avec les [webhooks](/events/webhooks/), page qui présente aussi les deux réglages dont un Worker a besoin.
- Il n'y a pas de système de fichiers. N'importez pas `@ix-xs/twitch.api/node`.

### Navigateurs

La bibliothèque fonctionne dans un navigateur, avec une règle absolue : le secret client n'y entre pas. Créez le client avec l'identifiant client seul et connectez l'utilisateur avec le [flux par code d'appareil](/auth/device-code/), qui ne demande aucun secret. Les appels sont alors faits avec le jeton de cet utilisateur.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: "your-client-id" });
```

:::danger
N'envoyez jamais un secret client à un navigateur. Tout ce que contient une page peut être lu par ses visiteurs, et le secret permet à n'importe qui de demander des jetons au nom de votre application. Si une page a besoin de données qui exigent le jeton d'application, récupérez-les depuis votre propre serveur et appelez Twitch à cet endroit.
:::

L'option `userAgent` n'a aucun effet dans les navigateurs, qui ne laissent pas une page définir cet en-tête.

## Modules ES et CommonJS

Le paquet est livré dans les deux formats, chacun avec ses propres déclarations de types. `import` et `require` aboutissent au bon format grâce à la table `exports` du paquet.

```ts
import { Twitch } from "@ix-xs/twitch.api";
```

```js
const { Twitch } = require("@ix-xs/twitch.api");
```

TypeScript trouve les types de lui-même avec les résolutions de modules `node16`, `nodenext` et `bundler`. Il n'y a aucun paquet `@types` à installer. Le paquet est déclaré sans effets de bord : un bundler ne conserve donc que les parties que vous importez.

## L'entrée Node.js

`@ix-xs/twitch.api/node` est un second point d'entrée pour les utilitaires qui ont besoin des modules intégrés de Node.js. Il n'en contient qu'un aujourd'hui : `FileTokenStore`, qui enregistre les jetons utilisateur dans un fichier JSON.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId,
  clientSecret,
  tokens: new FileTokenStore("./tokens.json"),
});
```

Il est séparé afin que l'entrée principale ne mentionne jamais `node:fs`. Un bundle destiné à un Worker ou à un navigateur se construit ainsi sans polyfills ni configuration particulière. Voir [Stocker les jetons](/auth/storing-tokens/) pour le magasin de jetons lui-même.

## Utiliser votre propre fetch

L'option `fetch` remplace la fonction derrière chaque requête HTTP que fait le client, vers l'API Twitch comme vers le serveur OAuth. Utilisez-la pour passer par un proxy, pour ajouter de l'instrumentation ou pour répondre depuis la mémoire dans des tests.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId,
  clientSecret,
  fetch: async (input, init) => {
    const started = performance.now();
    const response = await fetch(input, init);
    console.log(response.status, String(input), `${Math.round(performance.now() - started)} ms`);
    return response;
  },
});
```

Dans un test, un faux `fetch` tient lieu de Twitch. Rappelez-vous que le client demande un jeton d'application au serveur OAuth avant son premier appel :

```ts
import { Twitch } from "@ix-xs/twitch.api";

const fakeFetch: typeof fetch = async (input) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.hostname === "id.twitch.tv") {
    return Response.json({ access_token: "test-token", expires_in: 3600, token_type: "bearer" });
  }
  if (url.pathname === "/helix/users") {
    return Response.json({ data: [{ id: "1", login: "someone", display_name: "Someone" }] });
  }
  return Response.json({ data: [] });
};

const twitch = new Twitch({ clientId: "test", clientSecret: "test", fetch: fakeFetch });
const user = await twitch.users.getByLogin("someone");
```

Sans cette option, le client appelle le `fetch` global, et le recherche à chaque requête. Un outil de test qui remplace `globalThis.fetch` après la création du client est donc pris en compte. Sur un runtime sans aucun `fetch`, le constructeur lève une `TwitchError` qui vous demande d'en passer un.

## Utiliser une autre classe WebSocket

Les écouteurs WebSocket et conduit ouvrent leurs connexions avec le `WebSocket` global. L'option `webSocket` prend une autre classe à la place : celle d'un paquet sur un runtime qui n'a pas de global, ou une fausse classe dans des tests.

```ts
import type { WebSocketConstructor } from "@ix-xs/twitch.api";

// Par exemple la classe exportée par le paquet "ws".
declare const WebSocketClass: WebSocketConstructor;

const events = twitch.eventsub.websocket({ webSocket: WebSocketClass });
```

La classe doit pouvoir être construite avec une URL et exposer `onopen`, `onmessage`, `onclose`, `onerror` et `close()`. Sans global et sans l'option, la création de l'écouteur lève une `TwitchEventSubError`. Les autres options de l'écouteur sont décrites dans [WebSocket](/events/websocket/).

## Diriger le client vers un autre serveur

Deux options changent la destination des requêtes :

| Option | Par défaut | Utilisée pour |
| --- | --- | --- |
| `baseUrl` | `https://api.twitch.tv/helix` | Tous les appels à l'API. |
| `authUrl` | `https://id.twitch.tv/oauth2` | Les jetons d'application, les flux de connexion, le rafraîchissement, la validation et la révocation des jetons. |

Leur usage principal est le serveur de simulation de la [Twitch CLI](https://dev.twitch.tv/docs/cli/mock-api-command/), qui imite l'API sur votre machine avec des utilisateurs et des streams générés. Lancez-le avec `twitch mock-api start`, prenez l'identifiant et le secret de l'un de ses clients sur `http://localhost:8080/units/clients`, et créez le client en le dirigeant vers ce serveur :

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.MOCK_CLIENT_ID!,
  clientSecret: process.env.MOCK_CLIENT_SECRET,
  baseUrl: "http://localhost:8080/mock",
  authUrl: "http://localhost:8080/auth",
});

const streams = await twitch.streams.get().take(5);
```

Le jeton d'application est demandé au serveur de simulation comme au vrai. Le serveur de simulation distribue les jetons utilisateur par un endpoint qui lui est propre, décrit dans sa documentation. Enregistrez un tel jeton avec son propriétaire et ses scopes, afin que le client n'ait pas à interroger le serveur à son sujet :

```ts
declare const mockUserToken: string;

await twitch.auth.addUser({
  accessToken: mockUserToken,
  userId: "141981764",
  scopes: ["moderator:manage:banned_users"],
});
```

L'écouteur WebSocket a une option `url` correspondante pour le serveur EventSub de la Twitch CLI, voir [WebSocket](/events/websocket/).

## Voir aussi

- [Démarrage rapide](/quick-start/) : installation et premiers appels sur Node.js.
- [Obtenir vos identifiants](/credentials/) : applications publiques et confidentielles, et où le secret peut résider.
- [Stocker les jetons](/auth/storing-tokens/) : `FileTokenStore` et des magasins de jetons pour KV ou une base de données.
- [Webhooks](/events/webhooks/) : recevoir des événements sur Workers et sur d'autres plateformes serverless.
- [Options du client](/reference/client-options/) : toutes les options du constructeur.
