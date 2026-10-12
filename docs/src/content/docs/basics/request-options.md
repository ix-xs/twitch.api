---
title: "Request options"
description: "The options every method accepts as its last argument, and the two escape hatches for endpoints the library does not have yet: twitch.request() and twitch.paginate()."
sidebar:
  order: 6
---

Every method of every group takes an optional last argument that changes how that one call is made: as which user, with which timeout, with which signal. The same pipeline is open to you through `twitch.request()` and `twitch.paginate()`, for the day Twitch ships an endpoint before the library does.

## A first example

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

// After the parameters.
const streams = await twitch.streams.get({ language: "fr" }, { timeout: 5000 }).take(20);

// Alone, on a method without parameters.
const me = await twitch.users.me({ as: userId });

// After an empty object, when the parameters are optional and you have none.
const top = await twitch.games.top({}, { retries: 0 }).take(10);
```

## The five options

| Option | Type | Effect |
| --- | --- | --- |
| `as` | `string` | Makes the call with the token of this registered user, or with the app token when it is `"app"`. |
| `token` | `string` | Sends this access token as is, outside of all token management. |
| `signal` | `AbortSignal` | Cancels the call, including its retries and its rate limit waits. |
| `timeout` | `number` | Milliseconds before one attempt is abandoned. Overrides the client's `timeout`. |
| `retries` | `number` | Number of retries after the first attempt. Overrides the client's `retries`. |

On a method that returns a paginator, the options apply to every page it fetches.

`users.getById` and `users.getByLogin` normally merge the calls made in the same tick into one request. A call that passes options is sent on its own.

### Act as a user for one call

`as` takes the ID of a user registered with `twitch.auth.addUser()` and overrides the automatic choice of token, including the user of a `twitch.as()` view. [Acting as a user](/basics/acting-as-a-user/) has the full rules.

```ts
await twitch.chat.send({ broadcaster_id: channelId, message: "Back in 5 minutes" }, { as: botId });
```

The value `"app"` asks for the app token instead, on an endpoint that accepts both kinds and would otherwise pick a registered user. The app token belongs to no user, so write the acting user parameter yourself. A user-only endpoint refuses it with a `TwitchAuthError`.

```ts
await twitch.chat.send(
  { broadcaster_id: channelId, sender_id: botId, message: "Sent with the app token" },
  { as: "app" },
);
```

### Send a token you manage yourself

`token` is for a token the client knows nothing about: a signed JWT for the extension endpoints, or a user token you hold for one call and do not want to register.

```ts
declare const extensionJwt: string;
declare const extensionId: string;

const extension = await twitch.extensions.get({ extension_id: extensionId }, { token: extensionJwt });
```

The token is sent untouched, and everything the client does for registered tokens is off:

- Its scopes are not checked before the request.
- It is not renewed after a `401`. The error is thrown as Twitch sent it.
- An acting user parameter you leave out (`sender_id`, `moderator_id`, `broadcaster_id`) is not filled in. Write it, or the call fails before it is sent.
- It gets its own rate limit bucket, and `as` reads `"raw"` in the `request` and `response` events.

`token` wins over `as` when both are given.

### Bound or cancel one call

`timeout` and `retries` replace the client's settings for this call only, and `signal` cancels it at any point. [Rate limits and retries](/basics/rate-limits-and-retries/) explains what each one covers.

```ts
const controller = new AbortController();

const page = await twitch.search.channels(
  { query: "speedrun", live_only: true },
  { signal: controller.signal, timeout: 3000, retries: 1 },
);
```

## Call an endpoint the library does not have

`twitch.request()` sends any Helix request through the same pipeline as the built-in methods: choice of token, scope check, rate limit, retries, typed errors. You describe the endpoint and give the type of the response body.

```ts
interface ChatSettingsBody {
  data: { broadcaster_id: string; slow_mode: boolean; slow_mode_wait_time: number | null }[];
}

const body = await twitch.request<ChatSettingsBody>({
  path: "chat/settings",
  query: { broadcaster_id: channelId },
});

