---
title: "Erreurs"
description: "Chaque classe d'erreur de la bibliothèque : quand elle est levée, les champs qu'elle porte et ce qu'il faut en faire. Puis ce que le circuit des requêtes fait de chaque statut HTTP."
---

Tout ce que lève la bibliothèque est une instance de `TwitchError` ou de l'une de ses sept sous-classes, à [deux exceptions près](/reference/errors/#errors-that-are-not-a-twitcherror), qu'il ne revient pas à la bibliothèque d'envelopper. Toutes les classes sont exportées depuis l'entrée principale, donnent à `name` le nom de leur classe, et conservent l'échec d'origine dans `cause` quand elles en enveloppent un. Pour une introduction guidée avec un `try`/`catch` pratique, lisez d'abord [Erreurs](/basics/errors/).

## La hiérarchie

- `TwitchError`
  - `TwitchApiError`
    - `TwitchRateLimitError`
  - `TwitchAuthError`
    - `TwitchScopeError`
  - `TwitchNetworkError`
  - `TwitchTimeoutError`
  - `TwitchEventSubError`

Testez avec `instanceof`, la sous-classe avant son parent : une `TwitchRateLimitError` est aussi une `TwitchApiError`, et une `TwitchScopeError` est aussi une `TwitchAuthError`.

```ts
import {
  Twitch,
  TwitchApiError,
  TwitchAuthError,
  TwitchError,
  TwitchRateLimitError,
  TwitchScopeError,
} from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

try {
  await twitch.moderation.ban({ broadcaster_id, user_id, reason: "Spam" });
} catch (error) {
  if (error instanceof TwitchScopeError) console.log("Missing scope:", error.required);
  else if (error instanceof TwitchAuthError) console.log("No usable token:", error.message);
  else if (error instanceof TwitchRateLimitError) console.log("Retry in", error.retryAfter, "ms");
  else if (error instanceof TwitchApiError) console.log(error.status, error.message);
  else if (error instanceof TwitchError) console.log("Not sent or not answered:", error.message);
  else throw error;
}
```

## TwitchError

La classe de base. Interceptez-la pour intercepter tout ce que lève la bibliothèque. Elle est aussi levée directement, pour les problèmes qui ne correspondent à aucune sous-classe :

| Message | Quand |
| --- | --- |
| `A clientId is required: new Twitch({ clientId, clientSecret }).` | `new Twitch()` n'a reçu aucun `clientId`, ou en a reçu un vide. |
| ``No fetch implementation found. Pass one with the `fetch` option.`` | Le runtime n'a pas de `fetch` global et l'option `fetch` n'est pas définie. |
| `GET /users returned no data.` | Un endpoint qui renvoie toujours un objet a répondu par une liste vide. |
| `GET /users answered with a body that is not JSON.` | Une réponse de succès n'a pas pu être analysée, par exemple une page HTML venant d'un proxy. `cause` contient l'erreur d'analyse. |

Elle n'a aucun champ propre en dehors de `message`, `name` et `cause`.

Que faire : les deux premiers sont des erreurs dans le code appelant, corrigez l'appel. Les deux derniers méritent d'être journalisés avec la requête, ils signalent quelque chose entre vous et Twitch.

## TwitchApiError

Twitch a répondu par un statut hors de la plage 2xx, et le circuit des requêtes n'avait aucune raison de retenter ou avait épuisé ses nouvelles tentatives. C'est aussi l'erreur du serveur OAuth (`id.twitch.tv`) quand une demande de jeton, une validation ou une révocation est refusée.

| Champ | Type | Contenu |
| --- | --- | --- |
| `status` | `number` | Code de statut HTTP. |
| `method` | `string` | Méthode HTTP de la requête en échec. |
| `url` | `string` | URL complète de la requête en échec. |
| `error` | `string` ou `undefined` | Libellé court envoyé par Twitch, comme `Bad Request` ou `Unauthorized`. |
| `body` | `unknown` | Le corps de la réponse, analysé, ou son texte brut quand ce n'est pas du JSON. |
| `headers` | `Headers` ou `undefined` | Les en-têtes de la réponse. |

Pour un appel à l'API, `message` est le message de Twitch suivi du statut et du chemin :

