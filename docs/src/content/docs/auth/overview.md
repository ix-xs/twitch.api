---
title: "Tokens at a glance"
description: "The two kinds of Twitch tokens, the flow that fits your application, and what the library does with tokens so that you do not have to."
sidebar:
  order: 1
---

Every request to the Twitch API carries an access token. There are two kinds: an app access token, which identifies your application, and a user access token, which a user grants to your application so that it can act for them. This page tells you which one you need, how to get it, and what the client does with it afterwards.

## A first example

With a client ID and a client secret, the client requests the app token by itself. Registering a user token unlocks the endpoints that act for that user.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// Public data: the app token is requested on this first call.
const user = await twitch.users.getByLogin("twitchdev");

// Acting for someone: register their token once.
const broadcaster = await twitch.auth.addUser({ accessToken, refreshToken });
await twitch.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });
```

## App tokens and user tokens

| | App access token | User access token |
| --- | --- | --- |
| Identifies | Your application | One user who authorized your application |
| Obtained with | The client ID and the client secret | A flow in which the user approves a list of scopes |
| Good for | Public data (`users.get`, `streams.get`, `games.top`, `search.channels`), webhook and conduit subscriptions, the few endpoints reserved to applications (`conduits.list`, `users.authorization`) | Everything that reads private data or acts for the user (`users.me`, `streams.followed`, `polls.create`, `channels.update`), and WebSocket subscriptions |
| Scopes | None | The ones the user granted, listed in [Scopes](/reference/scopes/) |
| Renewal | Requested again with the client secret | Refreshed with its refresh token |
| Rate limit | One bucket for the application | One bucket per user |

Each endpoint accepts an app token, a user token, or either one. The reference page of every method says which under "Token", for example [users.me](/reference/api/users/#me). You never pass the token yourself: the client reads what the endpoint accepts and picks one. On an endpoint that accepts either kind, `{ as: "app" }` forces the app token. The rules are in [Acting as a user](/basics/acting-as-a-user/).

## Choose a flow

A flow is the way a user hands a token to your application. Pick it from where your code runs.

| Your application | Flow | Client secret | How |
| --- | --- | --- | --- |
| Web server | Authorization code | Required | [Authorization code flow](/auth/authorization-code/) |
| CLI, desktop app, bot on your own machine | Device code | Not needed | [Device code flow](/auth/device-code/) |
| Browser-only app, with no backend | Device code, or implicit | Must not be there | [Device code flow](/auth/device-code/), or the implicit flow below |
| Backend job with no user | None, the app token is enough | Required | Build the client with `clientId` and `clientSecret` |

A bot that always runs as the same account is the second row: sign in once with the device code flow, keep the token in a store, and the bot starts without asking again. See [Storing tokens](/auth/storing-tokens/).

### The implicit flow

The implicit flow returns an access token in the fragment of the redirect URL, with no refresh token. `authorizeUrl` builds its URL when you set `responseType` to `"token"`, and `addUser` registers the token it returns.

```ts
const url = twitch.auth.authorizeUrl({
  redirectUri: "https://example.com/",
  scopes: ["user:read:follows"],
  responseType: "token",
  state,
});

// Back on your page: #access_token=...&scope=...&state=...
const fragment = new URLSearchParams(location.hash.slice(1));
if (fragment.get("state") !== state) throw new Error("State mismatch");
const user = await twitch.auth.addUser({ accessToken: fragment.get("access_token")! });
```

Such a token cannot be renewed. When it expires the user is dropped and has to sign in again, which is why the device code flow is the better choice when you can show a code.

## What the library does for you

Once the client knows your credentials and your users, tokens need no code of yours.

- **App token on demand.** The first call that needs it requests it, and calls made at the same moment share that one request. It is kept in memory, requested again 60 seconds before it expires, and requested again if Twitch rejects it. The request itself is retried after a network failure or a `5xx`.
- **Refresh before expiry.** A user token that expires within 60 seconds is refreshed before the request is sent, provided it has a refresh token. Calls that need the same refresh share one request to Twitch.
- **Refresh after a real 401.** When Twitch answers `401`, the client asks Twitch whether the token is still valid. A dead token is renewed and the call is sent once more. A valid token means the `401` is about something else, and the error reaches you as is. [Errors](/basics/errors/) has the details.
- **Hourly validation.** Twitch requires applications that keep user sessions to validate their tokens every hour. A timer does it from the moment a user is registered, and it never keeps the process alive. Turn it off with `validateTokens: false`.
- **Persistence.** With a `tokens` store, users are restored on first use and every new or refreshed token is written back. Without one, tokens live in memory.
- **Scope checks.** A user token that lacks the scope an endpoint needs fails with a `TwitchScopeError` before any request is sent.
- **A dead token is reported once.** When a token cannot be renewed, the user is removed and the `tokenInvalid` event fires. [Managing users](/auth/managing-users/) shows how to react.

## Working without a client secret

A client built with only a `clientId` is a public client. It cannot request an app token, and it does not need one for most things.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: process.env.TWITCH_CLIENT_ID! });
await twitch.auth.addUser({ accessToken, refreshToken });

// Accepts either kind of token: the registered user's token is used.
const streams = await twitch.streams.get({ game_id: "509658" }).take(10);
```

| What you call | Without a client secret |
| --- | --- |
| The device code flow, refreshing, validating, revoking | Works |
| An endpoint that accepts either kind of token | Uses the token of the registered user when exactly one is registered, or of the one you name with `{ as }`. With several users and nobody named, it fails with a `TwitchAuthError` that asks you to choose |
| An endpoint reserved to applications, webhooks, conduits | Fails with a `TwitchAuthError` saying it "needs an app access token, which requires a clientSecret" |
| `twitch.auth.exchangeCode()` | Fails with `A clientSecret is required to exchange an authorization code.` |

:::caution
Keep the client secret on a server. Anything shipped to a browser, a desktop app or a CLI can be read by its users: build those clients with the `clientId` alone.
:::

## Using a token you manage yourself

When a token comes from somewhere else and you do not want the client to manage it, pass it for one call with the `token` request option. It is sent as is: no refresh, no scope check, no choice of user.

```ts
const me = await twitch.users.me({ token: accessToken });
```

To read the app token the client holds, for another tool that needs one, call `twitch.auth.appToken()`. It resolves with a valid token and requests a new one when needed.

## See also

- [Authorization code flow](/auth/authorization-code/): sign users in from a web server.
- [Device code flow](/auth/device-code/): sign in from a CLI or a desktop app, without a secret.
- [Storing tokens](/auth/storing-tokens/): keep users between restarts.
- [Acting as a user](/basics/acting-as-a-user/): how the token of each call is chosen.
- [Getting credentials](/credentials/): where the client ID and the client secret come from.
