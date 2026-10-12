---
title: "Alertes de direct"
description: "Publiez un message dans un salon Discord quand les streamers que vous suivez passent en direct, avec les webhooks EventSub et rien d'autre que le jeton d'application."
sidebar:
  order: 2
---

Cette recette construit un petit serveur qui surveille une liste de chaînes Twitch et publie dans un salon Discord quand l'une d'elles commence ou arrête de diffuser. Elle utilise les webhooks EventSub : aucun utilisateur n'a donc à se connecter et rien n'est interrogé à intervalles réguliers. Twitch appelle votre serveur quand quelque chose se produit.

## Ce qu'il vous faut

| | |
| --- | --- |
| Application | Un identifiant client et un secret client issus de la [console développeur de Twitch](https://dev.twitch.tv/console/apps). Voir [Obtenir vos identifiants](/credentials/). |
| Jeton | Le jeton d'application seulement. Le client le demande de lui-même. |
| Scopes | Aucun. `stream.online` et `stream.offline` sont des événements publics. |
| URL de callback | Une adresse HTTPS publique sur le port 443 qui atteint votre serveur. Un tunnel fait l'affaire pendant le développement. |
| Secret du webhook | Une chaîne aléatoire de 10 à 100 caractères. Twitch signe chaque livraison avec elle. |
| Discord | L'URL d'un webhook créé dans les paramètres du salon Discord qui reçoit les alertes. |

Le programme lit tout cela dans l'environnement :

```ini
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
EVENTSUB_SECRET=a-random-string-of-10-to-100-characters
CALLBACK_URL=https://your-public-host/twitch/eventsub
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook
```

## Recevoir les webhooks

Créez l'écouteur de webhooks, puis donnez son gestionnaire Node.js à un serveur HTTP. Le chemin de la route doit être celui de `CALLBACK_URL`.

```ts
import { createServer } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const hooks = twitch.eventsub.webhook({
  callback: process.env.CALLBACK_URL!,
  secret: process.env.EVENTSUB_SECRET!,
});
hooks.onError((error) => console.error(error.message));

const handler = hooks.nodeHandler();
createServer((req, res) => {
  if (req.method === "POST" && req.url === "/twitch/eventsub") void handler(req, res);
  else res.writeHead(404).end();
}).listen(3000);
```

Le gestionnaire lit le corps brut, vérifie la signature et l'ancienneté de chaque livraison, écarte les doublons et répond au défi de vérification que Twitch envoie pour un nouvel abonnement. [Webhooks](/events/webhooks/) décrit chaque vérification.

Démarrez le serveur avant de vous abonner. Twitch appelle le callback pour vérifier un abonnement dès sa création.

## S'abonner aux chaînes

Les événements sont adressés par identifiant d'utilisateur, les noms de connexion sont donc résolus d'abord. Un seul appel à `users.get` prend toute la liste, et un nom de connexion qui n'existe pas est absent du résultat.

```ts
const LOGINS = ["twitchdev", "twitch"];

const channels = await twitch.users.get({ login: LOGINS });

for (const channel of channels) {
  const condition = { broadcaster_user_id: channel.id };

  hooks.on("stream.online", condition, (event) => {
    console.log(`${event.broadcaster_user_name} went live at ${event.started_at}`);
  });
  hooks.on("stream.offline", condition, (event) => {
    console.log(`${event.broadcaster_user_name} went offline`);
  });
}
```

Chaque `on()` crée un abonnement avec le jeton d'application. Les abonnements restent du côté de Twitch quand le programme s'arrête. Quand il redémarre et demande les mêmes, Twitch répond qu'ils existent et l'écouteur continue avec eux.

## Publier sur Discord

Un webhook Discord accepte un corps JSON avec un champ `content`. L'événement dit qui est passé en direct, mais pas ce qu'il diffuse : le titre et la catégorie viennent de `streams.get`.

```ts
async function post(content: string): Promise<void> {
  const response = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Un titre de stream ne doit pas pouvoir mentionner tout le serveur.
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!response.ok) throw new Error(`Discord answered ${response.status}`);
}

hooks.on("stream.online", { broadcaster_user_id: channelId }, async (event) => {
  if (event.type !== "live") return; // rediffusions, premières...

  const stream = await twitch.streams.get({ user_id: event.broadcaster_user_id }).first();
  const details = stream ? `: ${stream.title} (${stream.game_name || "no category"})` : "";
  await post(`${event.broadcaster_user_name} is live${details}\nhttps://twitch.tv/${event.broadcaster_user_login}`);
});
```

`first()` se résout avec `undefined` quand le stream n'est pas listé, le message a donc une forme courte qui n'a besoin ni du titre ni de la catégorie.

L'écouteur répond tout de suite à Twitch et exécute votre gestionnaire en arrière-plan. Une erreur levée par le gestionnaire, comme celle que lève `post` quand Discord refuse le message, est transmise à `onError`.

## Le fichier complet

```ts title="src/alerts.ts"
import { createServer } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const LOGINS = ["twitchdev", "twitch"];

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const hooks = twitch.eventsub.webhook({
  callback: process.env.CALLBACK_URL!,
  secret: process.env.EVENTSUB_SECRET!,
});
hooks.onError((error) => console.error(error.message));
hooks.onRevocation((subscription) => console.warn(`Revoked: ${subscription.type} (${subscription.status})`));

