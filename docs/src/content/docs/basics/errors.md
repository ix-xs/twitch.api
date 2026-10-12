---
title: "Errors"
description: "The error classes the library throws, how to tell them apart, what a failed request carries, and what happens when Twitch answers 401."
sidebar:
  order: 4
---

A call that fails throws. The library turns every failure it knows about into one of a few error classes, all of which extend `TwitchError`, so you can decide what to do from the class and from a handful of typed fields.

## A first example

```ts
import { Twitch, TwitchApiError, TwitchScopeError } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

try {
  await twitch.moderation.ban({ broadcaster_id: channelId, user_id: "9876", duration: 600 });
} catch (error) {
  if (error instanceof TwitchScopeError) {
    console.log("Ask the user for", error.required);
  } else if (error instanceof TwitchApiError && error.status === 400) {
    console.log("Twitch refused:", error.message);
  } else {
    throw error;
  }
}
```

## The error classes

| Class | Extends | Thrown when |
| --- | --- | --- |
| `TwitchError` | `Error` | Base class. Also thrown as is in a few cases: no `clientId`, no `fetch` in the runtime, a response that is not JSON. |
| `TwitchApiError` | `TwitchError` | Twitch answered with an error status, and retrying was not possible or did not help. |
| `TwitchRateLimitError` | `TwitchApiError` | A `429` that was not retried, or the rate limit was reached with `rateLimit: "throw"`. |
| `TwitchAuthError` | `TwitchError` | No usable token: no user registered, several users and none chosen, an acting user that cannot be guessed, no client secret, a token that died and cannot be renewed. |
| `TwitchScopeError` | `TwitchAuthError` | The chosen user token lacks the scope the endpoint needs. Thrown before the request is sent. |
| `TwitchTimeoutError` | `TwitchError` | An attempt took longer than `timeout`, and could not be retried or was the last retry. |
| `TwitchNetworkError` | `TwitchError` | The request never reached Twitch, or the connection broke before the whole answer arrived, with the same condition on retries. |
| `TwitchEventSubError` | `TwitchError` | An EventSub listener failed: see [Events overview](/events/overview/). |

Requests to the OAuth server (getting the app token, refreshing, validating or revoking a token, the sign-in flows) throw the same classes: `TwitchApiError` for an error status, `TwitchTimeoutError` and `TwitchNetworkError` when the server cannot be reached.

The [error reference](/reference/errors/) lists the fields of each class.

## Tell errors apart

Use `instanceof`. Two classes have a subclass, so test the subclass first when you handle both: `TwitchRateLimitError` before `TwitchApiError`, `TwitchScopeError` before `TwitchAuthError`.

```ts
import {
  TwitchApiError,
  TwitchAuthError,
  TwitchError,
  TwitchNetworkError,
  TwitchRateLimitError,
  TwitchScopeError,
  TwitchTimeoutError,
} from "@ix-xs/twitch.api";

function describe(error: unknown): string {
  if (error instanceof TwitchScopeError) return `missing scope: ${error.required.join(" or ")}`;
  if (error instanceof TwitchAuthError) return `no usable token: ${error.message}`;
  if (error instanceof TwitchRateLimitError) return `rate limited for ${error.retryAfter} ms`;
  if (error instanceof TwitchApiError) return `Twitch answered ${error.status}: ${error.message}`;
  if (error instanceof TwitchTimeoutError || error instanceof TwitchNetworkError) return "Twitch is unreachable";
  if (error instanceof TwitchError) return error.message;
  throw error; // not from the library
}
```

Each class also sets `error.name` to its own name (`"TwitchApiError"`, `"TwitchScopeError"`), which is handy in logs. `TwitchNetworkError` and `TwitchTimeoutError` keep the original failure in `error.cause`.

## Read a failed request

A `TwitchApiError` carries the whole answer.

| Field | Type | Content |
| --- | --- | --- |
| `status` | `number` | HTTP status code. |
| `error` | `string \| undefined` | Short label sent by Twitch, such as `Bad Request` or `Unauthorized`. |
| `message` | `string` | The message sent by Twitch, followed by the status, the method and the path: `Missing required parameter (400 on GET /helix/users)`. |
| `method` | `string` | HTTP method of the request. |
| `url` | `string` | Full URL of the request, with its query string. |
| `body` | `unknown` | The parsed response body. The raw text when it is not JSON, `undefined` when there is none. |
| `headers` | `Headers \| undefined` | Response headers. |

```ts
import { TwitchApiError } from "@ix-xs/twitch.api";

try {
  await twitch.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });
} catch (error) {
  if (!(error instanceof TwitchApiError)) throw error;
  console.error(error.status, error.error, error.message);
  console.error(error.method, error.url, error.body);
}
```

The statuses you meet most often:

