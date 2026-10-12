---
title: "Channel stats"
description: "One function that gathers the numbers of a channel in parallel: profile, live status, followers, subscribers, recent clips and upcoming streams."
sidebar:
  order: 8
---

This recipe builds a `channelStats(login)` function that returns everything a dashboard or a profile card shows about a channel: who they are, what they stream, whether they are live, how many people follow and subscribe, their latest clips and their next scheduled streams. All but one of these parts need nothing more than the app token.

## What you need

| | |
| --- | --- |
| Application | A client ID and a client secret from the [Twitch developer console](https://dev.twitch.tv/console/apps). See [Credentials](/credentials/). |
| Token | The app token for the public parts. The broadcaster's user token for the subscribers. |
| Scopes | `channel:read:subscriptions`, granted by the broadcaster, for the subscriber count and points. Nothing else. |

Here is which call feeds each part, and the token it uses:

| Part | Call | Token |
| --- | --- | --- |
| Profile | `users.getByLogin` | App |
| Title, category, tags | `channels.get` | App |
| Live status and viewers | `streams.get` | App |
| Follower count | `channels.followers(...).total()` | App |
| Latest clips | `clips.get` | App |
| Next streams | `schedule.get` | App |
| Subscriber count and points | `subscriptions.get` | Broadcaster |

## Read the public parts

The client needs only its credentials. Everything is addressed by user ID, so the login is resolved first.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("Unknown channel");
const broadcaster_id = user.id;

const [channel] = await twitch.channels.get({ broadcaster_id });
const stream = await twitch.streams.get({ user_id: broadcaster_id }).first();
const followers = await twitch.channels.followers({ broadcaster_id }).total();

console.log(channel?.title, stream?.viewer_count ?? "offline", followers);
```

Each call returns the shape that fits it:

- `channels.get` resolves with an array, because it accepts several IDs. The first item is the channel.
- `streams.get` is a list of live streams. `first()` gives the stream of the channel, or `undefined` when it is offline.
- `channels.followers` is a list too, but `total()` reads the count Twitch reports with it, through a request for a single item. The list of followers itself is only given to the broadcaster and their moderators. The count is given to any token.

## Add the clips and the schedule

These two need a little more care, so each gets its own function.

Clips come back with the most viewed first. To get recent ones, take the clips created in the last 7 days and sort them by date. The schedule fails with a 404 when the channel has no schedule, which is not an error for a dashboard.

```ts
import { TwitchApiError, type Clip, type ScheduleSegment } from "@ix-xs/twitch.api";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function latestClips(broadcaster_id: string): Promise<Clip[]> {
  const started_at = new Date(Date.now() - WEEK_MS);
  const clips = await twitch.clips.get({ broadcaster_id, started_at }).all({ limit: 100 });
  return clips.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5);
}

async function nextStreams(broadcaster_id: string): Promise<ScheduleSegment[]> {
  try {
    const segments = await twitch.schedule.get({ broadcaster_id }).take(5);
    // A canceled occurrence of a recurring stream is still listed.
    return segments.filter((segment) => segment.canceled_until === null).slice(0, 3);
  } catch (error) {
    if (error instanceof TwitchApiError && error.status === 404) return [];
    throw error;
  }
}
```

`started_at` is a `Date` here. Parameters that take a timestamp accept a `Date` or an RFC 3339 string.

## Add the subscribers

The subscriber list belongs to the broadcaster. `subscriptions.get` needs their user token with the `channel:read:subscriptions` scope. A page of it carries two numbers next to the items: `total`, the number of subscribers, and `raw.points`, the subscriber points that decide how many emote slots the channel gets.

```ts
async function subscribers(broadcaster_id: string): Promise<{ count: number; points: number } | null> {
  // Only the broadcaster's own token can read this.
  const token = twitch.auth.getUser(broadcaster_id);
  if (!token?.scopes.includes("channel:read:subscriptions")) return null;

  const page = await twitch.subscriptions.get({ broadcaster_id, first: 1 });
  return { count: page.total ?? 0, points: page.raw.points ?? 0 };
}
```

The function looks at the registered users before it calls. When the broadcaster never signed in to your application, it returns `null` and the rest of the stats is still complete. When they did, the client picks their token on its own, because the `broadcaster_id` of the request is a registered user.

Register a broadcaster with one of the flows of [Authentication](/auth/overview/), or directly when you already hold their tokens:

```ts
await twitch.auth.addUser({ accessToken, refreshToken });
```

With a token store, call `await twitch.auth.restore()` once at startup. `getUser` only sees the tokens that are loaded.

## Gather everything in parallel

The profile comes first, since the other calls need the ID and there is nothing to gather for a login that does not exist. The six other calls then leave together and `Promise.all` waits for the slowest one.

```ts
import type { Clip, ScheduleSegment } from "@ix-xs/twitch.api";

// The three functions of the previous steps.
declare function latestClips(broadcaster_id: string): Promise<Clip[]>;
declare function nextStreams(broadcaster_id: string): Promise<ScheduleSegment[]>;
declare function subscribers(broadcaster_id: string): Promise<{ count: number; points: number } | null>;

