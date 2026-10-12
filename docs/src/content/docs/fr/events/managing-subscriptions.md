---
title: "Gérer les abonnements"
description: "Attendre les abonnements, les arrêter, lister ceux que votre application détient du côté de Twitch, en créer et en supprimer à la main, et lire les statuts et le coût."
sidebar:
  order: 6
---

Les écouteurs créent et suppriment les abonnements pour vous, à mesure que des gestionnaires arrivent et repartent. Cette page décrit ce qui se passe en coulisses, ainsi que les appels de `twitch.eventsub` qui vous permettent d'inspecter et de nettoyer les abonnements que Twitch détient pour votre application.

## Un premier exemple

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });
const hooks = twitch.eventsub.webhook({ callback, secret });

const handle = hooks.on("stream.online", { broadcaster_user_id: "141981764" }, (event) => {
  console.log(`${event.broadcaster_user_name} is live`);
});

await handle.ready; // Twitch a accepté l'abonnement
console.log(handle.type, handle.version, handle.condition);

await handle.stop(); // retire le gestionnaire, et l'abonnement avec lui
```

## Attendre un abonnement

`handle.ready` est une promesse résolue une fois l'abonnement en place : quand Twitch a répondu à la requête sur un WebSocket ou un conduit, quand le défi de vérification est arrivé sur un webhook. L'attendre est facultatif.

Elle est rejetée avec une `TwitchEventSubError` quand Twitch refuse l'abonnement. Le message est de la forme `Could not subscribe to <type> (version <version>): <reason>`, et `cause` contient l'erreur d'origine, ce qui vous permet de distinguer un scope manquant d'un autre échec :

```ts
import { TwitchApiError, TwitchEventSubError } from "@ix-xs/twitch.api";

const handle = events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, () => {});

try {
  await handle.ready;
} catch (error) {
  if (error instanceof TwitchEventSubError && error.cause instanceof TwitchApiError && error.cause.status === 403) {
    console.error(`Not authorized for ${handle.type}: ask for the missing scope`);
  } else {
    throw error;
  }
}
```

Un abonnement refusé est retiré de l'écouteur. Deux autres cas méritent d'être connus :

- Si vous arrêtez le handle ou fermez l'écouteur avant la confirmation de Twitch, `ready` est rejetée avec `The subscription to <type> was removed before Twitch confirmed it.`
- Tant qu'un WebSocket est déconnecté, `ready` reste en attente jusqu'au retour de la connexion. Sur un conduit, elle attend aussi que le shard soit affecté, et elle est rejetée si cette affectation échoue définitivement.

Les gestionnaires qui partagent un abonnement partagent la même promesse `ready`.

## Arrêter un gestionnaire

`handle.stop()` retire ce seul gestionnaire. Quand d'autres gestionnaires sont encore rattachés au même abonnement, rien d'autre ne se passe. Quand c'était le dernier, l'écouteur oublie l'abonnement et le supprime du côté de Twitch :

| Transport | Ce que fait le dernier `stop()` |
| --- | --- |
| WebSocket | Supprime l'abonnement avec le jeton utilisateur, quand la session est connectée. Ferme la connexion si c'était son dernier abonnement. Hors connexion, il n'envoie rien : Twitch a déjà désactivé l'abonnement. |
| Webhook | Supprime l'abonnement avec le jeton d'application. Avec `subscribe: false`, il n'envoie rien. |
| Conduit | Supprime l'abonnement avec le jeton d'application, que l'écouteur soit connecté ou non. |

La promesse renvoyée par `stop()` est résolue quand la requête est terminée. Un `404` de Twitch, qui signifie que l'abonnement avait déjà disparu, est ignoré. Tout autre échec la rejette.

Appeler `stop()` pendant que l'abonnement est encore en cours de création est sans danger : l'écouteur le supprime dès que Twitch le renvoie.

:::caution
`close()` n'est pas `stop()`. Fermer un écouteur WebSocket, directement ou par `twitch.close()`, laisse Twitch désactiver ses abonnements. Fermer un écouteur conduit les laisse sur le conduit, et un écouteur webhook n'a pas de `close()` du tout. Sur les webhooks et les conduits, les abonnements ne disparaissent que lorsqu'un handle est arrêté ou que vous les supprimez à la main.
:::

Un abonnement webhook ou conduit qui existait déjà au démarrage du processus n'a pas d'identifiant connu tant qu'il n'a pas livré son premier événement. D'ici là, `stop()` retire le gestionnaire sans rien supprimer. Supprimez un tel abonnement par son identifiant, comme décrit plus bas.

## Lister vos abonnements

`twitch.eventsub.subscriptions()` renvoie un [paginateur](/basics/pagination/) sur les abonnements que Twitch détient, du plus ancien au plus récent.

```ts
for await (const subscription of twitch.eventsub.subscriptions({ type: "stream.online" })) {
  console.log(subscription.id, subscription.status, subscription.transport.method, subscription.condition);
}