console.log(body.data[0]?.slow_mode);
```

It resolves with the parsed JSON body, or `undefined` when the answer is empty, as with a `204`. The type you give is not checked against what Twitch sends.

A call that acts for a user declares the rest. This is how the built-in `chat.announce` is written:

```ts
await twitch.request({
  method: "POST",
  path: "chat/announcements",
  query: { broadcaster_id: channelId },
  body: { message: "Giveaway in 5 minutes", color: "purple" },
  scopes: ["moderator:manage:announcements"],
  context: "moderator_id",
});
```

Because of `context`, `moderator_id` is added to the query with the ID of the user whose token is chosen. Because of `scopes`, a token without that scope fails with a `TwitchScopeError` before anything is sent.

### Every field of an endpoint

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `path` | `string` | Required | Path under the Helix base URL, without a leading slash: `"chat/settings"`. |
| `method` | `"GET" \| "POST" \| "PUT" \| "PATCH" \| "DELETE"` | `"GET"` | HTTP method. It also decides what is retried. |
| `query` | `object` | None | Query string parameters. An array repeats the key, `undefined` and `null` are skipped, a `Date` is sent in ISO 8601 form. |
| `body` | `object` | None | Sent as JSON. |
| `auth` | `"any" \| "app" \| "user"` | `"any"` | Kind of token the endpoint accepts. |
| `prefer` | `"user"` | None | For an endpoint that accepts both kinds but answers more to a user: use the registered user when there is exactly one, the app token otherwise. |
| `scopes` | `readonly ScopeInput[]` | None | Scopes that satisfy the endpoint when a user token is used. One of them is enough. Known scope names autocomplete, and any other string is accepted. |
| `context` | `string \| { body: string }` | None | Name of the parameter that holds the acting user. A string points into the query, `{ body: "sender_id" }` into the body. It selects whose token is used and is filled in when left out. |
| `options` | `RequestOptions` | None | The per call options described above. |
| `response` | `"json" \| "text"` | `"json"` | How to read the answer. `"text"` resolves with the body as a string. |

An endpoint newer than the library may need a scope that is newer too. `scopes` takes its name as a plain string, and the check before the request works the same.

Called on a `twitch.as(userId)` view, `request()` acts as that user, like any other method.

### Wrap it in a function

To give your own endpoint the same shape as the built-in ones, accept request options and forward them in `options`:

```ts
import type { RequestOptions } from "@ix-xs/twitch.api";

interface Thing {
  id: string;
  title: string;
}

async function createThing(params: { broadcaster_id?: string; title: string }, options?: RequestOptions): Promise<Thing | undefined> {
  const body = await twitch.request<{ data: Thing[] }>({
    method: "POST",
    path: "some/new/endpoint",
    body: params,
    auth: "user",
    scopes: ["channel:manage:broadcast"],
    context: { body: "broadcaster_id" },
    options,
  });
  return body.data[0];
}

await createThing({ title: "Hello" }, { as: userId });
```

## Page through a list the library does not have

`twitch.paginate()` is the same thing for an endpoint that returns pages. It gives you a regular [paginator](/basics/pagination/): `await`, `for await`, `all()`, `take()`, `first()`, `total()`.

```ts
interface Thing {
  id: string;
  title: string;
}

const things = await twitch.paginate<Thing>({ path: "some/new/list", query: { broadcaster_id: channelId } }).take(50);
```

Without a second argument, it expects the usual layout of Twitch lists: the items in `data`, the cursor in `pagination.cursor`, an optional `total`, a page size parameter named `first` that goes up to 100, and `after` to ask for the following page. If the query holds a `before` cursor, it pages backward with `before`. When an endpoint differs, describe it:

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `max` | `number` | `100` | Largest page size the endpoint accepts. It is the size used to iterate when the query sets no page size. |
| `sizeParam` | `string \| null` | `"first"` | Name of the page size parameter. `null` when the endpoint has none. |
| `extract` | `(body: R) => { data, cursor?, total? }` | Reads `data`, `pagination.cursor` and `total` | Pulls the items, the next cursor and the total out of a response body. |

The second type parameter is the type of the response body. It types `extract` and `page.raw`.

```ts
interface Thing {
  id: string;
  title: string;
}

interface ThingsBody {
  data: { owner_id: string; things: Thing[] };
  pagination?: { cursor?: string };
}

const paginator = twitch.paginate<Thing, ThingsBody>(
  { path: "some/new/list", query: { broadcaster_id: channelId } },
  { max: 25, extract: (body) => ({ data: body.data.things, cursor: body.pagination?.cursor }) },
);

const page = await paginator;
console.log(page.raw.data.owner_id, page.data.length);
```

## Limits to know about

- Bodies are JSON only, and paths are resolved under the Helix base URL. `request()` cannot reach another host.
- The types `Endpoint`, `PageConfig`, `RequestOptions` and `HttpMethod` are exported if you need to name them.
- For an EventSub type newer than the library you do not need `request()`: the listeners accept any `"type@version"` name, see [Typed events](/events/typed-events/).

## See also

- [Acting as a user](/basics/acting-as-a-user/): how `as`, `auth` and `context` decide the token.
- [Rate limits and retries](/basics/rate-limits-and-retries/): what `timeout`, `retries` and `signal` cover.
- [Pagination](/basics/pagination/): what the paginator returned by `paginate()` can do.
- [Client options](/reference/client-options/): the same settings for the whole client.
