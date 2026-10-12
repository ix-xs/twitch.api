---
title: "Dépannage"
description: "Les problèmes les plus fréquents, chacun en partant du message ou du symptôme que vous observez, avec sa cause et sa correction."
---

Chaque section ci-dessous part de quelque chose que vous pouvez observer : un message d'erreur, une promesse rejetée, un programme qui reste bloqué. Trouvez le vôtre, lisez la cause, appliquez la correction. Les messages sont cités tels que la bibliothèque les affiche, `123` représentant un identifiant d'utilisateur.

## Voir ce que fait le client

La plupart des problèmes de jeton deviennent évidents dès que vous voyez quel jeton chaque requête a utilisé. Deux écouteurs et un `catch` montrent tout.

```ts
import { Twitch, TwitchApiError, TwitchError } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
});

// `as` vaut "app", un identifiant d'utilisateur, ou "raw" pour un jeton passé à la main.
twitch.on("request", ({ method, url, as }) => console.log("->", method, url, "as", as));
twitch.on("response", ({ status, duration }) => console.log("<-", status, `${duration} ms`));

try {
  await twitch.users.me();
} catch (error) {
  if (error instanceof TwitchApiError) console.error(error.name, error.status, error.message, error.body);
  else if (error instanceof TwitchError) console.error(error.name, error.message, error.cause ?? "");
  else throw error;
}
```

## Aucun utilisateur n'est enregistré

```text
TwitchAuthError: GET /users needs a user access token and no user is registered. Add one with twitch.auth.addUser().
```

L'endpoint agit au nom d'un utilisateur et le client ne détient aucun jeton utilisateur.

