---
title: "Rate limits and retries"
description: "How the client follows Twitch's rate limit, which failures it retries on its own, and the settings that control waiting, retries, timeouts and cancellation."
sidebar:
  order: 5
---

Twitch limits how many requests each token can make per minute, and any network call can fail for a moment. The client handles both before an error reaches you: it waits when a limit is reached and sends again what is safe to send again. This page says exactly what it does, and how to change it.

## The settings

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId,
  clientSecret,
  rateLimit: "wait", // or "throw". Default: "wait"
  retries: 3, // retries after the first attempt. Default: 3
  timeout: 15_000, // milliseconds per attempt. Default: 15000
});
```

`retries` and `timeout` can also be set for one call, in the [request options](/basics/request-options/):

```ts
const streams = await twitch.streams.get({ first: 20 }, { timeout: 3000, retries: 0 });
```

## How the rate limit is followed

Twitch counts requests per token and reports the state of the count in three headers of every response: `Ratelimit-Limit`, `Ratelimit-Remaining` and `Ratelimit-Reset`. The [Twitch documentation](https://dev.twitch.tv/docs/api/guide/#twitch-rate-limits) describes the rule. The client keeps one bucket per token:

| Bucket | Used by |
| --- | --- |
| `app` | Every call made with the app token. |
| `user:<id>` | Calls made with the token of that user. Each user has their own. |
| `raw:<fingerprint>` | Calls made with a token passed in `{ token }`. The name holds a short hash, never the token. |

For each bucket it does the following:

- After every response, it records the limit, the points left and the reset time from the headers. Responses can arrive out of order, so within one window it trusts the lowest count.
- Before every attempt, it takes one point from its own copy of the count. Requests sent in parallel therefore cannot overshoot what Twitch last reported.
- When the count is at zero, the request is held until the reset time, then sent. The `rateLimit` event is emitted with the bucket and the wait.
- Once the reset time has passed, it forgets the bucket until Twitch reports on it again.

A busy user does not slow the others down, and calls made with user tokens do not use up the app token's budget.

## Fail instead of waiting

Waiting is right for a bot or a background job. In a web request handler you may prefer to answer at once. With `rateLimit: "throw"`, a call that would have to wait throws a `TwitchRateLimitError` without being sent, and a `429` from Twitch is thrown instead of retried.

```ts
import { Twitch, TwitchRateLimitError } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret, rateLimit: "throw" });

async function liveStreams(): Promise<Response> {
  try {
    const streams = await twitch.streams.get().take(20);
    return Response.json(streams);
  } catch (error) {
    if (!(error instanceof TwitchRateLimitError)) throw error;
    const seconds = Math.ceil(error.retryAfter / 1000);
    return new Response("Try again shortly", { status: 429, headers: { "Retry-After": String(seconds) } });
  }
}
```

`TwitchRateLimitError` extends `TwitchApiError` (its `status` is `429`) and adds two fields:

| Field | Type | Content |
| --- | --- | --- |
| `resetAt` | `number \| undefined` | Epoch milliseconds at which you can try again. |
| `retryAfter` | `number` | Milliseconds from now until `resetAt`. `0` when it is unknown or already past. |

## When Twitch answers 429

With the default `rateLimit: "wait"`, a `429` is retried, whatever the HTTP method: Twitch did nothing with the request. There are two cases.

- The bucket is empty (`Ratelimit-Remaining: 0` with a reset time). The bucket is marked empty until that time, so this request and every other request of the same token wait for it.
- The bucket is not empty. The limit belongs to the endpoint: Twitch allows one chat announcement every 2 seconds, one shoutout every 2 minutes, and so on. The headers say nothing about these limits, so the client waits on its own schedule, between 0.5 and 1 second the first time, then twice as long each time, up to 30 seconds. It emits `rateLimit` for that wait too.

Each retry of a `429` counts against `retries`. When they are used up, the call throws a `TwitchRateLimitError`. For an endpoint limit, its `resetAt` is the client's own estimate, not a time given by Twitch.

## What is retried

| Failure | `GET`, `PUT`, `DELETE` | `POST`, `PATCH` |
| --- | --- | --- |
| Network failure, connection lost while reading the answer | Retried with backoff | Not retried |
| Attempt longer than `timeout` | Retried with backoff | Not retried |
| Status `500` and above | Retried with backoff | Not retried |
| Status `429` | Retried after the wait | Retried after the wait |
| Status `401` with a dead token | Sent again once with a renewed token | Same |
| Any other `4xx` | Never | Never |

`POST` and `PATCH` are not sent again after a failure that Twitch may have processed. A chat message whose answer was lost could otherwise be posted twice. If you want to retry those yourself, catch `TwitchNetworkError`, `TwitchTimeoutError` or a `TwitchApiError` with a status of 500 or more, and decide per call.

The backoff grows with each retry and is randomised: 125 to 250 ms before the first retry, 250 to 500 ms before the second, 500 to 1000 ms before the third, and so on up to 4 to 8 seconds.

`retries` is the number of attempts after the first one. The default of 3 means at most four attempts. `retries: 0` turns retrying off, `429` included. The single resend after a `401` is separate and does not count, see [Errors](/basics/errors/).

## Timeouts

`timeout` applies to one attempt: sending the request and reading the whole answer. It does not cover time spent waiting for the rate limit or between retries. An attempt that runs out of time is retried under the rules above, and ends as a `TwitchTimeoutError` such as `GET /streams timed out after 15000 ms.`

So a call can last longer than `timeout`: up to four attempts with the defaults, plus the waits. To put a ceiling on the whole call, use a signal.

## Cancel a call

Pass an `AbortSignal` in the request options. Aborting stops everything the call is doing: the request in flight, a rate limit wait, a pause between retries. The call rejects with the reason of the signal.

```ts
// A ceiling of 10 seconds on the whole call, waits and retries included.
const users = await twitch.users.get({ login: ["twitchdev"] }, { signal: AbortSignal.timeout(10_000) });