const failed = await twitch.eventsub.subscriptions({ status: "notification_failures_exceeded" }).all();
```

| Filtre | Conserve |
| --- | --- |
| `status` | Les abonnements dans cet état, par exemple `"enabled"`. |
| `type` | Les abonnements de ce type. |
| `user_id` | Les abonnements dont la condition mentionne cet utilisateur. |
| `subscription_id` | L'abonnement qui porte cet identifiant. |
| `conduit_id` | Les abonnements livrés par ce conduit. |

Utilisez au plus un filtre par appel. L'endpoint n'a pas de paramètre de taille de page : Twitch décide du nombre d'éléments que contient une page.

Les abonnements que vous voyez dépendent du jeton. Avec le jeton d'application, vous obtenez les abonnements webhook et conduit de votre application. Pour voir les abonnements WebSocket créés avec le jeton d'un utilisateur, faites l'appel au nom de cet utilisateur :

```ts
const ofBot = await twitch.eventsub.subscriptions({}, { as: botId }).all();

for (const subscription of ofBot) {
  console.log(subscription.type, subscription.status, subscription.transport.session_id);
}
```

Un client qui dispose d'un secret client utilise le jeton d'application pour cet appel, sauf si vous passez `{ as }`, même quand un utilisateur est enregistré.

## Lire les totaux et le coût

Le corps de chaque page porte trois totaux à côté des éléments. Ils se trouvent dans `page.raw` :

```ts
const page = await twitch.eventsub.subscriptions();
const { total, total_cost, max_total_cost } = page.raw;

console.log(`${total} subscriptions, cost ${total_cost} of ${max_total_cost}`);
```

| Champ | Signification |
| --- | --- |
| `total` | Nombre d'abonnements que vous avez créés. |
| `total_cost` | Somme des coûts de vos abonnements. |
| `max_total_cost` | Coût total maximal que vous êtes autorisé à atteindre. |

Chaque abonnement a son propre `cost`, qui est ce qu'il ajoute à `total_cost`. Les règles qui déterminent le coût d'un abonnement sont celles de Twitch, et elles sont expliquées dans la section [Subscription limits](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#subscription-limits) de la documentation Twitch.

## Créer un abonnement à la main

`twitch.eventsub.subscribe()` crée un abonnement et se résout avec celui-ci. Vous en avez besoin pour les abonnements qu'un écouteur ne crée pas : ceux d'un écouteur webhook construit avec `subscribe: false`, ou ceux d'un endpoint que la bibliothèque ne dessert pas.

```ts
const created = await twitch.eventsub.subscribe({
  type: "stream.online",
  condition: { broadcaster_user_id: "141981764" },
  transport: { method: "webhook", callback: "https://example.com/twitch/eventsub", secret },
});

console.log(created.id, created.status, created.cost);
```

Le type et la condition sont typés comme dans `on()`, et la version est déduite du nom. Le jeton suit le transport : un jeton utilisateur pour `{ method: "websocket", session_id }`, le jeton d'application pour `webhook` et `{ method: "conduit", conduit_id }`.

Un abonnement webhook démarre à l'état `webhook_callback_verification_pending` et passe à `enabled` une fois que le callback a répondu au défi. Contrairement à un écouteur, `subscribe()` lève une erreur quand l'abonnement existe déjà : interceptez la `TwitchApiError` dont le `status` vaut `409` si cela vous convient. Les autres erreurs sont décrites dans [Erreurs](/basics/errors/).

Un écouteur n'exécute des gestionnaires que pour les abonnements qu'il connaît. Si les événements d'un abonnement créé à la main arrivent sur un écouteur, enregistrez-y un gestionnaire avec le même type et la même condition.

## Supprimer un abonnement à la main

`twitch.eventsub.unsubscribe(id)` supprime un abonnement par son identifiant.

```ts
await twitch.eventsub.unsubscribe(subscription.id);

// Un abonnement WebSocket est supprimé au nom de l'utilisateur qui l'a créé.
await twitch.eventsub.unsubscribe(subscription.id, { as: botId });
```

Un écouteur n'est pas prévenu quand vous supprimez ainsi l'un de ses abonnements : ses gestionnaires restent enregistrés et ne reçoivent plus rien. Dans un programme en cours d'exécution, préférez `handle.stop()`.

## Supprimer les abonnements webhook qui ne fonctionnent plus

Les abonnements webhook s'accumulent quand une URL de callback change ou qu'un serveur disparaît. Ce script supprime tous les abonnements webhook qui ne sont ni activés ni en attente de leur défi.

```ts title="scripts/clean-subscriptions.ts"
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// Lit d'abord toute la liste, pour que les suppressions ne décalent pas les pages.
const subscriptions = await twitch.eventsub.subscriptions().all();