- Vous n'en avez jamais enregistré. Obtenez un jeton avec le [flux par code d'autorisation](/auth/authorization-code/) ou le [flux par code d'appareil](/auth/device-code/), ou passez un jeton existant à `twitch.auth.addUser()`.
- Vous en avez enregistré un lors d'une exécution précédente. Sans magasin de jetons, les utilisateurs vivent en mémoire et disparaissent après un redémarrage. Ajoutez un magasin : voir [Stocker les jetons](/auth/storing-tokens/).
- L'utilisateur était là et a été retiré parce que son jeton est mort. Écoutez `tokenInvalid` pour savoir quand cela se produit.
- Vous avez enregistré l'utilisateur sur une autre instance de `Twitch`. Les utilisateurs appartiennent au client auquel ils ont été ajoutés. Les vues créées avec `twitch.as()` les partagent, un second `new Twitch()` non.

Un proche parent désigne un utilisateur :

```text
TwitchAuthError: No token is registered for user 123. Add it with twitch.auth.addUser().
```

Ici, `{ as }` ou `twitch.as()` a reçu un identifiant que le client ne connaît pas. Vérifiez que c'est un identifiant d'utilisateur et non un nom de connexion, et que c'est une chaîne.

Les endpoints qui acceptent les deux sortes de jeton n'échouent pas faute d'utilisateur : ils utilisent le jeton d'application. Ils échouent en revanche quand la requête a un champ pour l'utilisateur qui agit et que personne ne peut le remplir :

```text
TwitchAuthError: POST /chat/messages needs "sender_id": the call is made with the app token, which belongs to no user. Set "sender_id", or register the acting user with twitch.auth.addUser().
TwitchAuthError: POST /chat/messages needs "sender_id": a token passed by hand does not say who it belongs to.
```

Enregistrez l'utilisateur qui agit, ou écrivez le champ vous-même. Le second message correspond à la même situation avec l'option de requête `token` : un jeton brut est envoyé tel quel, et le client ne connaît pas son propriétaire.

## Plusieurs utilisateurs sont enregistrés

```text
TwitchAuthError: POST /polls needs a user access token and several users are registered. Choose one with { as: userId } or twitch.as(userId).
```

Avec un seul utilisateur, le client utilise cet utilisateur. Avec plusieurs, il doit savoir qui agit et l'appel ne le dit pas. N'importe laquelle de ces solutions règle la question :

```ts
// Pour un seul appel.
await twitch.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 }, { as: channelId });

// Pour une série d'appels.
const asBroadcaster = twitch.as(channelId);
await asBroadcaster.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });

// En désignant l'utilisateur qui agit dans la requête elle-même.
await twitch.polls.create({ broadcaster_id: channelId, title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });
```

Trois autres messages ont la même cause et la même correction :

```text
TwitchAuthError: POST /polls needs the token of user 123, which is not registered. Add it with twitch.auth.addUser() or choose a user with { as: userId }.
TwitchAuthError: POST /chat/messages does not say who is acting and several users are registered. Set "sender_id", or choose a user with { as: userId } or twitch.as(userId).
TwitchAuthError: GET /users can use a user token, but several users are registered. Choose one with { as: userId } or twitch.as(userId).
```

Le premier signifie que la requête désigne un utilisateur que le client n'a pas. Le deuxième vient des endpoints qui acceptent les deux sortes de jeton et qui ont un champ pour l'utilisateur qui agit, ici `sender_id`. Le troisième n'apparaît que sur un client sans secret client : avec un secret, un tel appel utilise le jeton d'application.

Si c'est le jeton d'application que vous vouliez sur l'un de ces endpoints, dites-le avec `{ as: "app" }`.

## Il manque un scope

```text
TwitchScopeError: The token of user 123 is missing the "moderator:manage:banned_users" scope required by POST /moderation/bans.
```

Le jeton existe et l'utilisateur n'a jamais autorisé cela. La requête n'a pas été envoyée.

1. Ajoutez le scope à la liste que vous passez à `authorizeUrl()` ou à `deviceFlow()`. `error.required` contient les scopes qui conviendraient, `error.granted` ceux que possède le jeton.
2. Faites repasser l'utilisateur par le flux. Un jeton ne peut pas gagner de scope après coup.

Si le scope est dans votre liste et que l'erreur persiste, vérifiez deux choses. Le message nomme l'utilisateur dont le jeton a été choisi : quand c'est le bot et que vous attendiez le diffuseur, le problème est le choix de l'utilisateur, pas le scope. Et si vous avez enregistré le jeton avec une liste `scopes` explicite, cette liste est prise pour vraie : omettez-la et la vraie liste est demandée à Twitch.

## Un jeton d'application est nécessaire

```text
TwitchAuthError: GET /users needs an app access token, which requires a clientSecret (or a registered user token).
```

Le client n'a pas de secret client, et pas d'utilisateur unique dont le jeton pourrait être utilisé à la place.

- Le secret est censé être là. Le coupable habituel est une variable d'environnement qui n'est pas définie, ce qui donne à `clientSecret` la valeur `undefined`. Affichez `twitch.auth.hasSecret`, et vérifiez comment le processus est lancé (`node --env-file=.env app.js` charge un fichier `.env`).
- Le client est public volontairement. Connectez un utilisateur avant de faire des appels.

Sans la partie entre parenthèses, l'endpoint ne prend qu'un jeton d'application : les abonnements par webhook et par conduit, le groupe `conduits`, `users.authorization`. Ces appels doivent venir d'un serveur qui détient le secret.

## Un 401 indique que l'identifiant doit correspondre au jeton

```text
TwitchApiError: The ID in broadcaster_id must match the user ID found in the request's OAuth token. (401 on POST /helix/polls)
```

La formulation exacte est celle de Twitch et varie selon l'endpoint. Elle signifie que l'endpoint ne fonctionne que pour le propriétaire du jeton, et que le jeton envoyé appartient à quelqu'un d'autre.

Le cas typique : un seul utilisateur est enregistré, un bot, et l'appel passe le `broadcaster_id` d'une chaîne dont le propriétaire n'est pas enregistré. Le client utilise le seul utilisateur qu'il a, et Twitch refuse. La même chose se produit quand `{ as }` désigne le mauvais utilisateur.

La correction consiste à enregistrer le jeton de l'utilisateur que l'endpoint concerne. Le diffuseur doit autoriser votre application, avec le scope dont l'endpoint a besoin. Le `broadcaster_id` de la requête sélectionne alors son jeton de lui-même.

Le client n'a rien rafraîchi ici, volontairement : il a demandé à Twitch si le jeton était valide, il l'était, et le `401` vous a donc été remis inchangé.

## Un abonnement WebSocket est refusé avec un 403

```text
TwitchEventSubError: Could not subscribe to channel.follow (version 2): subscription missing proper authorization (403 on POST /helix/eventsub/subscriptions)
```

Vous la recevez par `handle.ready` et par `onError`. Twitch vérifie l'autorisation de chaque type d'événement à la création de l'abonnement, et le jeton utilisé ne l'a pas. Le client ne peut pas le vérifier avant l'envoi : il n'y a donc pas de `TwitchScopeError` pour les événements.

- Il manque au jeton le scope du type d'événement. Cherchez le type dans [Types d'événements](/reference/event-types/) : `channel.follow` a besoin de `moderator:read:followers`.
- La condition désigne le mauvais utilisateur. Pour beaucoup de types, l'utilisateur de `user_id` ou de `moderator_user_id` doit être le propriétaire du jeton.
- L'écouteur utilise un autre utilisateur que celui auquel vous pensez. Avec plusieurs utilisateurs enregistrés, dites quel jeton crée les abonnements :

