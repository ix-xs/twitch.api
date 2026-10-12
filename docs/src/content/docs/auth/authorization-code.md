---
title: "Authorization code flow"
description: "Sign users in from a web server: send them to Twitch, check the state on the way back, and trade the code for a token the client keeps fresh."
sidebar:
  order: 2
---

The authorization code flow is the one for web servers. You redirect the user to Twitch, Twitch redirects them back to your server with a short-lived code, and your server trades that code for an access token and a refresh token. The trade uses the client secret, so this flow only runs on a server.

## The whole flow in one server

This server has two routes. `/login` sends the visitor to Twitch, `/callback` receives them afterwards. It uses `node:http` so that nothing is hidden.

```ts title="src/server.ts"
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// Must be one of the redirect URLs registered for the application.
const redirectUri = "http://localhost:3000/callback";

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost:3000");

  if (url.pathname === "/login") {
    // 1. Remember a random value in the browser, then send the user to Twitch.
    const state = randomBytes(16).toString("hex");
    res.writeHead(302, {
      "Set-Cookie": `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
      Location: twitch.auth.authorizeUrl({
        redirectUri,
        scopes: ["user:read:email", "user:read:follows"],
        state,
      }),
    });
    res.end();
    return;
  }

  if (url.pathname === "/callback") {
    // 2. Twitch sent the user back: the state must be the one we set.
    const expected = /(?:^|;\s*)oauth_state=([0-9a-f]+)/.exec(req.headers.cookie ?? "")?.[1];
    const state = url.searchParams.get("state");
    if (!expected || state !== expected) {
      res.writeHead(400).end("This sign-in did not start here.");
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      // The user refused: ?error=access_denied&error_description=...
      res.writeHead(403).end(url.searchParams.get("error_description") ?? "Authorization refused.");
      return;
    }

    try {
      // 3. Trade the code for tokens. The user is now registered.
      const user = await twitch.auth.exchangeCode(code, redirectUri);
      res.writeHead(200, { "Set-Cookie": "oauth_state=; Path=/; Max-Age=0" });
      res.end(`Signed in as ${user.login} (${user.userId}).`);
    } catch (error) {
      res.writeHead(502).end(`Twitch refused the code: ${(error as Error).message}`);
    }
    return;
  }

  res.writeHead(404).end();
}).listen(3000, () => console.log("Open http://localhost:3000/login"));
```

Run it with the two environment variables set, open `/login`, approve the request on Twitch, and the page shows who signed in. The sections below take the three steps one at a time.

## Send the user to Twitch

`twitch.auth.authorizeUrl()` builds the address of the consent page. It makes no request: it returns a string to redirect to.

```ts
const url = twitch.auth.authorizeUrl({
  redirectUri: "https://example.com/auth/callback",
  scopes: ["user:read:chat", "user:write:chat", "moderator:manage:banned_users"],
  state,
  forceVerify: true,
});
```

| Option | Type | Effect |
| --- | --- | --- |
| `redirectUri` | `string` | Where Twitch sends the user back. Required. |
| `scopes` | `string[]` | What you ask the user to allow. Defaults to none. Known scope names autocomplete, and any other string is accepted for scopes Twitch adds later. |
| `state` | `string` | An opaque value Twitch gives back unchanged on the redirect. |
| `forceVerify` | `boolean` | Shows the consent page even when the user already authorized your application. Without it Twitch redirects such a user straight back. Use it to let someone switch accounts. |
| `responseType` | `"code"` or `"token"` | `"code"`, the default, is this flow. `"token"` is the implicit flow, described in [Tokens at a glance](/auth/overview/). |

Ask for the scopes your features need and no more: the consent page lists them, and a long list makes people hesitate. [Scopes](/reference/scopes/) maps each scope to the methods it unlocks, and [Event types](/reference/event-types/) gives the scope of each event.

A token cannot gain scopes later. To add one, send the user through the flow again with the complete list.

## Check the state

The `state` value protects the callback against forged requests. Without it, anyone could send a victim's browser to your `/callback` with a code of their own and sign the victim in to the wrong account.

Generate a random value for each sign-in, tie it to the browser (a cookie, as above, or the server-side session), pass it to `authorizeUrl`, and refuse any callback whose `state` is not the one that browser was given. A value kept in one variable shared by every visitor does not protect anything.

## Exchange the code

`twitch.auth.exchangeCode(code, redirectUri)` finishes the flow. It posts the code and the client secret to Twitch (in the request body, never in the URL), asks Twitch who owns the new token, registers that user and saves the token in your store.

```ts
const user = await twitch.auth.exchangeCode(code, "https://example.com/auth/callback");

