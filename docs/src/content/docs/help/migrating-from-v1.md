---
title: "Coming from version 1"
description: "What changed between version 1 and version 2, why, and the version 2 call that replaces each version 1 method."
---

Version 2 is a rewrite. Version 1 wrapped a dozen read-only endpoints with an app token. Version 2 covers the whole API, user tokens and EventSub, and its shape changed to make room for that. No version 1 call works unchanged, but every one of them has a direct replacement, and the conversion is mechanical.

## Before and after

The same program in both versions: look a channel up, say whether it is live, list five clips.

```js title="before.js (version 1)"
const twitchAPI = require("@ix-xs/twitch.api");

const client = new twitchAPI({
  client_id: process.env.TWITCH_CLIENT_ID,
  client_secret: process.env.TWITCH_CLIENT_SECRET,
});

async function main() {
  await client.initialize();

  const users = await client.getUsers(["twitchdev"]);
  if (!users.ok) return console.error(users.statusText ?? users.error);
  console.log(users.result[0].display_name);

  const streams = await client.getStreams({ users_names: ["twitchdev"] });
  if (!streams.ok) return console.error(streams.statusText ?? streams.error);
  console.log(streams.result.length > 0 ? `Live: ${streams.result[0].title}` : "Offline");

  const clips = await client.getClips("twitchdev", { first: 5 });
  if (!clips.ok) return console.error(clips.statusText ?? clips.error);
  console.log(clips.result.map((clip) => clip.url));
}

main();
```

```ts title="after.ts (version 2)"
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("No such user");
console.log(user.display_name);

const [stream] = await twitch.streams.get({ user_id: user.id }).take(1);
console.log(stream ? `Live: ${stream.title}` : "Offline");

const clips = await twitch.clips.get({ broadcaster_id: user.id }).take(5);
console.log(clips.map((clip) => clip.url));
```

## What changed and why

| | Version 1 | Version 2 | Why |
| --- | --- | --- | --- |
| Import | The module is the class | A named export, `Twitch`, for ESM and CommonJS | Room for the error classes, the stores and the types next to it |
| Options | Documented as `clientId` and `clientSecret`, read as `client_id` and `client_secret` | `clientId` and `clientSecret` | One spelling, the documented one |
| Startup | `await client.initialize()` | Nothing | Tokens are requested when a call needs them |
| Token storage | A `Token.json` file written inside `node_modules` | The app token stays in memory | The file broke on read-only file systems, with pnpm, in monorepos and at every reinstall |
| Results | `{ ok: true, result }` or `{ ok: false, ... }` | The value, or a thrown error | A forgotten `ok` check no longer hides a failure |
| Identifiers | Logins and game names | IDs, like the Twitch API | One request per call instead of a hidden lookup first, and the full parameter list of each endpoint |
| Lists | The first page, as an array | A paginator | Every page is reachable, without handling cursors |
| Methods | Flat: `client.getUsers` | Grouped: `twitch.users.get` | 155 methods need a table of contents |
| Runtime | CommonJS on Node.js | Node.js 22 or later, Bun, Deno, Workers, browsers | Only web standard APIs in the main entry |

## Update the package

```bash
npm install @ix-xs/twitch.api@latest
```

Version 2 needs Node.js 22 or later. It ships its own type declarations and has no dependency.

CommonJS still works. Only the shape of the import changes:

```js
// Version 1
const twitchAPI = require("@ix-xs/twitch.api");

// Version 2
const { Twitch } = require("@ix-xs/twitch.api");
```

## The constructor

Rename the class and the two options. Everything else in `TwitchOptions` is optional, see [Client options](/reference/client-options/).

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});
```

Version 1 read `client_id` and `client_secret`, whatever its README said. Version 2 reads `clientId` and `clientSecret`, and throws at once when `clientId` is missing.

## No initialize()

Delete the call. In version 1, `initialize()` loaded or requested the app token, validated it and started an hourly validation. In version 2:

- the app token is requested by the first call that needs it and renewed before it expires;
- a token Twitch rejects is replaced and the call is sent again;
- nothing is written to disk, so `Token.json` can go;
- no timer keeps the process alive, so a script ends when its work is done.

The other token methods of version 1 (`generateToken`, `isExpiredToken`, `refreshToken`, `validateToken`, `updateTokenFile`, `startPeriodicValidation`) have no replacement because nothing is left for them to do. If you need the app token for another tool, `await twitch.auth.appToken()` returns a valid one.

## Errors instead of ok

Version 1 never threw: every method resolved with an object to inspect. Version 2 resolves with the data and throws typed errors.

```ts
import { TwitchApiError, TwitchError } from "@ix-xs/twitch.api";