async function post(content: string): Promise<void> {
  const response = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Un titre de stream ne doit pas pouvoir mentionner tout le serveur.
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!response.ok) throw new Error(`Discord answered ${response.status}`);
}

// Le serveur d'abord : Twitch l'appelle pour vérifier chaque abonnement.
const handler = hooks.nodeHandler();
createServer((req, res) => {
  if (req.method === "POST" && req.url === "/twitch/eventsub") void handler(req, res);
  else res.writeHead(404).end();
}).listen(3000);

const channels = await twitch.users.get({ login: LOGINS });
if (channels.length < LOGINS.length) console.warn("Some logins do not exist.");

const handles = channels.flatMap((channel) => {
  const condition = { broadcaster_user_id: channel.id };

  const online = hooks.on("stream.online", condition, async (event) => {
    if (event.type !== "live") return; // rediffusions, premières...

    const stream = await twitch.streams.get({ user_id: event.broadcaster_user_id }).first();
    const details = stream ? `: ${stream.title} (${stream.game_name || "no category"})` : "";
    await post(`${event.broadcaster_user_name} is live${details}\nhttps://twitch.tv/${event.broadcaster_user_login}`);
  });

  const offline = hooks.on("stream.offline", condition, async (event) => {
    await post(`${event.broadcaster_user_name} went offline.`);
  });

  return [online, offline];
});

// Chaque `ready` aboutit une fois que Twitch a vérifié le callback, ou abandonne après 60 secondes.
const results = await Promise.allSettled(handles.map((handle) => handle.ready));
const ready = results.filter((result) => result.status === "fulfilled").length;
console.log(`${ready} of ${handles.length} subscriptions are ready`);
```

Lancez-le avec [tsx](https://tsx.is/), dans un projet qui est un module ES (`"type": "module"` dans `package.json`) :

```bash
node --env-file=.env --import tsx src/alerts.ts
```

## Tester en local

Twitch ne peut pas atteindre `localhost`. Un tunnel comme [ngrok](https://ngrok.com/) donne à votre machine une adresse HTTPS publique :

```bash
ngrok http 3000
```

Copiez l'adresse qu'il affiche dans `CALLBACK_URL`, suivie de `/twitch/eventsub`, et démarrez le programme. La dernière ligne qu'il écrit vous dit combien d'abonnements Twitch a vérifiés. Un abonnement qui n'est pas vérifié dans les 60 secondes est signalé à `onError`, avec l'URL de callback dans le message.

Un tunnel reçoit en général une nouvelle adresse à chaque démarrage. Une nouvelle adresse est un nouveau callback : les abonnements créés avec la précédente restent donc en place et ne pointent nulle part. Supprimez-les avant qu'ils ne s'accumulent :

```ts
for await (const subscription of twitch.eventsub.subscriptions()) {
  if (subscription.transport.method === "webhook" && subscription.transport.callback !== callback) {
    await twitch.eventsub.unsubscribe(subscription.id);
  }
}
```

Pour ne pas attendre qu'une chaîne passe en direct, la commande `event trigger` de la [CLI Twitch](https://dev.twitch.tv/docs/cli/) peut envoyer une notification de test signée à votre serveur. Donnez-lui le même secret et l'identifiant d'une chaîne à laquelle le programme s'est abonné : l'écouteur retrouve le gestionnaire d'une notification à partir de son type et de sa condition.

## Aller plus loin

### Ne pas alerter quand un stream redémarre

Un streamer qui perd sa connexion passe hors ligne puis de nouveau en direct en moins d'une minute. Retenez quand chaque chaîne a été annoncée pour la dernière fois et restez silencieux un moment :

```ts
const QUIET_MS = 15 * 60_000;
const lastAlert = new Map<string, number>();

function shouldAnnounce(broadcasterId: string): boolean {
  const now = Date.now();
  if (now - (lastAlert.get(broadcasterId) ?? 0) < QUIET_MS) return false;
  lastAlert.set(broadcasterId, now);
  return true;
}
```

Appelez-la au début du gestionnaire de `stream.online` et sortez quand elle répond non.

### Envoyer un embed avec l'image d'aperçu

Discord accepte aussi `embeds`. Le `thumbnail_url` d'un stream est un modèle : remplacez `{width}` et `{height}` par la taille voulue.

```ts
import type { Stream } from "@ix-xs/twitch.api";

function embed(stream: Stream) {
  return {
    title: stream.title,
    url: `https://twitch.tv/${stream.user_login}`,
    description: `${stream.user_name} is playing ${stream.game_name || "something"}`,
    image: { url: stream.thumbnail_url.replace("{width}", "1280").replace("{height}", "720") },
  };
}
```

Envoyez-le sous la forme `{ embeds: [embed(stream)] }` à la place de `content`.

### Déployer sur une plateforme serverless

Sur Cloudflare Workers et les plateformes similaires, créez les abonnements depuis un script de déploiement et construisez l'écouteur avec `subscribe: false`. [Webhooks](/events/webhooks/) montre la configuration.

## Voir aussi

- [Webhooks](/events/webhooks/) : les vérifications faites sur chaque livraison, et d'autres frameworks que `node:http`.
- [Gérer les abonnements](/events/managing-subscriptions/) : lister, supprimer, statuts et coûts.
- [streams.get](/reference/api/streams/#get) : filtres et champs d'un stream en direct.
- [stream.online](/reference/event-types/#streamonline) : la condition et les champs de l'événement.
