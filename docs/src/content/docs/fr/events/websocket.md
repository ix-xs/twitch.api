---
title: "WebSocket"
description: "Recevoir des événements par WebSocket avec un jeton utilisateur : ce que l'écouteur fait de lui-même, comment suivre la connexion, ses options et les limites fixées par Twitch."
sidebar:
  order: 2
---

`twitch.eventsub.websocket()` renvoie un écouteur qui reçoit les événements sur une connexion WebSocket sortante. Il n'y a rien à héberger ni d'URL publique à exposer, ce qui en fait le transport des bots, des outils de bureau et du développement local. Les abonnements sont créés avec un jeton utilisateur.

## Un premier exemple

Un bot qui répond à `!ping` dans une chaîne. Le jeton du bot a besoin du scope `user:read:chat` pour lire le chat et de `user:write:chat` pour répondre.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});
const bot = await twitch.auth.addUser({ accessToken, refreshToken });

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on("channel.chat.message", { broadcaster_user_id: "141981764", user_id: bot.userId }, async (event) => {
  if (event.chatter_user_id === bot.userId) return; // ignore nos propres messages
  if (event.message.text.trim() !== "!ping") return;

  await twitch.chat.send({
    broadcaster_id: event.broadcaster_user_id,
    message: "pong",
    reply_parent_message_id: event.message_id,
  });
});
```

`on()`, `onError()`, `onRevocation()` et le handle renvoyé par `on()` sont les mêmes sur tous les transports. Ils sont décrits dans [Recevoir des événements](/events/overview/).

## Quel jeton utilisateur est utilisé

Twitch n'accepte qu'un jeton utilisateur pour les abonnements par WebSocket. L'écouteur le choisit dans cet ordre :

1. L'option `user` : `twitch.eventsub.websocket({ user: botId })`.
2. L'utilisateur de la vue, quand l'écouteur est créé à partir de `twitch.as(userId)`.
3. Le seul utilisateur enregistré, quand il y en a exactement un.

```ts
// Les deux écouteurs s'abonnent avec le jeton du bot.
const first = twitch.eventsub.websocket({ user: botId });
const second = twitch.as(botId).eventsub.websocket();
```

Quand aucun des trois cas ne s'applique, l'abonnement échoue et l'erreur parvient à `handle.ready` et à `onError`. Son message se termine par `needs a user access token and no user is registered. Add one with twitch.auth.addUser().` ou par `needs a user access token and several users are registered. Choose one with { as: userId } or twitch.as(userId).`

Un écouteur s'abonne au nom d'un seul utilisateur. Pour recevoir des événements au nom de deux utilisateurs, créez deux écouteurs. Le client garde le jeton à jour comme pour n'importe quel autre appel : un écouteur qui se reconnecte après plusieurs heures s'abonne donc toujours avec un jeton valide.

## Quand il se connecte

Créer l'écouteur n'ouvre rien. La connexion est ouverte par le premier `on()`, et chaque abonnement est créé une fois que Twitch a envoyé son message de bienvenue avec l'identifiant de session. Les appels à `on()` faits avant cela sont conservés puis envoyés ensemble, par groupes de 20.

Quand une session existe déjà, `on()` s'y abonne immédiatement.

```ts
const handle = events.on("stream.online", { broadcaster_user_id: channelId }, (event) => {
  console.log(`${event.broadcaster_user_name} went live`);
});

