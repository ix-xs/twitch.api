---
title: "Troubleshooting"
description: "The problems people run into most, each starting from the message or the symptom you see, with its cause and its fix."
---

Each section below starts from something you can observe: an error message, a promise that rejects, a program that hangs. Find yours, read the cause, apply the fix. Messages are quoted as the library prints them, with `123` standing for a user ID.

## See what the client is doing

Most token problems become obvious once you can see which token each request used. Two listeners and one `catch` show everything.

```ts
import { Twitch, TwitchApiError, TwitchError } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
});

// `as` is "app", a user ID, or "raw" for a token passed by hand.
twitch.on("request", ({ method, url, as }) => console.log("->", method, url, "as", as));
twitch.on("response", ({ status, duration }) => console.log("<-", status, `${duration} ms`));

try {
  await twitch.users.me();
} catch (error) {
  if (error instanceof TwitchApiError) console.error(error.name, error.status, error.message, error.body);
  else if (error instanceof TwitchError) console.error(error.name, error.message, error.cause ?? "");
  else throw error;
}
```

## No user is registered

```text
TwitchAuthError: GET /users needs a user access token and no user is registered. Add one with twitch.auth.addUser().
```

The endpoint acts for a user and the client holds no user token.

- You never registered one. Get a token with the [authorization code flow](/auth/authorization-code/) or the [device code flow](/auth/device-code/), or pass an existing one to `twitch.auth.addUser()`.
- You registered one in an earlier run. Without a token store, users live in memory and are gone after a restart. Add a store: see [Storing tokens](/auth/storing-tokens/).
- The user was there and was dropped because their token died. Listen to `tokenInvalid` to know when that happens.
- You registered the user on another `Twitch` instance. Users belong to the client they were added to. Views created with `twitch.as()` share them, a second `new Twitch()` does not.

A close relative names a user:

```text
TwitchAuthError: No token is registered for user 123. Add it with twitch.auth.addUser().
```

Here `{ as }` or `twitch.as()` was given an ID the client does not know. Check that it is a user ID and not a login, and that it is a string.

Endpoints that accept both kinds of token do not fail for lack of a user: they use the app token. They do fail when the request has a field for the acting user and nobody can fill it:

```text
TwitchAuthError: POST /chat/messages needs "sender_id": the call is made with the app token, which belongs to no user. Set "sender_id", or register the acting user with twitch.auth.addUser().
TwitchAuthError: POST /chat/messages needs "sender_id": a token passed by hand does not say who it belongs to.
```

Register the user who acts, or write the field yourself. The second message is the same situation with the `token` request option: a raw token is sent as it is, and the client does not know its owner.

## Several users are registered

```text
TwitchAuthError: POST /polls needs a user access token and several users are registered. Choose one with { as: userId } or twitch.as(userId).
```

With one user, the client uses that user. With several, it needs to know who acts and the call does not say. Any of these settles it:

```ts
// For one call.
await twitch.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 }, { as: channelId });

// For a series of calls.
const asBroadcaster = twitch.as(channelId);
await asBroadcaster.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });

// By naming the acting user in the request itself.
await twitch.polls.create({ broadcaster_id: channelId, title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });
```

Three other messages have the same cause and the same fix:

```text
TwitchAuthError: POST /polls needs the token of user 123, which is not registered. Add it with twitch.auth.addUser() or choose a user with { as: userId }.
TwitchAuthError: POST /chat/messages does not say who is acting and several users are registered. Set "sender_id", or choose a user with { as: userId } or twitch.as(userId).
TwitchAuthError: GET /users can use a user token, but several users are registered. Choose one with { as: userId } or twitch.as(userId).
```

The first one means the request names a user the client does not have. The second one comes from endpoints that accept both kinds of token and have a field for the acting user, here `sender_id`. The third one only appears on a client without a client secret: with a secret, such a call uses the app token.

If what you wanted on one of those endpoints was the app token, say so with `{ as: "app" }`.

## A scope is missing

```text
TwitchScopeError: The token of user 123 is missing the "moderator:manage:banned_users" scope required by POST /moderation/bans.
```

The token exists and the user never allowed this. The request was not sent.

1. Add the scope to the list you pass to `authorizeUrl()` or `deviceFlow()`. `error.required` holds the scopes that would do, `error.granted` the ones the token has.
2. Send the user through the flow again. A token cannot gain a scope afterwards.