| Status | Usual meaning |
| --- | --- |
| `400` | A parameter is missing or invalid, or the action is not possible right now (a poll is already running, the channel is offline). |
| `401` | The token is not allowed to make this call, for example a `broadcaster_id` that is not the owner of the token. |
| `403` | The user lacks a permission on Twitch's side, for example they are not a moderator of the channel. |
| `404` | The thing you named does not exist. |
| `409` | A conflict, such as an EventSub subscription that already exists. |
| `429` | Rate limit, as a `TwitchRateLimitError`. See [Rate limits and retries](/basics/rate-limits-and-retries/). |
| `5xx` | A failure on Twitch's side, raised after the retries are used up. |

## Lookups that find nothing

Finding nothing is not an error. Lookups that can come back empty resolve with `null`, so the type forces you to handle it:

```ts
const user = await twitch.users.getByLogin("some_login");
if (!user) console.log("No such user");

const sub = await twitch.subscriptions.check({ broadcaster_id: channelId });
console.log(sub ? `Subscribed at tier ${sub.tier}` : "Not subscribed");
```

The methods that do this are `users.getById`, `users.getByLogin`, `teams.get`, `subscriptions.check`, `charity.campaign`, `chat.sharedSession`, `chat.pinnedMessage`, `guestStar.session` and `extensions.get`. For `teams.get` and `subscriptions.check`, Twitch answers `404`, and the library turns that into `null`.

Lists behave the same way: `users.get` with IDs that do not exist resolves with a shorter or empty array, and `paginator.first()` resolves with `undefined` on an empty list.

One call reports a refusal in its result instead of throwing: `chat.send` resolves with `is_sent: false` and a `drop_reason` when Twitch does not deliver the message.

## What happens on a 401

Twitch answers `401` in two different situations: the token is dead (expired or revoked), or the token is fine but not allowed to do this. The client tells them apart by asking Twitch to validate the token, then acts on the result:

| The token is | What the client does |
| --- | --- |
| Valid | Throws the `TwitchApiError` as Twitch sent it. Nothing is refreshed. |
| A dead app token | Requests a new app token and sends the call again. |
| A dead user token with a refresh token | Refreshes it, saves it, emits `tokenRefresh` and sends the call again. |
| A dead user token without a refresh token | Forgets the user, emits `tokenInvalid` and throws a `TwitchAuthError`. |
| A dead user token whose refresh token Twitch rejects | Forgets the user, emits `tokenInvalid` and throws a `TwitchAuthError` saying the user has to authorize the application again. |
| Passed with `{ token }` | Throws the `TwitchApiError`. The library does not manage that token. |

The call is sent again once. A second `401` is thrown as a `TwitchApiError`. This second attempt does not count against `retries`, and it applies to every HTTP method, since Twitch did nothing with the request it rejected.

A valid token that gets a `401` usually means the wrong user is acting. The message says so:

```
TwitchApiError: The ID in broadcaster_id must match the user ID in the token (401 on GET /helix/users/blocks)
```

[Acting as a user](/basics/acting-as-a-user/) explains how the token is chosen, and [Managing users](/auth/managing-users/) what to do when `tokenInvalid` fires.

## A practical handler

This wrapper covers what a bot command usually needs: tell the user when the action is refused, stay quiet and retry later on a temporary failure, and let everything else surface.

```ts
import {
  TwitchApiError,
  TwitchAuthError,
  TwitchNetworkError,
  TwitchRateLimitError,
  TwitchTimeoutError,
} from "@ix-xs/twitch.api";

type Outcome = { ok: true } | { ok: false; reason: string; retryInMs?: number };

async function timeoutUser(target: string, seconds: number): Promise<Outcome> {
  try {
    await twitch.moderation.ban({ broadcaster_id: channelId, user_id: target, duration: seconds });
    return { ok: true };
  } catch (error) {
    if (error instanceof TwitchRateLimitError) {
      return { ok: false, reason: "rate limited", retryInMs: error.retryAfter };
    }
    if (error instanceof TwitchApiError && error.status < 500) {
      return { ok: false, reason: error.message }; // refused: bad target, not a moderator...
    }
    if (error instanceof TwitchAuthError) {
      return { ok: false, reason: "the bot has to sign in again or lacks a scope" };
    }
    if (error instanceof TwitchApiError || error instanceof TwitchTimeoutError || error instanceof TwitchNetworkError) {
      return { ok: false, reason: "Twitch is having trouble", retryInMs: 5000 };
    }
    throw error;
  }
}
```

## Errors that are not a TwitchError

Two kinds of failure pass through unchanged:

- When you cancel a call with an `AbortSignal`, the call rejects with the reason of the signal, which is an `AbortError` unless you gave another one.
- An error thrown by your own token store reaches the call that triggered it.

:::note
An error thrown inside a `twitch.on(...)` listener does not reach the call that emitted the event. It is rethrown on its own, as an uncaught exception.
:::

## See also

- [Error reference](/reference/errors/): every class with its fields, and what the client does for each HTTP status.
- [Rate limits and retries](/basics/rate-limits-and-retries/): what is retried before an error reaches you.
- [Acting as a user](/basics/acting-as-a-user/): the messages of `TwitchAuthError` and `TwitchScopeError`.
- [Troubleshooting](/help/troubleshooting/): common errors by symptom.