```text
Missing required parameter (400 on GET /helix/users)
```

Pour le serveur OAuth, `message` est le message de Twitch seul.

Que faire : lisez `status`. Un `400` est un paramètre que Twitch n'accepte pas, et le message le nomme. Un `401` sur un jeton que le client considère comme valide signifie que le jeton n'est pas autorisé à faire cela (voir le tableau des statuts plus bas). Un `403` signifie en général que l'utilisateur n'est pas autorisé à faire cela sur cette chaîne. Un `404` est une ressource qui n'existe pas. Un `409` est un conflit avec l'état actuel, comme un abonnement qui existe déjà. Un `5xx` ne vous parvient qu'après les nouvelles tentatives.

## TwitchRateLimitError

Une sous-classe de `TwitchApiError` dont le `status` vaut `429`. Elle est levée quand la limite de débit a été atteinte et que la requête n'a pas été retentée :

- avec `rateLimit: "throw"`, avant l'envoi quand le compartiment est connu comme vide (le message est alors `Rate limit reached for GET /users.`, sans `body` ni `headers`), et sur toute réponse `429` ;
- avec `rateLimit: "wait"`, la valeur par défaut, quand un `429` revient encore après chaque nouvelle tentative.

| Champ | Type | Contenu |
| --- | --- | --- |
| `resetAt` | `number` ou `undefined` | Le moment, en millisecondes depuis l'époque Unix, où la requête peut être renvoyée. Il vient de l'en-tête `Ratelimit-Reset` quand le compartiment est vide, et c'est une estimation quand la limite est propre à l'endpoint. |
| `retryAfter` | `number` | Millisecondes restantes jusqu'à `resetAt`, jamais négatif. `0` quand `resetAt` est inconnu. Calculé à chaque lecture. |

S'y ajoutent tous les champs de `TwitchApiError`.

Que faire : attendez `retryAfter` millisecondes, puis renvoyez la requête. [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/) explique les compartiments.

## TwitchAuthError

Il n'y a aucun jeton utilisable pour l'appel : aucun n'est enregistré, aucun ne convient, le client ne peut pas déterminer qui agit, ou le jeton qui convient est mort et ne peut pas être renouvelé. Sauf dans ce dernier cas, rien n'a été envoyé à l'API.

| Champ | Type | Contenu |
| --- | --- | --- |
| `userId` | `string` ou `undefined` | L'utilisateur concerné, quand le problème porte sur le jeton d'un utilisateur. |

