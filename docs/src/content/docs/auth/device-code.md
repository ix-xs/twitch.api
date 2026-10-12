---
title: "Device code flow"
description: "Sign a user in from a CLI, a desktop app or any program that cannot receive a redirect: show a code, wait for the approval, and get a token without a client secret."
sidebar:
  order: 3
---

The device code flow is for programs that have no web server to redirect to: command line tools, desktop apps, bots you run on your own machine, apps on a TV or a console. Your program shows a link and a short code, the user approves the request in any browser, and your program receives the token. It works without a client secret.

## A first example

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: process.env.TWITCH_CLIENT_ID! });

const flow = await twitch.auth.deviceFlow({
  scopes: ["user:read:chat", "user:write:chat"],
});
console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);

const user = await flow.wait();
console.log(`Signed in as ${user.login}, with ${user.scopes.join(", ")}`);
```

`deviceFlow()` asks Twitch for a code. `flow.wait()` resolves once the user has approved, with the user already registered in the client.

## Show the link and the code

`twitch.auth.deviceFlow({ scopes })` takes the list of scopes to ask for (scope names autocomplete) and resolves with a `DeviceFlow`:

| Field | Type | Holds |
| --- | --- | --- |
| `verificationUri` | `string` | The page the user must open. The code is already part of the address. |
| `userCode` | `string` | The code, to display so that the user can check it against the one on the page. |
| `expiresAt` | `number` | When the code stops working, in epoch milliseconds. |
| `interval` | `number` | Seconds between two checks, as asked by Twitch. It grows when Twitch asks to slow down. |
| `deviceCode` | `string` | The raw device code. You rarely need it. |
| `wait(signal?)` | function | Waits for the approval and resolves with the `UserToken`. |

Print both the link and the code. The user can open the link on another device, a phone for example, which is the point of this flow on a machine with no browser or no keyboard. A desktop app can open the link in the default browser and still show the code in its own window.

Tell the user how long they have:

```ts
const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:follows"] });

const minutes = Math.round((flow.expiresAt - Date.now()) / 60_000);
console.log(`Open ${flow.verificationUri}`);
console.log(`Code: ${flow.userCode} (valid for ${minutes} minutes)`);
```

## Wait for the approval

`flow.wait()` asks Twitch every `interval` seconds whether the user has approved.

- While the user has not answered, it keeps waiting.
- When Twitch asks for slower checks, it adds 5 seconds to the interval and carries on. You have nothing to handle, and `flow.interval` shows the new value.
- When the user approves, it asks Twitch who owns the token, registers the user, saves the token in your store and resolves with the `UserToken`.
- When the code expires first, it rejects with a `TwitchAuthError`: `The device code expired before the user approved the request.`
- Any other answer from Twitch is thrown as a `TwitchApiError` with Twitch's message.
- A check that cannot reach Twitch is skipped: the next one asks again, until the code expires.

Call `wait()` once per flow. To try again after a failure, start a new flow with `deviceFlow()`: a code cannot be reused.

```ts
import { TwitchAuthError } from "@ix-xs/twitch.api";

async function signIn() {
  for (;;) {
    const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat"] });
    console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
    try {
      return await flow.wait();
    } catch (error) {
      if (!(error instanceof TwitchAuthError)) throw error;
      console.log("That code expired. Here is a new one.");
    }
  }
}

const user = await signIn();
```

## Cancel the wait

`wait()` takes an `AbortSignal`. When the signal aborts, the wait stops and the promise rejects with the reason of the signal. A pending `wait()` keeps the process alive, so give the user a way out.

```ts
const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat"] });
console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);

const controller = new AbortController();
process.once("SIGINT", () => controller.abort(new Error("Sign-in cancelled.")));