// Cancel by hand, here when the process is asked to stop.
const controller = new AbortController();
process.once("SIGINT", () => controller.abort());

try {
  const streams = await twitch.streams.get({ language: "fr" }, { signal: controller.signal }).all({ limit: 5000 });
  console.log(streams.length);
} catch (error) {
  if (!controller.signal.aborted) throw error;
  console.log("Cancelled");
}
```

The rejection is the signal's reason, not a `TwitchError`: a `TimeoutError` for `AbortSignal.timeout()`, an `AbortError` for `controller.abort()` unless you pass your own reason. On a paginator the signal applies to every page.

## Look at a bucket

`twitch.rateLimitOf()` returns what the client knows about the app token's bucket, and `twitch.rateLimitOf(userId)` about a user's.

```ts
const bucket = twitch.rateLimitOf(botId);

if (bucket) {
  const seconds = Math.max(0, Math.round((bucket.resetAt - Date.now()) / 1000));
  console.log(`${bucket.remaining} of ${bucket.limit} points left, reset in ${seconds} s`);
}
```

The result is `{ limit, remaining, resetAt }`, with `resetAt` in epoch milliseconds. It is `undefined` until Twitch has answered a request made with that token. `resetAt` is when the bucket is full again: Twitch refills it as time passes, so with little traffic that moment is always close, and once it has passed the bucket is reported full. Buckets of tokens passed with `{ token }` cannot be read this way.

To follow the waits as they happen, listen to the `rateLimit` event, described in [Observability](/basics/observability/).

## Limits to know about

- Requests to the OAuth server follow the client's `timeout` and `retries`, not the ones of a call, and are not counted in any bucket. Getting the app token and validating a token are retried after a network failure, a timeout or a status of 500 and above. Refreshing a user token is never sent twice, because a refresh token may be single use: when it fails for a temporary reason, the call that needed it throws and the user stays registered.
- The client counts one point per request. If Twitch charges an endpoint differently, the next response headers put the count right.
- Buckets live in memory, per client. Two processes that share a token each see the headers of their own responses only, so they can still receive a `429`, which is then handled as described above.

## See also

- [Request options](/basics/request-options/): `timeout`, `retries` and `signal` for one call.
- [Errors](/basics/errors/): `TwitchRateLimitError`, `TwitchTimeoutError`, `TwitchNetworkError` and the `401` handling.
- [Observability](/basics/observability/): the `rateLimit`, `request` and `response` events.
- [Client options](/reference/client-options/): every option of the constructor.
