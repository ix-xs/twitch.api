---
title: "Clips and markers"
description: "Two chat commands, one that clips the last seconds of the stream and posts the link, one that drops a stream marker, then how to list recent clips and download them."
sidebar:
  order: 6
---

This recipe adds two commands to a channel's chat. `!clip` creates a clip of the last seconds of the stream and replies with its link. `!mark` drops a stream marker, a bookmark in the recording that the broadcaster finds again when editing highlights. The last part lists the clips of the week and gets the links to their video files.

## What you need

| | |
| --- | --- |
| Application | A client ID from the [Twitch developer console](https://dev.twitch.tv/console/apps). The program signs in with the device code flow, which needs no client secret. |
| Account | The broadcaster. |
| Token | A user token of that account. |
| Scopes | `clips:edit` for `!clip`, `channel:manage:broadcast` for `!mark`, `user:read:chat` and `user:write:chat` for the commands, `channel:manage:clips` for the download links. |

Both commands need a live stream: there is nothing to clip or to mark on an offline channel.

## Sign in and read the chat

The program keeps the token in a file and runs the device code flow when the file is empty, as in the [chat bot recipe](/recipes/chat-bot/). Give this program a token file of its own: a token saved by another program may belong to another account or lack these scopes. It then listens to the chat of the broadcaster's own channel.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [broadcaster] = await twitch.auth.restore();
if (!broadcaster) {
  const flow = await twitch.auth.deviceFlow({
    scopes: ["user:read:chat", "user:write:chat", "clips:edit", "channel:manage:broadcast", "channel:manage:clips"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on("channel.chat.message", { broadcaster_user_id: broadcaster_id, user_id: broadcaster_id }, (event) => {
  console.log(`${event.chatter_user_name}: ${event.message.text}`);
});
```

## Create a clip and post its link

`clips.create` answers at once with the ID of the clip, but the clip itself is made in the background. Look it up with `clips.get` until it shows up, then use its `url`.

```ts
import type { Clip } from "@ix-xs/twitch.api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Resolves once the clip exists, or with `undefined` after 60 seconds.
async function waitForClip(id: string): Promise<Clip | undefined> {
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(2000);
    const [clip] = (await twitch.clips.get({ id })).data;
    if (clip) return clip;
  }
  return undefined;
}

async function clip(): Promise<string> {
  const created = await twitch.clips.create({ broadcaster_id });
  const ready = await waitForClip(created.id);
  return ready ? ready.url : "The clip did not come through.";
}
```

Without a `duration`, Twitch clips the last 30 seconds. Pass a value from 5 to 60 to change it, and a `title` to name the clip.

The clip is created by the user whose token makes the call, here the broadcaster. The endpoint is not tied to the broadcaster's token, so the same code works from a bot account that has the `clips:edit` scope.

## Drop a marker

`streams.createMarker` marks the current position of the live stream. The `description` is a note of 140 characters at most, attached to the marker.

```ts
async function mark(description: string): Promise<string> {
  const marker = await twitch.streams.createMarker({ description: description.slice(0, 140) });
  const minutes = Math.floor(marker.position_seconds / 60);
  return `Marked at ${minutes} min ${marker.position_seconds % 60} s`;
}
```

The `user_id` of the broadcaster is left out: it defaults to the user making the call. A marker is refused when the channel is offline, when it does not keep recordings of its streams, or during a rerun.

## Handle an offline channel

When the stream is not live, Twitch answers both calls with an error, which the client throws as a `TwitchApiError`. Catch it around the commands, print its message and tell the viewer.

```ts
import { TwitchApiError } from "@ix-xs/twitch.api";

declare function clip(): Promise<string>;

async function run(): Promise<string> {
  try {
    return await clip();
  } catch (error) {
    if (!(error instanceof TwitchApiError)) throw error;
    console.error(`${error.status}: ${error.message}`);
    return "That did not work. Is the stream live?";
  }
}
```

The message is the one Twitch wrote, followed by the status, the method and the path of the request. Anything that is not a `TwitchApiError`, a network failure for instance, is thrown again and reaches `onError`.

## The whole file

`!clip` is open to everyone, with a pause of 30 seconds between two clips. `!mark` is reserved to the broadcaster and the moderators, recognized by their badges.

```ts title="src/clips.ts"
import { Twitch, TwitchApiError, type Clip } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [broadcaster] = await twitch.auth.restore();
if (!broadcaster) {
  const flow = await twitch.auth.deviceFlow({
    scopes: ["user:read:chat", "user:write:chat", "clips:edit", "channel:manage:broadcast", "channel:manage:clips"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Resolves once the clip exists, or with `undefined` after 60 seconds.
async function waitForClip(id: string): Promise<Clip | undefined> {
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(2000);
    const [clip] = (await twitch.clips.get({ id })).data;
    if (clip) return clip;
  }
  return undefined;
}

async function clip(): Promise<string> {
  const created = await twitch.clips.create({ broadcaster_id });
  const ready = await waitForClip(created.id);
  return ready ? ready.url : "The clip did not come through.";
}

async function mark(description: string): Promise<string> {
  const marker = await twitch.streams.createMarker({ description: description.slice(0, 140) });
  const minutes = Math.floor(marker.position_seconds / 60);
  return `Marked at ${minutes} min ${marker.position_seconds % 60} s`;
}

const CLIP_PAUSE_MS = 30_000;
let lastClip = 0;

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on("channel.chat.message", { broadcaster_user_id: broadcaster_id, user_id: broadcaster_id }, async (event) => {
  const [name, ...words] = event.message.text.trim().split(/\s+/);
  const trusted = event.badges.some((badge) => badge.set_id === "moderator" || badge.set_id === "broadcaster");

  let reply: string;
  try {
    if (name === "!clip" && Date.now() - lastClip > CLIP_PAUSE_MS) {
      lastClip = Date.now();
      reply = await clip();
    } else if (name === "!mark" && trusted) {
      reply = await mark(words.join(" ") || "Marked from chat");
    } else {
      return;
    }
  } catch (error) {
    if (!(error instanceof TwitchApiError)) throw error;
    console.error(`${error.status}: ${error.message}`);
    reply = "That did not work. Is the stream live?";
  }

  await twitch.chat.send({ broadcaster_id, message: reply, reply_parent_message_id: event.message_id });
});
```

Run it with [tsx](https://tsx.is/), in a project that is an ES module (`"type": "module"` in `package.json`), with `TWITCH_CLIENT_ID` in a `.env` file:

```bash
node --env-file=.env --import tsx src/clips.ts
```

## List the latest clips

`clips.get` returns the clips of a channel with the most viewed first, not the newest. To get recent ones, ask for the clips created since a date, then sort them yourself. When `ended_at` is left out, Twitch stops one week after `started_at`.

```ts
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const clips = await twitch.clips.get({ broadcaster_id, started_at: weekAgo }).all({ limit: 100 });
clips.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

for (const clip of clips.slice(0, 5)) {
  console.log(`${clip.created_at}  ${clip.title}  by ${clip.creator_name}  ${clip.url}`);
}
```

`clips.get` accepts any token and any channel: nothing here is reserved to the broadcaster.

## Get the download links

`clips.downloads` returns temporary links to the video files of clips. It is reserved to the broadcaster and to the editors of the channel, with the `channel:manage:clips` or the `editor:manage:clips` scope. Each of the two links, landscape and portrait, is `null` when the clip has no file in that format.

```ts
const clips = await twitch.clips.get({ broadcaster_id }).take(5);

const files = await twitch.clips.downloads({ broadcaster_id, clip_id: clips.map((clip) => clip.id) });
for (const file of files) {
  console.log(file.clip_id, file.landscape_download_url ?? file.portrait_download_url ?? "no file");
}
```

The `editor_id` parameter, the user who asks for the files, defaults to the user making the call.

## Going further

### Read the markers back

`streams.markers` lists the markers of a user's most recent video, grouped by video. It takes the `user_id` explicitly.

```ts
const [group] = (await twitch.streams.markers({ user_id: broadcaster_id })).data;
for (const video of group?.videos ?? []) {
  for (const marker of video.markers) {
    console.log(`${marker.position_seconds} s  ${marker.description}  ${marker.url}`);
  }
}
```

### Clip a past broadcast

`clips.createFromVod` clips a passage of a recorded video. `vod_offset` is where the clip ends, in seconds from the start of the video, and the clip covers the `duration` seconds before it. It needs the same scope as the download links.

```ts
const created = await twitch.clips.createFromVod({
  broadcaster_id,
  vod_id: "2301456789",
  vod_offset: 600,
  duration: 45,
  title: "The opening",
});
console.log(created.edit_url);
```

## See also

- [twitch.clips](/reference/api/clips/): every parameter and field of clips.
- [streams.createMarker](/reference/api/streams/#createmarker): parameters and return value of a marker.
- [Errors](/basics/errors/): the fields of `TwitchApiError` and the other error classes.
- [A chat bot](/recipes/chat-bot/): a command table and a per-user cooldown.
