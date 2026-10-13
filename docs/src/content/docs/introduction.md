---
title: "Introduction"
description: "What twitch.api is, what it covers, what it needs to run and how this documentation is organised."
---

twitch.api is a client for the Twitch API, for JavaScript and TypeScript. You call a method, you get typed data back. Tokens, rate limits, pagination and reconnections are handled by the library, and it has no dependency.

## What it covers

- **The Helix API**: all 149 endpoints, in 30 groups such as `twitch.users`, `twitch.chat` and `twitch.moderation`. Parameters and responses keep the names Twitch uses, so the official reference and this library read the same.
- **EventSub**: all 83 subscription types, with a typed condition and a typed event for each. One `on()` works over WebSocket, webhooks and conduits.
- **OAuth**: the app token, user tokens, the authorization code flow and the device code flow, with refresh, validation and storage.

## What it looks like

Public data needs a client ID and a client secret, nothing more.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

// One user, by login name.
const user = await twitch.users.getByLogin("twitchdev");

// The ten most watched streams right now.
const top = await twitch.streams.get().take(10);

console.log(user?.display_name, top.map((stream) => stream.user_name));
```

Acting for a user, such as reading and sending chat messages, needs a token from that user. Once the user has signed in, the calls look the same.

```ts
const events = twitch.eventsub.websocket();

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.message.text === "!ping") {
    await twitch.chat.send({ broadcaster_id: channelId, message: "pong" });
  }
});
```

## What it does for you

- It requests the app token when a call needs one, refreshes user tokens before they expire and validates them every hour, as Twitch requires. See [Tokens at a glance](/auth/overview/).
- It picks the token each endpoint wants, the app token or a user's, and fills in `moderator_id`, `broadcaster_id` or `sender_id` with the user who is acting. See [Acting as a user](/basics/acting-as-a-user/).
- It checks the scopes of a token before sending the request, and the error names the scope that is missing.
- It follows cursors for you: `await` a list for one page, loop over it with `for await` for every item. See [Pagination](/basics/pagination/).
- It reads the rate limit headers of each response, so requests wait for the limit to reset instead of failing, and it retries what is safe to retry. See [Rate limits and retries](/basics/rate-limits-and-retries/).
- It keeps EventSub connections alive: reconnections, resubscriptions, signature checks and duplicate deliveries. See [Receiving events](/events/overview/).
- It turns failures into typed errors that carry the status and the message Twitch sent. See [Errors](/basics/errors/).

## What you need

- **Node.js 22 or later.** The library also runs on Bun, Deno, Cloudflare Workers and in the browser, see [Runtimes](/basics/runtimes/).
- **A Twitch application**, which gives you a client ID and a client secret. Registering one takes a few minutes: [Getting credentials](/credentials/).

TypeScript is optional. The type declarations ship with the package, so an editor completes method names, parameters, scopes and event types in JavaScript files too.

## How this documentation is organised

- **Start**: this page, the [quick start](/quick-start/) and how to get your credentials.
- **Basics**: how every method works. [Calling the API](/basics/calling-the-api/) is the page to read once, the others each cover one subject.
- **Authentication**: user tokens, from signing a user in to [storing tokens](/auth/storing-tokens/).
- **Events**: EventSub over [WebSocket](/events/websocket/), [webhooks](/events/webhooks/) and [conduits](/events/conduits/).
- **Recipes**: complete programs to copy, such as a [chat bot](/recipes/chat-bot/).
- **Reference**: [every method](/reference/overview/), every [event type](/reference/event-types/) and every [scope](/reference/scopes/), generated from the source of the library, then [troubleshooting](/help/troubleshooting/) and the [questions that come up most](/help/faq/).

Every example of this site is compiled against the library before the site is published.

## Where to start

- New to the library: the [quick start](/quick-start/) goes from an empty folder to a first call.
- Coming from version 1: [Coming from version 1](/help/migrating-from-v1/) gives the new name of each old method.
- Looking for one endpoint: the search of this site knows every method and every event type.

twitch.api is an independent open source project, released under the MIT license. It is not affiliated with or endorsed by Twitch Interactive, Inc.
