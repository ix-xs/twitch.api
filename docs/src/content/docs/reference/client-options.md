---
title: "Client options"
description: "Every option of new Twitch(), every member of the client, and the request options accepted by every method, with types and defaults."
---

This page lists what you can pass to `new Twitch()`, what the resulting object offers besides the API groups, and the options every method accepts as its last argument. The guides explain when to use each of them. This is the place to check a name, a type or a default.

## A client with every common option

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  tokens: new FileTokenStore("./tokens.json"),
  timeout: 15_000,
  retries: 3,
  rateLimit: "wait",
  validateTokens: true,
  userAgent: "my-bot/1.0",
});
```

Only `clientId` is mandatory. The values shown for `timeout`, `retries`, `rateLimit` and `validateTokens` are the defaults.

## Options of the constructor

The type is `TwitchOptions`.

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `clientId` | `string` | Required | Client ID of your application. Sent with every request. |
| `clientSecret` | `string` | None | Client secret of your application. Needed to request the app token and to exchange an authorization code. Leave it out in a browser, a desktop app or a CLI. |
| `tokens` | `TokenStore` | Memory only | Where user tokens are kept. Users are restored from it on first use and every new or refreshed token is written back. |
| `timeout` | `number` | `15000` | Milliseconds before one attempt of a request is abandoned, reading the body included. It applies to the API and to the OAuth server. |
| `retries` | `number` | `3` | How many times a request is sent again after a network failure, a `5xx` or a `429`. It also covers the app token request and token validations. `0` disables retries. |
| `rateLimit` | `"wait" \| "throw"` | `"wait"` | What to do when a rate limit bucket is empty. `"wait"` holds the request until the bucket refills. `"throw"` fails at once with a `TwitchRateLimitError`. |
| `validateTokens` | `boolean` | `true` | Validates every user token once an hour, as Twitch requires. The timer never keeps the process alive. |
| `userAgent` | `string` | None | Sent as the `User-Agent` header of API requests, on runtimes that let a program set it. |
| `fetch` | `typeof fetch` | The global `fetch` | The function used for every HTTP request, to the API and to the OAuth server. Use it for a proxy, for instrumentation or for tests. |
| `baseUrl` | `string` | `https://api.twitch.tv/helix` | Base URL of the API. Trailing slashes are removed. |
| `authUrl` | `string` | `https://id.twitch.tv/oauth2` | Base URL of the OAuth server, for token requests and for the address built by `authorizeUrl()`. |

The constructor makes no request. It throws a `TwitchError` when `clientId` is missing or empty, and when there is neither a `fetch` option nor a global `fetch`.

Where each option is explained:

- `clientSecret`: [Getting credentials](/credentials/) and [Tokens at a glance](/auth/overview/).
- `tokens`: [Storing tokens](/auth/storing-tokens/).
- `timeout`, `retries`, `rateLimit`: [Rate limits and retries](/basics/rate-limits-and-retries/).
- `validateTokens`: [Managing users](/auth/managing-users/).
- `fetch`, `baseUrl`, `authUrl`: [Runtimes](/basics/runtimes/).

## Members of the client

### API groups

The client has one property per group of endpoints, 30 in all: `twitch.users`, `twitch.chat`, `twitch.moderation`, `twitch.eventsub` and so on. A group is created the first time you read it. The [Reference](/reference/overview/) lists them with their methods.

### Everything else

| Member | Type | What it does |
| --- | --- | --- |
| `auth` | `Auth` | Tokens and OAuth flows: `addUser`, `removeUser`, `authorizeUrl`, `exchangeCode`, `deviceFlow`, `refresh`, `validate`, `revoke`, `restore`, `validateAll`, `appToken`, and the `users`, `getUser`, `hasUser`, `hasSecret` lookups. |
| `as(userId)` | `(userId: string) => Twitch` | Returns a view of the client that makes every call as that user, or with the app token for `as("app")`. |
| `userId` | `string \| undefined` | On a view returned by `as()`, the ID it acts as (`"app"` for the app token view). `undefined` on the client itself. |
| `request(endpoint)` | `<T>(endpoint: Endpoint) => Promise<T>` | Sends any API request through the same pipeline as the built-in methods and resolves with the parsed body. |
| `paginate(endpoint, config?)` | `<T, R>(endpoint: Endpoint, config?: PageConfig<T, R>) => Paginator<T, R>` | The same for an endpoint that returns pages. |
| `on(event, listener)` | Returns `() => void` | Listens to what the client does. The function it returns removes the listener. |
| `once(event, listener)` | Returns `() => void` | The same for a listener that runs one time. |
| `off(event, listener)` | Returns `void` | Removes a listener added with `on`. |
| `rateLimitOf(userId?)` | Returns `{ limit, remaining, resetAt } \| undefined` | What is known about a rate limit bucket. |
| `close()` | Returns `void` | Stops the hourly validation timer and closes the WebSocket and conduit listeners created from the client. |