If the scope is in your list and the error persists, check two things. The message names the user whose token was chosen: when it is the bot and you expected the broadcaster, the problem is the choice of user, not the scope. And if you registered the token with an explicit `scopes` list, that list is trusted: leave it out and Twitch is asked for the real one.

## An app access token is needed

```text
TwitchAuthError: GET /users needs an app access token, which requires a clientSecret (or a registered user token).
```

The client has no client secret, and no single user whose token could be used instead.

- The secret is meant to be there. The usual culprit is an environment variable that is not set, which makes `clientSecret` `undefined`. Print `twitch.auth.hasSecret`, and check how the process is started (`node --env-file=.env app.js` loads a `.env` file).
- The client is public on purpose. Sign a user in before making calls.

Without the part in parentheses, the endpoint only takes an app token: webhook and conduit subscriptions, the `conduits` group, `users.authorization`. Those calls have to come from a server that holds the secret.

## A 401 says the ID must match the token

```text
TwitchApiError: The ID in broadcaster_id must match the user ID found in the request's OAuth token. (401 on POST /helix/polls)
```

The exact wording is Twitch's and varies by endpoint. It means the endpoint only works for the owner of the token, and the token that was sent belongs to someone else.

The typical case: one user is registered, a bot, and the call passes the `broadcaster_id` of a channel whose owner is not registered. The client uses the only user it has, and Twitch refuses. The same happens when `{ as }` points at the wrong user.

The fix is to register the token of the user the endpoint is about. The broadcaster has to authorize your application, with the scope the endpoint needs. Then the `broadcaster_id` in the request selects their token by itself.

The client did not refresh anything here, on purpose: it asked Twitch whether the token was valid, it was, so the `401` was handed to you unchanged.

## A WebSocket subscription is refused with 403

```text
TwitchEventSubError: Could not subscribe to channel.follow (version 2): subscription missing proper authorization (403 on POST /helix/eventsub/subscriptions)
```

You get it from `handle.ready` and from `onError`. Twitch checks the authorization of each event type when the subscription is created, and the token used does not have it. The client cannot check this before sending, so there is no `TwitchScopeError` for events.

- The token lacks the scope of the event type. Look the type up in [Event types](/reference/event-types/): `channel.follow` needs `moderator:read:followers`.
- The condition names the wrong user. For many types, the user in `user_id` or `moderator_user_id` has to be the owner of the token.
- The listener uses another user than you think. With several users registered, say whose token creates the subscriptions:

```ts
const events = twitch.eventsub.websocket({ user: botId });

const handle = events.on(
  "channel.follow",
  { broadcaster_user_id: channelId, moderator_user_id: botId },
  (event) => console.log(`${event.user_name} followed`),
);
await handle.ready; // rejects with the 403 if the bot lacks the scope
```

## Events never arrive on a webhook

Start by asking Twitch what state the subscriptions are in. Only `enabled` ones deliver.

```ts
for await (const subscription of twitch.eventsub.subscriptions()) {
  console.log(subscription.type, subscription.status, subscription.transport.callback);
}
```

| What you find | Cause | Fix |
| --- | --- | --- |
| No subscription at all | The listener was built with `subscribe: false` and nothing else created them, or `on()` was never reached | Create them, or remove `subscribe: false` |
| `webhook_callback_verification_pending` or `webhook_callback_verification_failed` | Twitch could not complete the challenge with your URL | See the next section |
| `notification_failures_exceeded` | Your endpoint failed too many deliveries and Twitch stopped | Fix the endpoint, delete the subscription and subscribe again |
| `enabled`, and still nothing | Deliveries arrive and are rejected, or the event did not happen | Read on |

When the subscription is enabled, look at what your endpoint answers to Twitch. The listener answers `200` to a challenge, `204` to a delivery it accepted, `400` when the EventSub headers are missing or the body is not an EventSub message, and `403` when the signature or the age of the message is wrong.

