---
title: "Un bot de chat"
description: "Un bot qui répond aux commandes du chat via EventSub WebSocket. Il se connecte une seule fois avec le flux par code d'appareil, puis répond aux commandes avec un temps de recharge par utilisateur."
sidebar:
  order: 1
---

Cette recette construit un bot de chat en un seul fichier. Il se connecte à la première exécution, garde son jeton dans un fichier, lit le chat d'une chaîne via EventSub WebSocket et répond à trois commandes : `!ping`, `!uptime` et `!so <login>`. Rien n'est à héberger : le bot tourne sur votre machine.

## Ce qu'il vous faut

| | |
| --- | --- |
| Application | Un identifiant client issu de la [console développeur de Twitch](https://dev.twitch.tv/console/apps). Pas de secret client : voir [Obtenir vos identifiants](/credentials/). |
| Compte | Un compte Twitch pour le bot. Votre propre compte convient aussi. |
| Jeton | Un jeton utilisateur de ce compte, obtenu par le programme avec le flux par code d'appareil. |
| Scopes | `user:read:chat` pour recevoir les messages, `user:write:chat` pour en envoyer, `moderator:manage:shoutouts` pour `!so`. |
| Dans la chaîne | Pour `!so`, le compte du bot doit être le diffuseur ou l'un de ses modérateurs. Les autres commandes fonctionnent dans n'importe quelle chaîne. |

## Se connecter une seule fois

Créez le client avec un `FileTokenStore`. À la première exécution le fichier est vide, le programme lance donc le flux par code d'appareil : il affiche un lien et un code, vous approuvez dans un navigateur, et `flow.wait()` se résout avec l'utilisateur enregistré. Le jeton est enregistré dans `tokens.json`, et aux exécutions suivantes `restore()` l'y retrouve.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [bot] = await twitch.auth.restore();
if (!bot) {
  const flow = await twitch.auth.deviceFlow({
    scopes: ["user:read:chat", "user:write:chat", "moderator:manage:shoutouts"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  bot = await flow.wait();
}
const botId = bot.userId;

// La chaîne à rejoindre : le premier argument, ou la chaîne du bot lui-même.
const channel = await twitch.users.getByLogin(process.argv[2] ?? bot.login!);
if (!channel) throw new Error("Unknown channel");
const channelId = channel.id;
```

À partir de là, le client renouvelle le jeton d'accès avant son expiration et écrit chaque nouveau jeton dans le fichier. Ajoutez `tokens.json` à votre `.gitignore` : il contient des identifiants. [Flux par code d'appareil](/auth/device-code/) et [Stocker les jetons](/auth/storing-tokens/) détaillent ces deux parties.

## Écouter le chat

`channel.chat.message` prend deux identifiants : la chaîne à lire et l'utilisateur qui la lit. L'écouteur se connecte quand le premier gestionnaire est ajouté.

```ts
const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.chatter_user_id === botId) return; // les propres messages du bot

  if (event.message.text.trim() === "!ping") {
    await twitch.chat.send({
      broadcaster_id: event.broadcaster_user_id,
      message: "pong",
      reply_parent_message_id: event.message_id,
    });
  }
});
```

Trois détails comptent ici :

- Le bot reçoit ses propres messages comme ceux de tout le monde. Sans la première ligne, une réponse qui commence par un nom de commande déclencherait de nouveau le bot.
- `sender_id` n'est pas écrit. Un seul utilisateur est enregistré, le message est donc envoyé au nom du bot.
- `reply_parent_message_id` transforme le message en réponse au spectateur qui a tapé la commande.

## Ajouter une table de commandes

Une commande est une fonction qui reçoit l'événement et les mots tapés après le nom de la commande. Elle renvoie le texte de la réponse, ou `undefined` pour rester silencieuse.

```ts
import type { EventSubEvent } from "@ix-xs/twitch.api";

type ChatMessage = EventSubEvent<"channel.chat.message">;
type Command = (event: ChatMessage, args: string[]) => Promise<string | undefined>;

const isModerator = (event: ChatMessage) =>
  event.badges.some((badge) => badge.set_id === "moderator" || badge.set_id === "broadcaster");

const commands: Record<string, Command> = {
  "!ping": async () => "pong",

  "!uptime": async (event) => {
    const stream = await twitch.streams.get({ user_id: event.broadcaster_user_id }).first();
    if (!stream) return "The stream is offline.";
    const minutes = Math.floor((Date.now() - Date.parse(stream.started_at)) / 60_000);
    return `Live for ${Math.floor(minutes / 60)} h ${minutes % 60} min.`;
  },

  "!so": async (event, [login]) => {
    if (!login || !isModerator(event)) return undefined;
    const target = await twitch.users.getByLogin(login.replace(/^@/, ""));
    if (!target) return `I do not know ${login}.`;
    await twitch.chat.shoutout({
      from_broadcaster_id: event.broadcaster_user_id,
      to_broadcaster_id: target.id,
    });
    return `Go follow ${target.display_name} at twitch.tv/${target.login}`;
  },
};
```

`streams.get` renvoie un paginateur, et `first()` se résout avec le stream en direct de la chaîne, ou avec `undefined` quand elle est hors ligne. Le champ `started_at` est une chaîne de caractères, il passe donc par `Date.parse`.

`!so` est réservée au diffuseur et aux modérateurs. L'événement porte les badges de l'expéditeur : un `set_id` valant `moderator` ou `broadcaster` les distingue des autres spectateurs. Le shoutout lui-même est fait par le bot, `moderator_id` est donc omis et rempli avec l'identifiant du bot.

## Ajouter un temps de recharge et répondre

Une `Map` retient quand chaque spectateur a utilisé une commande pour la dernière fois. Le gestionnaire de la deuxième étape est remplacé par un autre, qui trouve la commande, vérifie le temps de recharge et envoie la réponse.

```ts
import type { EventSubEvent } from "@ix-xs/twitch.api";

type ChatMessage = EventSubEvent<"channel.chat.message">;
// La table de l'étape précédente.
declare const commands: Record<string, (event: ChatMessage, args: string[]) => Promise<string | undefined>>;

const COOLDOWN_MS = 5_000;
const lastUse = new Map<string, number>();

function onCooldown(userId: string): boolean {
  const now = Date.now();
  if (now - (lastUse.get(userId) ?? 0) < COOLDOWN_MS) return true;
  lastUse.set(userId, now);
  return false;
}

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.chatter_user_id === botId) return;

  const [name = "", ...args] = event.message.text.trim().split(/\s+/);
  const command = commands[name.toLowerCase()];
  if (!command || onCooldown(event.chatter_user_id)) return;

  const reply = await command(event, args);
  if (!reply) return;
  await twitch.chat.send({
    broadcaster_id: event.broadcaster_user_id,
    message: reply,
    reply_parent_message_id: event.message_id,
  });
});
```

Une erreur levée par un gestionnaire n'arrête pas l'écouteur. Elle est transmise à l'écouteur `onError` : un shoutout que Twitch refuse (la chaîne est hors ligne, ou le dernier shoutout date de moins de 2 minutes) affiche donc une ligne et le bot continue de tourner.

## Le fichier complet

```ts title="src/bot.ts"
import { Twitch, type EventSubEvent } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

