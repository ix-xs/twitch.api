---
title: "Conduits"
description: "Recevoir des événements par WebSocket avec le jeton d'application : ce qu'est un conduit, quand le choisir, comment exécuter plusieurs shards et comment gérer les conduits à la main."
sidebar:
  order: 4
---

Un conduit est un conteneur qui appartient à votre application. Vous vous abonnez aux événements une seule fois, sur le conduit, avec le jeton d'application. Twitch livre ensuite les notifications aux shards du conduit, et chaque shard est une connexion WebSocket ou un callback de webhook que vous branchez. `twitch.eventsub.conduit()` ouvre un WebSocket et s'en sert pour desservir un shard.

## Un premier exemple

Ce programme journalise le passage en direct de n'importe quelle chaîne d'une liste. Il lui faut un identifiant client et un secret client, et aucun jeton utilisateur.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const events = twitch.eventsub.conduit(); // trouve votre conduit, ou en crée un
events.onError((error) => console.error(error.message));

const channels = await twitch.users.get({ login: ["twitchdev", "twitch"] });
for (const channel of channels) {
  events.on("stream.online", { broadcaster_user_id: channel.id }, (event) => {
    console.log(`${event.broadcaster_user_name} went live`);
  });
}
```

L'objet renvoyé est de la même classe que l'[écouteur WebSocket](/events/websocket/). `on()`, `onError()`, `onRevocation()`, `onConnect()`, `onDisconnect()`, `connected`, `sessionIds` et `close()` sont tous présents, et la connexion est maintenue et rétablie de la même manière.

## Quand un conduit est le bon choix

| Vous voulez | Utilisez |
| --- | --- |
| Agir pour un seul utilisateur, depuis une CLI, une application de bureau ou un bot doté de son propre jeton | [WebSocket](/events/websocket/) |
| Recevoir des événements sur un serveur qui a déjà une adresse HTTPS publique | [Webhooks](/events/webhooks/) |
| Suivre beaucoup de chaînes depuis un backend, sans adresse publique | Un conduit |
| Dépasser 3 connexions de 300 abonnements par utilisateur | Un conduit |
| Répartir les événements d'une application sur plusieurs processus | Un conduit à plusieurs shards |

Un conduit nécessite le jeton d'application, donc un secret client. Il n'est pas fait pour du code qui tourne sur la machine d'un utilisateur.

## Ce que fait l'écouteur

Comme `websocket()`, `conduit()` n'ouvre rien avant le premier `on()`. Chaque fois qu'une session WebSocket est établie, l'écouteur :

1. Trouve le conduit : celui indiqué par `conduitId`, sinon le premier conduit de votre application, sinon un nouveau qu'il crée.
2. Affecte sa session au shard `shardId` de ce conduit.
3. Crée les abonnements que Twitch n'a pas encore confirmés, avec le jeton d'application et le conduit comme transport.

Certains comportements diffèrent de ceux d'un écouteur WebSocket simple :

| | `websocket()` | `conduit()` |
| --- | --- | --- |
| Jeton qui s'abonne | Un jeton utilisateur | Le jeton d'application |
| Connexions | Jusqu'à 3 | 1 |
| Abonnements par connexion | 300 | Aucun plafond dans la bibliothèque |
| Après une reconnexion | Tous les abonnements sont recréés | Le shard est affecté à la nouvelle session, les abonnements ne sont pas touchés |
| Un abonnement qui existe déjà (`409`) | Refusé | Compte comme accepté |
| `close()` ou `twitch.close()` | Twitch désactive les abonnements | Les abonnements restent sur le conduit |

Les étapes 1 et 2 peuvent échouer, et l'écouteur traite différemment deux sortes d'échec :

- Un échec temporaire (un `5xx`, un `429`, une erreur réseau ou un délai d'attente dépassé) est signalé une fois à `onError`, sous la forme d'une `TwitchEventSubError` qui commence par `Could not bind the WebSocket session`. L'écouteur réessaie ensuite sur la même session, avec une attente qui croît jusqu'à 30 secondes. `handle.ready` reste en attente pendant ce temps.
- Un échec qu'attendre ne peut pas corriger, comme un identifiant de shard que le conduit n'a pas, rejette avec ce motif la promesse `ready` de chaque abonnement encore en attente, abandonne ces abonnements et ferme la connexion.

## Options

```ts
const events = twitch.eventsub.conduit({ conduitId: conduit.id, shardId: "0", keepalive: 30 });
```

| Option | Type | Par défaut | Effet |
| --- | --- | --- | --- |
| `conduitId` | `string` | premier conduit de l'application | Identifiant du conduit à rejoindre. Quand vous n'en avez aucun et que vous omettez l'option, un conduit est créé. |
| `shardId` | `string` | `"0"` | Identifiant du shard que ce processus dessert. Les identifiants de shard sont les indices `"0"`, `"1"`, `"2"`... |
| `keepalive` | `number` | Twitch utilise 10 | Nombre de secondes de silence après lesquelles Twitch envoie un keepalive, de 10 à 600. |
| `webSocket` | `WebSocketConstructor` | le `WebSocket` global | Classe WebSocket à utiliser. |
| `url` | `string` | `wss://eventsub.wss.twitch.tv/ws` | URL du WebSocket EventSub. |