| Message | Quand |
| --- | --- |
| `GET /users needs a user access token and no user is registered. Add one with twitch.auth.addUser().` | L'endpoint prend un jeton utilisateur et le client n'a aucun utilisateur. |
| `GET /users needs a user access token and several users are registered. Choose one with { as: userId } or twitch.as(userId).` | L'endpoint prend un jeton utilisateur, plusieurs utilisateurs sont enregistrés et l'appel n'en désigne aucun. |
| `POST /polls needs the token of user 123, which is not registered. Add it with twitch.auth.addUser() or choose a user with { as: userId }.` | L'appel désigne un utilisateur que le client ne connaît pas, et plusieurs autres utilisateurs sont enregistrés. |
| `POST /chat/messages does not say who is acting and several users are registered. Set "sender_id", or choose a user with { as: userId } or twitch.as(userId).` | L'endpoint accepte les deux sortes de jeton, l'appel omet le champ qui désigne l'utilisateur qui agit, et plusieurs utilisateurs sont enregistrés. |
| `POST /chat/messages needs "sender_id": the call is made with the app token, which belongs to no user. Set "sender_id", or register the acting user with twitch.auth.addUser().` | Même appel, sans utilisateur enregistré ou avec `{ as: "app" }` : le jeton d'application est utilisé et il n'y a personne à mettre dans le champ. |
| `POST /chat/messages needs "sender_id": a token passed by hand does not say who it belongs to.` | Même appel, fait avec l'option `token`. |
| `GET /users can use a user token, but several users are registered. Choose one with { as: userId } or twitch.as(userId).` | L'endpoint accepte les deux sortes de jeton, le client n'a pas de `clientSecret`, et plusieurs utilisateurs sont enregistrés. |
| `GET /users only accepts a user access token: the app token cannot be used for it.` | `{ as: "app" }` ou `twitch.as("app")` sur un endpoint qui ne prend qu'un jeton utilisateur. |
| `No token is registered for user 123. Add it with twitch.auth.addUser().` | `{ as }` ou `twitch.as()` a désigné un utilisateur que le client ne connaît pas. `twitch.auth.refresh()` lève la première phrase seule. |
| `GET /eventsub/conduits needs an app access token, which requires a clientSecret.` | L'endpoint prend le jeton d'application et le client n'a pas de `clientSecret`. Pour un endpoint qui prend l'une ou l'autre sorte, le message se termine par `(or a registered user token)`. |
| `A clientSecret is required to exchange an authorization code.` | `twitch.auth.exchangeCode()` sur un client sans `clientSecret`. |
| `A clientSecret is required to get an app access token.` | `{ as: "app" }` ou `twitch.auth.appToken()` sur un client sans `clientSecret`. |
| `This is an app access token, not a user access token.` | `twitch.auth.addUser()` a reçu un jeton qui n'appartient à aucun utilisateur. |
| `This token was issued to another application (client ID abc), so it cannot be used with client ID xyz.` | `twitch.auth.addUser()` a validé un jeton qui a été accordé à un autre identifiant client. |
| `The device code expired before the user approved the request.` | Le `flow.wait()` du flux par code d'appareil a dépassé le temps imparti. |
| `Twitch rejected the refresh token of user 123: ... The user has to authorize the app again.` | Un rafraîchissement a été refusé pour de bon, et le magasin de jetons ne contenait pas de jeton plus récent. L'utilisateur a été retiré et `tokenInvalid` a été émis. `cause` contient la `TwitchApiError`. |
| `The access token of user 123 is no longer valid and there is no refresh token to renew it. The user has to authorize the app again.` | Un appel a reçu un `401`, le jeton est mort et ne peut pas être renouvelé. L'utilisateur a été retiré et `tokenInvalid` a été émis. |
| `The access token of user 123 expired and there is no refresh token to renew it.` | `twitch.auth.refresh()` a été appelée pour un jeton qui n'a pas de jeton de rafraîchissement. |
| `User 123 was removed while their token was being renewed.` | `removeUser()` s'est exécutée pendant un rafraîchissement. |

Que faire : les messages qui portent sur l'utilisateur qui agit se résolvent en enregistrant un utilisateur, en en désignant un, ou en remplissant le champ que cite le message, voir [Agir au nom d'un utilisateur](/basics/acting-as-a-user/). Les messages qui se terminent par « has to authorize the app again » disent ce qu'ils veulent dire : faites repasser l'utilisateur par un flux. [Gérer les utilisateurs](/auth/managing-users/) décrit la vie d'un jeton.

## TwitchScopeError

Une sous-classe de `TwitchAuthError`. Le jeton choisi pour l'appel existe, et il lui manque le scope dont l'endpoint a besoin. Elle est levée avant l'envoi de toute requête.

| Champ | Type | Contenu |
| --- | --- | --- |
| `required` | `readonly Scope[]` | Les scopes qui satisferaient l'endpoint. Un seul d'entre eux suffit. |
| `granted` | `readonly string[]` | Les scopes que possède le jeton. |
| `userId` | `string` | Le propriétaire du jeton. |

```text
The token of user 123 is missing the "moderator:manage:banned_users" scope required by POST /moderation/bans.
```

Quand plusieurs scopes conviendraient, ils sont reliés par « or ».

Que faire : ajoutez l'un des scopes de `required` à ceux de votre connexion et faites repasser l'utilisateur par le flux. Un jeton ne peut pas gagner de scope après coup. La vérification ne s'applique qu'aux jetons utilisateur que gère le client : un jeton brut passé avec l'option `token` n'est pas vérifié, et les abonnements aux événements sont vérifiés par Twitch, pas ici.

## TwitchNetworkError

Une requête n'a pas obtenu de réponse : la résolution DNS a échoué, la connexion a été refusée ou réinitialisée, ou le corps a cessé d'arriver à mi-chemin. Le message a la forme `GET /users could not reach Twitch: fetch failed` pour l'API et `POST /oauth2/token could not reach Twitch: fetch failed` pour le serveur OAuth, et `cause` contient l'erreur du runtime, qui en dit généralement plus.

