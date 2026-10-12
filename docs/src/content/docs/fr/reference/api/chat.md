---
title: twitch.chat
description: "Chat: send messages and announcements, chatters, emotes, badges, settings, colors, pins and shoutouts."
sidebar:
  label: chat
---

Toutes les méthodes de `twitch.chat`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## chatters

```ts nocheck
twitch.chat.chatters(params, options?): Paginator<Chatter>
```

Lists the users connected to a channel's chat. Twitch refreshes the list
with a delay, so recent joins and departures can be missing.

**Jeton:** app or user, scope `moderator:read:chatters`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose chat to read. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `first` | `number` | Items per page, 1 to 1000. Twitch defaults to 100. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Chatter>`

<details>
<summary>Champs de Chatter</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the user. |
| `user_login` | `string` | Login name of the user. |
| `user_name` | `string` | Display name of the user. |

</details>

### Exemple

```ts
const count = await twitch.chat.chatters({ broadcaster_id: "141981764" }).total();
for await (const chatter of twitch.chat.chatters({ broadcaster_id: "141981764" })) {
  console.log(chatter.user_login);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-chatters)

## channelEmotes

```ts nocheck
twitch.chat.channelEmotes(params, options?): Promise<ChatEmoteList<ChatChannelEmote>>
```

Gets the custom emotes of a channel: subscriber, follower and Bits tier emotes.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose custom emotes to get. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatEmoteList<ChatChannelEmote>>`

<details>
<summary>Champs de ChatEmoteList</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `data` | `ChatChannelEmote[]` | The emotes. |
| `template` | `string` | Image URL with the placeholders `&#123;&#123;id}}`, `&#123;&#123;format}}`, `&#123;&#123;theme_mode}}` and `&#123;&#123;scale}}`. Fill them with the values of an emote to get its CDN URL. |

</details>

### Exemple

```ts
const { data, template } = await twitch.chat.channelEmotes({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-emotes)

## globalEmotes

```ts nocheck
twitch.chat.globalEmotes(options?): Promise<ChatEmoteList<ChatEmote>>
```

Gets the emotes made by Twitch that work in every chat.

**Jeton:** app or user.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatEmoteList<ChatEmote>>`

<details>
<summary>Champs de ChatEmoteList</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `data` | `ChatEmote[]` | The emotes. |
| `template` | `string` | Image URL with the placeholders `&#123;&#123;id}}`, `&#123;&#123;format}}`, `&#123;&#123;theme_mode}}` and `&#123;&#123;scale}}`. Fill them with the values of an emote to get its CDN URL. |

</details>

### Exemple

```ts
const { data, template } = await twitch.chat.globalEmotes();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-global-emotes)

## emoteSets

```ts nocheck
twitch.chat.emoteSets(params, options?): Promise<ChatEmoteList<ChatSetEmote>>
```

Gets the emotes of one or more emote sets. Sets that do not exist are
left out of the result.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `emote_set_id` <small>requis</small> | `string \| readonly string[]` | IDs of the emote sets to get. Any number: long lists are split for you. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatEmoteList<ChatSetEmote>>`

<details>
<summary>Champs de ChatEmoteList</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `data` | `ChatSetEmote[]` | The emotes. |
| `template` | `string` | Image URL with the placeholders `&#123;&#123;id}}`, `&#123;&#123;format}}`, `&#123;&#123;theme_mode}}` and `&#123;&#123;scale}}`. Fill them with the values of an emote to get its CDN URL. |

</details>

### Exemple

```ts
const { data, template } = await twitch.chat.emoteSets({ emote_set_id: ["301590448", "318939165"] });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-emote-sets)

## channelBadges

```ts nocheck
twitch.chat.channelBadges(params, options?): Promise<ChatBadgeSet[]>
```

Gets the custom chat badges of a channel, such as its subscriber and Bits
badges. The list is empty when the channel has none.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose custom badges to get. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatBadgeSet[]>`

<details>
<summary>Champs de ChatBadgeSet</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `set_id` | `string` | ID of the set. |
| `versions` | `ChatBadgeVersion[]` | Badges of the set, sorted by ID. |

</details>

### Exemple

```ts
const sets = await twitch.chat.channelBadges({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-chat-badges)

## globalBadges

```ts nocheck
twitch.chat.globalBadges(options?): Promise<ChatBadgeSet[]>
```

Gets the chat badges made by Twitch that can show up in every chat.

**Jeton:** app or user.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatBadgeSet[]>`

<details>
<summary>Champs de ChatBadgeSet</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `set_id` | `string` | ID of the set. |
| `versions` | `ChatBadgeVersion[]` | Badges of the set, sorted by ID. |

</details>

### Exemple

