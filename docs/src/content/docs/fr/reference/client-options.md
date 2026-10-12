---
title: "Options du client"
description: "Chaque option de new Twitch(), chaque membre du client, et les options de requête acceptées par toutes les méthodes, avec leurs types et leurs valeurs par défaut."
---

Cette page liste ce que vous pouvez passer à `new Twitch()`, ce que l'objet obtenu offre en plus des groupes de l'API, et les options que toute méthode accepte en dernier argument. Les guides expliquent quand utiliser chacune d'elles. C'est ici que vous vérifiez un nom, un type ou une valeur par défaut.

## Un client avec toutes les options courantes

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  tokens: new FileTokenStore("./tokens.json"),
  timeout: 15_000,
  retries: 3,
  rateLimit: "wait",
  validateTokens: true,
  userAgent: "my-bot/1.0",
});
```

Seul `clientId` est obligatoire. Les valeurs indiquées pour `timeout`, `retries`, `rateLimit` et `validateTokens` sont les valeurs par défaut.

## Options du constructeur

Le type est `TwitchOptions`.

| Option | Type | Par défaut | Effet |
| --- | --- | --- | --- |
| `clientId` | `string` | Obligatoire | Identifiant client de votre application. Envoyé avec chaque requête. |
| `clientSecret` | `string` | Aucun | Secret client de votre application. Nécessaire pour demander le jeton d'application et pour échanger un code d'autorisation. Omettez-le dans un navigateur, une application de bureau ou une CLI. |
| `tokens` | `TokenStore` | Mémoire uniquement | L'endroit où sont gardés les jetons utilisateur. Les utilisateurs en sont restaurés à la première utilisation et chaque jeton nouveau ou rafraîchi y est réécrit. |
| `timeout` | `number` | `15000` | Millisecondes avant qu'une tentative de requête soit abandonnée, lecture du corps comprise. S'applique à l'API et au serveur OAuth. |
| `retries` | `number` | `3` | Nombre de fois où une requête est renvoyée après une panne réseau, un `5xx` ou un `429`. Couvre aussi la demande du jeton d'application et les validations de jeton. `0` désactive les nouvelles tentatives. |
| `rateLimit` | `"wait" \| "throw"` | `"wait"` | Ce qu'il faut faire quand un compartiment de limite de débit est vide. `"wait"` retient la requête jusqu'à ce que le compartiment se remplisse. `"throw"` échoue immédiatement avec une `TwitchRateLimitError`. |
| `validateTokens` | `boolean` | `true` | Valide chaque jeton utilisateur une fois par heure, comme Twitch l'exige. Le minuteur ne maintient jamais le processus en vie. |
| `userAgent` | `string` | Aucun | Envoyé comme en-tête `User-Agent` des requêtes à l'API, sur les runtimes qui laissent un programme le définir. |
| `fetch` | `typeof fetch` | Le `fetch` global | La fonction utilisée pour chaque requête HTTP, vers l'API et vers le serveur OAuth. Utilisez-la pour un proxy, pour l'instrumentation ou pour les tests. |
| `baseUrl` | `string` | `https://api.twitch.tv/helix` | URL de base de l'API. Les barres obliques finales sont retirées. |
| `authUrl` | `string` | `https://id.twitch.tv/oauth2` | URL de base du serveur OAuth, pour les demandes de jeton et pour l'adresse construite par `authorizeUrl()`. |

Le constructeur ne fait aucune requête. Il lève une `TwitchError` quand `clientId` est absent ou vide, et quand il n'y a ni option `fetch` ni `fetch` global.

Où chaque option est expliquée :

