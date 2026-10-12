---
title: "Log in with Twitch"
description: "A sign-in button for a website, with node:http only: the redirect to Twitch, the callback, a session cookie and a logout that revokes the token."
sidebar:
  order: 7
---

This recipe builds a web server with a "Log in with Twitch" link. A visitor who follows it approves your application on Twitch, comes back signed in, and sees their name and their email address. Logging out ends the session and revokes the token. The server uses `node:http` and no framework, so every step of the authorization code flow is visible.

## What you need

| | |
| --- | --- |
| Application | A client ID and a client secret from the [Twitch developer console](https://dev.twitch.tv/console/apps). See [Credentials](/credentials/). |
| Redirect URL | `http://localhost:3000/callback`, added to the OAuth redirect URLs of the application. It must match the one in the code character for character. |
| Token | A user token for each visitor, obtained by the server with the authorization code flow. |
| Scopes | None to learn who the visitor is: ID, login, display name and profile picture. `user:read:email` to also get their verified email address. |

## Set up the client and the sessions

The server needs three things: the client, a place to remember who is signed in, and a way to read a cookie. Sessions live in a `Map` from a random session ID to what the server knows about the visitor.

```ts
import type { IncomingMessage } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const ORIGIN = "http://localhost:3000";
const REDIRECT_URI = `${ORIGIN}/callback`;

interface Session {
  userId: string;
  name: string;
  email: string | undefined;
}

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// In memory: every session is lost when the server restarts.
const sessions = new Map<string, Session>();

function cookie(req: IncomingMessage, name: string): string | undefined {
  return new RegExp(`(?:^|; )${name}=([^;]*)`).exec(req.headers.cookie ?? "")?.[1];
}
```

## Send the visitor to Twitch

`/login` builds the authorization URL and redirects to it. The `state` is a random value that Twitch sends back untouched. Keeping a copy in a cookie lets the callback check that the answer belongs to a sign-in this browser started, which is what stops a forged callback.

```ts
import { randomBytes } from "node:crypto";
import type { ServerResponse } from "node:http";

const REDIRECT_URI = "http://localhost:3000/callback";

function handleLogin(res: ServerResponse): void {
  const state = randomBytes(16).toString("hex");
  const location = twitch.auth.authorizeUrl({
    redirectUri: REDIRECT_URI,
    scopes: ["user:read:email"],
    state,
  });
  res
    .writeHead(302, {
      Location: location,
      "Set-Cookie": `oauth_state=${state}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/`,
    })
    .end();
}
```

`authorizeUrl` makes no request: it only assembles the URL. The cookie is `SameSite=Lax` so that the browser still sends it when Twitch redirects back to your site.

## Handle the callback

Twitch sends the visitor back to `/callback` with a `code` and the `state`. When the visitor refuses, there is no `code`. Check both, then trade the code for a token with `exchangeCode`, which also registers the user in the client.

```ts
import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const REDIRECT_URI = "http://localhost:3000/callback";
// From the first step.
declare const sessions: Map<string, { userId: string; name: string; email: string | undefined }>;
declare function cookie(req: IncomingMessage, name: string): string | undefined;

async function handleCallback(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== cookie(req, "oauth_state")) {
    res.writeHead(400).end("This sign-in was canceled or did not start here.");
    return;
  }

  const user = await twitch.auth.exchangeCode(code, REDIRECT_URI);
  const me = await twitch.users.me({ as: user.userId });

  const id = randomBytes(32).toString("hex");
  sessions.set(id, { userId: user.userId, name: me.display_name, email: me.email });
  res
    .writeHead(302, {
      Location: "/",
      "Set-Cookie": [`session=${id}; HttpOnly; SameSite=Lax; Path=/`, "oauth_state=; Max-Age=0; Path=/"],
    })
    .end();
}
```

`exchangeCode` takes the same redirect URL as `authorizeUrl`. It resolves with the user's token, which already tells you `user.userId`, `user.login` and `user.scopes`.

`users.me` returns the profile of the owner of a token. The `{ as: user.userId }` matters: as soon as a second visitor signs in, several users are registered, and the client has to be told whose token to use. The `email` field is only present because the token has the `user:read:email` scope. Without it, the field is `undefined`.

## Log out

`/logout` forgets the sessions of the user, then removes them from the client. With `revoke: true` the access token is also invalidated on Twitch's side, so it is of no use to anyone who copied it.

```ts
import type { IncomingMessage, ServerResponse } from "node:http";

// From the first step.
declare const sessions: Map<string, { userId: string; name: string; email: string | undefined }>;
declare function cookie(req: IncomingMessage, name: string): string | undefined;

async function handleLogout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const session = sessions.get(cookie(req, "session") ?? "");
  if (session) {
    // The same user may be signed in from several browsers.
    for (const [id, other] of sessions) if (other.userId === session.userId) sessions.delete(id);
    await twitch.auth.removeUser(session.userId, { revoke: true });
  }
  res.writeHead(302, { Location: "/", "Set-Cookie": "session=; Max-Age=0; Path=/" }).end();
}
```

## The whole file

```ts title="src/server.ts"
import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const ORIGIN = "http://localhost:3000";
const REDIRECT_URI = `${ORIGIN}/callback`;

interface Session {
  userId: string;
  name: string;
  email: string | undefined;
}

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// In memory: every session is lost when the server restarts.
const sessions = new Map<string, Session>();

function cookie(req: IncomingMessage, name: string): string | undefined {
  return new RegExp(`(?:^|; )${name}=([^;]*)`).exec(req.headers.cookie ?? "")?.[1];
}

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);

function handleLogin(res: ServerResponse): void {
  const state = randomBytes(16).toString("hex");
  const location = twitch.auth.authorizeUrl({
    redirectUri: REDIRECT_URI,
    scopes: ["user:read:email"],
    state,
  });
  res
    .writeHead(302, {
      Location: location,
      "Set-Cookie": `oauth_state=${state}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/`,
    })
    .end();
}

async function handleCallback(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== cookie(req, "oauth_state")) {
    res.writeHead(400).end("This sign-in was canceled or did not start here.");
    return;
  }

  const user = await twitch.auth.exchangeCode(code, REDIRECT_URI);
  const me = await twitch.users.me({ as: user.userId });

  const id = randomBytes(32).toString("hex");
  sessions.set(id, { userId: user.userId, name: me.display_name, email: me.email });
  res
    .writeHead(302, {
      Location: "/",
      "Set-Cookie": [`session=${id}; HttpOnly; SameSite=Lax; Path=/`, "oauth_state=; Max-Age=0; Path=/"],
    })
    .end();
}

async function handleLogout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const session = sessions.get(cookie(req, "session") ?? "");
  if (session) {
    // The same user may be signed in from several browsers.
    for (const [id, other] of sessions) if (other.userId === session.userId) sessions.delete(id);
    await twitch.auth.removeUser(session.userId, { revoke: true });
  }
  res.writeHead(302, { Location: "/", "Set-Cookie": "session=; Max-Age=0; Path=/" }).end();
}

function handleHome(req: IncomingMessage, res: ServerResponse): void {
  const session = sessions.get(cookie(req, "session") ?? "");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!session) {
    res.end('<a href="/login">Log in with Twitch</a>');
    return;
  }
  const email = escapeHtml(session.email ?? "no email");
  res.end(`Hello ${escapeHtml(session.name)} (${email}). <a href="/logout">Log out</a>`);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  try {
    if (url.pathname === "/login") handleLogin(res);
    else if (url.pathname === "/callback") await handleCallback(req, res, url);
    else if (url.pathname === "/logout") await handleLogout(req, res);
    else if (url.pathname === "/") handleHome(req, res);
    else res.writeHead(404).end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500);
    res.end("Something went wrong.");
  }
}).listen(3000, () => console.log(`Open ${ORIGIN}`));
```

Put the credentials in a `.env` file and run the server with [tsx](https://tsx.is/):

```ini
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
```

```bash
node --env-file=.env --import tsx src/server.ts
```

## What can go wrong

| Symptom | Cause |
| --- | --- |
| Twitch shows an error page about the redirect instead of the consent screen. | The redirect URL of the code is not registered for the application, or differs from it by a character. |
| `/callback` answers 400. | The visitor refused, the `oauth_state` cookie expired (it lives 10 minutes), or the callback was opened in another browser. |
| `exchangeCode` throws a `TwitchAuthError` about a `clientSecret`. | The client was built without a client secret. The authorization code flow needs one. |
| `exchangeCode` throws a `TwitchApiError` with status 400. | The code was already used or is too old. A code works once: do not reload the callback page. |

## Going further

### End the session when the user disconnects your application

A user can revoke your application from their Twitch settings at any time. The client validates every registered token each hour, as Twitch requires, and emits `tokenInvalid` when a token is dead and cannot be renewed. Close the matching sessions there.

```ts
declare const sessions: Map<string, { userId: string }>;

twitch.on("tokenInvalid", (userId) => {
  for (const [id, session] of sessions) if (session.userId === userId) sessions.delete(id);
});
```

### Call the API for the signed-in user

Ask for more scopes in `authorizeUrl`, then pass `{ as: userId }` to any call that acts for a visitor. The token is refreshed for you as long as the user stays registered.

```ts
// With the "user:read:follows" scope.
const follows = await twitch.channels.followed({}, { as: userId }).total();
console.log(`This visitor follows ${follows} channels`);
```

Set `forceVerify: true` in `authorizeUrl` to show the consent screen even to a visitor who already approved the application, for example to let them pick another Twitch account.

### Get ready for production

- Serve the site over HTTPS, register the HTTPS redirect URL, and add `Secure` to both cookies.
- Keep sessions and tokens somewhere that survives a restart. [Storing tokens](/auth/storing-tokens/) shows the token side.
- Make `/logout` a `POST` from a form, so that a link on another site cannot log your visitors out.

## See also

- [Authorization code flow](/auth/authorization-code/): each step of the flow and its options.
- [Managing users](/auth/managing-users/): `removeUser`, `revoke` and what happens when a token dies.
- [Acting as a user](/basics/acting-as-a-user/): `{ as }` and `twitch.as()`.
- [users.me](/reference/api/users/#me): the fields of the profile.
