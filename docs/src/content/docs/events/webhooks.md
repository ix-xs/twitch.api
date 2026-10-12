---
title: "Webhooks"
description: "Receive events on your own HTTPS endpoint: plug the listener into any server, what it checks on every delivery, and how to run it on serverless platforms."
sidebar:
  order: 3
---

`twitch.eventsub.webhook({ callback, secret })` returns a listener for servers that Twitch can reach over the internet. Twitch sends each notification as an HTTP `POST` to your callback URL. Subscriptions are created with the app token, so the client needs a client secret, no user has to be online, and the subscriptions survive a restart of your server.

## A first example

A `node:http` server that logs when a channel goes live.

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

`on()` asks Twitch to create the subscription. Twitch then calls the callback URL with a verification challenge, the listener answers it, and events start to arrive. `on()`, `onError()` and `onRevocation()` work as described in [Receiving events](/events/overview/).

`nodeHandler()` does not look at the path or the method of the request. When the server does other things, route to it yourself:

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

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `callback` | `string` | required | The public URL Twitch calls. It must reach one of the three entry points below. |
| `secret` | `string` | required | Signs and verifies notifications. 10 to 100 ASCII characters. |
| `subscribe` | `boolean` | `true` | Whether `on()` creates the subscription on Twitch's side. |
| `maxAge` | `number` | `600` | Oldest notification accepted, in seconds. |

The listener throws a `TwitchEventSubError` when `callback` or `secret` is missing, or when the secret is not 10 to 100 characters long. Generate the secret once and keep it with your other credentials:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

:::caution
Twitch signs the notifications of a subscription with the secret that subscription was created with. If you change the secret, delete the existing subscriptions first, otherwise their deliveries fail the signature check and are answered with `403`.
:::

## Fetch style runtimes

`handle(request)` takes a standard `Request` and resolves with the `Response` to send back. It fits Bun, Deno, Cloudflare Workers, Hono and Next.js route handlers.

```ts
// Bun and Deno
export default {
  fetch(request: Request): Response | Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === "POST" && pathname === "/twitch/eventsub") return hooks.handle(request);
    return new Response("Not found", { status: 404 });
  },
};
```

Give it the request untouched: the listener reads the body itself. With Hono, that is the raw request of the context:

```ts
declare const app: { post(path: string, handler: (c: { req: { raw: Request } }) => Promise<Response>): void };

app.post("/twitch/eventsub", (c) => hooks.handle(c.req.raw));
```

## Express

`nodeHandler()` also works as an Express route. The signature covers the exact bytes Twitch sent, so the handler must see the body before any JSON parser changes it. Mount the route before `express.json()`:

```ts
declare const express: { json(): unknown };
declare const app: {
  post(path: string, handler: (req: any, res: any) => unknown): void;
  use(middleware: unknown): void;
};

app.post("/twitch/eventsub", hooks.nodeHandler());
app.use(express.json()); // after the EventSub route
```

If a parser has to run first, use a raw one on that route. The handler uses a body that is a `Buffer` or a string as is:

```ts
type Middleware = (req: any, res: any, next: () => void) => unknown;
declare const express: { raw(options: { type: string }): Middleware };
declare const app: { post(path: string, ...handlers: Middleware[]): void };

app.post("/twitch/eventsub", express.raw({ type: "application/json" }), hooks.nodeHandler());
```

When the body was already parsed into an object, the handler answers `500` and reports `The request body was already parsed by a middleware, so its signature cannot be verified.` to `onError`.

## Any other framework

`process({ header, body })` is the entry point the two others are built on. Give it a way to read a header and the raw body as text, and send back the status and the body it returns. The body, when there is one, is plain text.

```ts
interface FunctionEvent {
  headers: Record<string, string | undefined>; // names in lower case
  body: string;
}

export async function handler(event: FunctionEvent) {
  const pending: Promise<unknown>[] = [];
  const result = await hooks.process(
    { header: (name) => event.headers[name.toLowerCase()], body: event.body },
    { waitUntil: (work) => pending.push(work) },
  );
  await Promise.all(pending); // let the handlers finish before the function is frozen
  return { statusCode: result.status, headers: { "Content-Type": "text/plain" }, body: result.body ?? "" };
}
```

The `header` function is called with names such as `Twitch-Eventsub-Message-Id`. Lower the case yourself if your framework stores header names in lower case. Never rebuild the body with `JSON.stringify`: the result is not byte for byte what Twitch signed.

## What is checked on every delivery

Each request goes through the same steps, in this order:

| Step | Answer |
| --- | --- |
| One of the four `Twitch-Eventsub-Message-*` headers (`Id`, `Timestamp`, `Signature`, `Type`) is missing | `400` |
| The timestamp cannot be read, or is more than `maxAge` seconds away from now | `403` |
| The HMAC SHA-256 signature of ID, timestamp and body does not match the secret | `403` |
| The body is not JSON, or has no `subscription` object | `400` |
| The message is a verification challenge | `200` with the challenge as `text/plain` |
| The message ID was already seen | `204`, handlers do not run |
| The message is a notification | `204`, handlers run |
| The message is a revocation | `204`, the subscription is dropped and `onRevocation` listeners are called |

The signature is computed with the Web Crypto API and compared in constant time. Message IDs are remembered for as long as a delivery with that ID could still pass the age check, so a replay inside the window is caught.

