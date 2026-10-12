---
title: twitch.users
description: "Users: profiles, block list and installed extensions."
sidebar:
  label: users
---

Every method of `twitch.users`, with its parameters, what it returns and the token it needs.

## get

```ts nocheck
twitch.users.get(params, options?): Promise<User[]>
```

Gets users by ID, by login name, or both. Users that do not exist are
left out of the result.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string \| readonly string[]` | IDs of the users to get. Any number: long lists are split for you. |
| `login` | `string \| readonly string[]` | Login names of the users to get. Any number: long lists are split for you. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<User[]>`

<details>
<summary>Fields of User</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the user. |
| `login` | `string` | Login name: lowercase, the one that appears in URLs. |
| `display_name` | `string` | Display name, with the capitalisation the user chose. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Staff role on Twitch. An empty string for a regular user. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Monetisation status. An empty string for a regular broadcaster. |
| `description` | `string` | Channel description written by the user. |
| `profile_image_url` | `string` | URL of the profile picture. |
| `offline_image_url` | `string` | URL of the image shown when the channel is offline. |
| `view_count` | `number` | Deprecated. Twitch no longer fills this field. |
| `email` | `string` | Verified email address. Only present when the call is made with a token of this user that has the `user:read:email` scope. |
| `created_at` | `string` | When the account was created, as an RFC 3339 timestamp. |

</details>

### Example

```ts
const users = await twitch.users.get({ login: ["twitchdev", "twitch"] });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-users)

## getById

```ts nocheck
twitch.users.getById(id, options?): Promise<User | null>
```

Gets one user by ID, or `null` when there is no such user. Calls made in
the same tick are merged into a single request.

**Token:** app or user.

### Parameters

`id`: `string`

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<User \| null>`

<details>
<summary>Fields of User</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the user. |
| `login` | `string` | Login name: lowercase, the one that appears in URLs. |
| `display_name` | `string` | Display name, with the capitalisation the user chose. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Staff role on Twitch. An empty string for a regular user. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Monetisation status. An empty string for a regular broadcaster. |
| `description` | `string` | Channel description written by the user. |
| `profile_image_url` | `string` | URL of the profile picture. |
| `offline_image_url` | `string` | URL of the image shown when the channel is offline. |
| `view_count` | `number` | Deprecated. Twitch no longer fills this field. |
| `email` | `string` | Verified email address. Only present when the call is made with a token of this user that has the `user:read:email` scope. |
| `created_at` | `string` | When the account was created, as an RFC 3339 timestamp. |

</details>

### Example

```ts
const user = await twitch.users.getById("141981764");
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-users)

## getByLogin

```ts nocheck
twitch.users.getByLogin(login, options?): Promise<User | null>
```

Gets one user by login name, or `null` when there is no such user. Calls
made in the same tick are merged into a single request.

**Token:** app or user.

### Parameters

`login`: `string`

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<User \| null>`

<details>
<summary>Fields of User</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the user. |
| `login` | `string` | Login name: lowercase, the one that appears in URLs. |
| `display_name` | `string` | Display name, with the capitalisation the user chose. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Staff role on Twitch. An empty string for a regular user. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Monetisation status. An empty string for a regular broadcaster. |
| `description` | `string` | Channel description written by the user. |
| `profile_image_url` | `string` | URL of the profile picture. |
| `offline_image_url` | `string` | URL of the image shown when the channel is offline. |
| `view_count` | `number` | Deprecated. Twitch no longer fills this field. |
| `email` | `string` | Verified email address. Only present when the call is made with a token of this user that has the `user:read:email` scope. |
| `created_at` | `string` | When the account was created, as an RFC 3339 timestamp. |

</details>

### Example

```ts
const user = await twitch.users.getByLogin("twitchdev");
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-users)

## me

```ts nocheck
twitch.users.me(options?): Promise<User>
```

Gets the user who owns the token the call is made with. Includes `email`
when the token has the `user:read:email` scope.

**Token:** user.

### Parameters

This method takes no parameters of its own.

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<User>`

