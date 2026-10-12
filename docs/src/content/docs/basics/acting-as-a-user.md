---
title: "Acting as a user"
description: "Register user tokens once and let the client pick the right one for each call. This page gives the exact rules of that choice, and how to override it."
sidebar:
  order: 2
---

Sending a chat message, banning someone or starting a poll is done in the name of a Twitch user, with a token that user granted to your application. You register the token once. After that, each call finds the token it needs, and the field that says who is acting fills itself in.

## A first example

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

// Register the token of your bot account.
const bot = await twitch.auth.addUser({ accessToken, refreshToken });
console.log(bot.userId, bot.login, bot.scopes);

// Both calls are made with the bot's token.
await twitch.chat.send({ broadcaster_id: channelId, message: "Hello chat" });
await twitch.moderation.ban({ broadcaster_id: channelId, user_id: "9876", duration: 600, reason: "Spam" });
```

Neither call says who is acting. `sender_id` and `moderator_id` are set to the bot's ID, because the bot is the only registered user.

## Register a user token

`twitch.auth.addUser` takes an access token and, when you have one, the refresh token that lets the client renew it. Unless you give them yourself, it asks Twitch who owns the token and which scopes it has. It resolves with a `UserToken`: `userId`, `login`, `scopes`, `accessToken`, `refreshToken`, `expiresAt`.

You rarely call it by hand in a finished application:

- The sign-in flows register the user for you. See [Authorization code flow](/auth/authorization-code/) and [Device code flow](/auth/device-code/).
- A token store brings registered users back after a restart. See [Storing tokens](/auth/storing-tokens/).

[Managing users](/auth/managing-users/) lists everything `addUser` accepts, and how to list, refresh and remove users.

## Let the acting user default

Many endpoints have a parameter that names the user who acts. It is optional in this library, and its documentation says "Defaults to the user making the call".

| Call | Field filled in |
| --- | --- |
| `chat.send` | `sender_id` |
| `moderation.ban`, `moderation.warn`, `chat.announce`, `chat.chatters` | `moderator_id` |
| `polls.create`, `channels.update`, `subscriptions.get`, `moderation.bans` | `broadcaster_id` |
| `channels.followed`, `streams.followed`, `subscriptions.check` | `user_id` |
| `clips.downloads` | `editor_id` |

When you leave the field out, it receives the ID of the user whose token was chosen for the call. You can always write it yourself, and with several users registered it is how the client knows whose token to use.

```ts
declare const streamerId: string; // both users are registered
declare const botId: string;

// The broadcaster's token: `broadcaster_id` names a registered user.
await twitch.polls.create({
  broadcaster_id: streamerId,
  title: "Next game?",
  choices: ["Hades", "Celeste"],
  duration: 120,
});

// The bot's token: `moderator_id` and `sender_id` name it.
await twitch.moderation.ban({ broadcaster_id: streamerId, moderator_id: botId, user_id: "9876" });
await twitch.chat.send({ broadcaster_id: streamerId, sender_id: botId, message: "Poll is open" });
```

## How the token is chosen

Each endpoint knows three things about itself: whether it takes a user token only, the app token only, or both; which parameter names the acting user, if any; and which scopes a user token needs. From that and from what you passed, the client goes through these steps and stops at the first that applies:

1. You passed `{ token }` in the request options: that token is sent as is. Nothing below applies. See [Request options](/basics/request-options/).
2. You asked for the app token, with `{ as: "app" }` or by calling through `twitch.as("app")`, and the endpoint is not user-only: the app token.
3. You named a user, with `{ as: userId }` or by calling through `twitch.as(userId)`, and the endpoint is not app-only: that user's token.
4. The acting user parameter of the request holds the ID of a registered user, and the endpoint is not app-only: that user's token.
5. The endpoint takes a user token only: the token of the registered user if there is exactly one. Otherwise the call fails with a `TwitchAuthError`.
6. The endpoint takes both kinds and has an acting user parameter that you left out: the token of the registered user if there is exactly one.
7. The client has a client secret: the app token.
8. No client secret, and the endpoint takes both kinds: the token of the registered user if there is exactly one.
9. Nothing fits: the call fails with a `TwitchAuthError`.

"Registered" includes users saved in the token store you gave the client: they are loaded before a user is chosen.

Once a user token is chosen, it is renewed first if it expires within the next minute and has a refresh token, then its scopes are checked.

If the acting user parameter is still empty after the choice and the token is not a registered user's (steps 1, 2 and 7), there is nobody to fill it with. The call fails with a `TwitchAuthError` before any request is sent. The section "When no token fits" below lists the messages.

## Say who is acting

When the request alone does not settle it, name the user. For one call, pass `as` in the request options, the last argument of every method:

```ts
await twitch.chat.announce({ broadcaster_id: channelId, message: "Stream starts in 5" }, { as: botId });

const me = await twitch.users.me({ as: userId });
```

For many calls, `twitch.as(userId)` returns a view of the client that makes every call as that user:

```ts
const asBot = twitch.as(botId);

