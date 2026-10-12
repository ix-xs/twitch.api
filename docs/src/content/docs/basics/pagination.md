---
title: "Pagination"
description: "List endpoints return a paginator. Await it for one page, loop over it for every item, or ask for an array, the first item or the total."
sidebar:
  order: 3
---

Twitch serves lists page by page, with a cursor to pass along to get the next one. The library hides the cursor: every list endpoint returns a `Paginator`, and you choose how much of the list you want by the way you use it.

## A first example

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

// One page.
const page = await twitch.streams.get({ game_id: "509658", first: 20 });
console.log(page.data.length, page.hasNext);

// Every item, page after page.
for await (const stream of twitch.streams.get({ game_id: "509658" })) {
  console.log(stream.user_name, stream.viewer_count);
}

// The first 250 items, in an array.
const top = await twitch.streams.get().take(250);
```

Calling `twitch.streams.get()` sends nothing. A paginator fetches when you await it, loop over it or call one of its methods.

## Choose how to read a list

| You want | Write | Requests |
| --- | --- | --- |
| One page | `await paginator` | 1 |
| Every item | `for await (const item of paginator)` | One per page, as the loop advances |
| Every page | `for await (const page of paginator.pages())` | One per page, as the loop advances |
| All items in an array | `await paginator.all()` | One per page |
| At most `n` items | `await paginator.take(n)` or `.all({ limit: n })` | As few as `n` allows |
| The first item | `await paginator.first()` | 1 |
| The total Twitch reports | `await paginator.total()` | 1 |

## Read one page

Awaiting a paginator fetches its first page and gives you a `Page`.

```ts
const page = await twitch.streams.get({ language: "fr", first: 50 });

page.data; // the items of this page
page.cursor; // cursor of the following page, undefined on the last one
page.hasNext; // whether another page follows
page.total; // total across all pages, for the endpoints that report one
page.raw; // the response body as Twitch sent it

for (const stream of page) console.log(stream.title); // a page is iterable
```

`page.next()` fetches the following page with the same page size, and resolves with `null` after the last one.

```ts
let page = await twitch.clips.get({ broadcaster_id: channelId, first: 20 });

while (true) {
  for (const clip of page.data) console.log(clip.title, clip.view_count);
  const next = await page.next();
  if (!next) break;
  page = next;
}
```

To continue later, for example on the next click of a "load more" button, keep `page.cursor` and pass it back as `after`:

```ts
declare const savedCursor: string;

const page = await twitch.clips.get({ broadcaster_id: channelId, first: 20, after: savedCursor });
```

## Go through every item

`for await` walks the whole list and fetches each page when the loop reaches it. Leave the loop with `break` or `return` and no further page is requested.

```ts
// Past broadcasts of a channel, newest first, back to the start of 2026.
for await (const video of twitch.videos.get({ user_id: channelId, type: "archive" })) {
  if (video.created_at < "2026-01-01") break;
  console.log(video.created_at, video.title, video.duration);
}
```

When you prefer to work page by page, for instance to write each page to a database in one query, loop over `pages()`:

```ts
declare function saveAll(rows: { user_id: string; user_login: string }[]): Promise<void>;