<details>
<summary>Fields of User</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the user. |
| `login` | `string` | Login name: lowercase, the one that appears in URLs. |
| `display_name` | `string` | Display name, with the capitalisation the user chose. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Staff role on Twitch. An empty string for a regular user. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Monetisation status. An empty string for a regular broadcaster. |
| `description` | `string` | Channel description written by the user. |
| `profile_image_url` | `string` | URL of the profile picture. |
| `offline_image_url` | `string` | URL of the image shown when the channel is offline. |
| `view_count` | `number` | Deprecated. Twitch no longer fills this field. |
| `email` | `string` | Verified email address. Only present when the call is made with a token of this user that has the `user:read:email` scope. |
| `created_at` | `string` | When the account was created, as an RFC 3339 timestamp. |

</details>

### Example

```ts
const me = await twitch.users.me();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-users)

## update

```ts nocheck
twitch.users.update(params, options?): Promise<User>
```

Updates the description of the user making the call.

**Token:** user, scope `user:edit`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `description` | `string` | New channel description, 300 characters at most. An empty string removes it. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<User>`

<details>
<summary>Fields of User</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the user. |
| `login` | `string` | Login name: lowercase, the one that appears in URLs. |
| `display_name` | `string` | Display name, with the capitalisation the user chose. |
| `type` | `"" \| "admin" \| "global_mod" \| "staff"` | Staff role on Twitch. An empty string for a regular user. |
| `broadcaster_type` | `"" \| "affiliate" \| "partner"` | Monetisation status. An empty string for a regular broadcaster. |
| `description` | `string` | Channel description written by the user. |
| `profile_image_url` | `string` | URL of the profile picture. |
| `offline_image_url` | `string` | URL of the image shown when the channel is offline. |
| `view_count` | `number` | Deprecated. Twitch no longer fills this field. |
| `email` | `string` | Verified email address. Only present when the call is made with a token of this user that has the `user:read:email` scope. |
| `created_at` | `string` | When the account was created, as an RFC 3339 timestamp. |

</details>

### Example

```ts
await twitch.users.update({ description: "Live every evening." });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-user)

## authorization

```ts nocheck
twitch.users.authorization(params, options?): Promise<UserAuthorization[]>
```

Tells which scopes the given users granted to your application.

**Token:** app.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user_id` <small>required</small> | `string \| readonly string[]` | IDs of the users to check. Any number: long lists are split for you. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<UserAuthorization[]>`

<details>
<summary>Fields of UserAuthorization</summary>

| Name | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the user. |
| `user_name` | `string` | Display name of the user. |
| `user_login` | `string` | Login name of the user. |
| `scopes` | `string[]` | Every scope the user granted to your client ID. |
| `has_authorized` | `boolean` | Whether the user authorized your application at all. |

</details>

### Example

```ts
const [auth] = await twitch.users.authorization({ user_id: "141981764" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-authorization-by-user)

## blocks

```ts nocheck
twitch.users.blocks(params?, options?): Paginator<BlockedUser>
```

Lists the users a broadcaster has blocked, most recent first.

**Token:** user, scope `user:read:blocked_users`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Broadcaster whose block list to read. Defaults to the user making the call. |
| `first` | `number` | Items per page, 1 to 100. Twitch defaults to 20. |
| `after` | `string` | Cursor of the page to fetch. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Paginator<BlockedUser>`

<details>
<summary>Fields of BlockedUser</summary>

| Name | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | ID of the blocked user. |
| `user_login` | `string` | Login name of the blocked user. |
| `display_name` | `string` | Display name of the blocked user. |

</details>

### Example

```ts
for await (const blocked of twitch.users.blocks()) console.log(blocked.user_login);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-user-block-list)

## block

```ts nocheck
twitch.users.block(params, options?): Promise<void>
```