await asBot.chat.send({ broadcaster_id: channelId, message: "Hello" });
await asBot.chat.setColor({ color: "blue_violet" });
console.log(asBot.userId); // the bot's ID
```

A view is a full client: same groups, same methods. It shares the tokens, the rate limits and the listeners of the client it comes from, so creating one is cheap and you can do it wherever you need it. `as` in the request options of a call wins over the view.

Neither form checks the user when you write it. If no token is registered for that ID, the call itself fails with `No token is registered for user 123. Add it with twitch.auth.addUser().`

## Endpoints that accept both kinds of token

Reading public data (`users.get`, `streams.get`, `channels.get`, `chat.settings`) works with either kind. By step 7, such a call goes out with the app token even when users are registered, which keeps it off the users' rate limits.

Some of these endpoints answer more to a user. `users.get` includes `email` only for a token of that same user with the `user:read:email` scope. Name the user to get it:

```ts
const [profile] = await twitch.users.get({ id: userId }, { as: userId });
console.log(profile?.email);
```

One endpoint does this on its own. `channels.followers` returns the list of followers only to the broadcaster or a moderator, so it uses the registered user when there is exactly one, and the app token otherwise. The follower count comes back with any token.

Endpoints such as `chat.send` and `moderation.ban` also accept both kinds, and have an acting user parameter. Steps 4 and 6 give them a user token when the acting user you wrote is registered, or when you left it out and a single user is registered. By step 7, they go out with the app token when you write an acting user whose token is not registered.

### Force the app token

To use the app token on one of these endpoints although the acting user is registered, ask for it by name. `"app"` goes where a user ID would: in the request options of one call, or in a view.

```ts
// The bot's token is registered, but this message goes out with the app token.
await twitch.chat.send(
  { broadcaster_id: channelId, sender_id: botId, message: "Sent with the app token" },
  { as: "app" },
);

const asApp = twitch.as("app");
const [profile] = await asApp.users.get({ id: botId });
```

Three things to know:

- The app token belongs to no user, so an acting user parameter is not filled in. Write it, as `sender_id` above.
- It needs a client secret, like every use of the app token.
- A user-only endpoint refuses it: the call fails with a `TwitchAuthError`.

## App-only endpoints

A few endpoints only take the app token: the `conduits` group, `users.authorization`, `bits.extensionTransactions`, the Bits products of the `extensions` group, and EventSub subscriptions delivered to a webhook or a conduit. They use the app token whoever is acting, including inside a view and with `{ as }`:

```ts
const asBot = twitch.as(botId);

await asBot.conduits.list(); // app token
await asBot.chat.send({ broadcaster_id: channelId, message: "Hello" }); // the bot's token
```

So a view can be handed to code that mixes both kinds of calls.

## Scopes are checked first

When a user token is chosen and the endpoint lists scopes, the client compares them with the scopes of the token before sending anything. One matching scope is enough. If none matches, the call throws a `TwitchScopeError`:

```
TwitchScopeError: The token of user 123 is missing the "moderator:manage:banned_users" scope required by POST /moderation/bans.
```

The error carries what you need to send the user back through authorization:

```ts
import { TwitchScopeError } from "@ix-xs/twitch.api";

try {
  await twitch.moderation.ban({ broadcaster_id: channelId, user_id: "9876" });
} catch (error) {
  if (!(error instanceof TwitchScopeError)) throw error;
  console.log(error.userId); // whose token it was
  console.log(error.required); // scopes that would do, one is enough
  console.log(error.granted); // scopes the token has
}
```

The check only runs for registered user tokens. With the app token or a token passed with `{ token }`, Twitch does the checking and a missing permission comes back as a `TwitchApiError`. The scope each method needs is in its documentation and in the [list of scopes](/reference/scopes/).

## When no token fits

The message of the error tells which case you are in.

| Situation | Message |
| --- | --- |
| A user-only endpoint, no user registered | `GET /users needs a user access token and no user is registered. Add one with twitch.auth.addUser().` |
| A user-only endpoint, several users registered, none named | `GET /users needs a user access token and several users are registered. Choose one with { as: userId } or twitch.as(userId).` |
| A user-only endpoint, several users registered, the request names another one | `GET /polls needs the token of user 123, which is not registered. Add it with twitch.auth.addUser() or choose a user with { as: userId }.` |
| `as` names a user without a token | `No token is registered for user 123. Add it with twitch.auth.addUser().` |
| An endpoint that takes both kinds, its acting user parameter left out, several users registered | `POST /chat/messages does not say who is acting and several users are registered. Set "sender_id", or choose a user with { as: userId } or twitch.as(userId).` |
| The same call made with the app token while no user is registered, or with `{ as: "app" }` | `POST /chat/messages needs "sender_id": the call is made with the app token, which belongs to no user. Set "sender_id", or register the acting user with twitch.auth.addUser().` |
| No client secret, an endpoint that takes both kinds, several users registered | `GET /streams can use a user token, but several users are registered. Choose one with { as: userId } or twitch.as(userId).` |
| No client secret, an endpoint that takes both kinds, no user registered | `GET /streams needs an app access token, which requires a clientSecret (or a registered user token).` |
| An app-only endpoint, no client secret | `GET /eventsub/conduits needs an app access token, which requires a clientSecret.` |

All of them are `TwitchAuthError`, thrown before any request is sent. With exactly one user registered, a user-only endpoint always uses that user, even when the request names someone else. Twitch then answers with a `401` that says the ID must match the token, which the client raises as a `TwitchApiError`. See [Errors](/basics/errors/).

## See also

- [Authentication overview](/auth/overview/): app tokens, user tokens and how to obtain them.
- [Managing users](/auth/managing-users/): add, list, refresh and remove registered users.
- [Request options](/basics/request-options/): `as`, `token` and the other per call settings.
- [Scopes](/reference/scopes/): every scope and the methods it unlocks.
- [Troubleshooting](/help/troubleshooting/): the errors above, symptom by symptom.
