---
title: "Go-live alerts"
description: "Post a message in a Discord channel when the streamers you follow go live, with EventSub webhooks and nothing but the app token."
sidebar:
  order: 2
---

This recipe builds a small server that watches a list of Twitch channels and posts in a Discord channel when one of them starts or stops streaming. It uses EventSub webhooks, so no user has to sign in and nothing is polled: Twitch calls your server when something happens.

## What you need

| | |
| --- | --- |
| Application | A client ID and a client secret from the [Twitch developer console](https://dev.twitch.tv/console/apps). See [Credentials](/credentials/). |
| Token | The app token only. The client requests it on its own. |
| Scopes | None. `stream.online` and `stream.offline` are public events. |
| Callback URL | A public HTTPS address on port 443 that reaches your server. A tunnel does the job while you develop. |
| Webhook secret | A random string of 10 to 100 characters. Twitch signs every delivery with it. |
| Discord | The URL of a webhook created in the settings of the Discord channel that receives the alerts. |

The program reads all of this from the environment:

```ini
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
EVENTSUB_SECRET=a-random-string-of-10-to-100-characters
CALLBACK_URL=https://your-public-host/twitch/eventsub
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook
```

## Receive the webhooks

Create the webhook listener, then give its Node.js handler to an HTTP server. The path of the route must be the path of `CALLBACK_URL`.

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

The handler reads the raw body, checks the signature and the age of each delivery, drops duplicates and answers the verification challenge Twitch sends for a new subscription. [Webhooks](/events/webhooks/) describes each check.

Start the server before you subscribe. Twitch calls the callback to verify a subscription as soon as it is created.

## Subscribe to the channels

Events are addressed by user ID, so the logins are resolved first. One call to `users.get` takes the whole list, and a login that does not exist is absent from the result.

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

Each `on()` creates a subscription with the app token. The subscriptions stay on Twitch's side when the program stops. When it starts again and asks for the same ones, Twitch answers that they exist and the listener carries on with them.

## Post to Discord

A Discord webhook accepts a JSON body with a `content` field. The event says who went live, but not what they stream: the title and the category come from `streams.get`.

```ts
async function post(content: string): Promise<void> {
  const response = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // A stream title must not be able to ping the whole server.
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!response.ok) throw new Error(`Discord answered ${response.status}`);
}

hooks.on("stream.online", { broadcaster_user_id: channelId }, async (event) => {
  if (event.type !== "live") return; // reruns, premieres...

  const stream = await twitch.streams.get({ user_id: event.broadcaster_user_id }).first();
  const details = stream ? `: ${stream.title} (${stream.game_name || "no category"})` : "";
  await post(`${event.broadcaster_user_name} is live${details}\nhttps://twitch.tv/${event.broadcaster_user_login}`);
});
```

`first()` resolves with `undefined` when the stream is not listed, so the message has a short form that needs neither the title nor the category.

The listener answers Twitch right away and runs your handler in the background. An error thrown by the handler, such as the one `post` throws when Discord refuses the message, is passed to `onError`.

## The whole file

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
    // A stream title must not be able to ping the whole server.
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!response.ok) throw new Error(`Discord answered ${response.status}`);
}

// The server comes first: Twitch calls it to verify each subscription.
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
    if (event.type !== "live") return; // reruns, premieres...

    const stream = await twitch.streams.get({ user_id: event.broadcaster_user_id }).first();
    const details = stream ? `: ${stream.title} (${stream.game_name || "no category"})` : "";
    await post(`${event.broadcaster_user_name} is live${details}\nhttps://twitch.tv/${event.broadcaster_user_login}`);
  });

  const offline = hooks.on("stream.offline", condition, async (event) => {
    await post(`${event.broadcaster_user_name} went offline.`);
  });

  return [online, offline];
});

// Each `ready` settles once Twitch has verified the callback, or gives up after 60 seconds.
const results = await Promise.allSettled(handles.map((handle) => handle.ready));
const ready = results.filter((result) => result.status === "fulfilled").length;
console.log(`${ready} of ${handles.length} subscriptions are ready`);
```

Run it with [tsx](https://tsx.is/), in a project that is an ES module (`"type": "module"` in `package.json`):

```bash
node --env-file=.env --import tsx src/alerts.ts
```

## Test it locally

Twitch cannot reach `localhost`. A tunnel such as [ngrok](https://ngrok.com/) gives your machine a public HTTPS address:

```bash
ngrok http 3000
```

Copy the address it prints into `CALLBACK_URL`, followed by `/twitch/eventsub`, and start the program. The last line it logs tells you how many subscriptions Twitch verified. A subscription that is not verified within 60 seconds is reported to `onError`, with the callback URL in the message.

A tunnel usually gets a new address each time it starts. A new address is a new callback, so the subscriptions created with the previous one stay behind and point nowhere. Remove them before they pile up:

```ts
for await (const subscription of twitch.eventsub.subscriptions()) {
  if (subscription.transport.method === "webhook" && subscription.transport.callback !== callback) {
    await twitch.eventsub.unsubscribe(subscription.id);
  }
}
```

To avoid waiting for a channel to go live, the `event trigger` command of the [Twitch CLI](https://dev.twitch.tv/docs/cli/) can send a signed test notification to your server. Give it the same secret and the ID of a channel the program subscribed to: the listener finds the handler of a notification from its type and its condition.

## Going further

### Skip the alert when a stream restarts

A streamer who loses their connection goes offline and online again within a minute. Remember when each channel was last announced and stay quiet for a while:

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

Call it at the top of the `stream.online` handler and return when it says no.

### Send an embed with the preview image

Discord also accepts `embeds`. The `thumbnail_url` of a stream is a template: replace `{width}` and `{height}` with the size you want.

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

Send it as `{ embeds: [embed(stream)] }` in place of `content`.

### Deploy on a serverless platform

On Cloudflare Workers and similar platforms, create the subscriptions from a deploy script and build the listener with `subscribe: false`. [Webhooks](/events/webhooks/) shows the setup.

## See also

- [Webhooks](/events/webhooks/): the checks made on each delivery, and other frameworks than `node:http`.
- [Managing subscriptions](/events/managing-subscriptions/): listing, deleting, statuses and costs.
- [streams.get](/reference/api/streams/#get): filters and fields of a live stream.
- [stream.online](/reference/event-types/#streamonline): the condition and the fields of the event.