console.log(user.userId, user.login, user.scopes);
```

The second argument must be the same string you gave to `authorizeUrl`. Twitch compares the two.

It resolves with a `UserToken`:

| Field | Type | Holds |
| --- | --- | --- |
| `userId` | `string` | ID of the user who signed in. |
| `login` | `string`, optional | Their login name. |
| `accessToken` | `string` | The access token. |
| `refreshToken` | `string`, optional | The refresh token. This flow always returns one. |
| `scopes` | `string[]` | The scopes the user granted. |
| `expiresAt` | `number`, optional | When the access token expires, in epoch milliseconds. |

A `UserToken` is plain JSON. You rarely need to read the tokens themselves: from here on, name the user by ID and the client finds the token.

```ts
const user = await twitch.auth.exchangeCode(code, "https://example.com/auth/callback");

const profile = await twitch.users.me({ as: user.userId });
const live = await twitch.streams.followed({}, { as: user.userId }).all();
```

On a server where many people sign in, always say who is acting with `{ as }` or `twitch.as(userId)`. [Acting as a user](/basics/acting-as-a-user/) explains what happens when you do not.

:::caution
A code works once and is short-lived. Exchange it as soon as it arrives, and do not retry the exchange with the same code.
:::

## Register the redirect URL

Twitch only redirects to addresses you declared. In the [Twitch developer console](https://dev.twitch.tv/console/apps), add the redirect URL to the OAuth redirect URLs of your application, character for character: scheme, host, port, path and trailing slash all count.

- In development, an `http://localhost` address is accepted.
- Everywhere else the URL must use HTTPS.
- You can register several, for example one for development and one for production. Pass the one that matches the current environment as `redirectUri`.

[Getting credentials](/credentials/) walks through the console.

## Common failures

| What you see | Cause | Fix |
| --- | --- | --- |
| Twitch shows an error page instead of the consent page | The `redirectUri` is not registered for the application, or differs from the registered one by a character | Copy the URL from your code into the console, or the other way round |
| The callback has `error=access_denied` and no `code` | The user refused the request | Show a message and offer to try again |
| `TwitchAuthError: A clientSecret is required to exchange an authorization code.` | The client was built without `clientSecret`, often an environment variable that is not set | Pass the secret, on a server |
| `TwitchApiError` with status `400` from `exchangeCode` | The code was already used or has expired, or the `redirectUri` differs from the one given to `authorizeUrl` | Start the flow again, and exchange each code once |
| `TwitchApiError` with status `403` from `exchangeCode` | The client secret is wrong or was regenerated | Copy the current secret from the console |
| `TwitchNetworkError` or `TwitchTimeoutError` from `exchangeCode` | Twitch could not be reached. The exchange is sent once and never repeated | Start the flow again: the code may have been used up by the attempt |
| A `TwitchScopeError` on a later call | The user was not asked for the scope that call needs | Add the scope to `scopes` and send the user through the flow again |

Errors from the token endpoint carry Twitch's own message in `error.message` and the full answer in `error.body`.

## After the sign-in

The user stays registered for the life of the process. Their access token is refreshed before it expires and after a `401`, for as long as the refresh token works. To keep users across restarts, give the client a token store.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  tokens: new FileTokenStore("./tokens.json"),
});
```

A user can withdraw the authorization at any time from their Twitch settings. The next refresh then fails, the user is removed and the `tokenInvalid` event tells you. See [Managing users](/auth/managing-users/).

## See also

- [Log in with Twitch](/recipes/login-with-twitch/): this flow turned into a complete sign-in, with a session and a logout.
- [Storing tokens](/auth/storing-tokens/): files, databases and KV namespaces.
- [Managing users](/auth/managing-users/): list, refresh, revoke and remove users.
- [Scopes](/reference/scopes/): which scope each method needs.
