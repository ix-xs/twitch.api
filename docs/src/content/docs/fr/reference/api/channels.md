---
title: twitch.channels
description: "Channels: title, category and tags, editors, follows and followers."
sidebar:
  label: channels
---

Toutes les méthodes de `twitch.channels`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## get

```ts nocheck
twitch.channels.get(params, options?): Promise<ChannelInformation[]>
```

Gets the title, category, language and tags of one or more channels.
Channels that do not exist are left out of the result.

**Jeton:** app or user.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string \| readonly string[]` | IDs of the broadcasters to get. Any number: long lists are split for you. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChannelInformation[]>`

<details>
<summary>Champs de ChannelInformation</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the broadcaster. |
| `broadcaster_login` | `string` | Login name of the broadcaster. |
| `broadcaster_name` | `string` | Display name of the broadcaster. |
| `broadcaster_language` | `string` | Language of the channel: an ISO 639-1 code, or `"other"`. |
| `game_name` | `string` | Name of the current or last category. An empty string when the channel never had one. |
| `game_id` | `string` | ID of the current or last category. An empty string when the channel never had one. |
| `title` | `string` | Title of the current or last stream. An empty string when the channel never streamed. |
| `delay` | `number` | Stream delay in seconds. Stays at `0` unless the call is made with the token of this broadcaster, who must be a partner with a delay set. |
| `tags` | `string[]` | Tags applied to the channel. |
| `content_classification_labels` | `string[]` | IDs of the content classification labels applied to the channel. |
| `is_branded_content` | `boolean` | Whether the channel is flagged as showing branded content. |

</details>

### Exemple

```ts
const [channel] = await twitch.channels.get({ broadcaster_id: "141981764" });
console.log(channel?.title, channel?.game_name);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-information)

## update

```ts nocheck
twitch.channels.update(params?, options?): Promise<void>
```

Changes the title, category, language, tags, delay or content labels of a
channel. Only the fields you set are touched.

**Jeton:** user, scope `channel:manage:broadcast`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose channel to update. Defaults to the user making the call. |
| `game_id` | `string` | ID of the category to set. `"0"` or an empty string clears it. |
| `broadcaster_language` | `string` | Language of the channel: an ISO 639-1 code, or `"other"`. |
| `title` | `string` | Stream title, 140 characters at most. Cannot be empty. |
| `delay` | `number` | Stream delay in seconds, 900 at most. Partners only. |
| `tags` | `readonly string[]` | Tags to apply, replacing the current ones. Up to 10, each 25 characters at most, without spaces or special characters. An empty array removes them all. |
| `content_classification_labels` | `readonly ChannelContentLabel[]` | Labels to switch on or off. Labels you leave out keep their current state. |
| `is_branded_content` | `boolean` | Whether the channel shows branded content. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.channels.update({ title: "Speedrun practice", game_id: "33214", tags: ["Speedrun"] });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#modify-channel-information)

## editors

```ts nocheck
twitch.channels.editors(params?, options?): Promise<ChannelEditor[]>
```

Lists the editors of a channel.

**Jeton:** user, scope `channel:read:editors`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster who owns the channel. Defaults to the user making the call. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChannelEditor[]>`

<details>
<summary>Champs de ChannelEditor</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the editor. |
| `user_name` | `string` | Display name of the editor. |
| `created_at` | `string` | When the user was made an editor, as an RFC 3339 timestamp. |

</details>

### Exemple

```ts
const editors = await twitch.channels.editors();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-editors)

## followed

```ts nocheck
twitch.channels.followed(params?, options?): Paginator<FollowedChannel>
```

Lists the channels a user follows, most recent follow first. With
`broadcaster_id` it tells whether the user follows that one channel.

**Jeton:** user, scope `user:read:follows`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | User whose follows to list. Defaults to the user making the call. |
| `broadcaster_id` | `string` | Only this broadcaster: the list holds one item when the user follows them, none otherwise. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<FollowedChannel>`

<details>
<summary>Champs de FollowedChannel</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | ID of the followed broadcaster. |
| `broadcaster_login` | `string` | Login name of the followed broadcaster. |
| `broadcaster_name` | `string` | Display name of the followed broadcaster. |
| `followed_at` | `string` | When the user started following, as an RFC 3339 timestamp. |

</details>

### Exemple

```ts
for await (const follow of twitch.channels.followed()) console.log(follow.broadcaster_name);
const count = await twitch.channels.followed().total();
const follows = (await twitch.channels.followed({ broadcaster_id: "141981764" })).data.length > 0;
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-followed-channels)

## followers

```ts nocheck
twitch.channels.followers(params, options?): Paginator<ChannelFollower>
```

Lists the followers of a channel, most recent first. The list itself is
only returned to the broadcaster or one of their moderators, with the
`moderator:read:followers` scope. Any other token gets an empty list but
still gets the follower count, which is what `total()` reads. With
`user_id` it tells whether that one user follows the channel.

**Jeton:** app or user. Scope `moderator:read:followers` to get the list.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Broadcaster whose followers to list. |
| `user_id` | `string` | Only this user: the list holds one item when they follow the broadcaster, none otherwise. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the next page. |

`options`: Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ChannelFollower>`

<details>
<summary>Champs de ChannelFollower</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the follower. |
| `user_login` | `string` | Login name of the follower. |
| `user_name` | `string` | Display name of the follower. |
| `followed_at` | `string` | When the user started following, as an RFC 3339 timestamp. |

</details>

### Exemple

```ts
const latest = await twitch.channels.followers({ broadcaster_id: "141981764" }).take(10);
const count = await twitch.channels.followers({ broadcaster_id: "141981764" }).total();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-followers)
