---
title: "Webhooks"
description: "Recevoir des événements sur votre propre endpoint HTTPS : brancher l'écouteur sur n'importe quel serveur, ce qu'il vérifie à chaque livraison, et comment l'exécuter sur des plateformes serverless."
sidebar:
  order: 3
---

`twitch.eventsub.webhook({ callback, secret })` renvoie un écouteur destiné aux serveurs que Twitch peut joindre par Internet. Twitch envoie chaque notification sous la forme d'un `POST` HTTP vers votre URL de callback. Les abonnements sont créés avec le jeton d'application : le client a donc besoin d'un secret client, aucun utilisateur n'a à être en ligne, et les abonnements survivent à un redémarrage de votre serveur.

## Un premier exemple

Un serveur `node:http` qui journalise le passage en direct d'une chaîne.

```ts
import { createServer } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const hooks = twitch.eventsub.webhook({
  callback: "https://example.com/twitch/eventsub",
  secret: process.env.EVENTSUB_SECRET!,
});
hooks.onError((error) => console.error(error.message));

hooks.on("stream.online", { broadcaster_user_id: "141981764" }, (event) => {
  console.log(`${event.broadcaster_user_name} went live at ${event.started_at}`);
});

createServer(hooks.nodeHandler()).listen(3000);
```

`on()` demande à Twitch de créer l'abonnement. Twitch appelle ensuite l'URL de callback avec un défi de vérification, l'écouteur y répond, et les événements commencent à arriver. `on()`, `onError()` et `onRevocation()` fonctionnent comme décrit dans [Recevoir des événements](/events/overview/).

`nodeHandler()` ne regarde ni le chemin ni la méthode de la requête. Quand le serveur fait autre chose, faites le routage vous-même :

```ts
import { createServer } from "node:http";

const eventsub = hooks.nodeHandler();

createServer((req, res) => {
  if (req.method === "POST" && req.url === "/twitch/eventsub") {
    void eventsub(req, res);
    return;
  }
  res.writeHead(404).end();
}).listen(3000);
```

## Options

| Option | Type | Par défaut | Effet |
| --- | --- | --- | --- |
| `callback` | `string` | obligatoire | L'URL publique que Twitch appelle. Elle doit aboutir à l'un des trois points d'entrée ci-dessous. |
| `secret` | `string` | obligatoire | Signe et vérifie les notifications. De 10 à 100 caractères ASCII. |
| `subscribe` | `boolean` | `true` | Indique si `on()` crée l'abonnement du côté de Twitch. |
| `maxAge` | `number` | `600` | Âge maximal d'une notification acceptée, en secondes. |

L'écouteur lève une `TwitchEventSubError` quand `callback` ou `secret` est absent, ou quand le secret ne compte pas entre 10 et 100 caractères. Générez le secret une seule fois et conservez-le avec vos autres informations d'identification :

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

:::caution
Twitch signe les notifications d'un abonnement avec le secret utilisé à la création de cet abonnement. Si vous changez de secret, supprimez d'abord les abonnements existants, sinon leurs livraisons échouent à la vérification de signature et reçoivent un `403` en réponse.
:::

## Runtimes de style Fetch

`handle(request)` prend une `Request` standard et se résout avec la `Response` à renvoyer. Elle convient à Bun, à Deno, à Cloudflare Workers, à Hono et aux gestionnaires de route de Next.js.

```ts
// Bun et Deno
export default {
  fetch(request: Request): Response | Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === "POST" && pathname === "/twitch/eventsub") return hooks.handle(request);
    return new Response("Not found", { status: 404 });
  },
};
```

Passez-lui la requête intacte : l'écouteur lit le corps lui-même. Avec Hono, il s'agit de la requête brute du contexte :

```ts
declare const app: { post(path: string, handler: (c: { req: { raw: Request } }) => Promise<Response>): void };

app.post("/twitch/eventsub", (c) => hooks.handle(c.req.raw));
```

## Express

`nodeHandler()` fonctionne aussi comme route Express. La signature porte sur les octets exacts envoyés par Twitch : le gestionnaire doit donc voir le corps avant qu'un analyseur JSON ne le modifie. Montez la route avant `express.json()` :

