---
title: "Points de chaîne"
description: "Créez une récompense personnalisée, soyez prévenu de chaque utilisation au moment où elle se produit, puis marquez-la comme honorée ou rendez les points."
sidebar:
  order: 4
---

Cette recette construit un programme qui possède une récompense de points de chaîne. Les spectateurs utilisent « Pick the next map » et tapent le nom d'une carte. Le programme vérifie ce qu'ils ont tapé : un choix valide est marqué comme honoré, tout le reste est annulé et le spectateur récupère ses points.

## Ce qu'il vous faut

| | |
| --- | --- |
| Application | Un identifiant client issu de la [console développeur de Twitch](https://dev.twitch.tv/console/apps). Le programme se connecte avec le flux par code d'appareil, qui ne demande pas de secret client. |
| Compte | Le diffuseur. Les points de chaîne n'existent que sur les chaînes affiliées et partenaires. |
| Jeton | Un jeton utilisateur du diffuseur. |
| Scopes | `channel:manage:redemptions`. Il couvre la récompense, l'événement et les changements de statut. |

:::caution
Une application ne peut gérer que les récompenses qu'elle a créées. Une récompense créée dans le tableau de bord de Twitch, ou par une autre application, peut être listée mais ni modifiée ni supprimée, et ses utilisations ne peuvent être ni lues ni réglées via l'API. Créez la récompense avec l'identifiant client qui la traitera.
:::

## Se connecter en tant que diffuseur

Le programme garde le jeton dans un fichier et lance le flux par code d'appareil quand le fichier est vide, comme dans la [recette du bot de chat](/recipes/chat-bot/). Donnez à ce programme son propre fichier de jetons : un jeton enregistré par un autre programme peut appartenir à un autre compte ou ne pas avoir ces scopes.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [broadcaster] = await twitch.auth.restore();
if (!broadcaster) {
  const flow = await twitch.auth.deviceFlow({ scopes: ["channel:manage:redemptions"] });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;
```

## Créer la récompense une seule fois

Le titre d'une récompense est unique dans une chaîne : la créer à chaque démarrage échouerait donc la deuxième fois. Cherchez-la d'abord parmi les récompenses que votre application gère.

```ts
const TITLE = "Pick the next map";
const MAPS = ["dust", "mirage", "nuke"];

const mine = await twitch.channelPoints.rewards({ only_manageable_rewards: true });
const reward =
  mine.find((candidate) => candidate.title === TITLE) ??
  (await twitch.channelPoints.createReward({
    title: TITLE,
    cost: 500,
    prompt: `Type one of: ${MAPS.join(", ")}`,
    is_user_input_required: true,
  }));
const rewardId = reward.id;
```

`broadcaster_id` n'est passé à aucun des deux appels : il prend par défaut l'utilisateur qui fait l'appel, le diffuseur.

Laissez `should_redemptions_skip_request_queue` désactivé, ce qui est le réglage par défaut. Avec lui, Twitch marque aussitôt chaque utilisation comme honorée et il ne reste rien à annuler.

## Écouter les utilisations

`channel.channel_points_custom_reward_redemption.add` se déclenche chaque fois qu'un spectateur utilise une récompense. Le `reward_id` de la condition restreint l'abonnement à une seule récompense. Sans lui, vous recevez les utilisations de toutes les récompenses de la chaîne.

```ts
events.on(
  "channel.channel_points_custom_reward_redemption.add",
  { broadcaster_user_id: broadcaster_id, reward_id: rewardId },
  (event) => {
    console.log(`${event.user_name} redeemed "${event.reward.title}" with: ${event.user_input}`);
  },
);
```

Une nouvelle utilisation arrive avec le statut `unfulfilled`. Elle reste dans la file d'attente des demandes de la chaîne jusqu'à ce que quelqu'un la règle.

## Honorer ou annuler

`updateRedemptions` prend l'identifiant de la récompense, l'identifiant de l'utilisation et le nouveau statut. `FULFILLED` clôt l'utilisation, `CANCELED` la clôt et rend les points.

```ts
const MAPS = ["dust", "mirage", "nuke"];

async function settle(redemption: { id: string; user_name: string; user_input: string }): Promise<void> {
  const choice = redemption.user_input.trim().toLowerCase();
  const valid = MAPS.includes(choice);

  await twitch.channelPoints.updateRedemptions({
    reward_id: rewardId,
    id: redemption.id,
    status: valid ? "FULFILLED" : "CANCELED",
  });
  console.log(valid ? `${redemption.user_name} picked ${choice}` : `Refunded ${redemption.user_name}`);
}
```

La fonction ne demande que trois champs, elle accepte donc aussi bien l'événement de l'abonnement qu'une utilisation lue depuis l'API. `id` accepte aussi un tableau, jusqu'à 50 utilisations de la même récompense en un seul appel.

## Le fichier complet

```ts title="src/rewards.ts"
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const TITLE = "Pick the next map";
const MAPS = ["dust", "mirage", "nuke"];

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [broadcaster] = await twitch.auth.restore();
if (!broadcaster) {
  const flow = await twitch.auth.deviceFlow({ scopes: ["channel:manage:redemptions"] });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;

// Réutiliser la récompense d'une exécution précédente : les titres sont uniques dans une chaîne.
const mine = await twitch.channelPoints.rewards({ only_manageable_rewards: true });
const reward =
  mine.find((candidate) => candidate.title === TITLE) ??
  (await twitch.channelPoints.createReward({
    title: TITLE,
    cost: 500,
    prompt: `Type one of: ${MAPS.join(", ")}`,
    is_user_input_required: true,
  }));
const rewardId = reward.id;

async function settle(redemption: { id: string; user_name: string; user_input: string }): Promise<void> {
  const choice = redemption.user_input.trim().toLowerCase();
  const valid = MAPS.includes(choice);

  await twitch.channelPoints.updateRedemptions({
    reward_id: rewardId,
    id: redemption.id,
    status: valid ? "FULFILLED" : "CANCELED",
  });
  console.log(valid ? `${redemption.user_name} picked ${choice}` : `Refunded ${redemption.user_name}`);
}

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

const handle = events.on(
  "channel.channel_points_custom_reward_redemption.add",
  { broadcaster_user_id: broadcaster_id, reward_id: rewardId },
  settle,
);
await handle.ready;
console.log(`Waiting for redemptions of "${reward.title}"`);
```

Lancez-le avec [tsx](https://tsx.is/), dans un projet qui est un module ES (`"type": "module"` dans `package.json`), avec `TWITCH_CLIENT_ID` dans un fichier `.env` :

```bash
node --env-file=.env --import tsx src/rewards.ts
```

## Limites

- Une chaîne contient au plus 50 récompenses personnalisées, récompenses désactivées comprises.
- Un titre fait au plus 45 caractères, une invite 200.
- L'API écrit les statuts en majuscules (`UNFULFILLED`, `FULFILLED`, `CANCELED`), l'événement en minuscules (`unfulfilled`, `fulfilled`, `canceled`).
- Les utilisations annulées et honorées ne restent listées que quelques jours.

## Aller plus loin

### Régler ce qui a été utilisé pendant que le programme était arrêté

Les événements envoyés pendant que le programme n'est pas connecté ne sont pas rejoués, mais les utilisations attendent toujours dans la file. Lisez-les avec `redemptions` une fois l'abonnement en place.

```ts
import type { CustomRewardRedemption } from "@ix-xs/twitch.api";

declare function settle(redemption: CustomRewardRedemption): Promise<void>;

const pending = twitch.channelPoints.redemptions({ reward_id: rewardId, status: "UNFULFILLED" });
for await (const redemption of pending) {
  await settle(redemption);
}
```

Exécutez ceci après `await handle.ready`, pour que rien ne tombe entre la liste et l'abonnement. Une utilisation faite à cet instant précis peut alors apparaître des deux côtés : gardez dans un `Set` les identifiants que vous avez réglés et ignorez ceux que vous avez déjà vus.

### Mettre la récompense en pause quand vous n'êtes pas prêt

Une récompense en pause ne peut pas être utilisée. `updateReward` ne modifie que les champs que vous passez.

```ts
await twitch.channelPoints.updateReward({ id: rewardId, is_paused: true });

// Plus tard, avec un nouveau prix et un temps de recharge de cinq minutes.
await twitch.channelPoints.updateReward({
  id: rewardId,
  is_paused: false,
  cost: 750,
  is_global_cooldown_enabled: true,
  global_cooldown_seconds: 300,
});
```

### Supprimer la récompense quand le programme s'arrête

`deleteReward` retire la récompense de la chaîne. Les utilisations qui attendent encore dans la file sont marquées comme honorées : réglez-les donc d'abord si certaines doivent être remboursées.

```ts
process.once("SIGINT", async () => {
  await twitch.channelPoints.deleteReward({ id: rewardId });
  twitch.close(); // ferme l'écouteur, ce qui laisse le processus se terminer
});
```

## Voir aussi

- [twitch.channelPoints](/reference/api/channel-points/) : tous les paramètres des récompenses et des utilisations.
- [L'événement d'utilisation](/reference/event-types/#channelchannel_points_custom_reward_redemptionadd) : sa condition et ses scopes.
- [WebSocket](/events/websocket/) : ce que fait l'écouteur quand la connexion tombe.
- [Pagination](/basics/pagination/) : lire une liste comme les utilisations d'une récompense.