### Views

`twitch.as(userId)` does not create a second client. The view shares the tokens, the rate limit state and the event listeners of the client it comes from, and only differs in who makes the calls.

```ts
const asBot = twitch.as(botId);

await asBot.chat.send({ broadcaster_id: channelId, message: "Hello" });
console.log(asBot.userId === botId); // true
```

A `{ as }` request option on a single call wins over the view. Endpoints that only take the app token keep using it inside a view.

`twitch.as("app")` is the opposite view: it uses the app token on every endpoint that accepts both kinds, even when a user is registered. On an endpoint that only takes a user token it throws a `TwitchAuthError`.

```ts
// Read public data on the application's rate limit bucket, not on a user's.
const asApp = twitch.as("app");
const games = await asApp.games.top().take(10);
```

The rules are in [Acting as a user](/basics/acting-as-a-user/).

### Custom requests

`request` and `paginate` take an `Endpoint`: `path`, plus `method`, `query`, `body`, `auth`, `prefer`, `scopes`, `context`, `options` and `response` when you need them. [Request options](/basics/request-options/) describes every field, and those of `PageConfig`.

```ts
const body = await twitch.request<{ data: { id: string }[] }>({
  path: "users",
  query: { login: "twitchdev" },
});
```

### Events

`on`, `once` and `off` accept five event names. The payloads are described in [Observability](/basics/observability/).

| Event | Listener arguments | Emitted when |
| --- | --- | --- |
| `request` | `RequestEvent` | An HTTP attempt is about to be sent to the API. |
| `response` | `ResponseEvent` | An HTTP response came back from the API. |
| `rateLimit` | `RateLimitEvent` | A request waits for a rate limit bucket to refill. |
| `tokenRefresh` | `UserToken` | A user token was renewed. |
| `tokenInvalid` | `userId: string`, `error: Error` | A user token is dead and the user was dropped. |

### Rate limit state

`rateLimitOf()` reads the bucket of the app token, `rateLimitOf(userId)` the bucket of a user. It returns a copy with three numbers: `limit` (points per window), `remaining` (points left) and `resetAt` (epoch milliseconds at which the bucket is full again). It returns `undefined` until Twitch has reported that bucket. Twitch refills a bucket as time passes, so with little traffic `resetAt` is always close: once it has passed, the bucket is reported full.

```ts
const state = twitch.rateLimitOf();
if (state) console.log(`${state.remaining}/${state.limit} until ${new Date(state.resetAt).toISOString()}`);
```

### Closing

`close()` stops the timer of the hourly validation and closes every WebSocket and conduit listener created from the client with `twitch.eventsub.websocket()` or `twitch.eventsub.conduit()`. The timer does not hold the process open, an open WebSocket does: call `close()` when you are done and the process can end. A webhook listener has nothing to close, your HTTP server is yours to stop. Calling `close()` on a view acts on the client the view comes from, since they share everything.

## Request options

Every method of every group takes a `RequestOptions` object as its last argument. All fields are optional.

| Option | Type | Effect |
| --- | --- | --- |
| `as` | `"app"` or a user ID | Makes the call as this user, who must be registered. Overrides the automatic choice of token and the user of a view. `"app"` uses the app token on an endpoint that accepts both kinds, and throws a `TwitchAuthError` on an endpoint that only takes a user token. |
| `token` | `string` | Uses this access token as it is: no refresh, no scope check, no choice of user. Wins over `as`. Counted in a rate limit bucket of its own. |
| `signal` | `AbortSignal` | Cancels the call, its retries and its rate limit waits included. The call rejects with the reason of the signal. |
| `timeout` | `number` | Milliseconds before one attempt is abandoned. Overrides the client setting for this call. Token requests made on the way keep the client setting. |
| `retries` | `number` | Number of retries after the first attempt. Overrides the client setting for this call. |

```ts
// A method with parameters: options come second.
const page = await twitch.streams.get({ language: "fr" }, { timeout: 5000, retries: 0 });

// A method without parameters: options are the only argument.
const me = await twitch.users.me({ as: userId });

// A paginated method: the options apply to every page it fetches.
const controller = new AbortController();
const followers = twitch.channels.followers({ broadcaster_id }, { signal: controller.signal });
```

Passing options to `users.getById` or `users.getByLogin` sends that lookup on its own, instead of merging it with the other lookups of the same moment.

With `twitch.request()` and `twitch.paginate()`, the same object goes in the `options` field of the endpoint.

## See also

- [Request options](/basics/request-options/): the options in practice, and the fields of `Endpoint` and `PageConfig`.
- [Observability](/basics/observability/): the events and their payloads.
- [Errors](/reference/errors/): what the client throws.
- [Reference](/reference/overview/): the API groups and their methods.