```ts
declare const express: { json(): unknown };
declare const app: {
  post(path: string, handler: (req: any, res: any) => unknown): void;
  use(middleware: unknown): void;
};

app.post("/twitch/eventsub", hooks.nodeHandler());
app.use(express.json()); // après la route EventSub
```

Si un analyseur doit passer en premier, utilisez-en un brut sur cette route. Le gestionnaire utilise tel quel un corps qui est un `Buffer` ou une chaîne de caractères :

```ts
type Middleware = (req: any, res: any, next: () => void) => unknown;
declare const express: { raw(options: { type: string }): Middleware };
declare const app: { post(path: string, ...handlers: Middleware[]): void };

app.post("/twitch/eventsub", express.raw({ type: "application/json" }), hooks.nodeHandler());
```

Quand le corps a déjà été analysé en objet, le gestionnaire répond `500` et signale `The request body was already parsed by a middleware, so its signature cannot be verified.` à `onError`.

## Tout autre framework

`process({ header, body })` est le point d'entrée sur lequel reposent les deux autres. Donnez-lui un moyen de lire un en-tête ainsi que le corps brut sous forme de texte, puis renvoyez le statut et le corps qu'il retourne. Le corps, quand il y en a un, est du texte brut.

```ts
interface FunctionEvent {
  headers: Record<string, string | undefined>; // noms en minuscules
  body: string;
}

export async function handler(event: FunctionEvent) {
  const pending: Promise<unknown>[] = [];
  const result = await hooks.process(
    { header: (name) => event.headers[name.toLowerCase()], body: event.body },
    { waitUntil: (work) => pending.push(work) },
  );
  await Promise.all(pending); // laisse les gestionnaires terminer avant que la fonction soit gelée
  return { statusCode: result.status, headers: { "Content-Type": "text/plain" }, body: result.body ?? "" };
}
```

La fonction `header` est appelée avec des noms tels que `Twitch-Eventsub-Message-Id`. Passez-les vous-même en minuscules si votre framework stocke les noms d'en-tête en minuscules. Ne reconstruisez jamais le corps avec `JSON.stringify` : le résultat n'est pas, octet pour octet, ce que Twitch a signé.

## Ce qui est vérifié à chaque livraison

Chaque requête passe par les mêmes étapes, dans cet ordre :

| Étape | Réponse |
| --- | --- |
| L'un des quatre en-têtes `Twitch-Eventsub-Message-*` (`Id`, `Timestamp`, `Signature`, `Type`) est absent | `400` |
| L'horodatage est illisible, ou s'écarte de plus de `maxAge` secondes de l'heure actuelle | `403` |
| La signature HMAC SHA-256 de l'identifiant, de l'horodatage et du corps ne correspond pas au secret | `403` |
| Le corps n'est pas du JSON, ou n'a pas d'objet `subscription` | `400` |
| Le message est un défi de vérification | `200` avec le défi en `text/plain` |
| L'identifiant du message a déjà été vu | `204`, les gestionnaires ne sont pas exécutés |
| Le message est une notification | `204`, les gestionnaires sont exécutés |
| Le message est une révocation | `204`, l'abonnement est abandonné et les écouteurs `onRevocation` sont appelés |

La signature est calculée avec l'API Web Crypto et comparée en temps constant. Les identifiants de message sont mémorisés aussi longtemps qu'une livraison portant cet identifiant pourrait encore passer le contrôle d'âge : un rejeu à l'intérieur de cette fenêtre est donc détecté.

Les gestionnaires s'exécutent en arrière-plan : le `204` est envoyé sans les attendre, car Twitch attend une réponse en quelques secondes. Un gestionnaire qui lève une erreur est signalé à `onError`. Twitch n'en sait rien et ne renvoie pas l'événement.

## Le défi et ready

Quand `on()` crée un abonnement, Twitch vérifie d'abord que le callback est bien le vôtre en lui envoyant un défi. L'écouteur y répond pour vous, pour tout abonnement signé avec votre secret. `handle.ready` est résolue quand le défi est arrivé : le serveur doit donc déjà être à l'écoute à ce moment-là.

```ts
import { createServer } from "node:http";

createServer(hooks.nodeHandler()).listen(3000);

const handle = hooks.on("stream.offline", { broadcaster_user_id: "141981764" }, (event) => {
  console.log(`${event.broadcaster_user_name} went offline`);
});

await handle.ready;
console.log("Twitch verified the callback");
```

