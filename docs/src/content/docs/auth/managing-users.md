---
title: "Managing users"
description: "Everything twitch.auth does with user tokens once you have them: register, look up, refresh, validate, revoke and remove, and what happens when a token dies."
sidebar:
  order: 5
---

A user, for the client, is a user token it has been given: an access token, usually a refresh token, the scopes and the owner. `twitch.auth` is where you register them, inspect them and remove them. The flows ([authorization code](/auth/authorization-code/), [device code](/auth/device-code/)) register the user for you. This page is for everything else.

## A first example

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const bot = await twitch.auth.addUser({ accessToken, refreshToken });
console.log(bot.userId, bot.login, bot.scopes);

console.log(twitch.auth.hasUser(bot.userId)); // true
console.log(twitch.auth.users.length); // 1

await twitch.auth.removeUser(bot.userId, { revoke: true });
```

## Register a token

`twitch.auth.addUser(input)` registers a user token and resolves with the resulting `UserToken`. Only `accessToken` is mandatory.

| Field | Type | Meaning |
| --- | --- | --- |
| `accessToken` | `string` | The access token. Required. |
| `refreshToken` | `string` | The refresh token. Without it the access token cannot be renewed. |
| `userId` | `string` | Owner of the token. Looked up from Twitch when left out. |
| `login` | `string` | Login of the owner. |
| `scopes` | `string[]` | Scopes of the token. Looked up from Twitch when left out. |
| `expiresAt` | `number` or `Date` | When the access token expires: epoch milliseconds or a `Date`. |
| `expiresIn` | `number` | Lifetime in seconds, as Twitch returns it. Used when `expiresAt` is absent. |

What happens depends on what you give.

```ts
import type { UserToken } from "@ix-xs/twitch.api";

declare const response: { access_token: string; refresh_token: string; expires_in: number };
declare const saved: UserToken;

// An access token alone. Twitch is asked who owns it, with which scopes, until when.
await twitch.auth.addUser({ accessToken });

// With a refresh token, so that the client can renew it.
await twitch.auth.addUser({ accessToken, refreshToken });

// The answer of Twitch's token endpoint, field by field.
await twitch.auth.addUser({
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  expiresIn: response.expires_in,
});

// A token you saved earlier, owner and scopes included. No request is made.
await twitch.auth.addUser(saved);

// The same, written out.
await twitch.auth.addUser({
  userId: "141981764",
  login: "twitchdev",
  accessToken,
  refreshToken,
  scopes: ["user:read:chat", "user:write:chat"],
  expiresAt: new Date("2026-10-12T18:00:00Z"),
});
```

The rules behind those forms:

- When `userId` or `scopes` is missing, the client validates the token with Twitch and takes the owner, the login and the scopes from the answer, and the expiry too if you gave none.
- When that validation says the access token is dead and you gave a refresh token, the token is refreshed on the spot. The `UserToken` you get back holds the new access token and the new refresh token.
- When you give both `userId` and `scopes`, the token is trusted as it is and nothing is sent. Scope checks then rely on the list you gave, so pass the real one.
- A token with no known expiry is not refreshed ahead of time. It is refreshed when Twitch rejects it, and the hourly validation fills in the expiry.
- Registering a user who is already registered replaces their token.
- The token is saved in your store, if you configured one.

`addUser` fails in these cases:

| Error | When |
| --- | --- |
| `TwitchApiError` with status `401` | The access token is invalid and there is no refresh token to renew it. |
| `TwitchApiError` | The refresh attempted on the spot was refused. |
| `TwitchAuthError: This is an app access token, not a user access token.` | The token belongs to no user. |
| `TwitchAuthError: This token was issued to another application (client ID ...), so it cannot be used with client ID ....` | The token was granted to a different client ID than the one the client was built with. |
| `TwitchNetworkError` or `TwitchTimeoutError` | Twitch could not be reached to validate the token. |

All of them come from the validation step. A token registered with both `userId` and `scopes` skips that step, and a token from another application is then only found out when Twitch refuses the first call.

## Look users up

Three synchronous members read the users loaded in the client.

```ts
const everyone = twitch.auth.users; // UserToken[]
const token = twitch.auth.getUser("141981764"); // UserToken | undefined
const known = twitch.auth.hasUser("141981764"); // boolean

if (token && !token.scopes.includes("user:write:chat")) {
  console.log(`${token.login} has to sign in again to let the bot talk.`);
}
```

They only see what is in memory. With a token store, users are loaded at the first request or the first `twitch.auth.restore()`, not when the client is built. See [Storing tokens](/auth/storing-tokens/).

To know what a user allowed without holding their token, an application can ask Twitch with [users.authorization](/reference/api/users/#authorization), which uses the app token.

## Refresh, validate and revoke

You rarely need these three: the client refreshes and validates on its own. They exist for the moments when you want to decide.

`twitch.auth.refresh(userId)` renews the access token now and resolves with the new `UserToken`. Calls made at the same moment for the same user share one request. The new token is saved in the store and announced on the `tokenRefresh` event. The request to Twitch is sent once and never repeated, because a refresh token may be single use.

With a token store, `refresh` reads the store first. When the token saved there differs from the one in memory, another process already renewed it: `refresh` resolves with that token and sends nothing. [Storing tokens](/auth/storing-tokens/) explains how processes share a store.

```ts
const fresh = await twitch.auth.refresh(userId);
console.log(new Date(fresh.expiresAt ?? 0));
```

`twitch.auth.validate(token)` asks Twitch about any access token, registered or not, and resolves with a `TokenInfo`. It throws a `TwitchApiError` of status `401` when the token is not valid. The request is retried after a network failure or a `5xx`, like the one for the app token.

```ts
const info = await twitch.auth.validate(accessToken);