```ts
const sets = await twitch.chat.globalBadges();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-global-chat-badges)

## settings

```ts nocheck
twitch.chat.settings(params, options?): Promise<ChatSettings>
```

Gets the chat settings of a channel. The chat delay settings are only
included when `moderator_id` is given and the call is made as that user
with the `moderator:read:chat_settings` scope.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose chat settings to get. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Only needed to read the chat delay settings, and the call must then be made with that user's token. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatSettings>`

<details>
<summary>Champs de ChatSettings</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `emote_mode` | `boolean` | Whether messages may only contain emotes. |
| `follower_mode` | `boolean` | Whether only followers may chat. |
| `follower_mode_duration` | `number \| null` | Minutes a user must have followed the channel before chatting. `null` when `follower_mode` is off. |
| `moderator_id` | `string` | ID of the moderator the call was made for. Only present with a user token that has the `moderator:read:chat_settings` scope. |
| `non_moderator_chat_delay` | `boolean` | Whether messages are held back for a moment so moderators can remove them first. Only present when the call names a moderator and uses their token with the `moderator:read:chat_settings` scope. |
| `non_moderator_chat_delay_duration` | `number` | Length of that delay, in seconds. `null` when the delay is off. Present under the same conditions. |
| `slow_mode` | `boolean` | Whether users must wait between two messages. |
| `slow_mode_wait_time` | `number \| null` | Seconds a user must wait between two messages. `null` when `slow_mode` is off. |
| `subscriber_mode` | `boolean` | Whether only subscribers may chat. |
| `unique_chat_mode` | `boolean` | Whether a user may not post the same message twice. |

</details>

### Exemple

```ts
const settings = await twitch.chat.settings({ broadcaster_id: "141981764" });
if (settings.slow_mode) console.log(settings.slow_mode_wait_time);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-chat-settings)

## sharedSession

```ts nocheck
twitch.chat.sharedSession(params, options?): Promise<SharedChatSession | null>
```

Gets the shared chat session a channel is part of, or `null` when it is
not in one.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose shared chat session to get. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<SharedChatSession \| null>`

<details>
<summary>Champs de SharedChatSession</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `session_id` | `string` | ID of the session. |
| `host_broadcaster_id` | `string` | ID of the broadcaster who hosts the session. |
| `participants` | `SharedChatParticipant[]` | Channels taking part in the session, host included. |
| `created_at` | `string` | When the session started, as an RFC 3339 timestamp. |
| `updated_at` | `string` | When the session last changed, as an RFC 3339 timestamp. |

</details>

### Exemple

```ts
const session = await twitch.chat.sharedSession({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-shared-chat-session)

## userEmotes

```ts nocheck
twitch.chat.userEmotes(params?, options?): Paginator<ChatUserEmote, ChatUserEmotePage>
```

Lists every emote a user can post, across all channels. The URL template
comes with each page, as `page.raw.template`.

**Jeton:** user, scope `user:read:emotes`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | User whose emotes to list. Defaults to the user making the call. |
| `broadcaster_id` | `string` | Makes sure the follower emotes of this broadcaster are part of the result. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ChatUserEmote, ChatUserEmotePage>`

<details>
<summary>Champs de ChatUserEmote</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the emote. |
| `name` | `string` | Name of the emote, which is what the user types in chat to post it. Case sensitive. |
| `emote_type` | `ChatUserEmoteType` | How the user obtained the emote. |
| `emote_set_id` | `string` | ID of the emote set the emote belongs to. An empty string when it belongs to none. |
| `owner_id` | `string` | ID of the broadcaster who owns the emote. An empty string when it has no owner. |
| `format` | `ChatEmoteFormat[]` | Formats the emote exists in. |
| `scale` | `ChatEmoteScale[]` | Sizes the emote exists in. |
| `theme_mode` | `ChatEmoteThemeMode[]` | Backgrounds the emote exists for. |

</details>

### Exemple

```ts
const page = await twitch.chat.userEmotes();
console.log(page.data.length, page.raw.template);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-user-emotes)

## updateSettings

```ts nocheck
twitch.chat.updateSettings(params, options?): Promise<ChatSettings>
```

Changes the chat settings of a channel and returns the new ones. To set a
duration, send its mode as `true` in the same call, even when the mode is
already on.

**Jeton:** app or user, scope `moderator:manage:chat_settings`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose chat settings to change. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `emote_mode` | `boolean` | Whether messages may only contain emotes. |
| `follower_mode` | `boolean` | Whether only followers may chat. |
| `follower_mode_duration` | `number` | Minutes a user must have followed the channel before chatting, 0 to 129600. Send it with `follower_mode: true`. |
| `non_moderator_chat_delay` | `boolean` | Whether messages are held back for a moment so moderators can remove them first. |
| `non_moderator_chat_delay_duration` | `2 \| 4 \| 6` | Length of that delay, in seconds. Send it with `non_moderator_chat_delay: true`. |
| `slow_mode` | `boolean` | Whether users must wait between two messages. |
| `slow_mode_wait_time` | `number` | Seconds a user must wait between two messages, 3 to 120. Send it with `slow_mode: true`. |
| `subscriber_mode` | `boolean` | Whether only subscribers may chat. |
| `unique_chat_mode` | `boolean` | Whether a user may not post the same message twice. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatSettings>`

