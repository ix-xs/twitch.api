---
title: "Quick start"
description: "Install the library, build a client and make your first calls to the Twitch API. Public data needs nothing more than a client ID and a client secret."
---

This page takes you from an empty folder to a program that reads a user profile and lists live streams. It uses public data only, so you do not need a user token yet.

## Install

```bash
npm install @ix-xs/twitch.api
```

The library needs Node.js 22 or later. It also runs on Bun, Deno and Cloudflare Workers, see [Runtimes](/basics/runtimes/). It has no dependency.

## Build the client

The client ID and the client secret come from an application you register in the Twitch developer console: [Getting credentials](/credentials/) walks through it. Put them in a `.env` file next to your code:

```ini title=".env"
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
```

Then create the client. One instance covers the whole API, and you can keep it for the lifetime of your program.

```ts title="index.mjs"
import { Twitch } from "@ix-xs/twitch.api";

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;
if (!TWITCH_CLIENT_ID) throw new Error("TWITCH_CLIENT_ID is not set");

const twitch = new Twitch({
  clientId: TWITCH_CLIENT_ID,
  clientSecret: TWITCH_CLIENT_SECRET,
});
```

Building the client sends nothing to Twitch. The first request goes out with your first call.

## Make a first call

Every endpoint is a method on a group of the client. `users.getByLogin` looks up one user by login name and resolves with `null` when nobody has that name.

```ts
const user = await twitch.users.getByLogin("twitchdev");

if (user) {
  console.log(user.id, user.display_name, user.created_at);
}
```

Keep the `id`: most of the Twitch API works with user IDs, not with login names.

## Read a list

Endpoints that return a list give you a paginator. Loop over it with `for await` to get every item, page after page, or ask for the first few with `take()`.

```ts
// Every live stream in French, most viewers first.
for await (const stream of twitch.streams.get({ language: "fr" })) {
  console.log(stream.user_name, stream.viewer_count);
  if (stream.viewer_count < 1000) break; // leaving the loop stops the paging
}

// The ten most watched streams, in one request.
const top = await twitch.streams.get().take(10);
console.log(top.map((stream) => stream.user_login));
```

[Pagination](/basics/pagination/) covers the other ways to read a list: one page at a time, everything in an array, or only the total.

## Run it

Here is the whole program.

```ts title="index.mjs"
import { Twitch } from "@ix-xs/twitch.api";

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;
if (!TWITCH_CLIENT_ID) throw new Error("TWITCH_CLIENT_ID is not set");

const twitch = new Twitch({
  clientId: TWITCH_CLIENT_ID,
  clientSecret: TWITCH_CLIENT_SECRET,
});

const user = await twitch.users.getByLogin("twitchdev");
if (user) console.log(user.id, user.display_name, user.created_at);

const top = await twitch.streams.get().take(10);
for (const stream of top) {
  console.log(stream.user_name, stream.game_name, stream.viewer_count);
}
```

```bash
node --env-file=.env index.mjs
```

The examples of this site are written in TypeScript. This one has no type annotation, so it runs as plain JavaScript too.

## What happened behind the scenes

You wrote two calls. The client did the rest:

- It requested an app access token with your client ID and client secret when the first call needed one, and it reuses that token until it is about to expire.
- It sent the token and the client ID with each request, and read the rate limit headers of each response. When the limit is reached, requests wait for it to reset instead of failing.
- It asked for the right page size: 10 items for `take(10)`, pages of 100 for the `for await` loop.
- It would have turned a failure into a typed error, such as `TwitchApiError` with the status and the message Twitch sent. See [Errors](/basics/errors/).

## Use CommonJS

The package ships both ES modules and CommonJS. With `require`, wrap your calls in an `async` function, since CommonJS has no top-level `await`.

```js title="index.cjs"
const { Twitch } = require("@ix-xs/twitch.api");

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
});

async function main() {
  const user = await twitch.users.getByLogin("twitchdev");
  console.log(user?.display_name);
}

main();
```

## See also

- [Calling the API](/basics/calling-the-api/): groups, parameters and what each kind of method returns.
- [Acting as a user](/basics/acting-as-a-user/): send chat messages, moderate and run polls with user tokens.
- [Events overview](/events/overview/): receive chat messages, follows and streams going live as they happen.
- [Chat bot](/recipes/chat-bot/): a complete program to copy.
- [Reference](/reference/overview/): every method, group by group.