Handlers run in the background: the `204` is sent without waiting for them, because Twitch expects an answer within a few seconds. A handler that throws is reported to `onError`. Twitch does not know about it and does not send the event again.

## The challenge and ready

When `on()` creates a subscription, Twitch first proves that the callback is yours by sending it a challenge. The listener answers it for you, for any subscription signed with your secret. `handle.ready` resolves when the challenge has arrived, so the server must be listening by then.

```ts
import { createServer } from "node:http";

createServer(hooks.nodeHandler()).listen(3000);

const handle = hooks.on("stream.offline", { broadcaster_user_id: "141981764" }, (event) => {
  console.log(`${event.broadcaster_user_name} went offline`);
});

await handle.ready;
console.log("Twitch verified the callback");
```

If no challenge arrives within 60 seconds, `ready` rejects and the same error goes to `onError`:

```
Twitch did not verify the callback for stream.offline within 60 seconds. Check that https://example.com/twitch/eventsub is public, uses HTTPS on port 443 and reaches this listener.
```

The handler stays registered after that. If the challenge comes late, events are still delivered to it.

## After a restart

Webhook subscriptions live on Twitch's side, so they are still there when your process starts again. `on()` then gets a `409 Conflict` from Twitch, which the listener treats as success: `ready` resolves and events are routed to the new handlers.

Two consequences follow. The listener learns the ID of such a subscription from its first notification, so a `stop()` called before any event arrived removes the handler but cannot delete the subscription. And a `409` only says that the subscription exists, not that it is `enabled`. If events stopped arriving, list your subscriptions as shown in [Managing subscriptions](/events/managing-subscriptions/) and delete the ones in a failed state.

## Receive without subscribing

With `subscribe: false`, `on()` sends nothing to Twitch. It registers the handler, and `ready` resolves at once. `stop()` removes the handler and leaves the subscription alone. Use it when subscriptions are created somewhere else: a deploy script, or another instance of the same service.

```ts
const hooks = twitch.eventsub.webhook({ callback, secret, subscribe: false });

hooks.on("channel.update", { broadcaster_user_id: "141981764" }, (event) => {
  console.log(`New title: ${event.title}`);
});
```

`callback` is still required, even though this listener never sends it.

## Cloudflare Workers and serverless

Two things change on platforms that run your code per request.

First, a Worker cannot make requests while its module loads, so `on()` must not subscribe: build the listener with `subscribe: false` and create the subscriptions from a script. Second, the platform may stop a handler as soon as the response is sent. Pass its `waitUntil` as the second argument of `handle()`, and it receives a promise that settles when the handlers of the notification are done.

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

Run the script once the Worker is deployed, since Twitch sends the challenge as soon as the subscription is created:

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
  // 409: the subscription already exists.
  if (!(error instanceof TwitchApiError) || error.status !== 409) throw error;
}
```

:::note
The memory of message IDs belongs to one instance. When the platform runs several instances, a notification Twitch sends twice can reach two of them and run a handler twice. If that matters, record `meta.messageId` in shared storage and skip the IDs you have already handled.
:::

## Verify a signature yourself

`verifyEventSubSignature` is the signature check alone, for code that handles the rest of the protocol itself. It resolves with `false` when a header is missing or the signature does not match.

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
  // Notifications and revocations are yours to handle from here.
  return new Response(null, { status: 204 });
}
```

It does not check the age of the message and does not filter duplicates. The listener does both.

## Requirements of the callback URL

These come from [Twitch's webhook documentation](https://dev.twitch.tv/docs/eventsub/handling-webhook-events/):

- The URL uses HTTPS and listens on port 443.
- It is reachable from the internet. `localhost` and private addresses do not work.
- It answers within a few seconds. The listener does, whatever your handlers do.
- When it fails to answer in time too many times, Twitch revokes the subscription with the status `notification_failures_exceeded`.

## Test locally with a tunnel

A tunnel gives your local server a public HTTPS address. With [ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Copy the `https://` forwarding address it prints, add the path your server listens on, and use the result as `callback`:

```ini
CALLBACK_URL=https://your-tunnel.ngrok-free.app/twitch/eventsub
```

Start your server with that value and wait for `handle.ready`. If the tunnel gets a new address on each start, every run creates new subscriptions and leaves the previous ones pointing at an address that no longer answers. Delete them from time to time, as shown in [Managing subscriptions](/events/managing-subscriptions/).

The [Twitch CLI](https://dev.twitch.tv/docs/cli/) can also send signed test notifications straight to a local URL, without a tunnel and without a real subscription: its `twitch event trigger` command takes the URL with `-F` and the secret with `-s`. Build the listener with `subscribe: false` for that. A notification is routed by its subscription ID, then by its type, version and condition, so the test event must carry the condition your handler was registered with.

## See also

- [Receiving events](/events/overview/): `on()`, `meta`, `onError` and `onRevocation`.
- [Managing subscriptions](/events/managing-subscriptions/): listing and deleting webhook subscriptions.
- [Runtimes](/basics/runtimes/): what the library needs on Workers, Bun and Deno.
- [Go-live alerts](/recipes/go-live-alerts/): a complete program built on this listener.
- [twitch.eventsub.webhook](/reference/api/eventsub/#webhook): the method in the reference.
