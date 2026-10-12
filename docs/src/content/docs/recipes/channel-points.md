---
title: "Channel Points"
description: "Create a custom reward, hear about each redemption as it happens, then mark it fulfilled or give the points back."
sidebar:
  order: 4
---

This recipe builds a program that owns one Channel Points reward. Viewers redeem "Pick the next map" and type the name of a map. The program checks what they typed: a valid choice is marked as fulfilled, anything else is canceled and the viewer gets their points back.

## What you need

| | |
| --- | --- |
| Application | A client ID from the [Twitch developer console](https://dev.twitch.tv/console/apps). The program signs in with the device code flow, which needs no client secret. |
| Account | The broadcaster. Channel Points exist on affiliate and partner channels only. |
| Token | A user token of the broadcaster. |
| Scopes | `channel:manage:redemptions`. It covers the reward, the event and the status changes. |

:::caution
An application can only manage the rewards it created. A reward made in the Twitch dashboard, or by another application, can be listed but not updated or deleted, and its redemptions can be neither read nor settled through the API. Create the reward with the same client ID that will handle it.
:::

## Sign in as the broadcaster

The program keeps the token in a file and runs the device code flow when the file is empty, as in the [chat bot recipe](/recipes/chat-bot/). Give this program a token file of its own: a token saved by another program may belong to another account or lack these scopes.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [broadcaster] = await twitch.auth.restore();
if (!broadcaster) {
  const flow = await twitch.auth.deviceFlow({ scopes: ["channel:manage:redemptions"] });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;
```

## Create the reward once

The title of a reward is unique in a channel, so creating it on every start would fail the second time. Look for it first among the rewards your application manages.

```ts
const TITLE = "Pick the next map";
const MAPS = ["dust", "mirage", "nuke"];

const mine = await twitch.channelPoints.rewards({ only_manageable_rewards: true });
const reward =
  mine.find((candidate) => candidate.title === TITLE) ??
  (await twitch.channelPoints.createReward({
    title: TITLE,
    cost: 500,
    prompt: `Type one of: ${MAPS.join(", ")}`,
    is_user_input_required: true,
  }));
const rewardId = reward.id;
```

`broadcaster_id` is not passed to either call: it defaults to the user making the call, the broadcaster.

Leave `should_redemptions_skip_request_queue` off, which is the default. With it, Twitch marks every redemption as fulfilled at once and there is nothing left to cancel.

## Listen to the redemptions

`channel.channel_points_custom_reward_redemption.add` fires each time a viewer redeems a reward. The `reward_id` of the condition narrows the subscription to one reward. Without it you receive the redemptions of every reward of the channel.

```ts
events.on(
  "channel.channel_points_custom_reward_redemption.add",
  { broadcaster_user_id: broadcaster_id, reward_id: rewardId },
  (event) => {
    console.log(`${event.user_name} redeemed "${event.reward.title}" with: ${event.user_input}`);
  },
);
```

A new redemption arrives with the status `unfulfilled`. It stays in the request queue of the channel until someone settles it.

## Fulfill or cancel

`updateRedemptions` takes the ID of the reward, the ID of the redemption and the new status. `FULFILLED` closes the redemption, `CANCELED` closes it and gives the points back.

```ts
const MAPS = ["dust", "mirage", "nuke"];

async function settle(redemption: { id: string; user_name: string; user_input: string }): Promise<void> {
  const choice = redemption.user_input.trim().toLowerCase();
  const valid = MAPS.includes(choice);

  await twitch.channelPoints.updateRedemptions({
    reward_id: rewardId,
    id: redemption.id,
    status: valid ? "FULFILLED" : "CANCELED",
  });
  console.log(valid ? `${redemption.user_name} picked ${choice}` : `Refunded ${redemption.user_name}`);
}
```

The function asks for three fields only, so it accepts the event of the subscription and a redemption read from the API alike. `id` also takes an array, up to 50 redemptions of the same reward in one call.

## The whole file

```ts title="src/rewards.ts"
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const TITLE = "Pick the next map";
const MAPS = ["dust", "mirage", "nuke"];

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [broadcaster] = await twitch.auth.restore();
if (!broadcaster) {
  const flow = await twitch.auth.deviceFlow({ scopes: ["channel:manage:redemptions"] });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;

// Reuse the reward of a previous run: titles are unique in a channel.
const mine = await twitch.channelPoints.rewards({ only_manageable_rewards: true });
const reward =
  mine.find((candidate) => candidate.title === TITLE) ??
  (await twitch.channelPoints.createReward({
    title: TITLE,
    cost: 500,
    prompt: `Type one of: ${MAPS.join(", ")}`,
    is_user_input_required: true,
  }));
const rewardId = reward.id;

async function settle(redemption: { id: string; user_name: string; user_input: string }): Promise<void> {
  const choice = redemption.user_input.trim().toLowerCase();
  const valid = MAPS.includes(choice);

  await twitch.channelPoints.updateRedemptions({
    reward_id: rewardId,
    id: redemption.id,
    status: valid ? "FULFILLED" : "CANCELED",
  });
  console.log(valid ? `${redemption.user_name} picked ${choice}` : `Refunded ${redemption.user_name}`);
}

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

const handle = events.on(
  "channel.channel_points_custom_reward_redemption.add",
  { broadcaster_user_id: broadcaster_id, reward_id: rewardId },
  settle,
);
await handle.ready;
console.log(`Waiting for redemptions of "${reward.title}"`);
```

Run it with [tsx](https://tsx.is/), in a project that is an ES module (`"type": "module"` in `package.json`), with `TWITCH_CLIENT_ID` in a `.env` file:

```bash
node --env-file=.env --import tsx src/rewards.ts
```

## Limits

- A channel holds 50 custom rewards at most, disabled ones included.
- A title is 45 characters at most, a prompt 200.
- The API writes statuses in uppercase (`UNFULFILLED`, `FULFILLED`, `CANCELED`), the event in lowercase (`unfulfilled`, `fulfilled`, `canceled`).
- Canceled and fulfilled redemptions stay listed for a few days only.

## Going further

### Settle what was redeemed while the program was off

Events sent while the program is not connected are not replayed, but the redemptions are still waiting in the queue. Read them with `redemptions` once the subscription is in place.

```ts
import type { CustomRewardRedemption } from "@ix-xs/twitch.api";

declare function settle(redemption: CustomRewardRedemption): Promise<void>;

const pending = twitch.channelPoints.redemptions({ reward_id: rewardId, status: "UNFULFILLED" });
for await (const redemption of pending) {
  await settle(redemption);
}
```

Run this after `await handle.ready`, so that nothing falls between the list and the subscription. A redemption made at that very moment can then show up on both sides: keep the IDs you have settled in a `Set` and skip the ones you have seen.

### Pause the reward when you are not ready for it

A paused reward cannot be redeemed. `updateReward` changes only the fields you pass.

```ts
await twitch.channelPoints.updateReward({ id: rewardId, is_paused: true });

// Later, with a new price and a cooldown of five minutes.
await twitch.channelPoints.updateReward({
  id: rewardId,
  is_paused: false,
  cost: 750,
  is_global_cooldown_enabled: true,
  global_cooldown_seconds: 300,
});
```

### Remove the reward when the program stops

`deleteReward` removes the reward from the channel. The redemptions still waiting in the queue are marked as fulfilled, so settle them first if some should be refunded.

```ts
process.once("SIGINT", async () => {
  await twitch.channelPoints.deleteReward({ id: rewardId });
  twitch.close(); // closes the listener, which lets the process exit
});
```

## See also

- [twitch.channelPoints](/reference/api/channel-points/): every parameter of rewards and redemptions.
- [The redemption event](/reference/event-types/#channelchannel_points_custom_reward_redemptionadd): its condition and its scopes.
- [WebSocket](/events/websocket/): what the listener does when the connection drops.
- [Pagination](/basics/pagination/): reading a list such as the redemptions of a reward.