await handle.ready; // connecté, et l'abonnement est accepté
console.log(events.connected, events.sessionIds);
```

## Ce qu'il fait de lui-même

Dès qu'il a un gestionnaire, l'écouteur se maintient lui-même en service :

- **Demandes de reconnexion.** Quand Twitch demande au client de passer sur un autre serveur, l'écouteur ouvre la nouvelle connexion, continue de lire l'ancienne jusqu'à ce que la nouvelle ait reçu son message de bienvenue, puis ferme l'ancienne. Les abonnements suivent la session : rien n'est réabonné et aucun événement n'est perdu.
- **Keepalive.** Twitch envoie un message keepalive quand rien d'autre n'a été envoyé pendant la période de keepalive. Si rien du tout n'arrive pendant cette période augmentée de 5 secondes, la connexion est considérée comme perdue. Une nouvelle connexion qui ne reçoit aucun message de bienvenue dans les 15 secondes est traitée de la même façon.
- **Reconnexion.** Après une perte de connexion, l'écouteur se reconnecte avec une attente exponentielle : entre 250 et 500 ms avant la première tentative, doublée après chaque échec, jamais plus de 30 secondes. Sur la nouvelle session, il recrée tous les abonnements.
- **Échecs temporaires.** Une requête d'abonnement qui échoue avec un `5xx`, un `429`, une erreur réseau ou un délai d'attente dépassé est renvoyée, avec la même attente, aussi longtemps que la session existe. Un refus tel qu'un `403` est définitif : l'abonnement est abandonné et signalé.
- **Connexions supplémentaires.** Une connexion porte 300 abonnements. Au-delà, l'écouteur ouvre une deuxième, puis une troisième connexion. Le 901e abonnement est refusé avec `Subscription limit reached: 3 connections of 300 subscriptions.`
- **Connexions en moins.** Une connexion est fermée quand son dernier abonnement est arrêté, et immédiatement quand tous les abonnements qu'elle portait ont été refusés.
- **Doublons.** Une notification livrée deux fois n'exécute vos gestionnaires qu'une fois.

Les abonnements recréés après une reconnexion reçoivent de nouveaux identifiants. Si l'un d'eux est refusé à ce moment-là, par exemple parce que l'utilisateur a révoqué votre application entre-temps, il est abandonné et l'erreur est transmise à `onError`. `handle.ready` est déjà résolue à ce stade et ne change pas.

## Suivre la connexion

`onConnect` est appelé chaque fois qu'une session est établie : à la première connexion, après chaque reconnexion, et après un déplacement demandé par Twitch. `onDisconnect` est appelé quand une connexion est perdue.

```ts
events.onConnect((sessionId) => {
  console.log(`Connected, session ${sessionId}`);
});

events.onDisconnect(({ code, reason, willReconnect }) => {
  console.warn(`Connection lost (${code ?? "no code"} ${reason ?? ""})`, willReconnect ? "reconnecting" : "");
});
```

| Membre | Type | Signification |
| --- | --- | --- |
| `onConnect(listener)` | renvoie une fonction qui retire l'écouteur | Appelé avec l'identifiant de chaque nouvelle session. L'écouteur peut être `async`. |
| `onDisconnect(listener)` | renvoie une fonction qui retire l'écouteur | Appelé avec le `code` et la `reason` de la fermeture, ainsi que `willReconnect`. L'écouteur peut être `async`. |
| `connected` | `boolean` | Indique si au moins une session est établie. |
| `sessionIds` | `string[]` | Identifiants des sessions établies. Vide tant que l'écouteur est déconnecté. |
| `size` | `number` | Nombre d'abonnements actifs. |

Quand c'est la vérification du keepalive qui a détecté la perte, `code` vaut `undefined` et `reason` vaut `"keepalive timeout"`. `willReconnect` vaut `false` quand la connexion perdue n'avait plus aucun abonnement à rétablir.

Tout ce qu'un de ces écouteurs lève, ou le motif de son rejet quand il est `async`, est transmis aux écouteurs `onError`.

## Événements manqués pendant une déconnexion

Twitch ne conserve pas les événements pour un WebSocket absent. Ce qui s'est passé entre la perte d'une connexion et les nouveaux abonnements n'est pas rejoué. Pour la plupart des fonctionnalités de chat, cela n'a pas d'importance. Quand cela en a, lisez l'état courant depuis l'API à chaque début de session :

```ts
events.onConnect(async () => {
  const live = await twitch.streams.get({ user_id: channelId }).first();
  console.log(live ? `Live since ${live.started_at}` : "Offline");
});
```

Si la requête échoue, l'erreur est signalée à `onError`.

Si vous ne pouvez vous permettre de manquer aucun événement, utilisez les [webhooks](/events/webhooks/) : Twitch renvoie une notification quand il n'est pas sûr que votre serveur l'a reçue.

## Fermer l'écouteur

```ts
events.close();
```

`close()` ferme toutes les connexions et oublie tous les abonnements et tous les gestionnaires. Il n'envoie aucune requête : Twitch désactive les abonnements d'une session quand sa connexion se ferme. Une promesse `ready` encore en attente est rejetée avec `The subscription to <type> was removed before Twitch confirmed it.`

Une connexion ouverte maintient le processus en vie, tout comme un écouteur qui attend de se reconnecter. Fermez l'écouteur quand votre programme a terminé. `twitch.close()` le fait pour vous : il ferme tous les écouteurs WebSocket et conduit créés à partir du client, et arrête le minuteur propre au client.

## Options

```ts
const events = twitch.eventsub.websocket({ user: botId, keepalive: 30 });
```

| Option | Type | Par défaut | Effet |
| --- | --- | --- | --- |
| `user` | `string` | voir plus haut | Identifiant de l'utilisateur dont le jeton crée les abonnements. |
| `keepalive` | `number` | Twitch utilise 10 | Nombre de secondes de silence après lesquelles Twitch envoie un keepalive, de 10 à 600. Une valeur plus basse détecte plus tôt une connexion morte. |
| `webSocket` | `WebSocketConstructor` | le `WebSocket` global | Classe WebSocket à utiliser, pour les runtimes qui n'en ont pas. |
| `url` | `string` | `wss://eventsub.wss.twitch.tv/ws` | URL du WebSocket EventSub. Faites-la pointer vers la CLI Twitch pour les tests locaux. |