- **A `403` on every delivery** is a signature that does not match. Either the body was changed before it reached the listener (parsed and serialized again, for example), or the secret is not the one the subscription was created with. A subscription that already existed keeps its original secret: after changing the secret, delete the old subscriptions and let the listener create them again.
- **A `403` on a correct signature** is a clock problem. Messages whose timestamp is more than 10 minutes away from the server's clock are refused (the `maxAge` option).
- **A `500`** together with an `onError` report saying the body "was already parsed by a middleware" means a JSON body parser ran first. Mount `nodeHandler()` before it.
- **A `204` and no handler call** is a duplicate (a message ID that was already handled is acknowledged and skipped), or a delivery for a subscription this process has no handler for, such as one left over from an older deployment.
- **A handler that starts and never finishes** on a serverless platform was cut off when the response went out. Pass `waitUntil`, as shown in [Webhooks](/events/webhooks/).

A handler that throws does not fail silently either: the error goes to `onError`, or to `console.error` when you have no listener.

## ready rejects after 60 seconds

```text
TwitchEventSubError: Twitch did not verify the callback for stream.online within 60 seconds. Check that https://example.com/twitch/eventsub is public, uses HTTPS on port 443 and reaches this listener.
```

The subscription was created, Twitch sent (or tried to send) its verification challenge to the callback URL, and the listener never saw it. The subscription is kept: if the challenge arrives later, it is answered and events start flowing.

Test the route from outside your network:

```bash
curl -i -X POST https://example.com/twitch/eventsub
```

A `400` is good news: the request reached the listener, which refused it for its missing headers. Anything else is your answer.