Elle n'a aucun champ propre.

Pour les requêtes `GET`, `PUT` et `DELETE` à l'API, la requête a déjà été retentée avec une attente exponentielle quand vous voyez cette erreur. `POST` et `PATCH` ne sont pas envoyées deux fois, parce que Twitch a peut-être traité la première. Sur le serveur OAuth, la demande du jeton d'application et les validations de jeton sont retentées de la même façon. Un rafraîchissement, un échange de code, une révocation et les requêtes du flux par code d'appareil sont envoyés une seule fois : un jeton de rafraîchissement ou un code peut être à usage unique.

Que faire : vérifiez le chemin réseau (pare-feu, proxy, DNS). Pour un `POST` ou un `PATCH`, déterminez si l'action a eu lieu avant de la renvoyer.

## TwitchTimeoutError

Une tentative a duré plus longtemps que `timeout` (15 secondes par défaut), en comptant le temps de lecture du corps d'une réponse de l'API. Le message a la forme `GET /users timed out after 15000 ms.`, ou `POST /oauth2/token timed out after 15000 ms.` pour le serveur OAuth. Les requêtes au serveur OAuth utilisent le `timeout` du client, pas celui d'un appel isolé.

Elle n'a aucun champ propre. La règle des nouvelles tentatives est celle de `TwitchNetworkError`.

Que faire : augmentez `timeout` sur le client ou pour l'appel si l'endpoint est lent par nature, et regardez du côté du réseau sinon.

## TwitchEventSubError