try {
  const games = await twitch.games.get({ name: ["Fortnite", "Minecraft"] });
  console.log(games.map((game) => game.id));
} catch (error) {
  if (error instanceof TwitchApiError) console.error(`Twitch answered ${error.status}: ${error.message}`);
  else if (error instanceof TwitchError) console.error(error.message);
  else throw error;
}
```

Three things replace the old `ok` checks:

- **Nothing found is not an error.** `users.getByLogin` and `users.getById` resolve with `null`. Methods that return arrays leave out what does not exist, so `users.get({ login: ["nobody-has-this-login"] })` resolves with `[]`.
- **A failure throws.** `TwitchApiError` carries the `status` that version 1 reduced to a `statusText`, along with Twitch's message and the response body.
- **Rate limits and outages are handled first.** A `429` waits and retries, a `5xx` on a read is retried. You only see the error when that did not help.

[Errors](/basics/errors/) shows the classes and how to tell them apart.

## IDs instead of logins

Version 1 took logins and game names and looked the IDs up behind your back, one extra request per call. Version 2 takes what the Twitch API takes. Resolve the login once, then reuse the ID:

```ts
const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("No such user");

const settings = await twitch.chat.settings({ broadcaster_id: user.id });
const { data: emotes } = await twitch.chat.channelEmotes({ broadcaster_id: user.id });
const badges = await twitch.chat.channelBadges({ broadcaster_id: user.id });
```

For several logins, one call returns all the users:

```ts
const users = await twitch.users.get({ login: ["twitchdev", "twitch"] });
const colors = await twitch.chat.colors({ user_id: users.map((user) => user.id) });
```

Games work the same way, by name first:

```ts
const games = await twitch.games.get({ name: ["Fortnite", "Minecraft"] });
const page = await twitch.streams.get({ game_id: games.map((game) => game.id), first: 50 });
console.log(page.data.length);
```

A user ID never changes, a login can. If you store channels, store their IDs.

Two shortcuts spare you the lookup: `streams.get` still accepts logins directly in `user_login`, and `getByLogin` calls made at the same moment are merged into one request.

## Method by method

| Version 1 | Version 2 | Returns |
| --- | --- | --- |
| `client.getUsers(["twitchdev"])` | [`twitch.users.get({ login: ["twitchdev"] })`](/reference/api/users/#get) | `User[]` |
| `client.getStreams({ users_names })` | [`twitch.streams.get({ user_login })`](/reference/api/streams/#get) | A paginator of `Stream` |
| `client.getStreams({ games_names })` | [`twitch.games.get({ name })`](/reference/api/games/#get), then [`twitch.streams.get({ game_id })`](/reference/api/streams/#get) | A paginator of `Stream` |
| `client.getCheermotes()` | [`twitch.bits.cheermotes()`](/reference/api/bits/#cheermotes) | `Cheermote[]` |
| `client.getChatEmotes()` | [`twitch.chat.globalEmotes()`](/reference/api/chat/#globalemotes) | `{ data, template }` |
| `client.getChatEmotes(login)` | [`twitch.chat.channelEmotes({ broadcaster_id })`](/reference/api/chat/#channelemotes) | `{ data, template }` |
| `client.getChatBadges()` | [`twitch.chat.globalBadges()`](/reference/api/chat/#globalbadges) | `ChatBadgeSet[]` |
| `client.getChatBadges(login)` | [`twitch.chat.channelBadges({ broadcaster_id })`](/reference/api/chat/#channelbadges) | `ChatBadgeSet[]` |
| `client.getChatSettings(login)` | [`twitch.chat.settings({ broadcaster_id })`](/reference/api/chat/#settings) | One `ChatSettings` |
| `client.getUsersChatColor(logins)` | [`twitch.chat.colors({ user_id })`](/reference/api/chat/#colors) | `UserChatColor[]` |
| `client.getClips(login)` | [`twitch.clips.get({ broadcaster_id })`](/reference/api/clips/#get) | A paginator of `Clip` |
| `client.getTopGames()` | [`twitch.games.top()`](/reference/api/games/#top) | A paginator of `Game` |
| `client.getGames(names)` | [`twitch.games.get({ name })`](/reference/api/games/#get) | `Game[]` |
| `client.getVideos(login)` | [`twitch.videos.get({ user_id })`](/reference/api/videos/#get) | A paginator of `Video` |

The other parameters kept the names Twitch gives them. For `getStreams`, that means `languages` became `language`, while `type`, `first`, `before` and `after` did not move. The `game_name` filter of `getVideos` became `game_id`.

Two return values changed shape beyond losing the `{ ok, result }` wrapper. The emote methods resolve with an object that holds the emotes in `data` and the image URL `template` next to them. `chat.settings` resolves with the settings object itself, not an array of one.

## Lists are paginators now

`getStreams`, `getClips`, `getTopGames` and `getVideos` returned one page. Their replacements return a paginator, which fetches nothing until you say how much you want.

```ts
// One page, like version 1.
const page = await twitch.games.top({ first: 20 });
console.log(page.data);

// A fixed number of items, however many pages that takes.
const top = await twitch.games.top().take(250);

// Every item, one page at a time.
for await (const video of twitch.videos.get({ user_id: userId })) {
  console.log(video.title);
}
```

[Pagination](/basics/pagination/) covers the rest.

## See also

- [Quick start](/quick-start/): version 2 from an empty folder.
- [Calling the API](/basics/calling-the-api/): groups, parameters and return shapes.
- [Errors](/basics/errors/): what replaces `{ ok, result }`.
- [Reference](/reference/overview/): every method of version 2.