Blocks a user on behalf of the user making the call.

**Token:** user, scope `user:manage:blocked_users`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `target_user_id` <small>required</small> | `string` | ID of the user to block. |
| `source_context` | `"chat" \| "whisper"` | Where the behaviour that motivates the block took place. |
| `reason` | `"harassment" \| "spam" \| "other"` | Why the user is being blocked. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.users.block({ target_user_id: "198704263", reason: "spam" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#block-user)

## unblock

```ts nocheck
twitch.users.unblock(params, options?): Promise<void>
```

Removes a block set by the user making the call.

**Token:** user, scope `user:manage:blocked_users`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `target_user_id` <small>required</small> | `string` | ID of the user to unblock. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<void>`

### Example

```ts
await twitch.users.unblock({ target_user_id: "198704263" });
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#unblock-user)

## extensions

```ts nocheck
twitch.users.extensions(options?): Promise<UserExtension[]>
```

Lists the extensions installed by the user making the call. Inactive ones
are only included with the `user:edit:broadcast` scope.

**Token:** user, scope `user:read:broadcast` or `user:edit:broadcast`.

### Parameters

This method takes no parameters of its own.

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<UserExtension[]>`

<details>
<summary>Fields of UserExtension</summary>

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID of the extension. |
| `version` | `string` | Installed version. |
| `name` | `string` | Name of the extension. |
| `can_activate` | `boolean` | Whether the extension is configured and ready to be activated. |
| `type` | `ExtensionType[]` | Slots this extension can be activated in. |

</details>

### Example

```ts
const extensions = await twitch.users.extensions();
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-user-extensions)

## activeExtensions

```ts nocheck
twitch.users.activeExtensions(params?, options?): Promise<ActiveExtensions>
```

Gets the extensions a broadcaster has active in each slot.

**Token:** app or user.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Broadcaster to read. Optional with a user token, required with an app token. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<ActiveExtensions>`

<details>
<summary>Fields of ActiveExtensions</summary>

| Name | Type | Description |
| --- | --- | --- |
| `panel` | `Record<string, ExtensionSlot>` | Panel extensions, shown under the video. |
| `overlay` | `Record<string, ExtensionSlot>` | Overlay extensions, shown on top of the whole video. |
| `component` | `Record<string, ComponentExtensionSlot>` | Component extensions, shown on top of a part of the video. |

</details>

### Example

```ts
const active = await twitch.users.activeExtensions({ user_id: "141981764" });
console.log(active.panel["1"]);
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#get-user-active-extensions)

## updateExtensions

```ts nocheck
twitch.users.updateExtensions(params, options?): Promise<ActiveExtensions>
```

Activates, deactivates or moves the extensions of the user making the call.

**Token:** user, scope `user:edit:broadcast`.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `data` <small>required</small> | `{ panel?: Record<string, ExtensionSlot> \| undefined; overlay?: Record<string, ExtensionSlot> \| undefined; component?: Record<string, ComponentExtensionSlot> \| undefined; }` | Slots to change, by kind then by slot number. Slots you leave out are untouched. |

`options`: Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.

### Returns

`Promise<ActiveExtensions>`

<details>
<summary>Fields of ActiveExtensions</summary>

| Name | Type | Description |
| --- | --- | --- |
| `panel` | `Record<string, ExtensionSlot>` | Panel extensions, shown under the video. |
| `overlay` | `Record<string, ExtensionSlot>` | Overlay extensions, shown on top of the whole video. |
| `component` | `Record<string, ComponentExtensionSlot>` | Component extensions, shown on top of a part of the video. |

</details>

### Example

```ts
await twitch.users.updateExtensions({
  data: { panel: { "1": { active: true, id: "rh6jq1q334hqc2rr1qlzqbvwlfl3x0", version: "1.1.0" } } },
});
```

[Twitch reference](https://dev.twitch.tv/docs/api/reference/#update-user-extensions)
