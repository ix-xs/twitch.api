---
title: "Calling the API"
description: "How the methods of the client are organised, what they take and what they return. Read this once and every group works the same way."
sidebar:
  order: 1
---

Every endpoint of the Twitch API is a method on a group of the client: `twitch.users`, `twitch.chat`, `twitch.moderation` and 27 others. All of them follow the same few conventions, described here.

## A first example

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("No such user");

const [channel] = await twitch.channels.get({ broadcaster_id: user.id });
const games = await twitch.games.get({ name: ["Fortnite", "Minecraft"] });
const clips = await twitch.clips.get({ broadcaster_id: user.id }).take(5);

console.log(channel?.title, games.length, clips.length);
```

## Pass parameters

A method takes one object of parameters, with the names the Twitch API uses: `broadcaster_id`, `user_id`, `first`, `started_at`. Nothing is renamed, so the official reference and this library read the same.

```ts
await twitch.chat.updateSettings({
  broadcaster_id: channelId,
  slow_mode: true,
  slow_mode_wait_time: 10,
});
```

You do not have to know which fields travel in the query string and which in the body. Here `broadcaster_id` goes into the query and the two others into the JSON body, as Twitch expects. The `moderator_id` this endpoint also wants is filled in for you, see [Acting as a user](/basics/acting-as-a-user/).

Three details hold across all groups:

- IDs are strings, in parameters and in results.
- A field that accepts several values takes a string or an array: `{ id: "141981764" }` and `{ id: ["141981764", "12826"] }` both work.
- When every field is optional, the object itself is optional: `twitch.streams.get()`.

A few methods that need a single value take it directly: `twitch.users.getById(id)`, `twitch.users.getByLogin(login)`, `twitch.eventsub.unsubscribe(id)`, `twitch.conduits.delete(id)`.

Every method also accepts request options as its last argument, to pick a user or set a timeout for one call. See [Request options](/basics/request-options/).

## Know what comes back

Methods return one of five shapes. The return type tells you which, and so does the reference page of the method.

| Shape | Type | Examples |
| --- | --- | --- |
| A list | `Promise<T[]>` | `users.get`, `channels.get`, `games.get`, `chat.colors` |
| One object | `Promise<T>` | `users.me`, `chat.send`, `chat.settings`, `polls.create` |
| One object or nothing found | `Promise<T \| null>` | `users.getById`, `users.getByLogin`, `teams.get`, `subscriptions.check` |
| Nothing | `Promise<void>` | `chat.announce`, `moderation.unban`, `channels.update` |
| A paginator | `Paginator<T>` | `streams.get`, `channels.followers`, `clips.get`, `moderation.bans` |

```ts
// A list: items Twitch does not find are absent, the array can be empty.
const users = await twitch.users.get({ login: ["twitchdev", "nobody_has_this_login"] });

// One object or null.
const team = await twitch.teams.get({ name: "livecoders" });
if (team) console.log(team.users.length, "members");

// A paginator: nothing is fetched until you use it.
const followers = await twitch.channels.followers({ broadcaster_id: channelId }).total();
```

A missing item is not an error: a list leaves it out, and a lookup that can find nothing resolves with `null`. The rare exceptions are noted on the method, such as `channelPoints.rewards`, which Twitch answers with a `404` when none of the IDs you ask for exists. Everything else that goes wrong throws a typed error, see [Errors](/basics/errors/).

A paginator is the result of every endpoint that Twitch serves page by page. [Pagination](/basics/pagination/) describes what you can do with it.

A handful of methods return what fits their endpoint best: `streams.key()` resolves with the stream key as a string, `schedule.icalendar()` with iCalendar text, `videos.delete()` with the IDs that were deleted, `chat.globalEmotes()` with the emotes and their URL template.

## Look up many IDs at once

Twitch caps most lookups at 100 IDs per request. The library removes the cap: pass as many as you have, the list is split, the requests are sent in parallel and the answers are merged into one array.

```ts
declare const ids: string[]; // say, 450 user IDs

const users = await twitch.users.get({ id: ids }); // 5 requests, one array
```

This applies to the methods that return a plain list:

| Method | Fields split | Per request |
| --- | --- | --- |
| `users.get` | `id`, `login` | 100 in total |
| `channels.get` | `broadcaster_id` | 100 |
| `games.get` | `id`, `name`, `igdb_id` | 100 in total |
| `chat.colors` | `user_id` | 100 |
| `chat.emoteSets` | `emote_set_id` | 25 |
| `channelPoints.rewards` | `id` | 50 |
| `bits.customPowerUps` | `id` | 50 |
| `clips.downloads` | `clip_id` | 10 |
| `users.authorization` | `user_id` | 10 |

Paginated endpoints are not split. `streams.get({ user_id })`, for example, accepts up to 100 IDs, as its parameter documentation says.

## Look up one item many times

The opposite case is common in bots: many parts of the program each need one user at the same moment. `users.getById` and `users.getByLogin` merge the calls made in the same tick into one request.

```ts
// One HTTP request, not three.
const [a, b, c] = await Promise.all([
  twitch.users.getById("141981764"),
  twitch.users.getById("12826"),
  twitch.users.getById("57781936"),
]);
```

What to know about this merging:

- "The same tick" means calls started one after the other without an `await` in between: a `Promise.all`, a `map`, several event handlers that run back to back.
- Each of the two methods has its own batch. A mix of `getById` and `getByLogin` calls costs two requests.
- Asking twice for the same ID in one tick shares one lookup.
- `getByLogin` lowercases the login before it looks it up.
- A call that passes request options is sent on its own, since its options may differ from those of its neighbours.
- If the merged request fails, every call that was part of it rejects with the same error.

## Work with dates

Twitch sends timestamps as RFC 3339 strings, and the library leaves them as they are: `created_at`, `started_at`, `followed_at` are strings.

```ts
const stream = await twitch.streams.get({ user_login: "twitchdev" }).first();

if (stream) {
  const minutes = Math.round((Date.now() - new Date(stream.started_at).getTime()) / 60_000);
  console.log(`Live for ${minutes} minutes`);
}
```

In parameters, a field that expects a timestamp accepts a string or a `Date`. A `Date` is sent in ISO 8601 form.

```ts
const lastWeek = new Date(Date.now() - 7 * 24 * 3_600_000);

const clips = await twitch.clips.get({ broadcaster_id: channelId, started_at: lastWeek }).take(20);
```

## Find the method you need

- The [reference](/reference/overview/) lists every group and every method, with its parameters, its return type, the token it needs and an example.
- The home page of this site has a finder: type what you want to do ("ban", "followers", "poll") and it shows the matching methods and event types.
- In your editor, type `twitch.` and let autocompletion list the groups, then the methods. Each method carries its documentation: what it does, the token and the scope it needs, an example and a link to the official Twitch reference. Parameters and results are typed, field by field.

Method names are short and follow one pattern: `get` for the main read of a group (`users.get`, `streams.get`, `polls.get`), a noun for the other reads (`channels.followers`, `moderation.bans`), a verb for actions (`chat.send`, `moderation.ban`, `polls.create`).

## See also

- [Acting as a user](/basics/acting-as-a-user/): how the token of each call is chosen.
- [Pagination](/basics/pagination/): everything a paginator can do.
- [Errors](/basics/errors/): what is thrown and how to tell errors apart.
- [Request options](/basics/request-options/): per call settings, and calling an endpoint the library does not have yet.
- [Reference](/reference/overview/): all groups and methods.
