---
title: "Observability"
description: "The client emits an event for every HTTP attempt, every rate limit wait and every token renewal. Use them to log, to measure and to keep tokens in your own storage."
sidebar:
  order: 7
---

The client tells you what it is doing through five events. They cost next to nothing when nobody listens, and they are the place to plug a logger, a metrics counter, or your own token storage.

## A request logger

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

twitch.on("response", ({ method, url, status, duration, attempt, as, remaining }) => {
  const { pathname } = new URL(url);
  console.log(`${method} ${pathname} ${status} in ${duration} ms (as ${as}, attempt ${attempt}, ${remaining ?? "?"} points left)`);
});

await twitch.users.getByLogin("twitchdev");
// GET /helix/users 200 in 87 ms (as app, attempt 1, 799 points left)
```

## Listen and stop listening

`twitch.on(event, listener)` adds a listener and returns a function that removes it. `twitch.once` does the same for a listener that runs a single time. `twitch.off(event, listener)` removes a listener by reference.

```ts
const stop = twitch.on("request", ({ method, url }) => console.log("->", method, url));
// later
stop();

twitch.once("tokenRefresh", (token) => console.log("First renewal:", token.userId));

const onWait = ({ waitMs }: { waitMs: number }) => console.log(`Waiting ${waitMs} ms`);
twitch.on("rateLimit", onWait);
twitch.off("rateLimit", onWait);
```

Event names and payloads are typed: the editor completes the names and knows the fields of each payload.

A view created with `twitch.as(userId)` shares the listeners of its client. Listening on either one reports the calls of both.

Listeners run synchronously, in the order they were added. What a listener returns is ignored, so an `async` listener must catch its own errors. A listener that throws does not break the call that emitted the event: the error is rethrown on its own, as an uncaught exception.

## The five events

| Event | Arguments | Emitted |
| --- | --- | --- |
| `request` | `RequestEvent` | Right before each HTTP attempt to the Twitch API, retries and following pages included. |
| `response` | `ResponseEvent` | When an answer comes back, whatever its status. |
| `rateLimit` | `RateLimitEvent` | When a request is held back because a bucket is empty, or waits after a `429`. |
| `tokenRefresh` | `UserToken` | After a user token was renewed and saved. |
| `tokenInvalid` | `userId: string`, `error: Error` | After a dead user token was dropped. |

Fields of `RequestEvent`:

| Field | Type | Content |
| --- | --- | --- |
| `method` | `string` | HTTP method. |
| `url` | `string` | Full URL, with the query string. Tokens travel in headers, never in the URL. |
| `attempt` | `number` | `1` for the first try, then `2`, `3` and so on. |
| `as` | `string` | Whose token is used: `"app"`, a user ID, or `"raw"` for a token passed with `{ token }`. |

`ResponseEvent` has the same four fields, plus:

| Field | Type | Content |
| --- | --- | --- |
| `status` | `number` | HTTP status of the answer. |
| `duration` | `number` | Milliseconds spent on this attempt. |
| `remaining` | `number \| undefined` | Points left in the rate limit bucket, when Twitch reported it. |

Fields of `RateLimitEvent`:

| Field | Type | Content |
| --- | --- | --- |
| `bucket` | `string` | `"app"`, `"user:<id>"`, or `"raw:<fingerprint>"` for a token passed with `{ token }`. |
| `waitMs` | `number` | How long the request waits, in milliseconds. |
| `resetAt` | `number` | Epoch milliseconds at which the wait ends. |

Two things to keep in mind when you read these events:

- `request` and `response` cover calls to the Twitch API only. Requests to the OAuth server (getting the app token, refreshing or validating a user token) do not emit them.
- An attempt that fails without an answer, on a network failure or a timeout, emits `request` and no `response`. A following `request` with a higher `attempt` is the retry.

## Spot retries and slow calls

```ts
twitch.on("request", ({ method, url, attempt }) => {
  if (attempt > 1) console.warn(`Retry ${attempt - 1} of ${method} ${new URL(url).pathname}`);
});