console.log(info.userId, info.login); // null and null for an app token
console.log(info.scopes, info.clientId);
console.log(`${info.expiresIn} seconds left`);
```

| Field | Type | Holds |
| --- | --- | --- |
| `clientId` | `string` | Client ID the token was issued to. |
| `userId` | `string` or `null` | Owner of the token. `null` for an app access token. |
| `login` | `string` or `null` | Login of the owner. `null` for an app access token. |
| `scopes` | `string[]` | Scopes granted to the token. |
| `expiresIn` | `number` | Seconds left. `0` means the token never expires. |
| `expiresAt` | `number`, optional | Expiry in epoch milliseconds. Absent when the token never expires. |

`twitch.auth.revoke(token)` invalidates an access token at Twitch. It does not touch the users of the client: to revoke and forget someone in one call, use `removeUser` with `revoke`.

## Remove a user

`twitch.auth.removeUser(userId)` forgets a user: the token leaves the memory of the client and your store. With `{ revoke: true }` the access token is also revoked at Twitch, which is what a "log out" or "disconnect" button should do.

```ts
await twitch.auth.removeUser(userId, { revoke: true });
```

- Removing someone who is not registered does nothing.
- A failure of the revocation is ignored: the user is removed either way.
- `tokenInvalid` does not fire. That event is for tokens that died, not for the ones you removed.
- A refresh that was in flight for that user fails with a `TwitchAuthError` instead of bringing the user back.

## The hourly validation

Twitch requires applications that keep users signed in to validate their tokens every hour, so that a user who disconnects your application is noticed within the hour. The client does it for you.

- The timer starts when the first user is registered or restored, and stops when the last one is removed or when you call `twitch.close()`.
- It never keeps the process alive.
- Each run is `twitch.auth.validateAll()`: every loaded token is validated, its scopes and its expiry are updated from Twitch's answer.
- A token Twitch calls invalid is refreshed when it has a refresh token, and dropped when it has none.
- A run that cannot reach Twitch changes nothing. The next one tries again.

Turn the timer off with `validateTokens: false` when you want to run the validation on your own schedule, for example on a platform with no long-lived process.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret, validateTokens: false });

// Later, from your own scheduler:
await twitch.auth.validateAll();
```

## When a token dies

A token dies when its user disconnects your application in their Twitch settings or changes their password, when a refresh token of a public client stays unused for 30 days, or when a token with no refresh token expires. The client finds out in one of three places:

| Where | Condition | Error |
| --- | --- | --- |
| A refresh | Twitch answers that the refresh token is invalid, and the store holds no newer one | `Twitch rejected the refresh token of user 123: ... The user has to authorize the app again.` |
| A call answered `401` | The token is dead and has no refresh token | `The access token of user 123 is no longer valid and there is no refresh token to renew it. The user has to authorize the app again.` |
| The hourly validation | The token is dead and has no refresh token | `The token of user 123 is no longer valid.` |

Each time, the same things happen: the user is removed from the client, the token is deleted from the store, and `tokenInvalid` fires with the user ID and a `TwitchAuthError`. In the first two cases the call that ran into the dead token rejects with that same error, whose `userId` field names the user.

```ts
declare function askToSignInAgain(userId: string, reason: string): void;

twitch.on("tokenInvalid", (userId, error) => {
  askToSignInAgain(userId, error.message);
});
```

After that, a call for this user fails with `No token is registered for user 123. Add it with twitch.auth.addUser().` until they sign in again. Twitch also revokes the event subscriptions that depended on the authorization, which the listeners report through `onRevocation`: see [Managing subscriptions](/events/managing-subscriptions/).

A refresh that fails for another reason (the network, a `5xx`, an error that is not about the refresh token) is thrown as it is and the user is kept, so an outage at Twitch does not sign anyone out.

## Several users at once

Register as many users as you need. Each has their own token, their own scopes and their own rate limit bucket.

```ts
declare const botTokens: { accessToken: string; refreshToken: string };

const broadcaster = await twitch.auth.addUser({ accessToken, refreshToken });
const bot = await twitch.auth.addUser(botTokens);

// The broadcaster_id names a registered user: their token is used.
await twitch.polls.create({
  broadcaster_id: broadcaster.userId,
  title: "Next game?",
  choices: ["Hades", "Celeste"],
  duration: 120,
});

// Nothing in this call says who sends the message: name the bot.
await twitch.chat.send(
  { broadcaster_id: broadcaster.userId, message: "The poll is open" },
  { as: bot.userId },
);
```

With one user registered, calls that need a user token use that user. With several, the client reads the request to find whose token fits. When it cannot tell, the call fails with a `TwitchAuthError` that asks you to choose with `{ as: userId }` or `twitch.as(userId)`. Without the `{ as: bot.userId }` above, the message would be:

```text
POST /chat/messages does not say who is acting and several users are registered. Set "sender_id", or choose a user with { as: userId } or twitch.as(userId).
```

The exact order is in [Acting as a user](/basics/acting-as-a-user/).

To do the same thing for everyone, loop over the users and name each one:

```ts
for (const user of twitch.auth.users) {
  const live = await twitch.streams.followed({}, { as: user.userId }).take(5);
  console.log(user.login, live.map((stream) => stream.user_name));
}
```

## See also

- [Acting as a user](/basics/acting-as-a-user/): how the token of each call is chosen.
- [Storing tokens](/auth/storing-tokens/): keep users between restarts.
- [Observability](/basics/observability/): the `tokenRefresh` and `tokenInvalid` events.
- [Errors](/reference/errors/): `TwitchAuthError` and `TwitchScopeError` in full.
- [Scopes](/reference/scopes/): what each scope unlocks.
