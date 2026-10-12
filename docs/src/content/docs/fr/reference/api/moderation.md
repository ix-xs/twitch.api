---
title: twitch.moderation
description: "Moderation: bans, timeouts, warnings, AutoMod, blocked terms, moderators, VIPs and Shield Mode."
sidebar:
  label: moderation
---

Toutes les méthodes de `twitch.moderation`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## checkAutoMod

```ts nocheck
twitch.moderation.checkAutoMod(params, options?): Promise<AutoModCheckResult[]>
```

Tells whether AutoMod would let messages through in a channel, without
sending them. Twitch limits these checks per channel, from 5 a minute for
a regular account to 30 for a partner.

**Jeton:** app or user, scope `moderation:read`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose AutoMod settings and blocked terms apply. Defaults to the user making the call. |
| `data` <small>requis</small> | `readonly AutoModCheckMessage[]` | Messages to check, 1 to 100. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AutoModCheckResult[]>`

<details>
<summary>Champs de AutoModCheckResult</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `msg_id` | `string` | The ID you gave to the message. |
| `is_permitted` | `boolean` | `true` when the message would go straight to chat, `false` when it would be held or blocked. |

</details>

### Exemple

```ts
const [result] = await twitch.moderation.checkAutoMod({
  data: [{ msg_id: "1", msg_text: "Hello chat" }],
});
if (!result?.is_permitted) console.log("AutoMod would hold this message");
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#check-automod-status)

## manageAutoModMessage

```ts nocheck
twitch.moderation.manageAutoModMessage(params, options?): Promise<void>
```

Approves or denies a message that AutoMod is holding for review.

