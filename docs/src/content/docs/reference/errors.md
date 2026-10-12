---
title: "Errors"
description: "Every error class of the library: when it is thrown, the fields it carries and what to do about it. Then what the request pipeline does with each HTTP status."
---

Everything the library throws is an instance of `TwitchError` or of one of its seven subclasses, with [two exceptions](/reference/errors/#errors-that-are-not-a-twitcherror) that are not the library's to wrap. All the classes are exported from the main entry, set `name` to their class name, and keep the original failure in `cause` when they wrap one. For a guided introduction with a practical `try`/`catch`, read [Errors](/basics/errors/) first.

## The hierarchy

- `TwitchError`
  - `TwitchApiError`
    - `TwitchRateLimitError`
  - `TwitchAuthError`
    - `TwitchScopeError`
  - `TwitchNetworkError`
  - `TwitchTimeoutError`
  - `TwitchEventSubError`

Test with `instanceof`, the subclass before its parent: a `TwitchRateLimitError` is also a `TwitchApiError`, and a `TwitchScopeError` is also a `TwitchAuthError`.

```ts
import {
  Twitch,
  TwitchApiError,
  TwitchAuthError,
  TwitchError,
  TwitchRateLimitError,
  TwitchScopeError,
} from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

try {
  await twitch.moderation.ban({ broadcaster_id, user_id, reason: "Spam" });
} catch (error) {
  if (error instanceof TwitchScopeError) console.log("Missing scope:", error.required);
  else if (error instanceof TwitchAuthError) console.log("No usable token:", error.message);
  else if (error instanceof TwitchRateLimitError) console.log("Retry in", error.retryAfter, "ms");
  else if (error instanceof TwitchApiError) console.log(error.status, error.message);
  else if (error instanceof TwitchError) console.log("Not sent or not answered:", error.message);
  else throw error;
}
```

## TwitchError

The base class. Catch it to catch everything the library throws. It is also thrown directly, for problems that fit no subclass:

| Message | When |
| --- | --- |
| `A clientId is required: new Twitch({ clientId, clientSecret }).` | `new Twitch()` received no `clientId`, or an empty one. |
| ``No fetch implementation found. Pass one with the `fetch` option.`` | The runtime has no global `fetch` and the `fetch` option is not set. |
| `GET /users returned no data.` | An endpoint that always returns one object answered with an empty list. |
| `GET /users answered with a body that is not JSON.` | A success response could not be parsed, for example an HTML page from a proxy. `cause` holds the parse error. |

It has no fields of its own beyond `message`, `name` and `cause`.

What to do: the first two are mistakes in the calling code, fix the call. The last two are worth logging with the request, they point at something between you and Twitch.

## TwitchApiError

Twitch answered with a status outside the 2xx range, and the request pipeline had no reason to retry or had used up its retries. It is also the error of the OAuth server (`id.twitch.tv`) when a token request, a validation or a revocation is refused.

| Field | Type | Holds |
| --- | --- | --- |
| `status` | `number` | HTTP status code. |
| `method` | `string` | HTTP method of the failed request. |
| `url` | `string` | Full URL of the failed request. |
| `error` | `string` or `undefined` | Short label sent by Twitch, such as `Bad Request` or `Unauthorized`. |
| `body` | `unknown` | The parsed response body, or its raw text when it is not JSON. |
| `headers` | `Headers` or `undefined` | The response headers. |

For an API call, `message` is Twitch's own message followed by the status and the path:

```text
Missing required parameter (400 on GET /helix/users)
```

For the OAuth server, `message` is Twitch's message alone.

What to do: read `status`. A `400` is a parameter Twitch does not accept, and the message names it. A `401` on a token the client considers valid means the token is not allowed to do this (see the status table below). A `403` usually means the user is not allowed to do this on that channel. A `404` is a resource that does not exist. A `409` is a conflict with the current state, such as a subscription that already exists. A `5xx` reaches you only after the retries.

## TwitchRateLimitError

A subclass of `TwitchApiError` whose `status` is `429`. It is thrown when the rate limit was hit and the request was not retried:

- with `rateLimit: "throw"`, before sending when the bucket is known to be empty (the message is then `Rate limit reached for GET /users.`, with no `body` and no `headers`), and on any `429` answer;
- with `rateLimit: "wait"`, the default, when a `429` keeps coming back after every retry.

| Field | Type | Holds |
| --- | --- | --- |
| `resetAt` | `number` or `undefined` | Epoch milliseconds at which the request can be sent again. It comes from the `Ratelimit-Reset` header when the bucket is empty, and is an estimate when the limit is specific to the endpoint. |
| `retryAfter` | `number` | Milliseconds left until `resetAt`, never negative. `0` when `resetAt` is unknown. Computed each time you read it. |

Plus every field of `TwitchApiError`.

What to do: wait `retryAfter` milliseconds, then send the request again. [Rate limits and retries](/basics/rate-limits-and-retries/) explains the buckets.

## TwitchAuthError

There is no usable token for the call: none is registered, none fits, the client cannot tell who is acting, or the token that fits died and cannot be renewed. Except in that last case, nothing was sent to the API.

| Field | Type | Holds |
| --- | --- | --- |
| `userId` | `string` or `undefined` | The user concerned, when the problem is about one user's token. |

| Message | When |
| --- | --- |
| `GET /users needs a user access token and no user is registered. Add one with twitch.auth.addUser().` | The endpoint takes a user token and the client has no user. |
| `GET /users needs a user access token and several users are registered. Choose one with { as: userId } or twitch.as(userId).` | The endpoint takes a user token, several users are registered and the call names none of them. |
| `POST /polls needs the token of user 123, which is not registered. Add it with twitch.auth.addUser() or choose a user with { as: userId }.` | The call names a user the client does not know, and several other users are registered. |
| `POST /chat/messages does not say who is acting and several users are registered. Set "sender_id", or choose a user with { as: userId } or twitch.as(userId).` | The endpoint accepts either kind of token, the call leaves out the field that names the acting user, and several users are registered. |
| `POST /chat/messages needs "sender_id": the call is made with the app token, which belongs to no user. Set "sender_id", or register the acting user with twitch.auth.addUser().` | Same call, with no user registered or with `{ as: "app" }`: the app token is used and there is nobody to put in the field. |
| `POST /chat/messages needs "sender_id": a token passed by hand does not say who it belongs to.` | Same call, made with the `token` option. |
| `GET /users can use a user token, but several users are registered. Choose one with { as: userId } or twitch.as(userId).` | The endpoint accepts either kind of token, the client has no `clientSecret`, and several users are registered. |
| `GET /users only accepts a user access token: the app token cannot be used for it.` | `{ as: "app" }` or `twitch.as("app")` on an endpoint that only takes a user token. |
| `No token is registered for user 123. Add it with twitch.auth.addUser().` | `{ as }` or `twitch.as()` named a user the client does not know. `twitch.auth.refresh()` throws the first sentence alone. |
| `GET /eventsub/conduits needs an app access token, which requires a clientSecret.` | The endpoint takes the app token and the client has no `clientSecret`. For an endpoint that takes either kind, the message ends with `(or a registered user token)`. |
| `A clientSecret is required to exchange an authorization code.` | `twitch.auth.exchangeCode()` on a client with no `clientSecret`. |
| `A clientSecret is required to get an app access token.` | `{ as: "app" }` or `twitch.auth.appToken()` on a client with no `clientSecret`. |
| `This is an app access token, not a user access token.` | `twitch.auth.addUser()` received a token that belongs to no user. |
| `This token was issued to another application (client ID abc), so it cannot be used with client ID xyz.` | `twitch.auth.addUser()` validated a token that was granted to a different client ID. |
| `The device code expired before the user approved the request.` | `flow.wait()` of the device code flow ran out of time. |
| `Twitch rejected the refresh token of user 123: ... The user has to authorize the app again.` | A refresh was refused for good, and the token store held no newer token. The user was removed and `tokenInvalid` fired. `cause` holds the `TwitchApiError`. |
| `The access token of user 123 is no longer valid and there is no refresh token to renew it. The user has to authorize the app again.` | A call was answered `401`, the token is dead and cannot be renewed. The user was removed and `tokenInvalid` fired. |
| `The access token of user 123 expired and there is no refresh token to renew it.` | `twitch.auth.refresh()` was called for a token that has no refresh token. |
| `User 123 was removed while their token was being renewed.` | `removeUser()` ran during a refresh. |

What to do: the messages about who is acting are solved by registering a user, by naming one, or by filling the field the message quotes, see [Acting as a user](/basics/acting-as-a-user/). The messages that end with "has to authorize the app again" mean what they say: send the user through a flow again. [Managing users](/auth/managing-users/) covers the life of a token.

## TwitchScopeError

A subclass of `TwitchAuthError`. The token chosen for the call exists, and it lacks the scope the endpoint needs. It is thrown before any request is sent.

| Field | Type | Holds |
| --- | --- | --- |
| `required` | `readonly Scope[]` | The scopes that would satisfy the endpoint. One of them is enough. |
| `granted` | `readonly string[]` | The scopes the token has. |
| `userId` | `string` | The owner of the token. |

```text
The token of user 123 is missing the "moderator:manage:banned_users" scope required by POST /moderation/bans.
```

When several scopes would do, they are joined with "or".

What to do: add one of `required` to the scopes of your sign-in and send the user through the flow again. A token cannot gain a scope afterwards. The check only applies to user tokens the client manages: a raw token passed with the `token` option is not checked, and event subscriptions are checked by Twitch, not here.

## TwitchNetworkError

A request did not get an answer: the DNS lookup failed, the connection was refused or reset, or the body stopped arriving halfway. The message has the form `GET /users could not reach Twitch: fetch failed` for the API and `POST /oauth2/token could not reach Twitch: fetch failed` for the OAuth server, and `cause` holds the error of the runtime, which usually says more.

It has no fields of its own.

For `GET`, `PUT` and `DELETE` requests to the API, the request has already been retried with backoff when you see this error. `POST` and `PATCH` are not sent twice, because Twitch may have processed the first one. On the OAuth server, the app token request and token validations are retried the same way. A refresh, a code exchange, a revocation and the requests of the device code flow are sent once: a refresh token or a code may be single use.

What to do: check the network path (firewall, proxy, DNS). For a `POST` or a `PATCH`, find out whether the action happened before sending it again.

## TwitchTimeoutError

One attempt took longer than `timeout` (15 seconds by default), counting the time to read the body of an API response. The message has the form `GET /users timed out after 15000 ms.`, or `POST /oauth2/token timed out after 15000 ms.` for the OAuth server. Requests to the OAuth server use the `timeout` of the client, not the one of a single call.

It has no fields of its own. The retry rule is the one of `TwitchNetworkError`.

What to do: raise `timeout` on the client or for the call if the endpoint is slow by nature, and look at the network otherwise.

## TwitchEventSubError

Something went wrong in an EventSub listener. Unlike the others, it mostly does not come out of a `throw`: a listener reports it by rejecting `handle.ready` and by calling the `onError` listeners (or `console.error` when there are none).

| Message starts with | When | How you get it |
| --- | --- | --- |
| `Could not subscribe to channel.follow (version 2):` | Twitch refused the subscription, the listener is full, or a temporary failure (a `429`, a `5xx`, the network) was still there after 6 attempts on the same session. The rest of the message is the reason, and `cause` is the original error, usually a `TwitchApiError`. | `handle.ready` and `onError` |
| `The subscription to stream.online was removed before Twitch confirmed it.` | `stop()` or `close()` was called before the subscription was accepted. | `handle.ready` |
| `Twitch did not verify the callback for stream.online within 60 seconds.` | A webhook subscription was created and the verification challenge never reached the listener. | `handle.ready` and `onError` |
| `The request body was already parsed by a middleware` | `nodeHandler()` received a body it cannot verify. The delivery is answered with `500`. | `onError` |
| `Could not open the EventSub WebSocket:` | The WebSocket could not be created. The listener tries again. | `onError` |
| `Could not bind the WebSocket session:` | A conduit shard could not be attached to the session. A temporary failure is reported once and tried again. A failure that waiting cannot fix rejects the subscriptions still pending, with this message as their reason. | `onError`, and `handle.ready` when it is final |
| `Unknown EventSub type "some.type".` | `on()` or `subscribe()` received a type name the library does not know, without a version. Write `"some.type@1"`. | Thrown |
| ``A webhook listener needs a `callback` URL and a `secret`.`` | `twitch.eventsub.webhook()` was called without one of them. | Thrown |
| `The webhook secret must be 10 to 100 characters long.` | The `secret` has the wrong length. | Thrown |
| `This runtime has no global WebSocket.` | `websocket()` or `conduit()` found no WebSocket class. Pass one with the `webSocket` option. | Thrown |

It has no fields of its own.

`onError` also receives errors that are yours and not of this class, unchanged: what a handler throws, and what an `onConnect` or `onDisconnect` listener throws or rejects with.

What to do: read the reason after the colon. A `403` means the token lacks the authorization the event type requires, listed in [Event types](/reference/event-types/). [Receiving events](/events/overview/) describes `onError` and `ready`.

## Errors that are not a TwitchError

Two kinds of failures reach you as they are, because they are yours and not the library's:

- **A cancelled call** rejects with the reason of your `AbortSignal`, an `AbortError` unless you gave another one.
- **An error thrown by your token store** comes out of the call that needed the store, unchanged.

So a `catch` that only expects `TwitchError` should rethrow what it does not recognize, as in the example at the top.

## What happens to each HTTP status

This is what the request pipeline does with the answer of the API, before anything is thrown. "Retried" means up to `retries` more attempts (3 by default), with a randomized backoff that doubles from 250 milliseconds up to 8 seconds.

| Answer | What the client does | What you get |
| --- | --- | --- |
| `2xx` with a body | Parses the JSON. | The result of the method. |
| `204`, or `2xx` with no body | Nothing to parse. | `undefined` from `twitch.request()`. The methods turn it into their own empty value. |
| `401` | Once per call, asks Twitch whether the token is still valid. A dead token is renewed (the app token is requested again, a user token is refreshed) and the request is sent once more, without using up a retry. | The result of the second attempt. A `TwitchApiError` when the token was valid, when it was a raw token, or when the second attempt is also refused. A `TwitchAuthError` when the token is dead and cannot be renewed. |
| `429`, bucket empty | With `rateLimit: "wait"`, marks the bucket empty until the time given by `Ratelimit-Reset`, waits for it and retries. | The result, or a `TwitchRateLimitError` once the retries are used up. With `rateLimit: "throw"`, a `TwitchRateLimitError` at once. |
| `429`, bucket not empty | A limit of that endpoint. With `rateLimit: "wait"`, emits `rateLimit`, waits with a backoff that doubles from 1 second up to 30 seconds, and retries. | Same as above. |
| `5xx` on `GET`, `PUT`, `DELETE` | Retried. | The result, or a `TwitchApiError` once the retries are used up. |
| `5xx` on `POST`, `PATCH` | Not retried. | A `TwitchApiError`. |
| Any other `4xx` | Not retried. | A `TwitchApiError`. |
| No answer, or a timeout | Retried for `GET`, `PUT` and `DELETE` only. | The result, or a `TwitchNetworkError` or `TwitchTimeoutError`. |

Requests to the OAuth server follow a shorter rule. An answer outside the 2xx range is a `TwitchApiError`. The app token request and token validations are retried after a `5xx` or a network failure, with the same backoff and the same `retries`. Everything else is sent once.

Some lookups never throw for a missing item: they resolve with `null` or leave the item out of the list. [Calling the API](/basics/calling-the-api/) lists the return shapes.

## See also

- [Errors](/basics/errors/): how to handle errors in practice.
- [Rate limits and retries](/basics/rate-limits-and-retries/): buckets, waiting, `retries` and `timeout`.
- [Acting as a user](/basics/acting-as-a-user/): the rules behind the `TwitchAuthError` messages.
- [Troubleshooting](/help/troubleshooting/): the same errors, starting from the symptom.
