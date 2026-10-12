---
title: "Runtimes"
description: "Where the library runs (Node.js, Bun, Deno, Cloudflare Workers, browsers), how it is packaged, and the options that swap fetch, WebSocket and the Twitch URLs."
sidebar:
  order: 8
---

The main entry of the library uses web standard APIs only: `fetch`, `AbortSignal`, `URL`, Web Crypto and, for the WebSocket listener, the global `WebSocket`. It imports no Node.js built-in and has no dependency, so the same code runs on servers, on edge platforms and in browsers.

## A first example

This is the whole of a Cloudflare Worker that answers with a Twitch profile. The same three lines of client code work in every runtime below.

```ts title="src/worker.ts"
import { Twitch } from "@ix-xs/twitch.api";

interface Env {
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
}

let twitch: Twitch | undefined;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Built once, then reused by the following requests.
    twitch ??= new Twitch({ clientId: env.TWITCH_CLIENT_ID, clientSecret: env.TWITCH_CLIENT_SECRET });

    const login = new URL(request.url).searchParams.get("login") ?? "twitchdev";
    const user = await twitch.users.getByLogin(login);
    return user ? Response.json(user) : new Response("No such user", { status: 404 });
  },
};
```

## What works where

| Runtime | API calls | WebSocket events | Webhook events | `FileTokenStore` |
| --- | --- | --- | --- | --- |
| [Node.js](https://nodejs.org) 22 or later | Yes | Yes | Yes | Yes |
| [Bun](https://bun.sh) | Yes | Yes | Yes | Yes |
| [Deno](https://deno.com) | Yes | Yes | Yes | Yes |
| [Cloudflare Workers](https://workers.cloudflare.com) | Yes | Use webhooks | Yes | No file system |
| Browsers | Yes, without a client secret | Yes | No server to call | No file system |

### Node.js

Node.js 22 is the minimum, and the `engines` field of the package says so. It is the first version that has `fetch`, `AbortSignal.any` and `WebSocket` as globals without a flag.

```bash
npm install @ix-xs/twitch.api
```

### Bun and Deno

Install the same package from npm. The imports do not change.

```bash
bun add @ix-xs/twitch.api
deno add npm:@ix-xs/twitch.api
```

Both runtimes implement the Node.js file system module, so `FileTokenStore` works there too. With Deno, allow network access when you run your program, plus file access if you use the store.

### Cloudflare Workers

Building a client sends no request, so it is safe to create one at the first request and keep it in a module variable, as in the example above. Three things differ from a server:

- Nothing survives in memory for long. Keep user tokens in a store backed by KV or a database, see [Storing tokens](/auth/storing-tokens/).
- A Worker does not stay alive between requests, so it cannot hold a WebSocket listener open. Receive events with [webhooks](/events/webhooks/), which page also covers the two settings a Worker needs.
- There is no file system. Do not import `@ix-xs/twitch.api/node`.

### Browsers

The library runs in a browser, with one hard rule: the client secret stays out. Build the client with the client ID alone and sign the user in with the [device code flow](/auth/device-code/), which needs no secret. Calls are then made with that user's token.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: "your-client-id" });
```

:::danger
Never ship a client secret to a browser. Anything in a page can be read by its visitors, and the secret lets anyone request tokens in the name of your application. If a page needs data that requires the app token, fetch it from your own server and call Twitch there.
:::

The `userAgent` option has no effect in browsers, which do not let a page set that header.

## ES modules and CommonJS

The package ships both formats, each with its own type declarations. `import` and `require` resolve to the right one through the `exports` map of the package.

```ts
import { Twitch } from "@ix-xs/twitch.api";
```

```js
const { Twitch } = require("@ix-xs/twitch.api");
```

TypeScript finds the types on its own with the `node16`, `nodenext` and `bundler` module resolutions. There is no `@types` package to install. The package is marked free of side effects, so a bundler keeps only the parts you import.

## The Node.js entry

`@ix-xs/twitch.api/node` is a second entry point for helpers that need Node.js built-ins. Today it holds one: `FileTokenStore`, which saves user tokens in a JSON file.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId,
  clientSecret,
  tokens: new FileTokenStore("./tokens.json"),
});
```

It is separate so that the main entry never mentions `node:fs`. A bundle for a Worker or a browser then builds without polyfills or special configuration. See [Storing tokens](/auth/storing-tokens/) for the store itself.

## Use your own fetch

The `fetch` option replaces the function behind every HTTP request the client makes, to the Twitch API and to the OAuth server alike. Use it to go through a proxy, to add instrumentation, or to answer from memory in tests.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId,
  clientSecret,
  fetch: async (input, init) => {
    const started = performance.now();
    const response = await fetch(input, init);
    console.log(response.status, String(input), `${Math.round(performance.now() - started)} ms`);
    return response;
  },
});
```

In a test, a fake `fetch` stands in for Twitch. Remember that the client asks the OAuth server for an app token before its first call:

```ts
import { Twitch } from "@ix-xs/twitch.api";

const fakeFetch: typeof fetch = async (input) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.hostname === "id.twitch.tv") {
    return Response.json({ access_token: "test-token", expires_in: 3600, token_type: "bearer" });
  }
  if (url.pathname === "/helix/users") {
    return Response.json({ data: [{ id: "1", login: "someone", display_name: "Someone" }] });
  }
  return Response.json({ data: [] });
};