const dead = subscriptions.filter(
  (subscription) =>
    subscription.transport.method === "webhook" &&
    subscription.status !== "enabled" &&
    subscription.status !== "webhook_callback_verification_pending",
);

for (const subscription of dead) {
  await twitch.eventsub.unsubscribe(subscription.id);
  console.log(`Deleted ${subscription.type} (${subscription.status}) of ${subscription.transport.callback}`);
}

console.log(`${dead.length} of ${subscriptions.length} subscriptions deleted`);
```

Pour supprimer plutôt les abonnements d'un ancien tunnel ou d'un ancien domaine, filtrez sur `subscription.transport.callback`.

## Statuts d'abonnement

`status` est typé comme `EventSubSubscriptionStatus`. Seuls les abonnements `enabled` livrent des événements.

| Statut | Signification |
| --- | --- |
| `enabled` | L'abonnement livre des événements. |
| `webhook_callback_verification_pending` | Twitch attend que le callback réponde au défi. |
| `webhook_callback_verification_failed` | Le callback n'a pas répondu correctement au défi. |
| `notification_failures_exceeded` | Trop de livraisons vers le callback ont échoué. |
| `authorization_revoked` | L'utilisateur a retiré l'autorisation dont dépendait l'abonnement. |
| `moderator_removed` | Le modérateur nommé dans la condition n'est plus modérateur de la chaîne. |
| `user_removed` | Un utilisateur nommé dans la condition n'existe plus. |
| `chat_user_banned` | L'utilisateur nommé dans la condition a été banni du chat du diffuseur. |
| `version_removed` | Le type, ou cette version du type, n'est plus disponible. |
| `beta_maintenance` | Le type est en bêta et en maintenance. |
| `websocket_disconnected` | Le client a fermé la connexion. |
| `websocket_failed_ping_pong` | Le client n'a pas répondu à un ping. |
| `websocket_received_inbound_traffic` | Le client a envoyé un message autre qu'un pong. |
| `websocket_connection_unused` | Le client n'a créé aucun abonnement à temps après s'être connecté. |
| `websocket_internal_error` | Twitch a rencontré une erreur interne. |
| `websocket_network_timeout` | Le délai d'attente de Twitch a expiré pendant l'écriture sur la connexion. |
| `websocket_network_error` | Twitch a rencontré une erreur réseau pendant l'écriture sur la connexion. |
| `websocket_failed_to_reconnect` | Le client n'est pas passé sur la nouvelle connexion après une demande de reconnexion. |
| `conduit_deleted` | Le conduit de l'abonnement a été supprimé. |

## Révocations

Quand Twitch met fin de lui-même à un abonnement, il envoie une révocation. L'écouteur abandonne l'abonnement, cesse d'appeler ses gestionnaires et appelle les écouteurs `onRevocation` avec l'abonnement, dont le `status` indique pourquoi.

```ts
declare function alertOwner(text: string): void;

hooks.onRevocation((subscription) => {
  const channel = subscription.condition.broadcaster_user_id;

  if (subscription.status === "authorization_revoked") {
    alertOwner(`Channel ${channel} disconnected the application`);
  } else {
    alertOwner(`${subscription.type} was revoked for channel ${channel}: ${subscription.status}`);
  }
});
```

L'écouteur ne se réabonne pas. Une fois la cause corrigée, par exemple après que l'utilisateur a de nouveau autorisé votre application, appelez `on()` pour créer un nouvel abonnement.

Sur les webhooks et les conduits, vous pouvez aussi suivre les autorisations pour toute l'application avec [`user.authorization.revoke`](/reference/event-types/#userauthorizationrevoke), dont la condition est votre identifiant client.

## Coût et limites

- Le coût total de vos abonnements ne peut pas dépasser `max_total_cost`. Lisez les deux nombres dans `page.raw` au lieu de les supposer.
- Créer un abonnement qui existe déjà avec le même transport donne un `409`. Les écouteurs webhook et conduit le comptent comme accepté, `subscribe()` le lève.
- Les abonnements WebSocket ont leurs propres limites par utilisateur, listées dans [WebSocket](/events/websocket/).

## Voir aussi

- [Recevoir des événements](/events/overview/) : le handle, `onError` et `onRevocation`.
- [Pagination](/basics/pagination/) : tout ce que sait faire le paginateur renvoyé par `subscriptions()`.
- [twitch.eventsub](/reference/api/eventsub/) : `subscribe`, `unsubscribe` et `subscriptions` dans la référence.
- [Types d'événements](/reference/event-types/) : la condition et le scope de chaque type.