Si aucun défi n'arrive dans les 60 secondes, `ready` est rejetée et la même erreur est transmise à `onError` :

```
Twitch did not verify the callback for stream.offline within 60 seconds. Check that https://example.com/twitch/eventsub is public, uses HTTPS on port 443 and reaches this listener.
```

Le gestionnaire reste enregistré après cela. Si le défi arrive en retard, les événements lui sont tout de même livrés.

## Après un redémarrage

Les abonnements webhook vivent du côté de Twitch : ils sont donc toujours là quand votre processus redémarre. `on()` reçoit alors de Twitch un `409 Conflict`, que l'écouteur traite comme un succès : `ready` est résolue et les événements sont acheminés vers les nouveaux gestionnaires.

Deux conséquences en découlent. L'écouteur apprend l'identifiant d'un tel abonnement à sa première notification : un `stop()` appelé avant l'arrivée du moindre événement retire donc le gestionnaire, mais ne peut pas supprimer l'abonnement. Et un `409` indique seulement que l'abonnement existe, pas qu'il est `enabled`. Si les événements ont cessé d'arriver, listez vos abonnements comme indiqué dans [Gérer les abonnements](/events/managing-subscriptions/) et supprimez ceux qui sont en échec.

## Recevoir sans s'abonner

Avec `subscribe: false`, `on()` n'envoie rien à Twitch. Il enregistre le gestionnaire, et `ready` est résolue aussitôt. `stop()` retire le gestionnaire et ne touche pas à l'abonnement. Utilisez cette option quand les abonnements sont créés ailleurs : par un script de déploiement, ou par une autre instance du même service.

```ts
const hooks = twitch.eventsub.webhook({ callback, secret, subscribe: false });

hooks.on("channel.update", { broadcaster_user_id: "141981764" }, (event) => {
  console.log(`New title: ${event.title}`);
});
```

`callback` reste obligatoire, même si cet écouteur ne l'envoie jamais.

## Cloudflare Workers et serverless

Deux choses changent sur les plateformes qui exécutent votre code à chaque requête.

D'abord, un Worker ne peut pas émettre de requêtes pendant le chargement de son module, donc `on()` ne doit pas s'abonner : construisez l'écouteur avec `subscribe: false` et créez les abonnements depuis un script. Ensuite, la plateforme peut arrêter un gestionnaire dès que la réponse est envoyée. Passez son `waitUntil` en second argument de `handle()` : il reçoit une promesse qui se termine quand les gestionnaires de la notification ont fini.

```ts title="src/worker.ts"
import { type EventSubWebhook, Twitch } from "@ix-xs/twitch.api";

interface Env {
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
  EVENTSUB_SECRET: string;
  CALLBACK_URL: string;
  DISCORD_WEBHOOK_URL: string;
}

let hooks: EventSubWebhook | undefined;

function listener(env: Env): EventSubWebhook {
  if (hooks) return hooks;
  const twitch = new Twitch({ clientId: env.TWITCH_CLIENT_ID, clientSecret: env.TWITCH_CLIENT_SECRET });
  hooks = twitch.eventsub.webhook({ callback: env.CALLBACK_URL, secret: env.EVENTSUB_SECRET, subscribe: false });

  hooks.on("stream.online", { broadcaster_user_id: "141981764" }, async (event) => {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `${event.broadcaster_user_name} is live` }),
    });
  });
  return hooks;
}

export default {
  fetch(request: Request, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<Response> {
    return listener(env).handle(request, { waitUntil: (work) => ctx.waitUntil(work) });
  },
};
```

Exécutez le script une fois le Worker déployé, puisque Twitch envoie le défi dès que l'abonnement est créé :

```ts title="scripts/subscribe.ts"
import { Twitch, TwitchApiError } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

try {
  await twitch.eventsub.subscribe({
    type: "stream.online",
    condition: { broadcaster_user_id: "141981764" },
    transport: { method: "webhook", callback: process.env.CALLBACK_URL!, secret: process.env.EVENTSUB_SECRET! },
  });
} catch (error) {
  // 409 : l'abonnement existe déjà.
  if (!(error instanceof TwitchApiError) || error.status !== 409) throw error;
}
```