Il n'y a pas d'option `user` : les abonnements passent toujours par le jeton d'application, y compris quand l'écouteur est créé à partir d'une vue `twitch.as(userId)`.

## Les abonnements survivent au processus

Les abonnements appartiennent au conduit, pas à la connexion. Quand votre processus redémarre, `on()` demande un abonnement qui existe déjà, Twitch répond `409`, et l'écouteur le compte comme accepté. Son identifiant est appris au premier événement qu'il livre.

Cela signifie aussi que `close()`, `twitch.close()` et un plantage laissent les abonnements en place. Pour en supprimer un, arrêtez son handle :

```ts
const handle = events.on("stream.offline", { broadcaster_user_id: channelId }, (event) => {
  console.log(`${event.broadcaster_user_name} went offline`);
});

await handle.ready;
await handle.stop(); // supprime l'abonnement du côté de Twitch
```

`stop()` ne peut supprimer qu'un abonnement dont l'identifiant est connu. Pour un abonnement qui existait avant le démarrage du processus et qui n'a encore livré aucun événement, supprimez-le par son identifiant comme indiqué dans [Gérer les abonnements](/events/managing-subscriptions/).

## Exécuter plusieurs shards

Twitch envoie chaque notification à un seul shard. Avec plusieurs shards, chacun desservi par son propre processus, la charge est répartie entre eux.

Créez le conduit une seule fois, avec autant de shards que de processus à exécuter, et conservez son identifiant :

```ts
const conduit = await twitch.conduits.create({ shard_count: 3 });
console.log(conduit.id);
```

Démarrez ensuite chaque processus avec l'identifiant du conduit et son propre identifiant de shard :

```ts
const events = twitch.eventsub.conduit({
  conduitId: process.env.CONDUIT_ID!,
  shardId: process.env.SHARD_ID ?? "0",
});

events.on("stream.online", { broadcaster_user_id: channelId }, (event) => {
  console.log(`[shard ${process.env.SHARD_ID}] ${event.broadcaster_user_name} went live`);
});
```

Trois règles permettent à l'ensemble de fonctionner :

- Chaque processus enregistre les mêmes gestionnaires. Un processus n'exécute que les gestionnaires qu'il a lui-même enregistrés, et un événement qui atteint un shard sans gestionnaire pour lui est abandonné. Le premier processus crée chaque abonnement, les autres reçoivent le `409` et continuent.
- Passez `conduitId` explicitement. Sans lui, l'écouteur ne crée un conduit que si l'application n'en a aucun, dimensionné pour son propre shard : `shardId: "2"` crée 3 shards. Un processus qui rejoint un conduit trop petit pour son identifiant de shard voit ses abonnements rejetés avec `Could not bind the WebSocket session: Shard 2 of conduit <id>: ...` suivi du motif donné par Twitch, et sa connexion est fermée.
- Gardez `shard_count` égal au nombre de processus que vous exécutez. Modifiez-le avec `twitch.conduits.update`.

L'abonnement est partagé par tous les processus : un `handle.stop()` dans l'un d'eux le supprime aussi pour les autres.

## Gérer les conduits à la main

Le groupe `twitch.conduits` couvre les endpoints des conduits. Tous utilisent le jeton d'application.

```ts
const conduits = await twitch.conduits.list();

for (const conduit of conduits) {
  const shards = await twitch.conduits.shards({ conduit_id: conduit.id }).all();
  for (const shard of shards) {
    console.log(conduit.id, shard.id, shard.status, shard.transport.method);
  }
}
```

