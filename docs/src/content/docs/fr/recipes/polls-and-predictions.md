---
title: "Sondages et prédictions"
description: "Lancez un sondage, suivez les votes en direct et annoncez le gagnant dans le chat, puis menez une prédiction de son ouverture au paiement des gains."
sidebar:
  order: 5
---

Cette recette construit un programme qui demande au chat quel jeu vient ensuite, affiche les votes à mesure qu'ils arrivent, annonce le gagnant dans le chat, puis ouvre une prédiction sur ce jeu. Vous fermez les paris et choisissez le résultat depuis le terminal.

## Ce qu'il vous faut

| | |
| --- | --- |
| Application | Un identifiant client issu de la [console développeur de Twitch](https://dev.twitch.tv/console/apps). Le programme se connecte avec le flux par code d'appareil, qui ne demande pas de secret client. |
| Compte | Le diffuseur. Les sondages et les prédictions n'existent que sur les chaînes affiliées et partenaires. |
| Jeton | Un jeton utilisateur du diffuseur. |
| Scopes | `channel:manage:polls`, `channel:manage:predictions`, et `user:write:chat` pour l'annonce. |

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
  const flow = await twitch.auth.deviceFlow({
    scopes: ["channel:manage:polls", "channel:manage:predictions", "user:write:chat"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;
```

## Suivre le sondage

Abonnez-vous avant que le sondage commence. `channel.poll.progress` se déclenche à mesure que les spectateurs votent et porte le décompte de chaque choix. `channel.poll.end` porte les décomptes finaux et la façon dont le sondage s'est terminé.

```ts
const condition = { broadcaster_user_id: broadcaster_id };

const progress = events.on("channel.poll.progress", condition, (event) => {
  console.log(event.choices.map((choice) => `${choice.title}: ${choice.votes}`).join(" | "));
});

const end = events.on("channel.poll.end", condition, async (event) => {
  if (event.status === "archived") return; // le sondage a été masqué, pas terminé

  const [top] = [...event.choices].sort((a, b) => b.votes - a.votes);
  if (!top) return;
  await twitch.chat.send({ broadcaster_id, message: `"${top.title}" wins with ${top.votes} votes` });
});

// Twitch a accepté les deux abonnements.
await Promise.all([progress.ready, end.ready]);
```

Le statut de l'événement de fin est `completed` quand le sondage est allé à son terme, `terminated` quand il a été arrêté plus tôt et `archived` quand il a été masqué de la chaîne. Le gestionnaire annonce un résultat pour les deux premiers.

`chat.send` est appelé sans `sender_id` : le diffuseur est le seul utilisateur enregistré, le message est donc le sien.

## Lancer le sondage

Les choix sont de simples chaînes de caractères. Le sondage s'ouvre aussitôt et se ferme de lui-même après `duration` secondes.

```ts
const poll = await twitch.polls.create({
  title: "Which game next?",
  choices: ["Celeste", "Hades", "Outer Wilds"],
  duration: 60,
});
console.log(`Poll ${poll.id} is ${poll.status}`);
```

Attendre `ready` avant cet appel a son importance. Un abonnement encore en cours de création quand le sondage commence peut manquer les premiers votes.

## Mener une prédiction

Une prédiction passe par trois appels au plus. `create` ouvre les paris pendant `prediction_window` secondes et renvoie les issues avec leurs identifiants. `end` la fait ensuite passer à son état suivant.

```ts
const prediction = await twitch.predictions.create({
  title: "Finish Hades tonight?",
  outcomes: ["Yes", "No"],
  prediction_window: 120,
});
const [yes] = prediction.outcomes;

// Fermer les paris avant la fin de la fenêtre. Facultatif.
await twitch.predictions.end({ id: prediction.id, status: "LOCKED" });

// Payer les spectateurs qui ont choisi l'issue gagnante.
if (yes) {
  await twitch.predictions.end({ id: prediction.id, status: "RESOLVED", winning_outcome_id: yes.id });
}
```

Pour l'annuler et rendre ses points à chacun, terminez-la avec `CANCELED`. Cela fonctionne tant que les paris sont ouverts et après leur verrouillage.

```ts
await twitch.predictions.end({ id: predictionId, status: "CANCELED" });
```

Une prédiction laissée sans résultat pendant 24 heures après la fermeture de sa fenêtre est annulée par Twitch, et les points sont remboursés.

## Le fichier complet

La fin du sondage lance la prédiction. Une invite dans le terminal attend alors votre décision : `lock`, `yes`, `no` ou `cancel`. Quand Twitch refuse une décision, le programme affiche l'erreur et repose la question. Une fois la prédiction réglée, `twitch.close()` arrête le minuteur de validation des jetons et ferme l'écouteur, pour que le programme puisse se terminer : un WebSocket ouvert maintient le processus en vie.

```ts title="src/vote.ts"
import { createInterface } from "node:readline/promises";
import { Twitch, TwitchApiError } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [broadcaster] = await twitch.auth.restore();
if (!broadcaster) {
  const flow = await twitch.auth.deviceFlow({
    scopes: ["channel:manage:polls", "channel:manage:predictions", "user:write:chat"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

async function predict(game: string): Promise<void> {
  const prediction = await twitch.predictions.create({
    title: `Finish ${game} tonight?`,
    outcomes: ["Yes", "No"],
    prediction_window: 120,
  });
  const [yes, no] = prediction.outcomes;
  if (!yes || !no) return;

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  let open = true;
  while (open) {
    const answer = (await terminal.question("lock, yes, no or cancel? ")).trim();
    try {
      if (answer === "lock") {
        await twitch.predictions.end({ id: prediction.id, status: "LOCKED" });
      } else if (answer === "yes" || answer === "no") {
        const winner = answer === "yes" ? yes : no;
        await twitch.predictions.end({ id: prediction.id, status: "RESOLVED", winning_outcome_id: winner.id });
        open = false;
      } else if (answer === "cancel") {
        await twitch.predictions.end({ id: prediction.id, status: "CANCELED" });
        open = false;
      }
    } catch (error) {
      if (!(error instanceof TwitchApiError)) throw error;
      console.error(error.message);
    }
  }

  terminal.close();
  twitch.close(); // ferme aussi l'écouteur WebSocket
}

const condition = { broadcaster_user_id: broadcaster_id };

const progress = events.on("channel.poll.progress", condition, (event) => {
  console.log(event.choices.map((choice) => `${choice.title}: ${choice.votes}`).join(" | "));
});

const end = events.on("channel.poll.end", condition, async (event) => {
  if (event.status === "archived") return; // le sondage a été masqué, pas terminé

  const [top] = [...event.choices].sort((a, b) => b.votes - a.votes);
  if (!top) return;
  await twitch.chat.send({ broadcaster_id, message: `"${top.title}" wins with ${top.votes} votes` });
  await predict(top.title);
});

await Promise.all([progress.ready, end.ready]);

const poll = await twitch.polls.create({
  title: "Which game next?",
  choices: ["Celeste", "Hades", "Outer Wilds"],
  duration: 60,
});
console.log(`Poll ${poll.id} is ${poll.status}`);
```

Lancez-le avec [tsx](https://tsx.is/), dans un projet qui est un module ES (`"type": "module"` dans `package.json`), avec `TWITCH_CLIENT_ID` dans un fichier `.env` :

```bash
node --env-file=.env --import tsx src/vote.ts
```

## Limites

| | Sondage | Prédiction |
| --- | --- | --- |
| Titre | 60 caractères | 45 caractères |
| Options | 2 à 5 choix de 25 caractères | 2 à 10 issues de 25 caractères |
| Durée | 15 à 1800 secondes | 30 à 1800 secondes de paris |
| En même temps | Un par chaîne | Une par chaîne |

Le titre de la prédiction ci-dessus est construit à partir d'un choix du sondage, qui fait 25 caractères au plus : il reste donc sous les 45.

## Aller plus loin

### Terminer un sondage plus tôt

`polls.end` arrête un sondage en cours. `TERMINATED` laisse les résultats à l'écran, `ARCHIVED` masque en plus le sondage.

```ts
const stopped = await twitch.polls.end({ id: pollId, status: "TERMINATED" });
console.log(stopped.choices.map((choice) => `${choice.title}: ${choice.votes}`));
```

### Laisser les spectateurs acheter des votes supplémentaires

Un sondage peut vendre des votes supplémentaires contre des points de chaîne. L'événement de fin les compte dans `channel_points_votes`, et `votes` est le total.

```ts
await twitch.polls.create({
  title: "Which game next?",
  choices: ["Celeste", "Hades", "Outer Wilds"],
  duration: 120,
  channel_points_voting_enabled: true,
  channel_points_per_vote: 100,
});
```

### Suivre les paris

Les prédictions ont leurs propres événements : `channel.prediction.begin`, `channel.prediction.progress`, `channel.prediction.lock` et `channel.prediction.end`. Ils prennent la même condition que les événements de sondage et demandent `channel:read:predictions` ou `channel:manage:predictions`.

```ts
events.on("channel.prediction.progress", { broadcaster_user_id: broadcaster_id }, (event) => {
  for (const outcome of event.outcomes) {
    console.log(`${outcome.title}: ${outcome.channel_points} points from ${outcome.users} viewers`);
  }
});
```

## Voir aussi

- [twitch.polls](/reference/api/polls/) : paramètres et champs d'un sondage.
- [twitch.predictions](/reference/api/predictions/) : paramètres et champs d'une prédiction.
- [channel.poll.end](/reference/event-types/#channelpollend) : la condition et les scopes de l'événement.
- [Gérer les abonnements](/events/managing-subscriptions/) : ce que font `ready` et `stop`.