:::note
La mémoire des identifiants de message appartient à une seule instance. Quand la plateforme exécute plusieurs instances, une notification que Twitch envoie deux fois peut en atteindre deux et exécuter un gestionnaire deux fois. Si cela pose problème, enregistrez `meta.messageId` dans un stockage partagé et ignorez les identifiants que vous avez déjà traités.
:::

## Vérifier une signature vous-même

`verifyEventSubSignature` est la vérification de signature seule, pour le code qui gère lui-même le reste du protocole. Elle se résout avec `false` quand un en-tête est absent ou que la signature ne correspond pas.

```ts
import { verifyEventSubSignature } from "@ix-xs/twitch.api";

async function receive(request: Request): Promise<Response> {
  const body = await request.text();
  const valid = await verifyEventSubSignature({
    secret,
    messageId: request.headers.get("Twitch-Eventsub-Message-Id"),
    timestamp: request.headers.get("Twitch-Eventsub-Message-Timestamp"),
    signature: request.headers.get("Twitch-Eventsub-Message-Signature"),
    body,
  });
  if (!valid) return new Response(null, { status: 403 });

  if (request.headers.get("Twitch-Eventsub-Message-Type") === "webhook_callback_verification") {
    const { challenge } = JSON.parse(body) as { challenge: string };
    return new Response(challenge, { headers: { "Content-Type": "text/plain" } });
  }
  // À partir d'ici, c'est à vous de traiter les notifications et les révocations.
  return new Response(null, { status: 204 });
}
```

Elle ne vérifie pas l'âge du message et ne filtre pas les doublons. L'écouteur fait les deux.

## Exigences de l'URL de callback

Elles viennent de la [documentation de Twitch sur les webhooks](https://dev.twitch.tv/docs/eventsub/handling-webhook-events/) :

- L'URL utilise HTTPS et écoute sur le port 443.
- Elle est joignable depuis Internet. `localhost` et les adresses privées ne fonctionnent pas.
- Elle répond en quelques secondes. L'écouteur le fait, quoi que fassent vos gestionnaires.
- Quand elle ne répond pas à temps un trop grand nombre de fois, Twitch révoque l'abonnement avec le statut `notification_failures_exceeded`.

## Tester en local avec un tunnel

Un tunnel donne à votre serveur local une adresse HTTPS publique. Avec [ngrok](https://ngrok.com/) :

```bash
ngrok http 3000
```

Copiez l'adresse de redirection en `https://` qu'il affiche, ajoutez le chemin sur lequel votre serveur écoute, et utilisez le résultat comme `callback` :

```ini
CALLBACK_URL=https://your-tunnel.ngrok-free.app/twitch/eventsub
```

Démarrez votre serveur avec cette valeur et attendez `handle.ready`. Si le tunnel obtient une nouvelle adresse à chaque démarrage, chaque exécution crée de nouveaux abonnements et laisse les précédents pointer vers une adresse qui ne répond plus. Supprimez-les de temps en temps, comme indiqué dans [Gérer les abonnements](/events/managing-subscriptions/).

La [CLI Twitch](https://dev.twitch.tv/docs/cli/) peut aussi envoyer des notifications de test signées directement à une URL locale, sans tunnel et sans véritable abonnement : sa commande `twitch event trigger` prend l'URL avec `-F` et le secret avec `-s`. Construisez l'écouteur avec `subscribe: false` pour cela. Une notification est acheminée d'après l'identifiant de son abonnement, puis d'après son type, sa version et sa condition : l'événement de test doit donc porter la condition avec laquelle votre gestionnaire a été enregistré.

## Voir aussi

- [Recevoir des événements](/events/overview/) : `on()`, `meta`, `onError` et `onRevocation`.
- [Gérer les abonnements](/events/managing-subscriptions/) : lister et supprimer les abonnements webhook.
- [Runtimes](/basics/runtimes/) : ce dont la bibliothèque a besoin sur Workers, Bun et Deno.
- [Alertes de direct](/recipes/go-live-alerts/) : un programme complet construit sur cet écouteur.
- [twitch.eventsub.webhook](/reference/api/eventsub/#webhook) : la méthode dans la référence.