| Méthode | Action |
| --- | --- |
| [conduits.list](/reference/api/conduits/#list) | Liste les conduits de votre application. |
| [conduits.create](/reference/api/conduits/#create) | Crée un conduit avec un nombre de shards donné. |
| [conduits.update](/reference/api/conduits/#update) | Modifie le nombre de shards. Le réduire supprime les shards dont les identifiants sont les plus élevés. |
| [conduits.delete](/reference/api/conduits/#delete) | Supprime un conduit. Ses abonnements s'arrêtent peu après. |
| [conduits.shards](/reference/api/conduits/#shards) | Liste les shards d'un conduit, avec leur statut et leur transport. |
| [conduits.updateShards](/reference/api/conduits/#updateshards) | Fait pointer des shards vers une session WebSocket ou un callback de webhook. |

`updateShards` ne lève pas d'erreur quand Twitch refuse une partie des shards. Elle se résout avec les shards mis à jour dans `data` et les shards refusés dans `errors` :

```ts
const { data, errors } = await twitch.conduits.updateShards({
  conduit_id: conduit.id,
  shards: [{ id: "0", transport: { method: "websocket", session_id } }],
});

for (const failure of errors) console.error(`Shard ${failure.id}: ${failure.message} (${failure.code})`);
console.log(`${data.length} shard(s) updated`);
```

Seuls les shards dont le statut est `enabled` reçoivent des événements. Pour être prévenu quand l'un d'eux s'arrête, abonnez-vous à [`conduit.shard.disabled`](/reference/event-types/#conduitsharddisabled) avec votre identifiant client comme `client_id`.

## Autorisations dont le jeton d'application a besoin

Le jeton d'application ne porte aucun scope. Pour un type d'événement qui en exige un, Twitch vérifie que l'utilisateur nommé dans la condition a accordé ce scope à votre application. L'utilisateur le fait une seule fois, par le [flux par code d'autorisation](/auth/authorization-code/) ou le [flux par code d'appareil](/auth/device-code/). L'abonnement lui-même n'utilise pas son jeton.

- `stream.online`, `channel.update` et les autres types sans scope fonctionnent pour n'importe quelle chaîne.
- `channel.follow` exige `moderator:read:followers`, accordé par l'utilisateur indiqué dans `moderator_user_id`.
- Les types de chat tels que `channel.chat.message` exigent davantage avec un jeton d'application qu'avec un jeton utilisateur : `user:read:chat` et `user:bot` accordés par l'utilisateur indiqué dans `user_id`, plus soit `channel:bot` accordé par le diffuseur, soit le statut de modérateur de cet utilisateur dans la chaîne.

```ts
// botId a accordé user:read:chat et user:bot, le diffuseur a accordé channel:bot.
events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
  console.log(`${event.chatter_user_name}: ${event.message.text}`);
});
```

Quand une autorisation manque, Twitch refuse l'abonnement avec un `403`, ce qui rejette `handle.ready` et parvient à `onError`. Quand un utilisateur retire votre application par la suite, l'abonnement est révoqué et `onRevocation` est appelé. La [référence des types d'événements](/reference/event-types/) donne les exigences de chaque type.

## Limites

- La [documentation de Twitch sur les conduits](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/) fixe les limites à cinq conduits activés par application et à 20 000 shards par conduit, et précise que ces nombres peuvent changer.
- Les abonnements d'un conduit comptent dans le coût total de votre application. [Gérer les abonnements](/events/managing-subscriptions/) montre comment le lire.
- Un écouteur dessert un seul shard sur une seule connexion. Créez un écouteur par shard.
- Quand un shard est désactivé, par exemple parce que sa connexion est tombée, Twitch essaie d'envoyer ses notifications à un autre shard. Si celui-ci est désactivé lui aussi, la notification est perdue. Avec un seul shard, un événement qui se produit pendant que la connexion est coupée n'est donc pas livré plus tard.
- Un conduit dont tous les shards sont désactivés depuis 72 heures est supprimé par Twitch.

## Voir aussi

- [WebSocket](/events/websocket/) : la gestion de la connexion, commune aux deux écouteurs.
- [Gérer les abonnements](/events/managing-subscriptions/) : lister les abonnements d'un conduit, les supprimer.
- [twitch.eventsub.conduit](/reference/api/eventsub/#conduit) : la méthode dans la référence.
- [twitch.conduits](/reference/api/conduits/) : tous les endpoints des conduits.