- `clientSecret` : [Obtenir vos identifiants](/credentials/) et [Les jetons en un coup d'œil](/auth/overview/).
- `tokens` : [Stocker les jetons](/auth/storing-tokens/).
- `timeout`, `retries`, `rateLimit` : [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/).
- `validateTokens` : [Gérer les utilisateurs](/auth/managing-users/).
- `fetch`, `baseUrl`, `authUrl` : [Runtimes](/basics/runtimes/).

## Membres du client

### Groupes de l'API

Le client a une propriété par groupe d'endpoints, 30 en tout : `twitch.users`, `twitch.chat`, `twitch.moderation`, `twitch.eventsub` et ainsi de suite. Un groupe est créé la première fois que vous le lisez. La [Référence](/reference/overview/) les liste avec leurs méthodes.

### Tout le reste

| Membre | Type | Ce qu'il fait |
| --- | --- | --- |
| `auth` | `Auth` | Jetons et flux OAuth : `addUser`, `removeUser`, `authorizeUrl`, `exchangeCode`, `deviceFlow`, `refresh`, `validate`, `revoke`, `restore`, `validateAll`, `appToken`, et les consultations `users`, `getUser`, `hasUser`, `hasSecret`. |
| `as(userId)` | `(userId: string) => Twitch` | Renvoie une vue du client qui fait chaque appel au nom de cet utilisateur, ou avec le jeton d'application pour `as("app")`. |
| `userId` | `string \| undefined` | Sur une vue renvoyée par `as()`, l'identifiant au nom duquel elle agit (`"app"` pour la vue du jeton d'application). `undefined` sur le client lui-même. |
| `request(endpoint)` | `<T>(endpoint: Endpoint) => Promise<T>` | Envoie n'importe quelle requête à l'API par le même circuit que les méthodes intégrées et renvoie le corps analysé. |
| `paginate(endpoint, config?)` | `<T, R>(endpoint: Endpoint, config?: PageConfig<T, R>) => Paginator<T, R>` | La même chose pour un endpoint qui renvoie des pages. |
| `on(event, listener)` | Renvoie `() => void` | Écoute ce que fait le client. La fonction renvoyée retire l'écouteur. |
| `once(event, listener)` | Renvoie `() => void` | La même chose pour un écouteur qui ne s'exécute qu'une fois. |
| `off(event, listener)` | Renvoie `void` | Retire un écouteur ajouté avec `on`. |
| `rateLimitOf(userId?)` | Renvoie `{ limit, remaining, resetAt } \| undefined` | Ce que l'on sait d'un compartiment de limite de débit. |
| `close()` | Renvoie `void` | Arrête le minuteur de la validation horaire et ferme les écouteurs WebSocket et conduit créés à partir du client. |

### Vues

`twitch.as(userId)` ne crée pas de second client. La vue partage les jetons, l'état des limites de débit et les écouteurs d'événements du client dont elle est issue, et ne diffère que par celui qui fait les appels.

```ts
const asBot = twitch.as(botId);

await asBot.chat.send({ broadcaster_id: channelId, message: "Hello" });
console.log(asBot.userId === botId); // true
```

Une option de requête `{ as }` sur un appel isolé l'emporte sur la vue. Les endpoints qui ne prennent que le jeton d'application continuent de l'utiliser à l'intérieur d'une vue.

`twitch.as("app")` est la vue inverse : elle utilise le jeton d'application sur tout endpoint qui accepte les deux sortes, même quand un utilisateur est enregistré. Sur un endpoint qui ne prend qu'un jeton utilisateur, elle lève une `TwitchAuthError`.

```ts
// Lire des données publiques sur le compartiment de limite de débit de l'application, pas sur celui d'un utilisateur.
const asApp = twitch.as("app");
const games = await asApp.games.top().take(10);
```