const twitch = new Twitch({ clientId: "test", clientSecret: "test", fetch: fakeFetch });
const user = await twitch.users.getByLogin("someone");
```

Without the option, the client calls the global `fetch`, and looks it up at each request. A test tool that replaces `globalThis.fetch` after the client was built is therefore picked up. On a runtime with no `fetch` at all, the constructor throws a `TwitchError` asking you to pass one.

## Use another WebSocket class

The WebSocket and conduit listeners open their connections with the global `WebSocket`. The `webSocket` option takes another class instead: one from a package on a runtime that has no global, or a fake one in tests.

```ts
import type { WebSocketConstructor } from "@ix-xs/twitch.api";

// For example the class exported by the "ws" package.
declare const WebSocketClass: WebSocketConstructor;

const events = twitch.eventsub.websocket({ webSocket: WebSocketClass });
```

The class must be constructible with a URL and expose `onopen`, `onmessage`, `onclose`, `onerror` and `close()`. Without a global and without the option, creating the listener throws a `TwitchEventSubError`. The other options of the listener are described in [WebSocket](/events/websocket/).

## Point the client at another server

Two options change where requests go:

| Option | Default | Used for |
| --- | --- | --- |
| `baseUrl` | `https://api.twitch.tv/helix` | Every API call. |
| `authUrl` | `https://id.twitch.tv/oauth2` | App tokens, the sign-in flows, refreshing, validating and revoking tokens. |

Their main use is the mock server of the [Twitch CLI](https://dev.twitch.tv/docs/cli/mock-api-command/), which imitates the API on your machine with generated users and streams. Start it with `twitch mock-api start`, take the ID and the secret of one of its clients from `http://localhost:8080/units/clients`, and build the client against it:

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.MOCK_CLIENT_ID!,
  clientSecret: process.env.MOCK_CLIENT_SECRET,
  baseUrl: "http://localhost:8080/mock",
  authUrl: "http://localhost:8080/auth",
});

const streams = await twitch.streams.get().take(5);
```

The app token is requested from the mock server like from the real one. The mock server hands out user tokens through an endpoint of its own, described in its documentation. Register such a token with its owner and its scopes, so that the client does not have to ask the server about it:

```ts
declare const mockUserToken: string;

await twitch.auth.addUser({
  accessToken: mockUserToken,
  userId: "141981764",
  scopes: ["moderator:manage:banned_users"],
});
```

The WebSocket listener has a matching `url` option for the EventSub server of the Twitch CLI, see [WebSocket](/events/websocket/).

## See also

- [Quick start](/quick-start/): install and first calls on Node.js.
- [Getting credentials](/credentials/): public and confidential applications, and where the secret may live.
- [Storing tokens](/auth/storing-tokens/): `FileTokenStore` and stores for KV or a database.
- [Webhooks](/events/webhooks/): receiving events on Workers and other serverless platforms.
- [Client options](/reference/client-options/): every option of the constructor.