twitch.on("response", ({ method, url, status, duration }) => {
  if (status >= 500) console.error(`Twitch answered ${status} to ${method} ${new URL(url).pathname}`);
  if (duration > 2000) console.warn(`${method} ${new URL(url).pathname} took ${duration} ms`);
});
```

## Count rate limit waits

A `rateLimit` event now and then is normal. Many of them on the same bucket mean one token is doing too much, and that the work should be spread over time or over users.

```ts
const waits = new Map<string, { count: number; totalMs: number }>();

twitch.on("rateLimit", ({ bucket, waitMs }) => {
  const entry = waits.get(bucket) ?? { count: 0, totalMs: 0 };
  entry.count += 1;
  entry.totalMs += waitMs;
  waits.set(bucket, entry);
});

setInterval(() => {
  for (const [bucket, { count, totalMs }] of waits) {
    console.log(`${bucket}: ${count} waits, ${totalMs} ms in the last minute`);
  }
  waits.clear();
}, 60_000);
```

With `rateLimit: "throw"` the client never waits, so this event is not emitted. For the current state of a bucket, use `twitch.rateLimitOf()`, described in [Rate limits and retries](/basics/rate-limits-and-retries/).

## Save renewed tokens yourself

If you gave the client a token store, renewed tokens are already saved there and you can skip this section. If you keep tokens in your own storage, `tokenRefresh` is when to update it: a renewed token replaces the previous access token, and usually the refresh token too.

```ts
import type { UserToken } from "@ix-xs/twitch.api";

declare const db: {
  saveToken(userId: string, token: UserToken): Promise<void>;
  loadTokens(): Promise<UserToken[]>;
};

twitch.on("tokenRefresh", (token) => {
  db.saveToken(token.userId, token).catch((error) => console.error("Could not save the token", error));
});

// At startup, register what was saved.
for (const token of await db.loadTokens()) {
  await twitch.auth.addUser(token);
}
```

A `UserToken` is plain JSON: `userId`, `login`, `accessToken`, `refreshToken`, `scopes`, `expiresAt`. The event fires for every renewal: before the token expires, after a `401`, during the hourly validation and when you call `twitch.auth.refresh()`. It does not fire when a user is first registered, so save the token returned by `addUser`, `exchangeCode` or the device flow as well.

A store does the same with less code and also covers that first save. See [Storing tokens](/auth/storing-tokens/).

:::caution
Tokens are credentials. Do not print them in logs, and protect the place where you save them.
:::

## React to a dead token

`tokenInvalid` fires when a user token cannot be used anymore: Twitch rejected its refresh token, or the access token died and there was no refresh token. This happens when the user disconnects your application in their Twitch settings or changes their password. The user has already been removed from the client and from the store when the event fires.

```ts
declare function markSignedOut(userId: string): Promise<void>;

twitch.on("tokenInvalid", (userId, error) => {
  console.warn(`User ${userId} has to sign in again: ${error.message}`);
  markSignedOut(userId).catch(console.error);
});
```

From then on, calls made as that user fail with a `TwitchAuthError` until they authorize your application again. [Managing users](/auth/managing-users/) covers the life of a registered user.

## Close the client

`twitch.close()` shuts down what the client keeps running in the background:

- The EventSub WebSocket and conduit listeners created from the client. Each one is closed as if you had called its own `close()`: its connections end and its subscriptions are forgotten.
- The timer that validates user tokens every hour. It only exists while at least one user token is loaded, and not at all with `validateTokens: false`.

```ts
twitch.close();
```

Call it when your program is done. An open WebSocket keeps a process alive, so a script that listened to events does not exit without it. The timer alone never holds a process open on Node.js, Bun and Deno, so a script that only made API calls exits on its own.

The client stays usable afterwards. The timer starts again the next time a user token is registered or renewed, and you can create new listeners. Webhook listeners hold no connection, so there is nothing to close for them. A view created with `twitch.as()` shares all of this with its client: closing either one closes both.

## See also

- [Rate limits and retries](/basics/rate-limits-and-retries/): what the `rateLimit` event reports on.
- [Errors](/basics/errors/): what happens on a `401`, which is when tokens are renewed or dropped.
- [Storing tokens](/auth/storing-tokens/): the built-in alternative to `tokenRefresh`.
- [Client options](/reference/client-options/): `on`, `once`, `off`, `close` and the other members of the client.
