---
title: "Recevoir des événements"
description: "Comment les événements EventSub arrivent jusqu'à votre programme : les trois transports, comment en choisir un, et l'interface on() qu'ils partagent."
sidebar:
  order: 1
---

EventSub est le moyen par lequel Twitch signale à votre programme qu'il s'est passé quelque chose : un message dans le chat, un follow, un stream qui démarre. Vous vous abonnez à un type d'événement pour une chaîne ou un utilisateur donné, et Twitch vous envoie une notification chaque fois qu'il se produit. La bibliothèque reçoit les événements par WebSocket, par webhooks ou par conduits, et les trois écouteurs partagent une même interface.

## Un premier exemple

Cet écouteur affiche le chat d'une chaîne. Il utilise un WebSocket : il n'y a donc rien à héberger.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});
const bot = await twitch.auth.addUser({ accessToken, refreshToken });

const events = twitch.eventsub.websocket();

events.on("channel.chat.message", { broadcaster_user_id: "141981764", user_id: bot.userId }, (event) => {
  console.log(`${event.chatter_user_name}: ${event.message.text}`);
});

events.onError((error) => console.error(error.message));
```

Le jeton enregistré avec `addUser` a besoin ici du scope `user:read:chat`. [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) explique comment les jetons sont enregistrés.

## Choisir un transport

Un transport est le chemin que suivent les notifications de Twitch jusqu'à vous. Les gestionnaires que vous écrivez sont les mêmes pour les trois.

| | WebSocket | Webhooks | Conduits |
| --- | --- | --- | --- |
| Créé avec | `twitch.eventsub.websocket()` | `twitch.eventsub.webhook({ callback, secret })` | `twitch.eventsub.conduit()` |
| Jeton qui s'abonne | Un jeton utilisateur | Le jeton d'application | Le jeton d'application |
| Ce que vous hébergez | Rien | Un endpoint HTTPS public sur le port 443 | Rien |
| Après un redémarrage | Les abonnements sont recréés | Les abonnements sont toujours là | Les abonnements sont toujours là |
| Capacité | 3 connexions de 300 abonnements | Limitée par le coût de vos abonnements | Limitée par le coût de vos abonnements, répartie sur les shards |
| Convient pour | Un bot ou un outil qui agit pour un seul utilisateur, le développement local | Les serveurs web et les plateformes serverless | Les backends qui suivent beaucoup de chaînes sans URL publique |

Chaque transport a sa page : [WebSocket](/events/websocket/), [Webhooks](/events/webhooks/) et [Conduits](/events/conduits/). Le jeton d'application nécessite un secret client : les webhooks et les conduits sont donc réservés au code qui tourne sur un serveur.

## S'abonner à un événement

Tous les écouteurs ont la même méthode `on(type, condition, handler)`.

```ts
events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, async (event) => {
  await twitch.chat.send({ broadcaster_id: event.broadcaster_user_id, message: `Welcome ${event.user_name}` });
});
```

- **type** est le nom du type d'abonnement, par exemple `channel.follow`. Votre éditeur le propose en autocomplétion.
- **condition** indique ce qu'il faut écouter : quelle chaîne, quel utilisateur. Ses champs dépendent du type et sont vérifiés par TypeScript.
- **handler** reçoit l'événement, typé d'après le nom. Il peut être synchrone ou `async`.

L'écouteur n'attend pas qu'un gestionnaire `async` ait terminé pour livrer l'événement suivant : deux gestionnaires peuvent donc s'exécuter en même temps. [Événements typés](/events/typed-events/) explique le fonctionnement des types, et la [référence des types d'événements](/reference/event-types/) liste chaque type avec sa condition.

## Lire les métadonnées

Le gestionnaire reçoit un second argument, `meta`, qui décrit la notification elle-même.

```ts
events.on("stream.online", { broadcaster_user_id: "141981764" }, (event, meta) => {
  console.log(meta.messageId, meta.timestamp, meta.subscription.id);
  console.log(`${event.broadcaster_user_name} went live at ${event.started_at}`);
});
```

| Champ | Type | Contenu |
| --- | --- | --- |
| `messageId` | `string` | Identifiant unique de la notification. |
| `timestamp` | `string` | Moment où Twitch l'a envoyée, sous forme d'horodatage RFC 3339. |
| `type` | `string` | Type d'abonnement, par exemple `stream.online`. |
| `version` | `string` | Version du type d'abonnement. |
| `subscription` | `EventSubSubscription` | L'abonnement auquel appartient l'événement, avec ses champs `id`, `condition`, `transport` et `cost`. |

Twitch peut livrer la même notification plusieurs fois. Les écouteurs mémorisent les identifiants de message et exécutent vos gestionnaires une seule fois par notification : vous n'avez pas à comparer `messageId` vous-même.

## Attendre un abonnement ou l'arrêter

`on()` renvoie un handle immédiatement. L'abonnement est créé en arrière-plan.

```ts
const handle = events.on("stream.online", { broadcaster_user_id: channelId }, (event) => {
  console.log(`${event.broadcaster_user_name} is live`);
});