**Jeton:** app or user, scope `moderator:manage:automod`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Moderator who takes the decision. Defaults to the user making the call. |
| `msg_id` <small>requis</small> | `string` | ID of the held message. |
| `action` <small>requis</small> | `"ALLOW" \| "DENY"` | `"ALLOW"` releases the message to chat, `"DENY"` discards it. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.manageAutoModMessage({ msg_id: "836013710", action: "ALLOW" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#manage-held-automod-messages)

## autoModSettings

```ts nocheck
twitch.moderation.autoModSettings(params, options?): Promise<AutoModSettings>
```

Gets the AutoMod levels of a channel.

**Jeton:** app or user, scope `moderator:read:automod_settings` or `moderator:manage:automod_settings`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose settings to read. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AutoModSettings>`

<details>
<summary>Champs de AutoModSettings</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `moderator_id` | `string` | ID of the moderator who made the call. |
| `overall_level` | `number \| null` | Overall level, 0 to 4. `null` when the categories were set one by one. |
| `disability` | `number` | Level for discrimination against disability. |
| `aggression` | `number` | Level for aggressive hostility. |
| `sexuality_sex_or_gender` | `number` | Level for discrimination based on sexuality, sex or gender. |
| `misogyny` | `number` | Level for discrimination against women. |
| `bullying` | `number` | Level for name calling and insults. |
| `swearing` | `number` | Level for profanity. |
| `race_ethnicity_or_religion` | `number` | Level for racial, ethnic or religious discrimination. |
| `sex_based_terms` | `number` | Level for sexual content. |

</details>

### Exemple

```ts
const settings = await twitch.moderation.autoModSettings({ broadcaster_id: "141981764" });
console.log(settings.overall_level);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-automod-settings)

## updateAutoModSettings

```ts nocheck
twitch.moderation.updateAutoModSettings(params, options?): Promise<AutoModSettings>
```

Replaces the AutoMod levels of a channel. This overwrites everything: a
category you leave out goes back to 0, so send all the levels you want to
keep.

**Jeton:** app or user, scope `moderator:manage:automod_settings`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose settings to change. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `overall_level` | `number` | Overall level, 0 to 4. Twitch derives every category level from it. |
| `disability` | `number` | Level for discrimination against disability. |
| `aggression` | `number` | Level for aggressive hostility. |
| `sexuality_sex_or_gender` | `number` | Level for discrimination based on sexuality, sex or gender. |
| `misogyny` | `number` | Level for discrimination against women. |
| `bullying` | `number` | Level for name calling and insults. |
| `swearing` | `number` | Level for profanity. |
| `race_ethnicity_or_religion` | `number` | Level for racial, ethnic or religious discrimination. |
| `sex_based_terms` | `number` | Level for sexual content. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<AutoModSettings>`

<details>
<summary>Champs de AutoModSettings</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `moderator_id` | `string` | ID of the moderator who made the call. |
| `overall_level` | `number \| null` | Overall level, 0 to 4. `null` when the categories were set one by one. |
| `disability` | `number` | Level for discrimination against disability. |
| `aggression` | `number` | Level for aggressive hostility. |
| `sexuality_sex_or_gender` | `number` | Level for discrimination based on sexuality, sex or gender. |
| `misogyny` | `number` | Level for discrimination against women. |
| `bullying` | `number` | Level for name calling and insults. |
| `swearing` | `number` | Level for profanity. |
| `race_ethnicity_or_religion` | `number` | Level for racial, ethnic or religious discrimination. |
| `sex_based_terms` | `number` | Level for sexual content. |

</details>

### Exemple

```ts
await twitch.moderation.updateAutoModSettings({ broadcaster_id: "141981764", overall_level: 3 });
await twitch.moderation.updateAutoModSettings({ broadcaster_id: "141981764", swearing: 2, bullying: 4 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-automod-settings)

## bans

```ts nocheck
twitch.moderation.bans(params?, options?): Paginator<BannedUser>
```

Lists the users who are banned or timed out in a channel.

**Jeton:** app or user, scope `moderation:read` or `moderator:manage:banned_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose bans to list. Defaults to the user making the call. |
| `user_id` | `string \| readonly string[]` | Only these users, when they are banned or timed out. Up to 100 IDs. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |
| `before` | `string` | Cursor of the previous page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<BannedUser>`

<details>
<summary>Champs de BannedUser</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the banned user. |
| `user_login` | `string` | Login name of the banned user. |
| `user_name` | `string` | Display name of the banned user. |
| `expires_at` | `string` | When the timeout ends, as an RFC 3339 timestamp. An empty string for a permanent ban. |
| `created_at` | `string` | When the ban or timeout was set, as an RFC 3339 timestamp. |
| `reason` | `string` | Reason given by the moderator. An empty string when there is none. |
| `moderator_id` | `string` | ID of the moderator who set the ban or timeout. |
| `moderator_login` | `string` | Login name of that moderator. |
| `moderator_name` | `string` | Display name of that moderator. |

</details>

### Exemple

```ts
for await (const banned of twitch.moderation.bans()) {
  console.log(banned.user_login, banned.expires_at || "permanent");
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-banned-users)

## ban

```ts nocheck
twitch.moderation.ban(params, options?): Promise<UserBan>
```

Bans a user from a channel's chat. A timeout is a ban with a `duration`:
give the number of seconds and the user is let back in afterwards. Calling
it again on a timed out user changes the duration or turns the timeout
into a ban, but a banned user has to be unbanned before a timeout can be
set.

**Jeton:** app or user, scope `moderator:manage:banned_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose chat the user is removed from. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `user_id` <small>requis</small> | `string` | ID of the user to ban or time out. |
| `duration` | `number` | Length of the timeout in seconds, 1 to 1209600 (two weeks). Leave it out for a permanent ban. |
| `reason` | `string` | Reason shown to the user and the other moderators, 500 characters at most. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserBan>`

<details>
<summary>Champs de UserBan</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster whose chat the user was removed from. |
| `moderator_id` | `string` | ID of the moderator who set it. |
| `user_id` | `string` | ID of the banned user. |
| `created_at` | `string` | When it was set, as an RFC 3339 timestamp. |
| `end_time` | `string \| null` | When the timeout ends, as an RFC 3339 timestamp. `null` for a permanent ban. |

</details>

### Exemple

```ts
await twitch.moderation.ban({ broadcaster_id: "141981764", user_id: "9876", reason: "Spam" });
const timeout = await twitch.moderation.ban({ broadcaster_id: "141981764", user_id: "9876", duration: 600 });
console.log(timeout.end_time);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#ban-user)

## unban

```ts nocheck
twitch.moderation.unban(params, options?): Promise<void>
```

Lifts the ban or the timeout of a user.

**Jeton:** app or user, scope `moderator:manage:banned_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose chat the user is banned from. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `user_id` <small>requis</small> | `string` | ID of the user to unban. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.unban({ broadcaster_id: "141981764", user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#unban-user)

## unbanRequests

```ts nocheck
twitch.moderation.unbanRequests(params, options?): Paginator<UnbanRequest>
```

Lists the unban requests of a channel that are in a given state.

**Jeton:** user, scope `moderator:read:unban_requests` or `moderator:manage:unban_requests`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose channel received the requests. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `status` <small>requis</small> | `UnbanRequestStatus` | Only requests in this state. |
| `user_id` | `string` | Only requests written by this user. |
| `first` | `number` | Items per page. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<UnbanRequest>`

<details>
<summary>Champs de UnbanRequest</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the request. |
| `broadcaster_id` | `string` | ID of the broadcaster who received the request. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `moderator_id` | `string` | ID of the moderator who approved or denied the request. |
| `moderator_login` | `string` | Login name of that moderator. |
| `moderator_name` | `string` | Display name of that moderator. |
| `user_id` | `string` | ID of the banned user who wrote the request. |
| `user_login` | `string` | Login name of that user. |
| `user_name` | `string` | Display name of that user. |
| `text` | `string` | Message written by the user. |
| `status` | `UnbanRequestStatus` | Where the request stands. |
| `created_at` | `string` | When the request was sent, as an RFC 3339 timestamp. |
| `resolved_at` | `string \| null` | When the request was approved or denied, as an RFC 3339 timestamp. `null` while it is open. |
| `resolution_text` | `string \| null` | Answer written by the moderator. `null` while the request is open. |

</details>

### Exemple

```ts
const pending = await twitch.moderation.unbanRequests({ broadcaster_id: "141981764", status: "pending" }).all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-unban-requests)

## resolveUnbanRequest

```ts nocheck
twitch.moderation.resolveUnbanRequest(params, options?): Promise<UnbanRequest>
```

Approves or denies an unban request. Approving it unbans the user.

**Jeton:** user, scope `moderator:manage:unban_requests`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose channel received the request. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `unban_request_id` <small>requis</small> | `string` | ID of the request to resolve. |
| `status` <small>requis</small> | `"approved" \| "denied"` | The decision. |
| `resolution_text` | `string` | Answer shown to the user, 500 characters at most. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UnbanRequest>`

<details>
<summary>Champs de UnbanRequest</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the request. |
| `broadcaster_id` | `string` | ID of the broadcaster who received the request. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `moderator_id` | `string` | ID of the moderator who approved or denied the request. |
| `moderator_login` | `string` | Login name of that moderator. |
| `moderator_name` | `string` | Display name of that moderator. |
| `user_id` | `string` | ID of the banned user who wrote the request. |
| `user_login` | `string` | Login name of that user. |
| `user_name` | `string` | Display name of that user. |
| `text` | `string` | Message written by the user. |
| `status` | `UnbanRequestStatus` | Where the request stands. |
| `created_at` | `string` | When the request was sent, as an RFC 3339 timestamp. |
| `resolved_at` | `string \| null` | When the request was approved or denied, as an RFC 3339 timestamp. `null` while it is open. |
| `resolution_text` | `string \| null` | Answer written by the moderator. `null` while the request is open. |

</details>

### Exemple

```ts
const request = await twitch.moderation.resolveUnbanRequest({
  broadcaster_id: "141981764",
  unban_request_id: "92af127c-7326-4483-a52b-b0da0be61c01",
  status: "approved",
  resolution_text: "Welcome back.",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#resolve-unban-requests)

## blockedTerms

```ts nocheck
twitch.moderation.blockedTerms(params, options?): Paginator<BlockedTerm>
```

Lists the blocked terms of a channel, newest first. Private terms are not
included.

**Jeton:** app or user, scope `moderator:read:blocked_terms` or `moderator:manage:blocked_terms`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the list. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<BlockedTerm>`

<details>
<summary>Champs de BlockedTerm</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the list. |
| `moderator_id` | `string` | ID of the moderator who blocked the term. |
| `id` | `string` | ID of the blocked term. |
| `text` | `string` | The blocked word or phrase. |
| `created_at` | `string` | When the term was blocked, as an RFC 3339 timestamp. |
| `updated_at` | `string` | When the term last changed, as an RFC 3339 timestamp. Moves each time AutoMod denies it again. |
| `expires_at` | `string \| null` | When the block ends, as an RFC 3339 timestamp. `null` for a term added by hand or blocked for good by AutoMod. |

</details>

### Exemple

```ts
const terms = await twitch.moderation.blockedTerms({ broadcaster_id: "141981764" }).all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-blocked-terms)

## addBlockedTerm

```ts nocheck
twitch.moderation.addBlockedTerm(params, options?): Promise<BlockedTerm>
```

Blocks a word or phrase in a channel's chat. When the term is already
blocked, the existing entry is returned.

**Jeton:** app or user, scope `moderator:manage:blocked_terms`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the list. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `text` <small>requis</small> | `string` | Word or phrase to block, 2 to 500 characters. A `*` at the start or the end of a word works as a wildcard, as in `"foo*"`. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<BlockedTerm>`

<details>
<summary>Champs de BlockedTerm</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the list. |
| `moderator_id` | `string` | ID of the moderator who blocked the term. |
| `id` | `string` | ID of the blocked term. |
| `text` | `string` | The blocked word or phrase. |
| `created_at` | `string` | When the term was blocked, as an RFC 3339 timestamp. |
| `updated_at` | `string` | When the term last changed, as an RFC 3339 timestamp. Moves each time AutoMod denies it again. |
| `expires_at` | `string \| null` | When the block ends, as an RFC 3339 timestamp. `null` for a term added by hand or blocked for good by AutoMod. |

</details>

### Exemple

```ts
const term = await twitch.moderation.addBlockedTerm({ broadcaster_id: "141981764", text: "spoil*" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#add-blocked-term)

## removeBlockedTerm

```ts nocheck
twitch.moderation.removeBlockedTerm(params, options?): Promise<void>
```

Removes a term from a channel's blocked terms. An ID that does not exist
is not an error.

**Jeton:** app or user, scope `moderator:manage:blocked_terms`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the list. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `id` <small>requis</small> | `string` | ID of the blocked term to remove. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.removeBlockedTerm({ broadcaster_id: "141981764", id: term.id });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#remove-blocked-term)

## deleteMessages

```ts nocheck
twitch.moderation.deleteMessages(params, options?): Promise<void>
```

Removes one message from a channel's chat, or every message when no
`message_id` is given.

**Jeton:** app or user, scope `moderator:manage:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the chat room. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `message_id` | `string` | ID of the message to remove. It must be less than 6 hours old and written by neither the broadcaster nor a moderator. Leave it out to clear the chat. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.deleteMessages({ broadcaster_id: "141981764", message_id: "abc-123-def" });
await twitch.moderation.deleteMessages({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#delete-chat-messages)

## moderatedChannels

```ts nocheck
twitch.moderation.moderatedChannels(params?, options?): Paginator<ModeratedChannel>
```

Lists the channels in which a user is a moderator.

**Jeton:** app or user, scope `user:read:moderated_channels`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | User whose moderated channels to list. Defaults to the user making the call. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ModeratedChannel>`

<details>
<summary>Champs de ModeratedChannel</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the channel's broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |

</details>

### Exemple

```ts
for await (const channel of twitch.moderation.moderatedChannels()) {
  console.log(channel.broadcaster_login);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-moderated-channels)

## moderators

```ts nocheck
twitch.moderation.moderators(params?, options?): Paginator<ChannelModerator>
```

Lists the moderators of a channel.

**Jeton:** user, scope `moderation:read` or `channel:manage:moderators`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose moderators to list. Defaults to the user making the call. |
| `user_id` | `string \| readonly string[]` | Only these users, when they are moderators. Up to 100 IDs. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ChannelModerator>`

<details>
<summary>Champs de ChannelModerator</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the moderator. |
| `user_login` | `string` | Login name of the moderator. |
| `user_name` | `string` | Display name of the moderator. |

</details>

### Exemple

```ts
const mods = await twitch.moderation.moderators().all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-moderators)

## addModerator

```ts nocheck
twitch.moderation.addModerator(params, options?): Promise<void>
```

Makes a user a moderator of the channel. A VIP has to lose that status
first. Twitch allows 10 additions per 10 seconds.

**Jeton:** user, scope `channel:manage:moderators`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the chat room. Defaults to the user making the call. |
| `user_id` <small>requis</small> | `string` | ID of the user to make a moderator. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.addModerator({ user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#add-channel-moderator)

## removeModerator

```ts nocheck
twitch.moderation.removeModerator(params, options?): Promise<void>
```

Takes the moderator role away from a user. Twitch allows 10 removals per
10 seconds.

**Jeton:** user, scope `channel:manage:moderators`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the chat room. Defaults to the user making the call. |
| `user_id` <small>requis</small> | `string` | ID of the moderator to remove. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.removeModerator({ user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#remove-channel-moderator)

## vips

```ts nocheck
twitch.moderation.vips(params?, options?): Paginator<ChannelVip>
```

Lists the VIPs of a channel.

**Jeton:** user, scope `channel:read:vips` or `channel:manage:vips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose VIPs to list. Defaults to the user making the call. |
| `user_id` | `string \| readonly string[]` | Only these users, when they are VIPs. Up to 100 IDs. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ChannelVip>`

<details>
<summary>Champs de ChannelVip</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the VIP. |
| `user_name` | `string` | Display name of the VIP. |
| `user_login` | `string` | Login name of the VIP. |

</details>

### Exemple

```ts
const vips = await twitch.moderation.vips().all();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-vips)

## addVip

```ts nocheck
twitch.moderation.addVip(params, options?): Promise<void>
```

Makes a user a VIP of the channel. A moderator has to lose that role
first, and the channel needs a free VIP slot. Twitch allows 10 additions
per 10 seconds.

**Jeton:** user, scope `channel:manage:vips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who grants the status. Defaults to the user making the call. |
| `user_id` <small>requis</small> | `string` | ID of the user to make a VIP. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.addVip({ user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#add-channel-vip)

## removeVip

```ts nocheck
twitch.moderation.removeVip(params, options?): Promise<void>
```

Takes the VIP status away from a user. A VIP can also give up their own
status: pass the channel in `broadcaster_id` and make the call as that
VIP. Twitch allows 10 removals per 10 seconds.

**Jeton:** user, scope `channel:manage:vips`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster of the channel where the user is a VIP. Defaults to the user making the call. |
| `user_id` <small>requis</small> | `string` | ID of the VIP to remove. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.moderation.removeVip({ user_id: "9876" });
await twitch.moderation.removeVip({ broadcaster_id: "141981764", user_id: "9876" }, { as: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#remove-channel-vip)

## updateShieldMode

```ts nocheck
twitch.moderation.updateShieldMode(params, options?): Promise<ShieldModeStatus>
```

Turns Shield Mode on or off in a channel. While it is on, the stricter
chat rules the broadcaster prepared for it apply.

**Jeton:** app or user, scope `moderator:manage:shield_mode`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose Shield Mode to switch. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `is_active` <small>requis</small> | `boolean` | `true` turns Shield Mode on, `false` turns it off. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ShieldModeStatus>`

<details>
<summary>Champs de ShieldModeStatus</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `is_active` | `boolean` | Whether Shield Mode is on. |
| `moderator_id` | `string` | ID of the moderator who last turned it on. An empty string when it was never on. |
| `moderator_login` | `string` | Login name of that moderator. An empty string when it was never on. |
| `moderator_name` | `string` | Display name of that moderator. An empty string when it was never on. |
| `last_activated_at` | `string` | When it was last turned on, as an RFC 3339 timestamp. An empty string when it was never on. |

</details>

### Exemple

```ts
const status = await twitch.moderation.updateShieldMode({ broadcaster_id: "141981764", is_active: true });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-shield-mode-status)

## shieldMode

```ts nocheck
twitch.moderation.shieldMode(params, options?): Promise<ShieldModeStatus>
```

Tells whether Shield Mode is on in a channel and who turned it on last.

**Jeton:** app or user, scope `moderator:read:shield_mode` or `moderator:manage:shield_mode`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose Shield Mode to read. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ShieldModeStatus>`

<details>
<summary>Champs de ShieldModeStatus</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `is_active` | `boolean` | Whether Shield Mode is on. |
| `moderator_id` | `string` | ID of the moderator who last turned it on. An empty string when it was never on. |
| `moderator_login` | `string` | Login name of that moderator. An empty string when it was never on. |
| `moderator_name` | `string` | Display name of that moderator. An empty string when it was never on. |
| `last_activated_at` | `string` | When it was last turned on, as an RFC 3339 timestamp. An empty string when it was never on. |

</details>

### Exemple

```ts
const { is_active } = await twitch.moderation.shieldMode({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-shield-mode-status)

## warn

```ts nocheck
twitch.moderation.warn(params, options?): Promise<UserWarning>
```

Sends a warning to a chat user, who cannot chat again until they
acknowledge it. A new warning replaces a pending one.

**Jeton:** app or user, scope `moderator:manage:warnings`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster of the channel the warning applies to. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `user_id` <small>requis</small> | `string` | ID of the user to warn. |
| `reason` <small>requis</small> | `string` | Why the user is warned, 500 characters at most. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserWarning>`

<details>
<summary>Champs de UserWarning</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster of the channel the warning applies to. |
| `user_id` | `string` | ID of the warned user. |
| `moderator_id` | `string` | ID of the moderator who sent the warning. |
| `reason` | `string` | Reason given with the warning. |

</details>

### Exemple

```ts
await twitch.moderation.warn({ broadcaster_id: "141981764", user_id: "9876", reason: "Keep it friendly." });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#warn-chat-user)

## addSuspiciousStatus

```ts nocheck
twitch.moderation.addSuspiciousStatus(params, options?): Promise<SuspiciousUser>
```

Flags a chatter as suspicious in a channel, either to keep an eye on them
or to restrict their messages.

**Jeton:** app or user, scope `moderator:manage:suspicious_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster of the channel the status applies to. |
| `moderator_id` | `string` | Moderator who sets the status. Defaults to the user making the call. |
| `user_id` <small>requis</small> | `string` | ID of the chatter to flag. |
| `status` <small>requis</small> | `"ACTIVE_MONITORING" \| "RESTRICTED"` | `"ACTIVE_MONITORING"` watches the user, `"RESTRICTED"` also hides their messages from chat. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<SuspiciousUser>`

<details>
<summary>Champs de SuspiciousUser</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the chatter. |
| `broadcaster_id` | `string` | ID of the broadcaster of the channel. |
| `moderator_id` | `string` | ID of the moderator who last changed the status. |
| `updated_at` | `string` | When the status last changed, as an RFC 3339 timestamp. |
| `status` | `SuspiciousUserStatus` | Current treatment. `"NO_TREATMENT"` once the status has been removed. |
| `types` | `SuspiciousUserType[]` | Reasons the user is considered suspicious. |

</details>

### Exemple

```ts
const flagged = await twitch.moderation.addSuspiciousStatus({
  broadcaster_id: "141981764",
  user_id: "9876",
  status: "RESTRICTED",
});
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#add-suspicious-status-to-chat-user)

## removeSuspiciousStatus

```ts nocheck
twitch.moderation.removeSuspiciousStatus(params, options?): Promise<SuspiciousUser>
```

Clears the suspicious status of a chatter in a channel.

**Jeton:** app or user, scope `moderator:manage:suspicious_users`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster of the channel the status applies to. |
| `moderator_id` | `string` | Moderator who removes the status. Defaults to the user making the call. |
| `user_id` <small>requis</small> | `string` | ID of the chatter to clear. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<SuspiciousUser>`

<details>
<summary>Champs de SuspiciousUser</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the chatter. |
| `broadcaster_id` | `string` | ID of the broadcaster of the channel. |
| `moderator_id` | `string` | ID of the moderator who last changed the status. |
| `updated_at` | `string` | When the status last changed, as an RFC 3339 timestamp. |
| `status` | `SuspiciousUserStatus` | Current treatment. `"NO_TREATMENT"` once the status has been removed. |
| `types` | `SuspiciousUserType[]` | Reasons the user is considered suspicious. |

</details>

### Exemple

```ts
await twitch.moderation.removeSuspiciousStatus({ broadcaster_id: "141981764", user_id: "9876" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#remove-suspicious-status-from-chat-user)