<details>
<summary>Champs de ChatSettings</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `emote_mode` | `boolean` | Whether messages may only contain emotes. |
| `follower_mode` | `boolean` | Whether only followers may chat. |
| `follower_mode_duration` | `number \| null` | Minutes a user must have followed the channel before chatting. `null` when `follower_mode` is off. |
| `moderator_id` | `string` | ID of the moderator the call was made for. Only present with a user token that has the `moderator:read:chat_settings` scope. |
| `non_moderator_chat_delay` | `boolean` | Whether messages are held back for a moment so moderators can remove them first. Only present when the call names a moderator and uses their token with the `moderator:read:chat_settings` scope. |
| `non_moderator_chat_delay_duration` | `number` | Length of that delay, in seconds. `null` when the delay is off. Present under the same conditions. |
| `slow_mode` | `boolean` | Whether users must wait between two messages. |
| `slow_mode_wait_time` | `number \| null` | Seconds a user must wait between two messages. `null` when `slow_mode` is off. |
| `subscriber_mode` | `boolean` | Whether only subscribers may chat. |
| `unique_chat_mode` | `boolean` | Whether a user may not post the same message twice. |

</details>

### Exemple

```ts
await twitch.chat.updateSettings({ broadcaster_id: "141981764", slow_mode: true, slow_mode_wait_time: 10 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-chat-settings)

## announce

```ts nocheck
twitch.chat.announce(params, options?): Promise<void>
```

Posts a highlighted announcement in a channel's chat. Limited to one
announcement every 2 seconds.

**Jeton:** app or user, scope `moderator:manage:announcements`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose chat receives the announcement. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `message` <small>requis</small> | `string` | Text of the announcement. Anything past 500 characters is cut. |
| `color` | `ChatAnnouncementColor` | Highlight color. Twitch defaults to `"primary"`. |
| `for_source_only` | `boolean` | During a shared chat session, whether only this channel gets the announcement. App tokens only, where it defaults to `true`. Twitch rejects it with a user token. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.announce({ broadcaster_id: "141981764", message: "Giveaway in 5 minutes", color: "purple" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-chat-announcement)

## shoutout

```ts nocheck
twitch.chat.shoutout(params, options?): Promise<void>
```

Gives a shoutout to another broadcaster, which shows their channel with a
follow button in chat. The sending channel must be live. Limited to one
shoutout every 2 minutes, and one per hour to the same broadcaster.

**Jeton:** app or user, scope `moderator:manage:shoutouts`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `from_broadcaster_id` <small>requis</small> | `string` | Broadcaster who gives the shoutout. |
| `to_broadcaster_id` <small>requis</small> | `string` | Broadcaster who receives the shoutout. |
| `moderator_id` | `string` | The broadcaster giving the shoutout or one of their moderators. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.shoutout({ from_broadcaster_id: "141981764", to_broadcaster_id: "12826" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-a-shoutout)

## send

```ts nocheck
twitch.chat.send(params, options?): Promise<SentChatMessage>
```

Sends a message to a channel's chat. Check `is_sent` on the result: a
message Twitch refuses comes back with a `drop_reason` instead of an error.

**Jeton:** app or user, scope `user:write:chat`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose chat receives the message. |
| `sender_id` | `string` | User who sends the message. Defaults to the user making the call. |
| `message` <small>requis</small> | `string` | Text of the message, 500 characters at most. Emote names are turned into emotes. |
| `reply_parent_message_id` | `string` | ID of the message this one replies to. |
| `for_source_only` | `boolean` | During a shared chat session, whether only this channel gets the message. App tokens only. Twitch rejects it with a user token. |
| `pin` | `boolean` | Pins the message for 20 minutes as it is sent. The sender must be the broadcaster or a moderator and also needs the `moderator:manage:chat_messages` scope. Cannot be used together with `reply_parent_message_id` or `for_source_only`. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<SentChatMessage>`

<details>
<summary>Champs de SentChatMessage</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `message_id` | `string` | ID of the message. |
| `is_sent` | `boolean` | Whether the message passed every check and reached the chat. |
| `drop_reason` | `ChatMessageDropReason` | Why the message was not delivered. Absent or `null` when it was. |

</details>

### Exemple

