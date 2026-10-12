---
title: Reference
description: "Every method, every event type, every scope and every error of the library."
---

The library has 155 methods in 30 groups, which cover every endpoint of the Helix API, and types the 83 EventSub event types. The group pages and the list of events are generated from the source code, so they always match the published version.

## API groups

Each group is a property of the client: `twitch.chat`, `twitch.moderation`... Its page gives, for each method, the signature, the token it needs, the parameters, what comes back and an example.

| Group | Covers | Methods |
| --- | --- | --- |
| [`twitch.ads`](/reference/api/ads/) | Ads: run commercials, read the ad schedule, snooze the next ad. | 3 |
| [`twitch.analytics`](/reference/api/analytics/) | Analytics: downloadable reports for your extensions and games. | 2 |
| [`twitch.bits`](/reference/api/bits/) | Bits: leaderboard, Cheermotes, custom Power-ups and extension transactions. | 4 |
| [`twitch.channelPoints`](/reference/api/channel-points/) | Channel Points: custom rewards and their redemptions. | 6 |
| [`twitch.channels`](/reference/api/channels/) | Channels: title, category and tags, editors, follows and followers. | 5 |
| [`twitch.charity`](/reference/api/charity/) | Charity: the active campaign and its donations. | 2 |
| [`twitch.chat`](/reference/api/chat/) | Chat: send messages and announcements, chatters, emotes, badges, settings, colors, pins and shoutouts. | 19 |
| [`twitch.clips`](/reference/api/clips/) | Clips: create, look up and download clips. | 4 |
| [`twitch.conduits`](/reference/api/conduits/) | Conduits: the EventSub transport that spreads events over several shards. | 6 |
| [`twitch.contentLabels`](/reference/api/content-labels/) | Content classification labels and their localized names. | 1 |
| [`twitch.entitlements`](/reference/api/entitlements/) | Drops entitlements: list them and mark them fulfilled. | 2 |
| [`twitch.eventsub`](/reference/api/eventsub/) | EventSub: subscriptions, and the WebSocket, webhook and conduit listeners. | 6 |
| [`twitch.extensions`](/reference/api/extensions/) | Extensions: configuration, secrets, PubSub and chat messages, Bits products. | 12 |
| [`twitch.games`](/reference/api/games/) | Games and categories: look them up, list the most watched. | 2 |
| [`twitch.goals`](/reference/api/goals/) | Creator goals of a channel. | 1 |
| [`twitch.guestStar`](/reference/api/guest-star/) | Guest Star (beta): sessions, invites and slots. | 12 |
| [`twitch.hypeTrain`](/reference/api/hype-train/) | Hype Train: the current train and the channel records. | 1 |
| [`twitch.moderation`](/reference/api/moderation/) | Moderation: bans, timeouts, warnings, AutoMod, blocked terms, moderators, VIPs and Shield Mode. | 25 |
| [`twitch.polls`](/reference/api/polls/) | Polls: create, read and end them. | 3 |
| [`twitch.predictions`](/reference/api/predictions/) | Predictions: create, read, lock and resolve them. | 3 |
| [`twitch.raids`](/reference/api/raids/) | Raids: start one, cancel a pending one. | 2 |
| [`twitch.schedule`](/reference/api/schedule/) | Stream schedule: segments, vacation and the iCalendar feed. | 6 |
| [`twitch.search`](/reference/api/search/) | Search for categories and channels. | 2 |
| [`twitch.streams`](/reference/api/streams/) | Streams: who is live, stream keys and markers. | 5 |
| [`twitch.subscriptions`](/reference/api/subscriptions/) | Subscriptions: the subscribers of a channel, and whether a user is one. | 2 |
| [`twitch.tags`](/reference/api/tags/) | Stream tags (deprecated by Twitch, kept for completeness). | 2 |
| [`twitch.teams`](/reference/api/teams/) | Teams: look one up, list the teams of a channel. | 2 |
| [`twitch.users`](/reference/api/users/) | Users: profiles, block list and installed extensions. | 12 |
| [`twitch.videos`](/reference/api/videos/) | Videos: VODs, highlights and uploads. | 2 |
| [`twitch.whispers`](/reference/api/whispers/) | Whispers: send a private message to a user. | 1 |

## The rest of the reference

- [Event types](/reference/event-types/): every EventSub subscription type, its version, its condition and its scope.
- [Scopes](/reference/scopes/): every OAuth scope and the methods it unlocks.
- [Errors](/reference/errors/): every error class, its fields and when it is thrown.
- [Client options](/reference/client-options/): the options of `new Twitch()`, the methods of the client and the request options.
