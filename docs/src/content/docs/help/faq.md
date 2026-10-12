---
title: "Questions and answers"
description: "Short answers to the questions that come up most: what the library is, where it runs, which credentials it needs and how to do the common things."
---

Short answers, each with a link to the page that has the long one. If you are looking at an error message, [Troubleshooting](/help/troubleshooting/) is the better starting point.

## About the library

### Is this an official Twitch library?

No. It is an independent open source project, released under the MIT license and not affiliated with Twitch. It talks to the official, documented interfaces: the Helix API, the OAuth server and EventSub. Every method links to the page of the Twitch reference it implements.

### Which Node.js versions does it support?

Node.js 22 and later. The library has no dependency and relies on what the runtime provides (`fetch`, `AbortSignal`, Web Crypto, and the global `WebSocket` for EventSub), which Node.js has in full from that version on. It also runs on Bun, Deno and Cloudflare Workers: see [Runtimes](/basics/runtimes/).

### Does it work in the browser?

Yes. The main entry only uses web standard APIs, so it can be bundled for a browser. Two rules apply there: build the client with the `clientId` alone, because anything shipped to a browser can be read by its users, and get a user token with the device code flow or the implicit flow. Only `@ix-xs/twitch.api/node`, which holds the file token store, is specific to Node.js.

### Does it support CommonJS?

Yes. The package ships an ESM build and a CommonJS build, each with its type declarations.

```js
const { Twitch } = require("@ix-xs/twitch.api");
const { FileTokenStore } = require("@ix-xs/twitch.api/node");

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  tokens: new FileTokenStore("./tokens.json"),
});
```

### Do I need TypeScript?

No. The library is plain JavaScript once installed. The declarations are what gives your editor the autocompletion of method names, parameters, scopes and event types, and that works in JavaScript files too.

### Why are the fields in snake_case?

Parameters and response fields carry the names Twitch gives them: `broadcaster_id`, `viewer_count`, `started_at`. What you read in the official reference, in Twitch's error messages and in examples written for other tools applies as is, and nothing has to be translated in either direction. The library's own vocabulary is in camelCase: the options of the client, the fields of a `UserToken`, the names of the methods.

```ts
const [stream] = await twitch.streams.get({ user_login: "twitchdev" }).take(1);
console.log(stream?.viewer_count, stream?.started_at);
```

## Tokens and limits

### Do I need a client secret?

It depends on where the code runs. On a server, yes: the secret is what gets the app token, which public data, webhooks, conduits and the authorization code flow rely on. In a CLI, a desktop app or a browser, no, and you must not ship it: sign the user in with the device code flow and every endpoint that takes a user token works. [Tokens at a glance](/auth/overview/) has the table.

### Do I have to refresh tokens myself?

No. The app token is requested when a call needs it and renewed before it expires. A user token registered with its refresh token is refreshed before it expires and after Twitch rejects it, and validated every hour as Twitch requires. Give the client a token store and the refreshed tokens are saved too: see [Storing tokens](/auth/storing-tokens/).

### How are rate limits handled?

The client reads the `Ratelimit-*` headers of every answer, keeps one bucket for the app token and one per user, and holds a request back when its bucket is empty. A `429` that still gets through is retried once the bucket refills. If you would rather fail than wait, build the client with `rateLimit: "throw"` and catch `TwitchRateLimitError`. Details in [Rate limits and retries](/basics/rate-limits-and-retries/).

### Which token does a call use?

The one the endpoint needs. Endpoints for public data use the app token. Endpoints that act for someone use the token of the user named by the request (its `broadcaster_id`, its `moderator_id`), or of the only registered user. When several users are registered and the call does not say who acts, name one with `{ as: userId }`. To use the app token where a user's would be picked, pass `{ as: "app" }`. [Acting as a user](/basics/acting-as-a-user/) gives the exact order.

## Everyday use

### How do I get an ID from a login?

Ask `users.getByLogin`. It resolves with the user, or with `null` when nobody has that login. For several logins, `users.get` takes a list. IDs are strings, and unlike logins they never change, so they are what you should store.

```ts
const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("No such user");
console.log(user.id);

const users = await twitch.users.get({ login: ["twitchdev", "twitch"] });
```

### Does it support IRC chat?

No, and it does not need to. Chat goes through the API now: you read messages with the `channel.chat.message` event of EventSub, and you send them with [chat.send](/reference/api/chat/#send), the Send Chat Message endpoint. A bot needs the `user:read:chat` and `user:write:chat` scopes. [A chat bot](/recipes/chat-bot/) builds one from start to finish.

```ts
events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.message.text === "!ping") {
    await twitch.chat.send({ broadcaster_id: event.broadcaster_user_id, message: "pong" });
  }
});
```

### How do I use an endpoint newer than my version?

Update the package first, in case the endpoint was added since. If it was not, `twitch.request()` and `twitch.paginate()` send any path through the same pipeline as the built-in methods, with the token choice, the rate limit, the retries and the typed errors. Event types newer than the library work by writing their version after an `@`. See [Request options](/basics/request-options/) and [Typed events](/events/typed-events/).

```ts
const body = await twitch.request<{ data: { id: string }[] }>({
  path: "some/new/endpoint",
  query: { broadcaster_id },
  auth: "user",
  context: "broadcaster_id",
});

events.on("some.new.type@1", { broadcaster_user_id: channelId }, (event) => console.log(event));
```

### How do I mock it in tests?

Give the client a `fetch` of your own. Every request, to the API and to the OAuth server, goes through it, so a test never touches the network.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const paths: string[] = [];
const fakeFetch: typeof fetch = async (input) => {
  const url = new URL(String(input));
  paths.push(url.pathname);
  if (url.hostname === "id.twitch.tv") {
    return Response.json({ access_token: "test-token", expires_in: 3600, token_type: "bearer" });
  }
  return Response.json({ data: [{ id: "141981764", login: "twitchdev" }] });
};

const twitch = new Twitch({ clientId: "test", clientSecret: "test", fetch: fakeFetch, retries: 0 });

const user = await twitch.users.getByLogin("twitchdev");
console.log(user?.id, paths); // "141981764" [ "/oauth2/token", "/helix/users" ]
```

Three things help further. Registering a user with `userId` and `scopes` given makes no request, which is how you set up a fake user. Tools that replace the global `fetch` work as well, since the client calls the global one at request time when you pass none. And for tests against a server that behaves like Twitch, point `baseUrl` and `authUrl` at the mock server of the Twitch CLI, as described in [Runtimes](/basics/runtimes/).

### How do I stop everything cleanly?

Call `twitch.close()`. It stops the hourly validation timer and closes the WebSocket and conduit listeners created from the client, which are what keeps a process alive. To close one listener and keep the rest, call its own `close()`. A webhook listener holds nothing open beyond your HTTP server, and a program that only makes API calls ends by itself when its last call settles.

```ts
twitch.close();
```

## See also

- [Troubleshooting](/help/troubleshooting/): starting from an error message.
- [Quick start](/quick-start/): the first call in a few lines.
- [Tokens at a glance](/auth/overview/): which token and which flow you need.
- [Reference](/reference/overview/): every method, event type, scope and error.
