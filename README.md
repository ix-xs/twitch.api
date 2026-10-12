<div align="center">

# @ix-xs/twitch.api

**The complete Twitch API client for JavaScript and TypeScript.**

_Every Helix endpoint. Every EventSub event. Fully typed. Zero dependencies._

[![npm version](https://img.shields.io/npm/v/@ix-xs/twitch.api.svg?color=cb3837&logo=npm)](https://www.npmjs.com/package/@ix-xs/twitch.api)
[![npm downloads](https://img.shields.io/npm/dm/@ix-xs/twitch.api.svg?color=cb3837&logo=npm)](https://www.npmjs.com/package/@ix-xs/twitch.api)
[![CI](https://img.shields.io/github/actions/workflow/status/ix-xs/twitch.api/ci.yml?branch=main&label=CI&logo=github)](https://github.com/ix-xs/twitch.api/actions)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)
[![types](https://img.shields.io/badge/types-included-3178c6?logo=typescript&logoColor=white)](#)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/ix-xs/twitch.api/blob/main/package.json)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ix-xs/twitch.api/blob/main/LICENSE)

**[Documentation](https://ix-xs.github.io/twitch.api/)** ·
[Quick start](https://ix-xs.github.io/twitch.api/quick-start/) ·
[API reference](https://ix-xs.github.io/twitch.api/reference/overview/) ·
[Recipes](https://ix-xs.github.io/twitch.api/recipes/chat-bot/) ·
[Troubleshooting](https://ix-xs.github.io/twitch.api/help/troubleshooting/) ·
[GitHub](https://github.com/ix-xs/twitch.api)

</div>

```bash
npm install @ix-xs/twitch.api
```

Requires **Node 22+**. Also runs on Bun, Deno, Cloudflare Workers and in the browser.

---

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

const user = await twitch.users.getByLogin("twitchdev");

for await (const stream of twitch.streams.get({ language: "fr" })) {
  console.log(stream.user_name, stream.viewer_count);
}
```

No token to fetch, no header to set, no cursor to carry around, no `429` to catch. You call a method, you get typed data.

This page is the short tour. The [documentation site](https://ix-xs.github.io/twitch.api/) has the guides, complete programs to copy and the reference of every method and event type, in English and [in French](https://ix-xs.github.io/twitch.api/fr/).

## What you get

| | |
| --- | --- |
| **The whole API** | All 149 Helix endpoints in 30 groups (`twitch.chat`, `twitch.moderation`, `twitch.polls`...) and all 83 EventSub subscription types. |
| **Types everywhere** | Parameters, responses, events, scopes and subscription names autocomplete. Events with variants narrow on their discriminator. |
| **Tokens handled** | App token on demand, user tokens refreshed before they expire and after a `401`, validated hourly as Twitch requires, persisted in the store you choose. |
| **The right token, picked for you** | Each endpoint knows which token it needs. Register your users once: the client uses the broadcaster's token for broadcaster calls, the moderator's for moderation calls. |
| **Scopes checked up front** | A missing scope fails before the request leaves, with the name of the scope to ask for. |
| **Pagination that disappears** | `await` for one page, `for await` for every item, `.all()`, `.take(n)`, `.total()`. |
| **Rate limits respected** | The client follows Twitch's rate limit headers and waits instead of failing. Lists of more than 100 IDs are split and fetched in parallel. |
| **EventSub, three ways** | WebSocket, webhooks and conduits behind the same typed `on()`. Reconnects, resubscribes, signature checks and duplicate filtering are built in. |
| **Small and portable** | No dependency. About 23 kB gzipped. ESM and CommonJS. Only web standard APIs in the main entry. |

## Contents

- [Getting credentials](#getting-credentials)
- [Calling the API](#calling-the-api)
- [Acting as a user](#acting-as-a-user)
- [Getting user tokens](#getting-user-tokens)
- [Keeping tokens between restarts](#keeping-tokens-between-restarts)
- [Pagination](#pagination)
- [Events (EventSub)](#events-eventsub)
- [Errors](#errors)
- [Rate limits, retries and timeouts](#rate-limits-retries-and-timeouts)
- [Observability](#observability)
- [Endpoints newer than the library](#endpoints-newer-than-the-library)
- [API groups](#api-groups)
- [Coming from version 1](#coming-from-version-1)

## Getting credentials

Create an application in the [Twitch developer console](https://dev.twitch.tv/console/apps). You get a **client ID** and can generate a **client secret**.

- With both, the client can call every public endpoint right away (users, streams, games, clips, search...).
- Endpoints that act for someone (send a chat message, ban a user, create a poll) need a **user token**, granted by that user to your application. See [Getting user tokens](#getting-user-tokens).

Keep the client secret on a server. In a browser, a desktop app or a CLI, leave it out and use the [device code flow](#device-code-flow-clis-desktop-apps-no-server).

## Calling the API

Every endpoint is a method on a group. Parameters are one object, with the names Twitch uses.

```ts
const [channel] = await twitch.channels.get({ broadcaster_id: user.id });
const games = await twitch.games.get({ name: ["Fortnite", "Minecraft"] });
const clips = await twitch.clips.get({ broadcaster_id: user.id, first: 5 });
const results = await twitch.search.channels({ query: "speedrun", live_only: true }).take(20);
const followers = await twitch.channels.followers({ broadcaster_id: user.id }).total();
```

Lookups by ID take any number of IDs. Twitch caps most of them at 100 per request: the client splits the list, sends the requests in parallel and merges the answers.

```ts
const users = await twitch.users.get({ id: fiveHundredIds }); // 5 requests, one array
```

Single lookups made at the same moment are merged the other way around:

```ts
// One HTTP request, not three.
const [a, b, c] = await Promise.all([
  twitch.users.getById("141981764"),
  twitch.users.getById("12826"),
  twitch.users.getById("57781936"),
]);
```

## Acting as a user

Register a user token once. From then on, endpoints that need it find it.

```ts
const bot = await twitch.auth.addUser({ accessToken, refreshToken });

await twitch.chat.send({ broadcaster_id: channelId, message: "Hello chat" });
await twitch.moderation.ban({ broadcaster_id: channelId, user_id: spammerId, duration: 600, reason: "Spam" });
await twitch.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });
```

Notice what is missing: `sender_id`, `moderator_id` and `broadcaster_id` default to the user making the call. You can always pass them explicitly.

With several users registered, the client reads the request to decide whose token to use: a call with `broadcaster_id: "123"` on a broadcaster endpoint uses the token of user `123`, a moderation call uses the token of its `moderator_id`. When that is not enough, say who is acting:

```ts
const asBot = twitch.as(bot.userId);
await asBot.chat.send({ broadcaster_id: channelId, message: "Hello" });

// or for a single call
await twitch.chat.announce({ broadcaster_id: channelId, message: "Stream starts in 5" }, { as: bot.userId });
```

On an endpoint that accepts both kinds of token, `{ as: "app" }` asks for the app token even when the acting user is registered.

If the token lacks a scope, the call fails before any request is sent:

```
TwitchScopeError: The token of user 123 is missing the "moderator:manage:banned_users" scope required by POST /moderation/bans.
```

## Getting user tokens

### Authorization code flow (web servers)

```ts
// 1. Send the user to Twitch. Scope names autocomplete.
const url = twitch.auth.authorizeUrl({
  redirectUri: "https://example.com/auth/callback",
  scopes: ["user:read:chat", "user:write:chat", "moderator:manage:banned_users"],
  state, // a random value you check in step 2
});

// 2. Twitch redirects back with ?code=...&state=...
const user = await twitch.auth.exchangeCode(code, "https://example.com/auth/callback");
console.log(user.userId, user.login, user.scopes);
```

The user is registered and their token is refreshed for as long as the refresh token lives.

### Device code flow (CLIs, desktop apps, no server)

Works without a client secret.

```ts
const twitch = new Twitch({ clientId });

const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat", "user:write:chat"] });
console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
const user = await flow.wait();
```

### Other helpers

```ts
await twitch.auth.validate(accessToken); // who owns it, which scopes, when it expires
await twitch.auth.refresh(userId);       // renew now
await twitch.auth.revoke(accessToken);   // invalidate
await twitch.auth.removeUser(userId, { revoke: true });
```

## Keeping tokens between restarts

By default tokens live in memory. Give the client a store and it restores users on first use and saves every refreshed token.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId,
  clientSecret,
  tokens: new FileTokenStore("./tokens.json"), // add this file to .gitignore
});
```

A store is four methods, so a database or a KV namespace takes a few lines:

```ts
import type { TokenStore } from "@ix-xs/twitch.api";

const store: TokenStore = {
  get: (userId) => db.tokens.find(userId),
  set: (userId, token) => db.tokens.upsert(userId, token),
  delete: (userId) => db.tokens.remove(userId),
  list: () => db.tokens.ids(),
};
```

Prefer to handle it yourself? Listen instead:

```ts
twitch.on("tokenRefresh", (token) => save(token));
twitch.on("tokenInvalid", (userId) => askToLogInAgain(userId));
```

## Pagination

Every list endpoint returns a paginator. Nothing is fetched until you use it.

```ts
// One page
const page = await twitch.streams.get({ game_id: "509658", first: 20 });
page.data;     // the items
page.cursor;   // cursor of the next page
await page.next();

// Every item, fetched page after page at the largest page size
for await (const follower of twitch.channels.followers({ broadcaster_id })) {
  console.log(follower.user_name);
}

// Into an array
const all = await twitch.moderation.bans().all();
const top = await twitch.streams.get().take(250);
const first = await twitch.clips.get({ broadcaster_id }).first();

// Totals, with the cheapest possible request
const subscribers = await twitch.subscriptions.get().total();
```

## Events (EventSub)

The three transports share one interface. The subscription name autocompletes, and the condition and the event are typed from it.

### WebSocket

Nothing to host. Uses a user token.

```ts
const events = twitch.eventsub.websocket();

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: bot.userId }, async (event) => {
  if (event.message.text === "!ping") {
    await twitch.chat.send({
      broadcaster_id: event.broadcaster_user_id,
      message: "pong",
      reply_parent_message_id: event.message_id,
    });
  }
});

events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: bot.userId }, (event) => {
  console.log(`${event.user_name} followed`);
});

events.onError(console.error);
```

The listener connects when you add the first handler. It answers Twitch's reconnect requests without dropping an event, detects dead connections from the keepalive, reconnects with backoff and subscribes again. Past 300 subscriptions it opens another connection, up to the 3 Twitch allows.

### Webhooks

For servers reachable from the internet. Uses the app token, so no user has to be online, and subscriptions survive restarts.

```ts
const hooks = twitch.eventsub.webhook({
  callback: "https://example.com/twitch/eventsub",
  secret: process.env.EVENTSUB_SECRET,
});

hooks.on("stream.online", { broadcaster_user_id: "141981764" }, (event) => {
  console.log(`${event.broadcaster_user_name} is live`);
});

// Bun, Deno, Hono, Next.js route handlers
export default { fetch: (request: Request) => hooks.handle(request) };

// Node.js
import { createServer } from "node:http";
createServer(hooks.nodeHandler()).listen(3000);

// Express: mount it before express.json()
app.post("/twitch/eventsub", hooks.nodeHandler());
```

Every delivery is checked: HMAC signature (constant time, Web Crypto), age of the message, and duplicates. The verification challenge is answered for you.

On Cloudflare Workers and other platforms that stop work once the response is sent, two things change. Create the subscriptions from a deploy script with `twitch.eventsub.subscribe()` and build the listener with `subscribe: false`, because a Worker cannot make requests while its module loads. And hand over `waitUntil` so that asynchronous handlers are allowed to finish:

```ts
const hooks = twitch.eventsub.webhook({ callback, secret, subscribe: false });
hooks.on("stream.online", { broadcaster_user_id: "141981764" }, handler);

export default {
  fetch: (request, env, ctx) => hooks.handle(request, { waitUntil: (work) => ctx.waitUntil(work) }),
};
```

### Conduits

One WebSocket per process, subscriptions created with the app token: follow thousands of channels without a connection per user. Run one process per shard to scale out.

```ts
const events = twitch.eventsub.conduit(); // finds your conduit or creates one

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
  console.log(event.chatter_user_name, event.message.text);
});
```

### Typed variants

Events that come in several shapes narrow on their discriminator:

```ts
events.on("channel.chat.notification", { broadcaster_user_id: channelId, user_id: bot.userId }, (event) => {
  if (event.notice_type === "resub") {
    console.log(event.resub.cumulative_months); // typed, not null
  } else if (event.notice_type === "raid") {
    console.log(event.raid.viewer_count);
  }
});

events.on("channel.moderate", { broadcaster_user_id: channelId, moderator_user_id: bot.userId }, (event) => {
  if (event.action === "timeout") console.log(event.timeout.user_name, event.timeout.expires_at);
});
```

A type that exists in several versions is available as `"channel.moderate"` (newest) and `"channel.moderate@1"`. A type Twitch released after your version of the library works the same way: `events.on("some.new.type@1", condition, handler)`.

### Managing subscriptions

```ts
const handle = events.on("stream.online", { broadcaster_user_id: channelId }, handler);
await handle.ready; // Twitch accepted the subscription
await handle.stop(); // remove it

events.onRevocation((subscription) => console.log(subscription.type, subscription.status));

const page = await twitch.eventsub.subscriptions({ status: "enabled" });
console.log(page.raw.total_cost, "/", page.raw.max_total_cost);
```

## Errors

Everything the library throws extends `TwitchError`. A call you abort rejects with the reason of your signal.

| Class | When |
| --- | --- |
| `TwitchApiError` | Twitch answered with an error. Carries `status`, `error`, `message`, `method`, `url`, `body`, `headers`. |
| `TwitchRateLimitError` | A `429` that was not retried. Carries `resetAt` and `retryAfter`. |
| `TwitchAuthError` | No usable token: no user registered, refresh token rejected, missing client secret. |
| `TwitchScopeError` | The token lacks a scope. Carries `required` and `granted`. Thrown before the request. |
| `TwitchTimeoutError` | The request took longer than `timeout`. |
| `TwitchNetworkError` | The request never reached Twitch, or the connection broke. |
| `TwitchEventSubError` | A subscription was refused or a connection could not be established. |

```ts
import { TwitchApiError, TwitchScopeError } from "@ix-xs/twitch.api";

try {
  await twitch.moderation.ban({ broadcaster_id, user_id });
} catch (error) {
  if (error instanceof TwitchScopeError) console.log("Ask the user for", error.required);
  else if (error instanceof TwitchApiError && error.status === 400) console.log(error.message);
  else throw error;
}
```

Lookups that can legitimately find nothing return `null` instead of throwing: `users.getById`, `subscriptions.check`, `teams.get`, `charity.campaign`...

## Rate limits, retries and timeouts

```ts
const twitch = new Twitch({
  clientId,
  clientSecret,
  timeout: 15_000,   // per attempt, default 15 s
  retries: 3,        // default 3
  rateLimit: "wait", // or "throw"
});
```

- The client tracks each bucket (the app token and every user have their own) from the `Ratelimit-*` headers and holds requests back when a bucket is empty.
- A `429` is retried when the bucket refills. Network failures and `5xx` are retried with backoff for `GET`, `PUT` and `DELETE`. `POST` and `PATCH` are never replayed after a failure Twitch may have processed.
- A `401` is checked first: if the token really is dead it is renewed and the call retried once, and if the token is fine (Twitch also answers `401` when the token is not allowed to do something) the error is raised as is.
- Every method takes request options as its last argument: `{ as, token, signal, timeout, retries }`.

```ts
const controller = new AbortController();
const streams = await twitch.streams.get({}, { signal: controller.signal, timeout: 5000 });
```

## Observability

```ts
twitch.on("request", ({ method, url, attempt, as }) => {});
twitch.on("response", ({ method, url, status, duration, remaining }) => {});
twitch.on("rateLimit", ({ bucket, waitMs }) => {});

twitch.rateLimitOf();       // { limit, remaining, resetAt } of the app token
twitch.rateLimitOf(userId); // of a user
```

## Endpoints newer than the library

Twitch ships endpoints regularly. Until the library catches up, `request` and `paginate` give you the same pipeline (token choice, rate limit, retries, typed errors) for any path:

```ts
const body = await twitch.request<{ data: Thing[] }>({
  method: "POST",
  path: "some/new/endpoint",
  query: { broadcaster_id },
  body: { enabled: true },
  auth: "user",
  scopes: ["channel:manage:broadcast"],
  context: "broadcaster_id",
});

const things = await twitch.paginate<Thing>({ path: "some/new/list" }).all();
```

Custom `fetch`, base URLs and WebSocket class are options too, which makes the [Twitch CLI](https://dev.twitch.tv/docs/cli/) mock server a drop-in backend for tests:

```ts
const twitch = new Twitch({ clientId, clientSecret, baseUrl: "http://localhost:8080/mock", authUrl: "http://localhost:8080/auth" });
```

## API groups

| Group | Covers |
| --- | --- |
| `twitch.ads` | Commercials, ad schedule, snooze |
| `twitch.analytics` | Extension and game reports |
| `twitch.bits` | Leaderboard, Cheermotes, custom Power-ups, extension transactions |
| `twitch.channels` | Channel information, editors, follows, followers |
| `twitch.channelPoints` | Custom rewards and redemptions |
| `twitch.charity` | Campaign and donations |
| `twitch.chat` | Messages, announcements, shoutouts, chatters, emotes, badges, settings, colors, pins, shared chat |
| `twitch.clips` | Create, look up, download |
| `twitch.conduits` | Conduits and shards |
| `twitch.contentLabels` | Content classification labels |
| `twitch.entitlements` | Drops entitlements |
| `twitch.eventsub` | Subscriptions, and the WebSocket, webhook and conduit listeners |
| `twitch.extensions` | Configuration, secrets, PubSub, chat, Bits products |
| `twitch.games` | Games and top games |
| `twitch.goals` | Creator goals |
| `twitch.guestStar` | Guest Star sessions, invites and slots (beta) |
| `twitch.hypeTrain` | Hype Train status |
| `twitch.moderation` | Bans, timeouts, warnings, AutoMod, blocked terms, moderators, VIPs, Shield Mode, unban requests, suspicious users |
| `twitch.polls` | Polls |
| `twitch.predictions` | Predictions |
| `twitch.raids` | Start and cancel raids |
| `twitch.schedule` | Stream schedule and iCalendar |
| `twitch.search` | Categories and channels |
| `twitch.streams` | Live streams, followed streams, stream key, markers |
| `twitch.subscriptions` | Subscribers and subscription checks |
| `twitch.teams` | Teams |
| `twitch.users` | Users, block list, extensions, authorizations |
| `twitch.videos` | Videos |
| `twitch.whispers` | Whispers |
| `twitch.auth` | Tokens and OAuth flows |

Every method has an example and a link to the official reference in its documentation: hover it in your editor. The [reference](https://ix-xs.github.io/twitch.api/reference/overview/) lists them all, with their parameters, what they return and the token they need, and the [event types](https://ix-xs.github.io/twitch.api/reference/event-types/) page does the same for EventSub.

## Coming from version 1

Version 2 is a rewrite. The [migration page](https://ix-xs.github.io/twitch.api/help/migrating-from-v1/) has the details and a before and after example. The main differences:

- The client is a named export and takes `clientId` / `clientSecret`: `new Twitch({ clientId, clientSecret })`.
- No `initialize()`. Tokens are fetched when needed, and nothing is written to `node_modules` anymore.
- Methods throw typed errors instead of returning `{ ok, result }`.
- Methods take IDs like the Twitch API does. Resolve a login with `twitch.users.getByLogin(login)`.

| Version 1 | Version 2 |
| --- | --- |
| `client.getUsers(["twitchdev"])` | `twitch.users.get({ login: ["twitchdev"] })` |
| `client.getStreams({ users_names })` | `twitch.streams.get({ user_login })` |
| `client.getStreams({ games_names })` | `twitch.games.get({ name })` then `twitch.streams.get({ game_id })` |
| `client.getCheermotes()` | `twitch.bits.cheermotes()` |
| `client.getChatEmotes()` | `twitch.chat.globalEmotes()` |
| `client.getChatEmotes(login)` | `twitch.chat.channelEmotes({ broadcaster_id })` |
| `client.getChatBadges()` | `twitch.chat.globalBadges()` |
| `client.getChatBadges(login)` | `twitch.chat.channelBadges({ broadcaster_id })` |
| `client.getChatSettings(login)` | `twitch.chat.settings({ broadcaster_id })` |
| `client.getUsersChatColor(logins)` | `twitch.chat.colors({ user_id })` |
| `client.getClips(login)` | `twitch.clips.get({ broadcaster_id })` |
| `client.getTopGames()` | `twitch.games.top()` |
| `client.getGames(names)` | `twitch.games.get({ name })` |
| `client.getVideos(login)` | `twitch.videos.get({ user_id })` |

## Links

- [Documentation](https://ix-xs.github.io/twitch.api/), also [in French](https://ix-xs.github.io/twitch.api/fr/)
- [Source code and issues](https://github.com/ix-xs/twitch.api) on GitHub
- [Changelog](https://github.com/ix-xs/twitch.api/blob/main/CHANGELOG.md)
- [Package](https://www.npmjs.com/package/@ix-xs/twitch.api) on npm

## License

[MIT](https://github.com/ix-xs/twitch.api/blob/main/LICENSE)