await handle.ready; // Twitch a accepté l'abonnement
await handle.stop(); // retire ce gestionnaire
```

`ready` est résolue dès que Twitch a accepté l'abonnement, et rejetée si Twitch le refuse. Vous n'êtes pas obligé de l'attendre : un échec est aussi signalé à `onError`, et une promesse `ready` que personne n'observe ne fait jamais planter le processus. Le handle expose aussi le `type`, la `version` et la `condition` avec lesquels il a été créé. [Gérer les abonnements](/events/managing-subscriptions/) décrit ce que fait `stop()` sur chaque transport.

## Gérer les erreurs

`onError` reçoit tout ce qui se passe mal dans un écouteur :

- un abonnement refusé par Twitch, sous la forme d'une `TwitchEventSubError` dont le message commence par `Could not subscribe to <type>` et dont `cause` est l'erreur d'origine ;
- une erreur levée par l'un de vos gestionnaires, ou le rejet d'un gestionnaire `async`, transmis tels quels ;
- une connexion qui n'a pas pu être ouverte, ou un callback de webhook que Twitch n'a jamais vérifié.

```ts
import { TwitchEventSubError } from "@ix-xs/twitch.api";

const off = events.onError((error) => {
  if (error instanceof TwitchEventSubError) console.error("EventSub:", error.message, error.cause);
  else console.error("A handler failed:", error);
});

off(); // arrête d'écouter
```

Un gestionnaire qui lève une erreur n'interrompt pas la livraison : les autres gestionnaires et les événements suivants sont tout de même traités.

:::caution
Quand aucun écouteur `onError` n'est enregistré, les erreurs sont affichées avec `console.error`, précédées de `[twitch.api] EventSub error`. Appelez `onError` juste après avoir créé un écouteur si vous les voulez dans vos propres journaux.
:::

## Réagir aux révocations

Twitch révoque un abonnement quand il ne peut plus le livrer : l'utilisateur a retiré votre application, l'utilisateur a été banni ou supprimé, ou le type d'abonnement a été retiré. L'écouteur abandonne l'abonnement, ses gestionnaires ne sont plus exécutés, et `onRevocation` est appelé avec l'abonnement tel que Twitch l'a décrit en dernier.

```ts
events.onRevocation((subscription) => {
  console.warn(`${subscription.type} was revoked: ${subscription.status}`);
});
```

`subscription.status` donne la raison, par exemple `authorization_revoked` ou `user_removed`. Rien ne se réabonne tout seul. Comme `onError`, `onRevocation` renvoie une fonction qui retire l'écouteur.

## Partager un abonnement entre plusieurs gestionnaires

Appeler `on()` deux fois avec le même type et la même condition crée un seul abonnement du côté de Twitch et y rattache les deux gestionnaires. L'ordre des champs dans la condition n'a pas d'importance.

```ts
const log = events.on("stream.online", { broadcaster_user_id: channelId }, (event) => {
  console.log("online", event.started_at);
});
const announce = events.on("stream.online", { broadcaster_user_id: channelId }, async (event) => {
  await twitch.chat.send({ broadcaster_id: event.broadcaster_user_id, message: "We are live" });
});

console.log(events.size); // 1

await log.stop(); // l'abonnement reste, announce s'exécute toujours
await announce.stop(); // plus aucun gestionnaire : l'abonnement est supprimé
```

`size` est le nombre d'abonnements actifs d'un écouteur, pas le nombre de gestionnaires. Le partage se fait à l'intérieur d'un même objet écouteur : deux écouteurs qui s'abonnent à la même chose créent deux abonnements.

## D'où viennent les scopes

La plupart des types d'événements exigent un scope, accordé par un utilisateur nommé dans la condition. `channel.follow` exige `moderator:read:followers` de la part de l'utilisateur indiqué dans `moderator_user_id`, `channel.subscribe` exige `channel:read:subscriptions` de la part du diffuseur, et `stream.online` n'exige rien. La [référence des types d'événements](/reference/event-types/) donne le scope de chaque type.

Celui qui doit détenir le scope dépend du transport :

- Par WebSocket, l'abonnement est créé avec un jeton utilisateur, et ce jeton doit porter le scope.
- Par webhooks et par conduits, l'abonnement est créé avec le jeton d'application. L'utilisateur doit avoir accordé le scope à votre application à un moment donné, par l'un des flux présentés dans la [vue d'ensemble de l'authentification](/auth/overview/). Vous n'avez pas besoin de conserver son jeton.

Contrairement aux appels d'API, la bibliothèque ne vérifie pas les scopes des événements avant de s'abonner. Quand un scope manque, Twitch répond `403` et l'échec parvient à `handle.ready` et à `onError` :

```ts
const handle = events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, () => {});

try {
  await handle.ready;
} catch (error) {
  // Could not subscribe to channel.follow (version 2): subscription missing proper authorization (403 on POST /helix/eventsub/subscriptions)
  console.error((error as Error).message);
}
```

## Voir aussi

- [WebSocket](/events/websocket/) : gestion de la connexion, reconnexion et limites.
- [Webhooks](/events/webhooks/) : brancher l'écouteur sur votre serveur HTTP.
- [Conduits](/events/conduits/) : des abonnements par jeton d'application sur des shards WebSocket.
- [Événements typés](/events/typed-events/) : affiner les événements qui prennent plusieurs formes.
- [Types d'événements](/reference/event-types/) : chaque type, sa condition et son scope.