async function channelStats(login: string) {
  const user = await twitch.users.getByLogin(login);
  if (!user) return null;
  const broadcaster_id = user.id;

  const [channels, stream, followers, subs, clips, upcoming] = await Promise.all([
    twitch.channels.get({ broadcaster_id }),
    twitch.streams.get({ user_id: broadcaster_id }).first(),
    twitch.channels.followers({ broadcaster_id }).total(),
    subscribers(broadcaster_id),
    latestClips(broadcaster_id),
    nextStreams(broadcaster_id),
  ]);

  return { user, channel: channels[0], stream, followers, subs, clips, upcoming };
}
```

Up to seven requests go out for one channel, all but the first at the same moment. The client spreads them over the rate limit by itself: when the bucket is empty, a request waits for it to refill.

## The whole file

The complete file also turns the pieces into one flat, typed object, ready to be sent as JSON.

```ts title="src/channel-stats.ts"
import { Twitch, TwitchApiError, type Clip, type ScheduleSegment } from "@ix-xs/twitch.api";

export interface ChannelStats {
  id: string;
  login: string;
  name: string;
  avatar: string;
  title: string;
  category: string;
  /** `null` when the channel is offline. */
  live: { viewers: number; since: string } | null;
  followers: number;
  /** `null` when the broadcaster's token is not registered. */
  subscribers: { count: number; points: number } | null;
  clips: Clip[];
  upcoming: ScheduleSegment[];
}

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function latestClips(broadcaster_id: string): Promise<Clip[]> {
  const started_at = new Date(Date.now() - WEEK_MS);
  const clips = await twitch.clips.get({ broadcaster_id, started_at }).all({ limit: 100 });
  return clips.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5);
}

async function nextStreams(broadcaster_id: string): Promise<ScheduleSegment[]> {
  try {
    const segments = await twitch.schedule.get({ broadcaster_id }).take(5);
    // A canceled occurrence of a recurring stream is still listed.
    return segments.filter((segment) => segment.canceled_until === null).slice(0, 3);
  } catch (error) {
    if (error instanceof TwitchApiError && error.status === 404) return [];
    throw error;
  }
}

async function subscribers(broadcaster_id: string): Promise<{ count: number; points: number } | null> {
  // Only the broadcaster's own token can read this.
  const token = twitch.auth.getUser(broadcaster_id);
  if (!token?.scopes.includes("channel:read:subscriptions")) return null;

  const page = await twitch.subscriptions.get({ broadcaster_id, first: 1 });
  return { count: page.total ?? 0, points: page.raw.points ?? 0 };
}

export async function channelStats(login: string): Promise<ChannelStats | null> {
  const user = await twitch.users.getByLogin(login);
  if (!user) return null;
  const broadcaster_id = user.id;

  const [channels, stream, followers, subs, clips, upcoming] = await Promise.all([
    twitch.channels.get({ broadcaster_id }),
    twitch.streams.get({ user_id: broadcaster_id }).first(),
    twitch.channels.followers({ broadcaster_id }).total(),
    subscribers(broadcaster_id),
    latestClips(broadcaster_id),
    nextStreams(broadcaster_id),
  ]);
  const channel = channels[0];

  return {
    id: user.id,
    login: user.login,
    name: user.display_name,
    avatar: user.profile_image_url,
    title: channel?.title ?? "",
    category: channel?.game_name ?? "",
    live: stream ? { viewers: stream.viewer_count, since: stream.started_at } : null,
    followers: followers ?? 0,
    subscribers: subs,
    clips,
    upcoming,
  };
}

const stats = await channelStats(process.argv[2] ?? "twitchdev");
console.log(JSON.stringify(stats, null, 2));
```

Put the credentials in a `.env` file and run it with [tsx](https://tsx.is/), in a project that is an ES module (`"type": "module"` in `package.json`):

```ini
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
```

```bash
node --env-file=.env --import tsx src/channel-stats.ts some_channel
```

## Going further

### Look at many channels at once

Calling the function in a loop costs up to seven requests per channel. For a list, the lookups that accept several values do most of the work in one request each. Lists longer than 100 are split for you by `users.get` and `channels.get`.

```ts
const logins = ["twitchdev", "twitch", "twitchgaming"];

const users = await twitch.users.get({ login: logins });
const ids = users.map((user) => user.id);

const [channels, live] = await Promise.all([
  twitch.channels.get({ broadcaster_id: ids }),
  twitch.streams.get({ user_id: ids }).all(),
]);

const liveIds = new Set(live.map((stream) => stream.user_id));
for (const channel of channels) {
  console.log(channel.broadcaster_name, liveIds.has(channel.broadcaster_id) ? "live" : "offline", channel.title);
}
```

`streams.get` takes up to 100 IDs per call. Follower counts, clips and schedules have no batch form: they stay one request per channel.

### Keep the result for a minute

A page that shows these numbers to every visitor should not ask Twitch for them on every view. A small cache in front of the function is enough.

```ts
declare function channelStats(login: string): Promise<object | null>;

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; stats: Promise<object | null> }>();

function cachedStats(login: string): Promise<object | null> {
  const key = login.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.stats;

  const stats = channelStats(key);
  cache.set(key, { at: Date.now(), stats });
  // Do not keep a failure for a minute.
  stats.catch(() => cache.delete(key));
  return stats;
}
```

Storing the promise, not its result, also means that two visitors who arrive together share one round of requests.

### Start from an ID

When you already have the ID of the channel, there is no login to resolve. Put `twitch.users.getById(id)` in the `Promise.all` with the six other calls, and all seven leave at once.

## See also

- [Calling the API](/basics/calling-the-api/): the return shapes, and lookups merged or split for you.
- [Pagination](/basics/pagination/): `first()`, `total()`, `take()` and `page.raw`.
- [Acting as a user](/basics/acting-as-a-user/): how the broadcaster's token is picked for a call.
- [Rate limits and retries](/basics/rate-limits-and-retries/): what happens when many requests leave together.
- [subscriptions.get](/reference/api/subscriptions/#get): the subscriber list and its totals.