Les règles se trouvent dans [Agir au nom d'un utilisateur](/basics/acting-as-a-user/).

### Requêtes personnalisées

`request` et `paginate` prennent un `Endpoint` : `path`, plus `method`, `query`, `body`, `auth`, `prefer`, `scopes`, `context`, `options` et `response` quand vous en avez besoin. [Options de requête](/basics/request-options/) décrit chaque champ, ainsi que ceux de `PageConfig`.

```ts
const body = await twitch.request<{ data: { id: string }[] }>({
  path: "users",
  query: { login: "twitchdev" },
});
```

### Événements

`on`, `once` et `off` acceptent cinq noms d'événement. Les contenus sont décrits dans [Observabilité](/basics/observability/).

| Événement | Arguments de l'écouteur | Émis quand |
| --- | --- | --- |
| `request` | `RequestEvent` | Une tentative HTTP est sur le point d'être envoyée à l'API. |
| `response` | `ResponseEvent` | Une réponse HTTP est revenue de l'API. |
| `rateLimit` | `RateLimitEvent` | Une requête attend qu'un compartiment de limite de débit se remplisse. |
| `tokenRefresh` | `UserToken` | Un jeton utilisateur a été renouvelé. |
| `tokenInvalid` | `userId: string`, `error: Error` | Un jeton utilisateur est mort et l'utilisateur a été retiré. |

### État des limites de débit

`rateLimitOf()` lit le compartiment du jeton d'application, `rateLimitOf(userId)` celui d'un utilisateur. Elle renvoie une copie avec trois nombres : `limit` (points par fenêtre), `remaining` (points restants) et `resetAt` (le moment, en millisecondes depuis l'époque Unix, où le compartiment est de nouveau plein). Elle renvoie `undefined` tant que Twitch n'a pas communiqué ce compartiment. Twitch remplit un compartiment au fil du temps : avec peu de trafic, `resetAt` est donc toujours proche, et une fois ce moment passé le compartiment est indiqué comme plein.

```ts
const state = twitch.rateLimitOf();
if (state) console.log(`${state.remaining}/${state.limit} until ${new Date(state.resetAt).toISOString()}`);
```

### Fermeture

`close()` arrête le minuteur de la validation horaire et ferme tous les écouteurs WebSocket et conduit créés à partir du client avec `twitch.eventsub.websocket()` ou `twitch.eventsub.conduit()`. Le minuteur ne retient pas le processus, un WebSocket ouvert si : appelez `close()` quand vous avez terminé et le processus peut s'arrêter. Un écouteur webhook n'a rien à fermer, c'est à vous d'arrêter votre serveur HTTP. Appeler `close()` sur une vue agit sur le client dont la vue est issue, puisqu'ils partagent tout.

## Options de requête

Chaque méthode de chaque groupe prend un objet `RequestOptions` en dernier argument. Tous les champs sont facultatifs.

| Option | Type | Effet |
| --- | --- | --- |
| `as` | `"app"` ou un identifiant d'utilisateur | Fait l'appel au nom de cet utilisateur, qui doit être enregistré. Remplace le choix automatique du jeton et l'utilisateur d'une vue. `"app"` utilise le jeton d'application sur un endpoint qui accepte les deux sortes, et lève une `TwitchAuthError` sur un endpoint qui ne prend qu'un jeton utilisateur. |
| `token` | `string` | Utilise ce jeton d'accès tel quel : pas de rafraîchissement, pas de vérification des scopes, pas de choix d'utilisateur. L'emporte sur `as`. Compté dans un compartiment de limite de débit qui lui est propre. |
| `signal` | `AbortSignal` | Annule l'appel, y compris ses nouvelles tentatives et ses attentes de limite de débit. L'appel est rejeté avec la raison du signal. |
| `timeout` | `number` | Millisecondes avant qu'une tentative soit abandonnée. Remplace le réglage du client pour cet appel. Les demandes de jeton faites en chemin gardent le réglage du client. |
| `retries` | `number` | Nombre de nouvelles tentatives après la première. Remplace le réglage du client pour cet appel. |

```ts
// Une méthode avec des paramètres : les options viennent en second.
const page = await twitch.streams.get({ language: "fr" }, { timeout: 5000, retries: 0 });

// Une méthode sans paramètres : les options sont le seul argument.
const me = await twitch.users.me({ as: userId });

// Une méthode paginée : les options s'appliquent à chaque page qu'elle récupère.
const controller = new AbortController();
const followers = twitch.channels.followers({ broadcaster_id }, { signal: controller.signal });
```

Passer des options à `users.getById` ou à `users.getByLogin` envoie cette recherche à part, au lieu de la fusionner avec les autres recherches du même moment.

Avec `twitch.request()` et `twitch.paginate()`, le même objet va dans le champ `options` de l'endpoint.

## Voir aussi

- [Options de requête](/basics/request-options/) : les options en pratique, et les champs de `Endpoint` et de `PageConfig`.
- [Observabilité](/basics/observability/) : les événements et leurs contenus.
- [Erreurs](/reference/errors/) : ce que lève le client.
- [Référence](/reference/overview/) : les groupes de l'API et leurs méthodes.
