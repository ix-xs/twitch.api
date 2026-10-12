---
title: "Polls and predictions"
description: "Start a poll, follow the votes live and announce the winner in chat, then run a prediction from its opening to the payout."
sidebar:
  order: 5
---

This recipe builds a program that asks the chat which game comes next, prints the votes as they arrive, announces the winner in chat, then opens a prediction about that game. You close the bets and pick the result from the terminal.

## What you need

| | |
| --- | --- |
| Application | A client ID from the [Twitch developer console](https://dev.twitch.tv/console/apps). The program signs in with the device code flow, which needs no client secret. |
| Account | The broadcaster. Polls and predictions exist on affiliate and partner channels only. |
| Token | A user token of the broadcaster. |
| Scopes | `channel:manage:polls`, `channel:manage:predictions`, and `user:write:chat` for the announcement. |

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
  const flow = await twitch.auth.deviceFlow({
    scopes: ["channel:manage:polls", "channel:manage:predictions", "user:write:chat"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;
```

## Follow the poll

Subscribe before the poll starts. `channel.poll.progress` fires as viewers vote and carries the count of every choice. `channel.poll.end` carries the final counts and the way the poll ended.

```ts
const condition = { broadcaster_user_id: broadcaster_id };

const progress = events.on("channel.poll.progress", condition, (event) => {
  console.log(event.choices.map((choice) => `${choice.title}: ${choice.votes}`).join(" | "));
});

const end = events.on("channel.poll.end", condition, async (event) => {
  if (event.status === "archived") return; // the poll was hidden, not finished

  const [top] = [...event.choices].sort((a, b) => b.votes - a.votes);
  if (!top) return;
  await twitch.chat.send({ broadcaster_id, message: `"${top.title}" wins with ${top.votes} votes` });
});

// Twitch has accepted both subscriptions.
await Promise.all([progress.ready, end.ready]);
```

The status of the end event is `completed` when the poll ran to its end, `terminated` when it was stopped early and `archived` when it was hidden from the channel. The handler announces a result for the first two.

`chat.send` is called without a `sender_id`: the broadcaster is the only registered user, so the message is theirs.

## Start the poll

Choices are plain strings. The poll opens at once and closes by itself after `duration` seconds.

```ts
const poll = await twitch.polls.create({
  title: "Which game next?",
  choices: ["Celeste", "Hades", "Outer Wilds"],
  duration: 60,
});
console.log(`Poll ${poll.id} is ${poll.status}`);
```

Waiting for `ready` before this call matters. A subscription that is still being created when the poll starts can miss the first votes.

## Run a prediction

A prediction goes through up to three calls. `create` opens the bets for `prediction_window` seconds and returns the outcomes with their IDs. `end` then moves it to its next state.

```ts
const prediction = await twitch.predictions.create({
  title: "Finish Hades tonight?",
  outcomes: ["Yes", "No"],
  prediction_window: 120,
});
const [yes] = prediction.outcomes;

// Close the bets before the window is over. Optional.
await twitch.predictions.end({ id: prediction.id, status: "LOCKED" });

// Pay the viewers who picked the winning outcome.
if (yes) {
  await twitch.predictions.end({ id: prediction.id, status: "RESOLVED", winning_outcome_id: yes.id });
}
```

To call it off and give everyone their points back, end it with `CANCELED`. That works while the bets are open and after they are locked.

```ts
await twitch.predictions.end({ id: predictionId, status: "CANCELED" });
```

A prediction left unresolved for 24 hours after its window closed is canceled by Twitch, and the points are refunded.

## The whole file

The end of the poll starts the prediction. A prompt in the terminal then waits for your decision: `lock`, `yes`, `no` or `cancel`. When Twitch refuses a decision, the program prints the error and asks again. Once the prediction is settled, `twitch.close()` stops the token validation timer and closes the listener, so the program can exit: an open WebSocket keeps the process alive.

```ts title="src/vote.ts"
import { createInterface } from "node:readline/promises";
import { Twitch, TwitchApiError } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [broadcaster] = await twitch.auth.restore();
if (!broadcaster) {
  const flow = await twitch.auth.deviceFlow({
    scopes: ["channel:manage:polls", "channel:manage:predictions", "user:write:chat"],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  broadcaster = await flow.wait();
}
const broadcaster_id = broadcaster.userId;

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

async function predict(game: string): Promise<void> {
  const prediction = await twitch.predictions.create({
    title: `Finish ${game} tonight?`,
    outcomes: ["Yes", "No"],
    prediction_window: 120,
  });
  const [yes, no] = prediction.outcomes;
  if (!yes || !no) return;

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  let open = true;
  while (open) {
    const answer = (await terminal.question("lock, yes, no or cancel? ")).trim();
    try {
      if (answer === "lock") {
        await twitch.predictions.end({ id: prediction.id, status: "LOCKED" });
      } else if (answer === "yes" || answer === "no") {
        const winner = answer === "yes" ? yes : no;
        await twitch.predictions.end({ id: prediction.id, status: "RESOLVED", winning_outcome_id: winner.id });
        open = false;
      } else if (answer === "cancel") {
        await twitch.predictions.end({ id: prediction.id, status: "CANCELED" });
        open = false;
      }
    } catch (error) {
      if (!(error instanceof TwitchApiError)) throw error;
      console.error(error.message);
    }
  }

  terminal.close();
  twitch.close(); // also closes the WebSocket listener
}

const condition = { broadcaster_user_id: broadcaster_id };

const progress = events.on("channel.poll.progress", condition, (event) => {
  console.log(event.choices.map((choice) => `${choice.title}: ${choice.votes}`).join(" | "));
});

const end = events.on("channel.poll.end", condition, async (event) => {
  if (event.status === "archived") return; // the poll was hidden, not finished

  const [top] = [...event.choices].sort((a, b) => b.votes - a.votes);
  if (!top) return;
  await twitch.chat.send({ broadcaster_id, message: `"${top.title}" wins with ${top.votes} votes` });
  await predict(top.title);
});

await Promise.all([progress.ready, end.ready]);

const poll = await twitch.polls.create({
  title: "Which game next?",
  choices: ["Celeste", "Hades", "Outer Wilds"],
  duration: 60,
});
console.log(`Poll ${poll.id} is ${poll.status}`);
```

Run it with [tsx](https://tsx.is/), in a project that is an ES module (`"type": "module"` in `package.json`), with `TWITCH_CLIENT_ID` in a `.env` file:

```bash
node --env-file=.env --import tsx src/vote.ts
```

## Limits

| | Poll | Prediction |
| --- | --- | --- |
| Title | 60 characters | 45 characters |
| Options | 2 to 5 choices of 25 characters | 2 to 10 outcomes of 25 characters |
| Duration | 15 to 1800 seconds | 30 to 1800 seconds of betting |
| At the same time | One per channel | One per channel |

The title of the prediction above is built from a poll choice, which is 25 characters at most, so it stays under 45.

## Going further

### End a poll early

`polls.end` stops a running poll. `TERMINATED` leaves the results on screen, `ARCHIVED` also hides the poll.

```ts
const stopped = await twitch.polls.end({ id: pollId, status: "TERMINATED" });
console.log(stopped.choices.map((choice) => `${choice.title}: ${choice.votes}`));
```

### Let viewers buy extra votes

A poll can sell additional votes for Channel Points. The end event counts them in `channel_points_votes`, and `votes` is the total.

```ts
await twitch.polls.create({
  title: "Which game next?",
  choices: ["Celeste", "Hades", "Outer Wilds"],
  duration: 120,
  channel_points_voting_enabled: true,
  channel_points_per_vote: 100,
});
```

### Follow the bets

Predictions have their own events: `channel.prediction.begin`, `channel.prediction.progress`, `channel.prediction.lock` and `channel.prediction.end`. They take the same condition as the poll events and need `channel:read:predictions` or `channel:manage:predictions`.

```ts
events.on("channel.prediction.progress", { broadcaster_user_id: broadcaster_id }, (event) => {
  for (const outcome of event.outcomes) {
    console.log(`${outcome.title}: ${outcome.channel_points} points from ${outcome.users} viewers`);
  }
});
```

## See also

- [twitch.polls](/reference/api/polls/): parameters and fields of a poll.
- [twitch.predictions](/reference/api/predictions/): parameters and fields of a prediction.
- [channel.poll.end](/reference/event-types/#channelpollend): the condition and the scopes of the event.
- [Managing subscriptions](/events/managing-subscriptions/): what `ready` and `stop` do.
