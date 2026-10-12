---
title: "Clips et marqueurs"
description: "Deux commandes de chat, l'une qui met en clip les dernières secondes du stream et publie le lien, l'autre qui pose un marqueur de stream, puis comment lister les clips récents et les télécharger."
sidebar:
  order: 6
---

Cette recette ajoute deux commandes au chat d'une chaîne. `!clip` crée un clip des dernières secondes du stream et répond avec son lien. `!mark` pose un marqueur de stream, un repère dans l'enregistrement que le diffuseur retrouve au moment de monter ses moments forts. La dernière partie liste les clips de la semaine et récupère les liens vers leurs fichiers vidéo.

## Ce qu'il vous faut

| | |
| --- | --- |
| Application | Un identifiant client issu de la [console développeur de Twitch](https://dev.twitch.tv/console/apps). Le programme se connecte avec le flux par code d'appareil, qui ne demande pas de secret client. |
| Compte | Le diffuseur. |
| Jeton | Un jeton utilisateur de ce compte. |
| Scopes | `clips:edit` pour `!clip`, `channel:manage:broadcast` pour `!mark`, `user:read:chat` et `user:write:chat` pour les commandes, `channel:manage:clips` pour les liens de téléchargement. |

Les deux commandes ont besoin d'un stream en direct : il n'y a rien à mettre en clip ni à marquer sur une chaîne hors ligne.

## Se connecter et lire le chat

Le programme garde le jeton dans un fichier et lance le flux par code d'appareil quand le fichier est vide, comme dans la [recette du bot de chat](/recipes/chat-bot/). Donnez à ce programme son propre fichier de jetons : un jeton enregistré par un autre programme peut appartenir à un autre compte ou ne pas avoir ces scopes. Il écoute ensuite le chat de la propre chaîne du diffuseur.

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
    scopes: ["user:read:chat", "user:write:chat", "clips:edit", "channel:manage:broadcast", "channel:manage:clips"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on("channel.chat.message", { broadcaster_user_id: broadcaster_id, user_id: broadcaster_id }, (event) => {
  console.log(`${event.chatter_user_name}: ${event.message.text}`);
});
```

## Créer un clip et publier son lien

`clips.create` répond aussitôt avec l'identifiant du clip, mais le clip lui-même est fabriqué en arrière-plan. Cherchez-le avec `clips.get` jusqu'à ce qu'il apparaisse, puis utilisez son `url`.

```ts
import type { Clip } from "@ix-xs/twitch.api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Se résout une fois que le clip existe, ou avec `undefined` après 60 secondes.
async function waitForClip(id: string): Promise<Clip | undefined> {
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(2000);
    const [clip] = (await twitch.clips.get({ id })).data;
    if (clip) return clip;
  }
  return undefined;
}

async function clip(): Promise<string> {
  const created = await twitch.clips.create({ broadcaster_id });
  const ready = await waitForClip(created.id);
  return ready ? ready.url : "The clip did not come through.";
}
```

Sans `duration`, Twitch met en clip les 30 dernières secondes. Passez une valeur de 5 à 60 pour la changer, et un `title` pour nommer le clip.

Le clip est créé par l'utilisateur dont le jeton fait l'appel, ici le diffuseur. L'endpoint n'est pas lié au jeton du diffuseur : le même code fonctionne donc depuis un compte de bot qui a le scope `clips:edit`.

## Poser un marqueur

`streams.createMarker` marque la position actuelle du stream en direct. La `description` est une note de 140 caractères au plus, attachée au marqueur.

```ts
async function mark(description: string): Promise<string> {
  const marker = await twitch.streams.createMarker({ description: description.slice(0, 140) });
  const minutes = Math.floor(marker.position_seconds / 60);
  return `Marked at ${minutes} min ${marker.position_seconds % 60} s`;
}
```

Le `user_id` du diffuseur est omis : il prend par défaut l'utilisateur qui fait l'appel. Un marqueur est refusé quand la chaîne est hors ligne, quand elle ne conserve pas les enregistrements de ses streams, ou pendant une rediffusion.

## Gérer une chaîne hors ligne

Quand le stream n'est pas en direct, Twitch répond aux deux appels par une erreur, que le client lève sous la forme d'une `TwitchApiError`. Interceptez-la autour des commandes, affichez son message et prévenez le spectateur.

```ts
import { TwitchApiError } from "@ix-xs/twitch.api";

declare function clip(): Promise<string>;

async function run(): Promise<string> {
  try {
    return await clip();
  } catch (error) {
    if (!(error instanceof TwitchApiError)) throw error;
    console.error(`${error.status}: ${error.message}`);
    return "That did not work. Is the stream live?";
  }
}
```

Le message est celui que Twitch a écrit, suivi du statut, de la méthode et du chemin de la requête. Tout ce qui n'est pas une `TwitchApiError`, une panne réseau par exemple, est levé de nouveau et atteint `onError`.

## Le fichier complet

`!clip` est ouverte à tous, avec une pause de 30 secondes entre deux clips. `!mark` est réservée au diffuseur et aux modérateurs, reconnus à leurs badges.

```ts title="src/clips.ts"
import { Twitch, TwitchApiError, type Clip } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [broadcaster] = await twitch.auth.restore();
if (!broadcaster) {
  const flow = await twitch.auth.deviceFlow({
    scopes: ["user:read:chat", "user:write:chat", "clips:edit", "channel:manage:broadcast", "channel:manage:clips"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Se résout une fois que le clip existe, ou avec `undefined` après 60 secondes.
async function waitForClip(id: string): Promise<Clip | undefined> {
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(2000);
    const [clip] = (await twitch.clips.get({ id })).data;
    if (clip) return clip;
  }
  return undefined;
}

async function clip(): Promise<string> {
  const created = await twitch.clips.create({ broadcaster_id });
  const ready = await waitForClip(created.id);
  return ready ? ready.url : "The clip did not come through.";
}

async function mark(description: string): Promise<string> {
  const marker = await twitch.streams.createMarker({ description: description.slice(0, 140) });
  const minutes = Math.floor(marker.position_seconds / 60);
  return `Marked at ${minutes} min ${marker.position_seconds % 60} s`;
}

const CLIP_PAUSE_MS = 30_000;
let lastClip = 0;

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on("channel.chat.message", { broadcaster_user_id: broadcaster_id, user_id: broadcaster_id }, async (event) => {
  const [name, ...words] = event.message.text.trim().split(/\s+/);
  const trusted = event.badges.some((badge) => badge.set_id === "moderator" || badge.set_id === "broadcaster");

  let reply: string;
  try {
    if (name === "!clip" && Date.now() - lastClip > CLIP_PAUSE_MS) {
      lastClip = Date.now();
      reply = await clip();
    } else if (name === "!mark" && trusted) {
      reply = await mark(words.join(" ") || "Marked from chat");
    } else {
      return;
    }
  } catch (error) {
    if (!(error instanceof TwitchApiError)) throw error;
    console.error(`${error.status}: ${error.message}`);
    reply = "That did not work. Is the stream live?";
  }

  await twitch.chat.send({ broadcaster_id, message: reply, reply_parent_message_id: event.message_id });
});
```

Lancez-le avec [tsx](https://tsx.is/), dans un projet qui est un module ES (`"type": "module"` dans `package.json`), avec `TWITCH_CLIENT_ID` dans un fichier `.env` :

```bash
node --env-file=.env --import tsx src/clips.ts
```

## Lister les derniers clips

`clips.get` renvoie les clips d'une chaîne en commençant par les plus vus, pas par les plus récents. Pour obtenir les plus récents, demandez les clips créés depuis une date, puis triez-les vous-même. Quand `ended_at` est omis, Twitch s'arrête une semaine après `started_at`.

```ts
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const clips = await twitch.clips.get({ broadcaster_id, started_at: weekAgo }).all({ limit: 100 });
clips.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

for (const clip of clips.slice(0, 5)) {
  console.log(`${clip.created_at}  ${clip.title}  by ${clip.creator_name}  ${clip.url}`);
}
```

`clips.get` accepte n'importe quel jeton et n'importe quelle chaîne : rien ici n'est réservé au diffuseur.

## Obtenir les liens de téléchargement

`clips.downloads` renvoie des liens temporaires vers les fichiers vidéo des clips. Il est réservé au diffuseur et aux éditeurs de la chaîne, avec le scope `channel:manage:clips` ou `editor:manage:clips`. Chacun des deux liens, paysage et portrait, vaut `null` quand le clip n'a pas de fichier dans ce format.

```ts
const clips = await twitch.clips.get({ broadcaster_id }).take(5);

const files = await twitch.clips.downloads({ broadcaster_id, clip_id: clips.map((clip) => clip.id) });
for (const file of files) {
  console.log(file.clip_id, file.landscape_download_url ?? file.portrait_download_url ?? "no file");
}
```

Le paramètre `editor_id`, l'utilisateur qui demande les fichiers, prend par défaut l'utilisateur qui fait l'appel.

## Aller plus loin

### Relire les marqueurs

`streams.markers` liste les marqueurs de la vidéo la plus récente d'un utilisateur, regroupés par vidéo. Il prend le `user_id` explicitement.

```ts
const [group] = (await twitch.streams.markers({ user_id: broadcaster_id })).data;
for (const video of group?.videos ?? []) {
  for (const marker of video.markers) {
    console.log(`${marker.position_seconds} s  ${marker.description}  ${marker.url}`);
  }
}
```

### Mettre en clip une diffusion passée

`clips.createFromVod` met en clip un passage d'une vidéo enregistrée. `vod_offset` est l'endroit où le clip se termine, en secondes depuis le début de la vidéo, et le clip couvre les `duration` secondes qui précèdent. Il demande le même scope que les liens de téléchargement.

```ts
const created = await twitch.clips.createFromVod({
  broadcaster_id,
  vod_id: "2301456789",
  vod_offset: 600,
  duration: 45,
  title: "The opening",
});
console.log(created.edit_url);
```

## Voir aussi

- [twitch.clips](/reference/api/clips/) : tous les paramètres et les champs des clips.
- [streams.createMarker](/reference/api/streams/#createmarker) : paramètres et valeur de retour d'un marqueur.
- [Erreurs](/basics/errors/) : les champs de `TwitchApiError` et les autres classes d'erreur.
- [Un bot de chat](/recipes/chat-bot/) : une table de commandes et un temps de recharge par utilisateur.