```ts
const events = twitch.eventsub.websocket({ user: botId });

const handle = events.on(
  "channel.follow",
  { broadcaster_user_id: channelId, moderator_user_id: botId },
  (event) => console.log(`${event.user_name} followed`),
);
await handle.ready; // rejetée avec le 403 s'il manque le scope au bot
```

## Les événements n'arrivent jamais sur un webhook

Commencez par demander à Twitch dans quel état se trouvent les abonnements. Seuls ceux qui sont `enabled` livrent des événements.

```ts
for await (const subscription of twitch.eventsub.subscriptions()) {
  console.log(subscription.type, subscription.status, subscription.transport.callback);
}
```

| Ce que vous trouvez | Cause | Correction |
| --- | --- | --- |
| Aucun abonnement | L'écouteur a été construit avec `subscribe: false` et rien d'autre ne les a créés, ou `on()` n'a jamais été atteint | Créez-les, ou retirez `subscribe: false` |
| `webhook_callback_verification_pending` ou `webhook_callback_verification_failed` | Twitch n'a pas pu mener le défi à son terme avec votre URL | Voir la section suivante |
| `notification_failures_exceeded` | Votre endpoint a fait échouer trop de livraisons et Twitch a arrêté | Corrigez l'endpoint, supprimez l'abonnement et abonnez-vous de nouveau |
| `enabled`, et toujours rien | Les livraisons arrivent et sont rejetées, ou l'événement ne s'est pas produit | Lisez la suite |

Quand l'abonnement est actif, regardez ce que votre endpoint répond à Twitch. L'écouteur répond `200` à un défi, `204` à une livraison qu'il a acceptée, `400` quand les en-têtes EventSub sont absents ou que le corps n'est pas un message EventSub, et `403` quand la signature ou l'âge du message est incorrect.

- **Un `403` sur chaque livraison** est une signature qui ne correspond pas. Soit le corps a été modifié avant d'atteindre l'écouteur (analysé puis sérialisé de nouveau, par exemple), soit le secret n'est pas celui avec lequel l'abonnement a été créé. Un abonnement qui existait déjà garde son secret d'origine : après avoir changé le secret, supprimez les anciens abonnements et laissez l'écouteur les recréer.
- **Un `403` sur une signature correcte** est un problème d'horloge. Les messages dont l'horodatage s'écarte de plus de 10 minutes de l'horloge du serveur sont refusés (l'option `maxAge`).
- **Un `500`** accompagné d'un signalement `onError` indiquant que le corps « was already parsed by a middleware » signifie qu'un analyseur de corps JSON est passé avant. Montez `nodeHandler()` avant lui.
- **Un `204` sans appel du gestionnaire** est un doublon (un identifiant de message déjà traité est acquitté puis ignoré), ou une livraison pour un abonnement pour lequel ce processus n'a pas de gestionnaire, par exemple un abonnement hérité d'un ancien déploiement.
- **Un gestionnaire qui démarre et ne se termine jamais** sur une plateforme serverless a été interrompu au départ de la réponse. Passez `waitUntil`, comme le montre [Webhooks](/events/webhooks/).

Un gestionnaire qui lève une erreur n'échoue pas en silence non plus : l'erreur va à `onError`, ou à `console.error` quand vous n'avez aucun écouteur.

## ready est rejetée après 60 secondes

```text
TwitchEventSubError: Twitch did not verify the callback for stream.online within 60 seconds. Check that https://example.com/twitch/eventsub is public, uses HTTPS on port 443 and reaches this listener.
```

L'abonnement a été créé, Twitch a envoyé (ou tenté d'envoyer) son défi de vérification à l'URL de callback, et l'écouteur ne l'a jamais vu. L'abonnement est conservé : si le défi arrive plus tard, il reçoit sa réponse et les événements commencent à arriver.

Testez la route depuis l'extérieur de votre réseau :

```bash
curl -i -X POST https://example.com/twitch/eventsub
```

Un `400` est une bonne nouvelle : la requête a atteint l'écouteur, qui l'a refusée parce que ses en-têtes manquent. Toute autre réponse vous donne l'explication.