L'écouteur a besoin d'une classe WebSocket dotée des propriétés standard `onmessage` et `onclose` et d'une méthode `close()`. Node.js 22, Bun, Deno et les navigateurs en ont une. Ailleurs, `twitch.eventsub.websocket()` lève une `TwitchEventSubError` indiquant `This runtime has no global WebSocket`, et vous passez une classe vous-même :

```ts
import type { WebSocketConstructor } from "@ix-xs/twitch.api";

// Par exemple l'export par défaut du paquet "ws".
declare const WS: WebSocketConstructor;

const events = twitch.eventsub.websocket({ webSocket: WS });
```

[Runtimes](/basics/runtimes/) détaille ce que fournit chaque runtime.

## Limites fixées par Twitch

Ces règles viennent de la [documentation de Twitch sur les WebSocket](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/), pas de la bibliothèque :

- Les abonnements par WebSocket sont créés avec un jeton utilisateur. Le jeton d'application est refusé.
- Un utilisateur peut détenir 3 connexions avec des abonnements activés pour un même identifiant client, et chaque connexion 300 abonnements activés. Un second écouteur pour le même utilisateur partage ce budget.
- Le coût total des abonnements WebSocket d'un utilisateur ne peut pas dépasser 10, le `max_total_cost` de ce transport. Tous les abonnements n'ont pas un coût : [Gérer les abonnements](/events/managing-subscriptions/) montre comment le lire.
- Une connexion doit s'abonner à quelque chose dans les 10 secondes qui suivent son message de bienvenue, sinon Twitch la ferme. L'écouteur ne se connecte que lorsqu'il a un abonnement à créer : cela se règle donc tout seul.
- `drop.entitlement.grant`, `extension.bits_transaction.create`, `user.authorization.grant` et `user.authorization.revoke` ne sont pas livrés par WebSocket. Utilisez les webhooks ou un conduit pour ces types.

:::note
Pour suivre beaucoup de chaînes avec le jeton d'application, ou dépasser 900 abonnements, utilisez un [conduit](/events/conduits/). Il conserve la connexion WebSocket et lève les limites par utilisateur.
:::

## Voir aussi

- [Recevoir des événements](/events/overview/) : `on()`, `meta`, `onError` et `onRevocation`.
- [Gérer les abonnements](/events/managing-subscriptions/) : arrêter des gestionnaires, lister les abonnements, coût.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : enregistrer le jeton utilisateur dont l'écouteur a besoin.
- [twitch.eventsub.websocket](/reference/api/eventsub/#websocket) : la méthode dans la référence.
- [Un bot de chat](/recipes/chat-bot/) : un programme complet construit sur cet écouteur.
