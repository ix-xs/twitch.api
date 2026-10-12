---
title: "Getting credentials"
description: "Register an application in the Twitch developer console, find its client ID and client secret, and keep them out of your code."
---

Every request to the Twitch API is made on behalf of an application. Registering one takes a few minutes and gives you two values: a client ID, and a client secret when your code runs on a server.

## Register an application

Sign in to the [Twitch developer console](https://dev.twitch.tv/console/apps) with your Twitch account and register a new application. Twitch asks you to turn on two-factor authentication on the account first.

The form has four fields:

| Field | What to enter |
| --- | --- |
| Name | A name that is unique across Twitch. Users see it on the consent screen when they authorize your application. |
| OAuth redirect URLs | Where Twitch may send users back after they authorize your application. URLs must use HTTPS, except `http://localhost` ones. If you have no server yet, `http://localhost:3000` will do. You can add and change URLs later. |
| Category | The kind of application: a chat bot, a website integration, a game integration and so on. Pick the closest one. |
| Client type | Confidential when your code runs on a server you control and can keep a secret. Public when it runs on the user's machine: a browser, a desktop application, a mobile application, a command line tool. |

The redirect URL only matters for the authorization code flow, where it has to match the one your code sends, character for character. See [Authorization code flow](/auth/authorization-code/).

## Find the client ID and the client secret

Open the application from the list in the console. Its page shows the client ID. On a confidential application, the same page lets you generate a client secret. Twitch shows the secret once, so copy it right away. A public application has no secret.

| Value | What it is | What it allows |
| --- | --- | --- |
| Client ID | The public identifier of your application. It is sent with every request and appears in authorization URLs. | On its own: the device code flow, and API calls made with user tokens. |
| Client secret | The password of your application. | App access tokens, which are enough for all public data and for webhook and conduit events. It is also required to finish the authorization code flow. |

With both, the client can call every endpoint that serves public data right away, as in the [Quick start](/quick-start/). Endpoints that act for someone (send a chat message, ban a user, create a poll) need a user token on top of that. [Authentication overview](/auth/overview/) explains the two kinds of token.

## Keep them in environment variables

Do not write the values in your source code. Put them in a `.env` file:

```ini title=".env"
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
```

Node.js loads the file with the `--env-file` flag, with no extra package:

```bash
node --env-file=.env index.mjs
```

Read the variables when you build the client:

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
});
```

The constructor throws a `TwitchError` when `clientId` is missing or empty, so a forgotten variable shows up at startup and not at the first call.

Keep the `.env` file out of version control. Add it to `.gitignore` before the first commit, along with the file your tokens are saved in if you use one:

```ini title=".gitignore"
.env
tokens.json
```

On a hosting platform, use its own secret storage (the environment variables of the service, or the secrets of a Cloudflare Worker) instead of a file.

:::caution
The client secret must never reach a browser, a mobile application or a public repository. Anyone who has it can request tokens in the name of your application.
:::

## When the secret leaks

Generate a new secret from the page of the application in the console. The previous one stops working as soon as you do, so update the variable everywhere your code runs and restart it.

The client then requests a new app access token with the new secret. User tokens are refreshed with the secret as well, which is one more reason to update it everywhere at once.

If the leak also exposed user tokens, for example a committed `tokens.json`, revoke them and ask the users to authorize your application again:

```ts
await twitch.auth.revoke(accessToken);
```

## Work without a secret

A public application has only a client ID. Build the client without `clientSecret` and sign users in with the device code flow, which never asks for one:

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: process.env.TWITCH_CLIENT_ID! });

const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat", "user:write:chat"] });
console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
const user = await flow.wait();
```

Once that user is registered, the endpoints that accept either kind of token are called with their token. With several users registered, say who is acting, as described in [Acting as a user](/basics/acting-as-a-user/). The flow itself is covered in [Device code flow](/auth/device-code/).

Three things are out of reach without a secret:

- Reading public data before any user has signed in. The call fails with a `TwitchAuthError` whose message says it needs an app access token, which requires a `clientSecret`.
- Endpoints that only accept an app access token, such as the conduits group and webhook subscriptions.
- The authorization code flow: `twitch.auth.exchangeCode` throws a `TwitchAuthError` without a secret.

## See also

- [Quick start](/quick-start/): a first program with these two values.
- [Authentication overview](/auth/overview/): app tokens, user tokens and which flow fits your application.
- [Storing tokens](/auth/storing-tokens/): where user tokens go between two runs.
- [Runtimes](/basics/runtimes/): why a browser must never hold the client secret.