- A timeout or a connection error: the URL is not reachable from the internet. `localhost` never is. For local development, use a tunnel such as [ngrok](https://ngrok.com) and pass its HTTPS URL as `callback`.
- A `404` or a page of your site: the path does not lead to `handle()` or `nodeHandler()`.
- A `403` or a challenge page from a CDN or a firewall: something in front of your server blocks the request.
- A certificate error: Twitch requires HTTPS with a valid certificate, on port 443.

Also check that the server is listening when you call `on()`, since the challenge follows within moments, and that a tunnel URL from a previous session is not still in your configuration.

## A 409 when subscribing

```text
TwitchApiError: subscription already exists (409 on POST /helix/eventsub/subscriptions)
```

`twitch.eventsub.subscribe()` was called for a type and a condition that are already subscribed with the same transport. Webhook and conduit subscriptions outlive your process, so this is what a second run of a setup script gets.

The webhook and conduit listeners treat this answer as success, which is why you only see it when subscribing by hand. Do the same:

```ts
import { TwitchApiError } from "@ix-xs/twitch.api";

try {
  await twitch.eventsub.subscribe({
    type: "stream.online",
    condition: { broadcaster_user_id: "141981764" },
    transport: { method: "webhook", callback, secret },
  });
} catch (error) {
  if (!(error instanceof TwitchApiError) || error.status !== 409) throw error;
  // Already there: nothing to do.
}
```

To start clean instead, list the subscriptions and delete the ones you no longer want: see [Managing subscriptions](/events/managing-subscriptions/).

## 429 errors

A `TwitchRateLimitError` reaches you in two situations.

- The client was built with `rateLimit: "throw"`. That is the behaviour you asked for: wait `error.retryAfter` milliseconds and send again, or go back to the default `"wait"`.
- The default mode ran out of retries. It takes a `429` on every attempt, four in a row with the default `retries: 3`. That happens when many processes share one token, each unaware of what the others spend, or when the limit is one of the endpoint's own (Twitch documents those on the page of each endpoint). Lower the concurrency, raise `retries`, or space the calls out.

Before reaching for retries, check that you are not making more requests than needed. Lookups by ID accept lists, and the client splits long ones for you: one `users.get({ id: ids })` instead of a loop of `getById` calls spread over time.

Event subscriptions have a limit of their own. A WebSocket or conduit listener treats a `429` on a subscription as temporary and tries again, up to 6 times on one session. After that, `handle.ready` rejects and `onError` receives a `TwitchEventSubError` that starts with `Could not subscribe to` and ends with the `429`. A `429` that does not go away means too many subscriptions, not too many requests. Compare `total_cost` with `max_total_cost`:

```ts
const page = await twitch.eventsub.subscriptions({}, { as: botId });
console.log(page.raw.total_cost, "of", page.raw.max_total_cost);
```

[Rate limits and retries](/basics/rate-limits-and-retries/) explains the buckets.

## The process does not exit

Something still has work scheduled. The hourly validation timer is not the cause: it never holds the process open. An open WebSocket is the usual cause.

| What holds the process | How to release it |
| --- | --- |
| A WebSocket or conduit listener: its connection, or its reconnection timer | `events.close()` for one listener, or `twitch.close()` for every listener created from the client |
| The HTTP server that receives webhooks | `server.close()` |
| A pending `flow.wait()` of the device code flow | Abort the signal you passed to `wait()` |
| A call waiting for a rate limit bucket or for a retry | It ends by itself, or abort its `signal` |

```ts
process.once("SIGINT", () => {
  // Closes the WebSocket and conduit listeners, and stops the validation timer.
  twitch.close();
});
```

A script that only makes API calls ends by itself when the last call settles.

## fetch failed behind a proxy

The error names the request that failed first.

```text
TwitchNetworkError: POST /oauth2/token could not reach Twitch: fetch failed
TwitchNetworkError: GET /users could not reach Twitch: fetch failed
```

The first is a request to the OAuth server (`id.twitch.tv`), usually the one for the app token, which is why a client that cannot reach Twitch tends to fail there before any API call. The second is a request to the API. In both, the request was retried first when repeating it is safe, and `error.cause` holds the real reason: a DNS failure, a refused connection, a certificate the runtime does not trust. A connection that hangs instead of failing ends as a `TwitchTimeoutError` after `timeout` milliseconds.

On a network where outgoing traffic must go through a proxy, the cause is that the `fetch` of Node.js does not read `HTTP_PROXY` and `HTTPS_PROXY` on its own. Node.js 24 does when it is started with `NODE_USE_ENV_PROXY=1`. On any version, you can give the client a `fetch` that uses the proxy, for example with the `undici` package:

```ts
import { Twitch } from "@ix-xs/twitch.api";

// In your code: import { ProxyAgent, fetch as proxyFetch } from "undici";
declare class ProxyAgent {
  constructor(url: string);
}
declare function proxyFetch(url: string, init?: object): Promise<unknown>;

const dispatcher = new ProxyAgent(process.env.HTTPS_PROXY!);

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  fetch: (input, init) => proxyFetch(String(input), { ...init, dispatcher }) as Promise<Response>,
});
```

The `fetch` option covers the API and the OAuth server. The WebSocket of an EventSub listener is a separate connection: give the listener a proxy-aware class with its `webSocket` option. If the proxy inspects TLS traffic, the runtime also has to trust its certificate, which on Node.js is what `NODE_EXTRA_CA_CERTS` is for.

## Types do not resolve

The package ships its own declarations, for ESM and for CommonJS. There is no `@types` package to install.

| What the compiler says | Cause | Fix |
| --- | --- | --- |
| The module has no default export, or `Twitch is not a constructor` at run time | The client is a named export | `import { Twitch } from "@ix-xs/twitch.api"`, or `const { Twitch } = require("@ix-xs/twitch.api")` |
| No declaration file is found, or nothing you import exists | Version 1 is still installed | Run `npm ls @ix-xs/twitch.api`, then install version 2. See [Coming from version 1](/help/migrating-from-v1/) |
| `Cannot find name 'Headers'`, `'Request'`, `'Response'` or `'AbortSignal'` (or, with `skipLibCheck`, those types quietly become `any`) | The declarations use web standard types and your project has none | Install `@types/node`, or add `"DOM"` to `lib` in `tsconfig.json` |
| A bundler cannot resolve `node:fs/promises` | `@ix-xs/twitch.api/node` is imported in code built for a browser or a Worker | Import it only in Node.js code. It holds `FileTokenStore` and nothing else |
| A string is not accepted as an event type by `on()` | The type is newer than your version of the library | Write its version after an `@`: `"some.new.type@1"` |
| A field does not exist on an event | The event has several shapes | Narrow it first: see [Typed events](/events/typed-events/) |

The package describes its entry points with `exports`, which TypeScript reads when `moduleResolution` is `"bundler"`, `"node16"` or `"nodenext"`. If imports resolve at run time and not in the editor, check that setting in `tsconfig.json`, and make sure the editor uses the TypeScript version of the workspace.

## See also

- [Errors](/reference/errors/): every error class and every message.
- [Acting as a user](/basics/acting-as-a-user/): how the token of a call is chosen.
- [Webhooks](/events/webhooks/): requirements of the callback URL and local testing.
- [Questions and answers](/help/faq/): shorter answers to broader questions.