```ts
const sent = await twitch.chat.send({ broadcaster_id: "141981764", message: "Hello chat" });
if (!sent.is_sent) console.log(sent.drop_reason?.message);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-chat-message)

## pinnedMessage

```ts nocheck
twitch.chat.pinnedMessage(params, options?): Promise<PinnedChatMessage | null>
```

Gets the message pinned in a channel's chat, or `null` when nothing is
pinned.

**Jeton:** app or user, scope `moderator:manage:chat_messages` or `moderator:read:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the chat. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<PinnedChatMessage \| null>`

<details>
<summary>Champs de PinnedChatMessage</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `message_id` | `string` | ID of the pinned message. |
| `broadcaster_id` | `string` | ID of the broadcaster who owns the chat. |
| `sender_user_id` | `string` | ID of the user who wrote the message. |
| `sender_user_login` | `string` | Login name of the user who wrote the message. |
| `sender_user_name` | `string` | Display name of the user who wrote the message. |
| `pinned_by_user_id` | `string` | ID of the user who pinned the message. |
| `pinned_by_user_login` | `string` | Login name of the user who pinned the message. |
| `pinned_by_user_name` | `string` | Display name of the user who pinned the message. |
| `message` | `{ text: string; fragments: PinnedChatMessageFragment[]; }` | Content of the message. |
| `starts_at` | `string` | When the message was pinned, as an RFC 3339 timestamp. |
| `ends_at` | `string \| null` | When the pin expires, as an RFC 3339 timestamp. `null` when it lasts until the stream ends. |
| `updated_at` | `string` | When the pin was last changed, as an RFC 3339 timestamp. |

</details>

### Exemple

```ts
const pinned = await twitch.chat.pinnedMessage({ broadcaster_id: "141981764" });
if (pinned) console.log(pinned.message.text);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-pinned-chat-message)

## pin

```ts nocheck
twitch.chat.pin(params, options?): Promise<void>
```

Pins a message at the top of a channel's chat. A chat holds one pinned
message, so this replaces the current one.

**Jeton:** app or user, scope `moderator:manage:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the chat. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `message_id` <small>requis</small> | `string` | ID of the message to pin. |
| `duration_seconds` | `number` | Seconds the message stays pinned, 30 to 1800. Without it the pin lasts until the stream ends. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.pin({ broadcaster_id: "141981764", message_id: sent.message_id, duration_seconds: 300 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#pin-chat-message)

## updatePin

```ts nocheck
twitch.chat.updatePin(params, options?): Promise<void>
```

Changes how long a pinned message stays pinned. The new duration counts
from the moment of the call.

**Jeton:** app or user, scope `moderator:manage:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the chat. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `message_id` <small>requis</small> | `string` | ID of the pinned message. |
| `duration_seconds` | `number` | Seconds the message stays pinned counting from now, 30 to 1800. Without it the pin lasts until the stream ends. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.updatePin({ broadcaster_id: "141981764", message_id: pinned.message_id, duration_seconds: 600 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-pinned-chat-message)

## unpin

```ts nocheck
twitch.chat.unpin(params, options?): Promise<void>
```

Removes a pinned message from the top of a channel's chat.

**Jeton:** app or user, scope `moderator:manage:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster who owns the chat. |
| `moderator_id` | `string` | The broadcaster or one of their moderators. Defaults to the user making the call. |
| `message_id` <small>requis</small> | `string` | ID of the message to unpin. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.unpin({ broadcaster_id: "141981764", message_id: pinned.message_id });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#unpin-chat-message)

## colors

```ts nocheck
twitch.chat.colors(params, options?): Promise<UserChatColor[]>
```

Gets the color users have for their name in chat. Users that do not exist
are left out of the result.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` <small>requis</small> | `string \| readonly string[]` | IDs of the users to look up. Any number: long lists are split for you. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserChatColor[]>`

<details>
<summary>Champs de UserChatColor</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the user. |
| `user_login` | `string` | Login name of the user. |
| `user_name` | `string` | Display name of the user. |
| `color` | `string` | Hex code of the color, such as `"#9146FF"`. An empty string when the user never picked one. |

</details>

### Exemple

```ts
const [entry] = await twitch.chat.colors({ user_id: "141981764" });
console.log(entry?.color);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-user-chat-color)

## setColor

```ts nocheck
twitch.chat.setColor(params, options?): Promise<void>
```

Changes the color of a user's name in chat. Hex codes are reserved to
Turbo and Prime users, everyone else picks a named color.

**Jeton:** user, scope `user:manage:chat_color`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | User whose color to change. Defaults to the user making the call. |
| `color` <small>requis</small> | `ChatColorName \| (string & {})` | A named color, or a hex code such as `"#9146FF"` for Turbo and Prime users. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.setColor({ color: "blue_violet" });
await twitch.chat.setColor({ color: "#9146FF" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-user-chat-color)