const user = await flow.wait(controller.signal);
```

To give up after a fixed time, shorter than the life of the code, pass `AbortSignal.timeout(120_000)`.

## Sign in once and keep the token

Nobody wants to type a code at every start. Give the client a token store, restore the saved user first, and run the flow only when there is none.

```ts title="src/sign-in.ts"
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const scopes = ["user:read:chat", "user:write:chat"] as const;

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [user] = await twitch.auth.restore();

// Also run the flow when a newer version of the program needs more scopes.
if (!user || scopes.some((scope) => !user?.scopes.includes(scope))) {
  const flow = await twitch.auth.deviceFlow({ scopes });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  user = await flow.wait();
}

console.log(`Signed in as ${user.login}`);
```

The first run asks for the approval and writes `tokens.json`. Later runs read the file and start at once. Add the file to `.gitignore`: it holds credentials. [Storing tokens](/auth/storing-tokens/) covers the other kinds of stores.

## Public clients and refresh tokens

An application used without its client secret is a public client. Twitch treats the refresh tokens of public clients differently, and two of its rules matter here.

- **A refresh token works once.** Each refresh returns a new refresh token and the previous one stops working. The client keeps the new one and writes it to your store after every refresh, so a store (or a `tokenRefresh` listener that saves the token) is not optional: a refresh token you copied by hand at the first sign-in is useless after the first renewal.
- **A refresh token expires after 30 days without use.** A program that runs every day never notices. One that sleeps for more than a month has to ask the user to sign in again.

When a refresh token is refused for good, the user is removed from the client and from the store, and the `tokenInvalid` event fires. Run the flow again when that happens.

Several processes can share one signed-in user, as long as they share one token store. Before it refreshes, a process reads the store and adopts a token that another process already renewed. If Twitch still refuses its refresh token, it reads the store once more and takes the newer token it finds there, without dropping the user.

:::caution
Sharing needs a store that returns what is saved right now, such as a database or a KV namespace. `FileTokenStore` reads its file once, so give each process its own file. And two processes that refresh at the very same instant can still race: the one that loses may drop the user.
:::

When the client does have a `clientSecret`, it is sent with the checks and the refreshes, and the flow works the same way.

## What a client without a secret can do

The user token you get here is a normal user token: every endpoint that takes a user token works, and so do WebSocket event subscriptions. What is missing is the app token, which webhooks, conduits and a few endpoints reserved to applications require. The table is in [Tokens at a glance](/auth/overview/).

Endpoints that accept either kind of token use the token of the signed-in user:

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: process.env.TWITCH_CLIENT_ID! });
const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:follows"] });
console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
await flow.wait();

// No client secret: public data is read with the user's token.
const top = await twitch.games.top().take(5);
const live = await twitch.streams.followed().take(20);
```

## Limits and errors

| What you see | Cause | Fix |
| --- | --- | --- |
| `deviceFlow()` throws a `TwitchApiError` | Twitch refused to start the flow. The message says why, for example a client ID it does not know. | Check the `clientId` |
| `TwitchAuthError: The device code expired before the user approved the request.` | Nobody approved before `flow.expiresAt` | Start a new flow |
| `wait()` rejects with an `AbortError` or your own error | The signal you passed aborted | Nothing, this is the cancellation you asked for |
| `TwitchNetworkError` or `TwitchTimeoutError` from `deviceFlow()` | Twitch could not be reached when the flow started | Check the network, then start a new flow |
| `TwitchAuthError` mentioning the refresh token, days later | The refresh token stayed unused for 30 days, the user disconnected your application, or the token was spent by a process that does not share your store | Run the flow again |
| A `TwitchAuthError` saying a call "needs an app access token, which requires a clientSecret" | The endpoint only takes an app token | Call it from a server that has the secret |

## See also

- [Tokens at a glance](/auth/overview/): the other flows and when each one fits.
- [Storing tokens](/auth/storing-tokens/): where the token goes between two runs.
- [A chat bot](/recipes/chat-bot/): a complete bot that signs in with this flow.
- [Managing users](/auth/managing-users/): what happens when a token dies.