Quelque chose s'est mal passé dans un écouteur EventSub. Contrairement aux autres, elle ne sort le plus souvent pas d'un `throw` : un écouteur la signale en rejetant `handle.ready` et en appelant les écouteurs `onError` (ou `console.error` quand il n'y en a aucun).

| Le message commence par | Quand | Comment vous la recevez |
| --- | --- | --- |
| `Could not subscribe to channel.follow (version 2):` | Twitch a refusé l'abonnement, l'écouteur est plein, ou un échec temporaire (un `429`, un `5xx`, le réseau) était toujours là après 6 tentatives sur la même session. Le reste du message est la raison, et `cause` est l'erreur d'origine, en général une `TwitchApiError`. | `handle.ready` et `onError` |
| `The subscription to stream.online was removed before Twitch confirmed it.` | `stop()` ou `close()` a été appelée avant que l'abonnement soit accepté. | `handle.ready` |
| `Twitch did not verify the callback for stream.online within 60 seconds.` | Un abonnement par webhook a été créé et le défi de vérification n'a jamais atteint l'écouteur. | `handle.ready` et `onError` |
| `The request body was already parsed by a middleware` | `nodeHandler()` a reçu un corps qu'il ne peut pas vérifier. La livraison reçoit un `500` en réponse. | `onError` |
| `Could not open the EventSub WebSocket:` | Le WebSocket n'a pas pu être créé. L'écouteur réessaie. | `onError` |
| `Could not bind the WebSocket session:` | Un shard de conduit n'a pas pu être rattaché à la session. Un échec temporaire est signalé une fois puis retenté. Un échec que l'attente ne peut pas corriger rejette les abonnements encore en attente, avec ce message pour raison. | `onError`, et `handle.ready` quand il est définitif |
| `Unknown EventSub type "some.type".` | `on()` ou `subscribe()` a reçu un nom de type que la bibliothèque ne connaît pas, sans version. Écrivez `"some.type@1"`. | Levée |
| ``A webhook listener needs a `callback` URL and a `secret`.`` | `twitch.eventsub.webhook()` a été appelée sans l'un des deux. | Levée |
| `The webhook secret must be 10 to 100 characters long.` | Le `secret` n'a pas la bonne longueur. | Levée |
| `This runtime has no global WebSocket.` | `websocket()` ou `conduit()` n'a trouvé aucune classe WebSocket. Passez-en une avec l'option `webSocket`. | Levée |

Elle n'a aucun champ propre.

`onError` reçoit aussi, inchangées, des erreurs qui sont les vôtres et non de cette classe : ce que lève un gestionnaire, et ce qu'un écouteur `onConnect` ou `onDisconnect` lève ou rejette.

Que faire : lisez la raison après les deux-points. Un `403` signifie que le jeton n'a pas l'autorisation qu'exige le type d'événement, indiquée dans [Types d'événements](/reference/event-types/). [Recevoir des événements](/events/overview/) décrit `onError` et `ready`.

## Les erreurs qui ne sont pas des TwitchError

Deux sortes d'échec vous parviennent telles quelles, parce qu'elles sont les vôtres et non celles de la bibliothèque :

- **Un appel annulé** est rejeté avec la raison de votre `AbortSignal`, une `AbortError` sauf si vous en avez donné une autre.
- **Une erreur levée par votre magasin de jetons** sort, inchangée, de l'appel qui avait besoin du magasin.

Un `catch` qui n'attend que des `TwitchError` doit donc relancer ce qu'il ne reconnaît pas, comme dans l'exemple du début.

## Ce qu'il advient de chaque statut HTTP

Voici ce que le circuit des requêtes fait de la réponse de l'API, avant que quoi que ce soit ne soit levé. « Retentée » signifie jusqu'à `retries` tentatives supplémentaires (3 par défaut), avec une attente aléatoire qui double de 250 millisecondes jusqu'à 8 secondes.

| Réponse | Ce que fait le client | Ce que vous recevez |
| --- | --- | --- |
| `2xx` avec un corps | Analyse le JSON. | Le résultat de la méthode. |
| `204`, ou `2xx` sans corps | Rien à analyser. | `undefined` de la part de `twitch.request()`. Les méthodes le transforment en leur propre valeur vide. |
| `401` | Une fois par appel, demande à Twitch si le jeton est encore valide. Un jeton mort est renouvelé (le jeton d'application est demandé de nouveau, un jeton utilisateur est rafraîchi) et la requête est envoyée une seconde fois, sans consommer de nouvelle tentative. | Le résultat de la seconde tentative. Une `TwitchApiError` quand le jeton était valide, quand c'était un jeton brut, ou quand la seconde tentative est refusée elle aussi. Une `TwitchAuthError` quand le jeton est mort et ne peut pas être renouvelé. |
| `429`, compartiment vide | Avec `rateLimit: "wait"`, marque le compartiment vide jusqu'à l'heure donnée par `Ratelimit-Reset`, l'attend et retente. | Le résultat, ou une `TwitchRateLimitError` une fois les nouvelles tentatives épuisées. Avec `rateLimit: "throw"`, une `TwitchRateLimitError` immédiatement. |
| `429`, compartiment non vide | Une limite propre à cet endpoint. Avec `rateLimit: "wait"`, émet `rateLimit`, attend avec un délai qui double de 1 seconde jusqu'à 30 secondes, et retente. | Comme ci-dessus. |
| `5xx` sur `GET`, `PUT`, `DELETE` | Retentée. | Le résultat, ou une `TwitchApiError` une fois les nouvelles tentatives épuisées. |
| `5xx` sur `POST`, `PATCH` | Pas retentée. | Une `TwitchApiError`. |
| Tout autre `4xx` | Pas retentée. | Une `TwitchApiError`. |
| Pas de réponse, ou un délai d'attente dépassé | Retentée pour `GET`, `PUT` et `DELETE` uniquement. | Le résultat, ou une `TwitchNetworkError` ou une `TwitchTimeoutError`. |

Les requêtes au serveur OAuth suivent une règle plus courte. Une réponse hors de la plage 2xx est une `TwitchApiError`. La demande du jeton d'application et les validations de jeton sont retentées après un `5xx` ou une panne réseau, avec la même attente et le même `retries`. Tout le reste est envoyé une seule fois.

Certaines recherches ne lèvent jamais d'erreur pour un élément manquant : elles renvoient `null` ou omettent l'élément de la liste. [Appeler l'API](/basics/calling-the-api/) liste les formes de retour.

## Voir aussi

- [Erreurs](/basics/errors/) : comment traiter les erreurs en pratique.
- [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/) : compartiments, attente, `retries` et `timeout`.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : les règles derrière les messages de `TwitchAuthError`.
- [Dépannage](/help/troubleshooting/) : les mêmes erreurs, en partant du symptôme.