- Un délai d'attente dépassé ou une erreur de connexion : l'URL n'est pas joignable depuis Internet. `localhost` ne l'est jamais. Pour le développement local, utilisez un tunnel comme [ngrok](https://ngrok.com) et passez son URL HTTPS comme `callback`.
- Un `404` ou une page de votre site : le chemin ne mène pas à `handle()` ni à `nodeHandler()`.
- Un `403` ou une page de défi venant d'un CDN ou d'un pare-feu : quelque chose devant votre serveur bloque la requête.
- Une erreur de certificat : Twitch exige HTTPS avec un certificat valide, sur le port 443.

Vérifiez aussi que le serveur écoute quand vous appelez `on()`, puisque le défi suit en quelques instants, et qu'une URL de tunnel d'une session précédente ne traîne pas encore dans votre configuration.

## Un 409 lors d'un abonnement

```text
TwitchApiError: subscription already exists (409 on POST /helix/eventsub/subscriptions)
```

`twitch.eventsub.subscribe()` a été appelée pour un type et une condition qui ont déjà un abonnement avec le même transport. Les abonnements par webhook et par conduit survivent à votre processus : c'est donc ce que reçoit la deuxième exécution d'un script d'installation.

Les écouteurs webhook et conduit traitent cette réponse comme un succès, ce qui explique que vous ne la voyiez qu'en vous abonnant à la main. Faites de même :

```ts
import { TwitchApiError } from "@ix-xs/twitch.api";

try {
  await twitch.eventsub.subscribe({
    type: "stream.online",
    condition: { broadcaster_user_id: "141981764" },
    transport: { method: "webhook", callback, secret },
  });
} catch (error) {
  if (!(error instanceof TwitchApiError) || error.status !== 409) throw error;
  // Déjà là : rien à faire.
}
```

Pour repartir de zéro à la place, listez les abonnements et supprimez ceux dont vous ne voulez plus : voir [Gérer les abonnements](/events/managing-subscriptions/).

## Les erreurs 429

Une `TwitchRateLimitError` vous parvient dans deux situations.

- Le client a été construit avec `rateLimit: "throw"`. C'est le comportement que vous avez demandé : attendez `error.retryAfter` millisecondes et renvoyez la requête, ou revenez à la valeur par défaut `"wait"`.
- Le mode par défaut a épuisé ses nouvelles tentatives. Il faut pour cela un `429` à chaque tentative, soit quatre d'affilée avec la valeur par défaut `retries: 3`. Cela arrive quand de nombreux processus partagent un même jeton, chacun ignorant ce que dépensent les autres, ou quand la limite est propre à l'endpoint (Twitch les documente sur la page de chaque endpoint). Réduisez la concurrence, augmentez `retries`, ou espacez les appels.

Avant de vous tourner vers les nouvelles tentatives, vérifiez que vous ne faites pas plus de requêtes que nécessaire. Les recherches par identifiant acceptent des listes, et le client découpe les longues pour vous : un seul `users.get({ id: ids })` au lieu d'une boucle d'appels `getById` étalés dans le temps.

Les abonnements aux événements ont leur propre limite. Un écouteur WebSocket ou conduit traite un `429` sur un abonnement comme temporaire et réessaie, jusqu'à 6 fois sur une même session. Ensuite, `handle.ready` est rejetée et `onError` reçoit une `TwitchEventSubError` qui commence par `Could not subscribe to` et se termine par le `429`. Un `429` qui ne disparaît pas signifie trop d'abonnements, pas trop de requêtes. Comparez `total_cost` à `max_total_cost` :

```ts
const page = await twitch.eventsub.subscriptions({}, { as: botId });
console.log(page.raw.total_cost, "of", page.raw.max_total_cost);
```

[Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/) explique les compartiments.

## Le processus ne se termine pas

Quelque chose a encore du travail planifié. Le minuteur de la validation horaire n'est pas en cause : il ne retient jamais le processus. Un WebSocket ouvert est la cause habituelle.

| Ce qui retient le processus | Comment le libérer |
| --- | --- |
| Un écouteur WebSocket ou conduit : sa connexion, ou son minuteur de reconnexion | `events.close()` pour un écouteur, ou `twitch.close()` pour tous les écouteurs créés à partir du client |
| Le serveur HTTP qui reçoit les webhooks | `server.close()` |
| Un `flow.wait()` en attente du flux par code d'appareil | Annulez avec le signal que vous avez passé à `wait()` |
| Un appel qui attend un compartiment de limite de débit ou une nouvelle tentative | Il se termine de lui-même, ou annulez avec son `signal` |

```ts
process.once("SIGINT", () => {
  // Ferme les écouteurs WebSocket et conduit, et arrête le minuteur de validation.
  twitch.close();
});
```

Un script qui ne fait que des appels à l'API s'arrête de lui-même quand le dernier appel se termine.

## fetch failed derrière un proxy

L'erreur nomme la requête qui a échoué en premier.

```text
TwitchNetworkError: POST /oauth2/token could not reach Twitch: fetch failed
TwitchNetworkError: GET /users could not reach Twitch: fetch failed
```

La première est une requête au serveur OAuth (`id.twitch.tv`), en général celle du jeton d'application : c'est pourquoi un client qui ne peut pas joindre Twitch a tendance à échouer là, avant tout appel à l'API. La seconde est une requête à l'API. Dans les deux cas, la requête a d'abord été retentée quand la répéter est sans risque, et `error.cause` contient la vraie raison : un échec DNS, une connexion refusée, un certificat auquel le runtime ne fait pas confiance. Une connexion qui reste bloquée au lieu d'échouer se termine par une `TwitchTimeoutError` après `timeout` millisecondes.

Sur un réseau où le trafic sortant doit passer par un proxy, la cause est que le `fetch` de Node.js ne lit pas de lui-même `HTTP_PROXY` et `HTTPS_PROXY`. Node.js 24 le fait quand il est lancé avec `NODE_USE_ENV_PROXY=1`. Quelle que soit la version, vous pouvez donner au client un `fetch` qui utilise le proxy, par exemple avec le paquet `undici` :

```ts
import { Twitch } from "@ix-xs/twitch.api";

// Dans votre code : import { ProxyAgent, fetch as proxyFetch } from "undici";
declare class ProxyAgent {
  constructor(url: string);
}
declare function proxyFetch(url: string, init?: object): Promise<unknown>;

const dispatcher = new ProxyAgent(process.env.HTTPS_PROXY!);

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  fetch: (input, init) => proxyFetch(String(input), { ...init, dispatcher }) as Promise<Response>,
});
```

L'option `fetch` couvre l'API et le serveur OAuth. Le WebSocket d'un écouteur EventSub est une connexion à part : donnez à l'écouteur une classe qui sait passer par le proxy avec son option `webSocket`. Si le proxy inspecte le trafic TLS, le runtime doit aussi faire confiance à son certificat : sur Node.js, c'est à cela que sert `NODE_EXTRA_CA_CERTS`.

## Les types ne sont pas résolus

Le paquet fournit ses propres déclarations, pour ESM et pour CommonJS. Il n'y a aucun paquet `@types` à installer.

| Ce que dit le compilateur | Cause | Correction |
| --- | --- | --- |
| Le module n'a pas d'export par défaut, ou `Twitch is not a constructor` à l'exécution | Le client est un export nommé | `import { Twitch } from "@ix-xs/twitch.api"`, ou `const { Twitch } = require("@ix-xs/twitch.api")` |
| Aucun fichier de déclaration n'est trouvé, ou rien de ce que vous importez n'existe | La version 1 est encore installée | Lancez `npm ls @ix-xs/twitch.api`, puis installez la version 2. Voir [Depuis la version 1](/help/migrating-from-v1/) |
| `Cannot find name 'Headers'`, `'Request'`, `'Response'` ou `'AbortSignal'` (ou, avec `skipLibCheck`, ces types deviennent discrètement `any`) | Les déclarations utilisent des types standard du web et votre projet n'en a aucun | Installez `@types/node`, ou ajoutez `"DOM"` à `lib` dans `tsconfig.json` |
| Un bundler ne peut pas résoudre `node:fs/promises` | `@ix-xs/twitch.api/node` est importé dans du code compilé pour un navigateur ou un Worker | Importez-le uniquement dans du code Node.js. Il contient `FileTokenStore` et rien d'autre |
| Une chaîne n'est pas acceptée comme type d'événement par `on()` | Le type est plus récent que votre version de la bibliothèque | Écrivez sa version après un `@` : `"some.new.type@1"` |
| Un champ n'existe pas sur un événement | L'événement a plusieurs formes | Affinez-le d'abord : voir [Événements typés](/events/typed-events/) |

Le paquet décrit ses points d'entrée avec `exports`, que TypeScript lit quand `moduleResolution` vaut `"bundler"`, `"node16"` ou `"nodenext"`. Si les imports sont résolus à l'exécution mais pas dans l'éditeur, vérifiez ce réglage dans `tsconfig.json`, et assurez-vous que l'éditeur utilise la version de TypeScript de l'espace de travail.

## Voir aussi

- [Erreurs](/reference/errors/) : chaque classe d'erreur et chaque message.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : comment le jeton d'un appel est choisi.
- [Webhooks](/events/webhooks/) : les exigences de l'URL de callback et les tests en local.
- [Questions et réponses](/help/faq/) : des réponses plus courtes à des questions plus larges.