type ChatMessage = EventSubEvent<"channel.chat.message">;
type Command = (event: ChatMessage, args: string[]) => Promise<string | undefined>;

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

// Connexion : depuis le fichier si possible, sinon avec le flux par code d'appareil.
let [bot] = await twitch.auth.restore();
if (!bot) {
  const flow = await twitch.auth.deviceFlow({
    scopes: ["user:read:chat", "user:write:chat", "moderator:manage:shoutouts"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  bot = await flow.wait();
}
const botId = bot.userId;

const channel = await twitch.users.getByLogin(process.argv[2] ?? bot.login!);
if (!channel) throw new Error("Unknown channel");
const channelId = channel.id;

const isModerator = (event: ChatMessage) =>
  event.badges.some((badge) => badge.set_id === "moderator" || badge.set_id === "broadcaster");

const commands: Record<string, Command> = {
  "!ping": async () => "pong",

  "!uptime": async (event) => {
    const stream = await twitch.streams.get({ user_id: event.broadcaster_user_id }).first();
    if (!stream) return "The stream is offline.";
    const minutes = Math.floor((Date.now() - Date.parse(stream.started_at)) / 60_000);
    return `Live for ${Math.floor(minutes / 60)} h ${minutes % 60} min.`;
  },

  "!so": async (event, [login]) => {
    if (!login || !isModerator(event)) return undefined;
    const target = await twitch.users.getByLogin(login.replace(/^@/, ""));
    if (!target) return `I do not know ${login}.`;
    await twitch.chat.shoutout({
      from_broadcaster_id: event.broadcaster_user_id,
      to_broadcaster_id: target.id,
    });
    return `Go follow ${target.display_name} at twitch.tv/${target.login}`;
  },
};

const COOLDOWN_MS = 5_000;
const lastUse = new Map<string, number>();

function onCooldown(userId: string): boolean {
  const now = Date.now();
  if (now - (lastUse.get(userId) ?? 0) < COOLDOWN_MS) return true;
  lastUse.set(userId, now);
  return false;
}

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));
events.onConnect(() => console.log(`Listening to #${channel.login}`));

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.chatter_user_id === botId) return;

  const [name = "", ...args] = event.message.text.trim().split(/\s+/);
  const command = commands[name.toLowerCase()];
  if (!command || onCooldown(event.chatter_user_id)) return;

  const reply = await command(event, args);
  if (!reply) return;
  await twitch.chat.send({
    broadcaster_id: event.broadcaster_user_id,
    message: reply,
    reply_parent_message_id: event.message_id,
  });
});
```

Le fichier utilise `await` au niveau supérieur, le projet doit donc être un module ES (`"type": "module"` dans `package.json`). Placez l'identifiant client dans un fichier `.env` et lancez le bot avec [tsx](https://tsx.is/), en lui donnant le nom de connexion de la chaîne à rejoindre :

```ini
TWITCH_CLIENT_ID=your-client-id
```

```bash
node --env-file=.env --import tsx src/bot.ts some_channel
```

## Aller plus loin

### Vérifier qu'une réponse a atteint le chat

`chat.send` ne lève pas d'erreur quand Twitch refuse un message, par exemple un message qu'AutoMod retient. Il se résout avec `is_sent: false` et la raison.

```ts
const sent = await twitch.chat.send({ broadcaster_id: channelId, message: "pong" });
if (!sent.is_sent) console.warn(`Dropped: ${sent.drop_reason?.message}`);
```

### Réagir à autre chose qu'aux messages

Le même écouteur porte d'autres abonnements. Les réabonnements, les raids et les abonnements offerts arrivent par `channel.chat.notification`, qui demande le même scope que les messages de chat.

```ts
events.on("channel.chat.notification", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.notice_type !== "raid") return;
  await twitch.chat.send({
    broadcaster_id: event.broadcaster_user_id,
    message: `Welcome to the ${event.raid.viewer_count} raiders of ${event.raid.user_name}`,
  });
});
```

### Ajouter un scope plus tard

Les scopes sont accordés quand le bot se connecte et enregistrés avec le jeton. Quand une nouvelle commande a besoin d'un autre scope, l'appel échoue avec une `TwitchScopeError` qui le nomme. Ajoutez le scope à l'appel `deviceFlow`, supprimez `tokens.json` et relancez le programme pour vous connecter avec la nouvelle liste.

## Voir aussi

- [WebSocket](/events/websocket/) : reconnexion, limites et options de l'écouteur.
- [Flux par code d'appareil](/auth/device-code/) : ce que font `deviceFlow` et `wait`.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : comment le jeton d'un appel est choisi.
- [chat.send](/reference/api/chat/#send) : tous les paramètres d'un message de chat.
- [channel.chat.message](/reference/event-types/#channelchatmessage) : la condition et les scopes de l'événement.