for await (const page of twitch.chat.chatters({ broadcaster_id: channelId }).pages()) {
  await saveAll(page.data);
}
```

## Collect items into an array

`all()` reads until the last page and resolves with one array. `take(n)` stops after `n` items, and is the same as `all({ limit: n })`.

```ts
const banned = await twitch.moderation.bans().all();
const latestClips = await twitch.clips.get({ broadcaster_id: channelId }).take(10);
const someStreams = await twitch.streams.get({ language: "fr" }).all({ limit: 300 });
```

Set a limit on any list whose length you do not control. `twitch.streams.get().all()` would read every live stream on Twitch.

`first()` resolves with the first item, or `undefined` when the list is empty:

```ts
const lastPoll = await twitch.polls.get().first();
if (lastPoll) console.log(lastPoll.title, lastPoll.status);
```

## Get a total

Some endpoints report how many items the whole list holds: followers, followed channels, subscribers, chatters. `total()` reads that number with the smallest request the endpoint allows. It resolves with `undefined` when the endpoint reports no total.

```ts
const followers = await twitch.channels.followers({ broadcaster_id: channelId }).total();
const chatters = await twitch.chat.chatters({ broadcaster_id: channelId }).total();
```

If you already have a page, `page.total` holds the same number and costs no request.

## Which page size is used

The `first` parameter is the page size. When you set it, every request of that paginator uses it. When you leave it out, the library picks one that fits what you asked:

| Usage | Page size when `first` is not set |
| --- | --- |
| `await paginator` | Twitch's default, 20 on most endpoints |
| `for await`, `pages()`, `all()` | The largest the endpoint accepts |
| `take(n)`, `all({ limit: n })` | `n`, or the largest the endpoint accepts if `n` is greater |
| `first()` | 1 |
| `total()` | 1, whatever `first` says |

The largest page is 100 items on most endpoints. It is 1000 for `chat.chatters` and `entitlements.drops`, 50 for `channelPoints.redemptions`, 25 for `predictions.get` and `schedule.get`, 20 for `polls.get`.

So `take(10)` sends one request for 10 items, and `take(250)` sends three requests of 100.

## Page backward

Some endpoints accept a `before` cursor (`streams.get`, `games.top`, `clips.get`, `subscriptions.get`, `moderation.bans`, among others). When you pass one, the paginator pages backward: each following request sends the new cursor as `before` instead of `after`.

```ts
const page = await twitch.games.top({ first: 20 });
const second = await page.next();

// From the cursor of the second page, walk back toward the start.
if (second?.cursor) {
  const previous = await twitch.games.top({ first: 20, before: second.cursor });
  console.log(previous.data.map((game) => game.name));
}
```

## Read extra fields of the response

Some endpoints send fields next to the list. They are in `page.raw`, which is typed for these endpoints.

```ts
// Subscribers: the total and the subscriber points of the channel.
const subs = await twitch.subscriptions.get({ first: 1 });
console.log(subs.total, subs.raw.points);

// EventSub subscriptions: what they cost against your limit.
const subscriptions = await twitch.eventsub.subscriptions({ status: "enabled" });
console.log(subscriptions.raw.total, subscriptions.raw.total_cost, subscriptions.raw.max_total_cost);
```

The same goes for `schedule.get` (the broadcaster and the vacation, under `page.raw.data`) and `chat.userEmotes` (`page.raw.template`). On the other endpoints `raw` is typed `unknown`.

## Limits to know about

- Three endpoints have no page size: `eventsub.subscriptions`, `conduits.shards` and `chat.userEmotes`. Twitch decides how many items a page holds. `take(n)` still stops at `n` items, but `first()` and `total()` fetch a whole first page.
- Live lists move while you page through them. `streams.get` is sorted by viewer count, which changes between two requests, so a stream can appear twice or be skipped. Keep a `Set` of the IDs you have seen when duplicates matter.
- Twitch stops paging some lists early. `clips.get` ends after about 1000 results: narrow `started_at` and `ended_at` to reach more.
- If Twitch hands back a cursor it already gave, the iteration stops instead of looping forever.
- Each page is an ordinary request: it follows the rate limit, is retried like any `GET`, and can throw. An error thrown in the middle of a `for await` loop comes out of the loop. The request options you passed to the method apply to every page, so an `AbortSignal` cancels the whole iteration.
- A paginator can be awaited but is not a `Promise`: it has `then`, not `catch` or `finally`. Use `try` and `catch` around the `await`.

```ts
const seen = new Set<string>();

for await (const stream of twitch.streams.get({ language: "fr" })) {
  if (seen.has(stream.id)) continue;
  seen.add(stream.id);
}
```

## See also

- [Calling the API](/basics/calling-the-api/): the other shapes a method can return.
- [Rate limits and retries](/basics/rate-limits-and-retries/): what happens when a long iteration reaches the limit.
- [Request options](/basics/request-options/): `twitch.paginate()` for a list endpoint the library does not have yet.
- [streams.get](/reference/api/streams/#get): parameters and fields of the example used on this page.
