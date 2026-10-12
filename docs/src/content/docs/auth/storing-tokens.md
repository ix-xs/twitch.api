---
title: "Storing tokens"
description: "Keep user tokens between restarts with a token store: the file store for Node.js, your own store for a database or a KV namespace, or two events if you prefer to do it by hand."
sidebar:
  order: 4
---

By default the client keeps user tokens in memory, and they are gone when the process stops. Give it a token store and it restores your users on first use, writes every refreshed token back, and deletes the tokens that died. Nobody has to sign in again after a restart.

## A first example

On Node.js, the file store is one line.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  tokens: new FileTokenStore("./tokens.json"),
});

// First run: register the user. The token is written to tokens.json.
// Later runs: the user is restored from the file, this line is not needed.
await twitch.auth.addUser({ accessToken, refreshToken });
```

## What a store is

A store is an object with four methods, typed by `TokenStore`. Each one may return its result directly or as a promise.

| Method | Called when | Must do |
| --- | --- | --- |
| `get(userId)` | A user is restored, a call names a user who is not loaded yet, and before each refresh | Return the saved `UserToken`, or `undefined` |
| `set(userId, token)` | A user is registered (`addUser`, `exchangeCode`, the device code flow) and after every refresh | Save the token, replacing the previous one |
| `delete(userId)` | You call `removeUser`, or a token turned out to be dead | Forget the token |
| `list()` | Users are restored | Return every saved user ID. Optional. |

A `UserToken` is plain JSON (`userId`, `login`, `accessToken`, `refreshToken`, `scopes`, `expiresAt`), so `JSON.stringify` and `JSON.parse` are all the serialization you need.

Two stores ship with the library:

- `MemoryTokenStore`, in the main entry, is the default. It is a `Map`. Passing one yourself is handy in tests, where you want to look at what was saved.
- `FileTokenStore`, in `@ix-xs/twitch.api/node`, writes a JSON file.

## The file store

`new FileTokenStore(path)` keeps every user in one JSON file, keyed by user ID. The path defaults to `./tokens.json` and is resolved once, when the store is built: `store.path` is the absolute path.

```json
{
  "141981764": {
    "userId": "141981764",
    "accessToken": "...",
    "scopes": ["user:read:chat", "user:write:chat"],
    "login": "twitchdev",
    "refreshToken": "...",
    "expiresAt": 1791798000000
  }
}
```

It is written with some care:

- **Atomic writes.** The store writes a temporary file next to the target and renames it into place. A crash in the middle of a write leaves the previous file, never half a file.
- **One write at a time.** Two refreshes that finish together are written one after the other.
- **Owner-only permissions.** The file is created with mode `0600` on platforms that have file modes.
- **Missing pieces are created.** A file that does not exist yet is an empty store, and missing parent directories are created at the first write.

The file is read once and then kept in memory, so the store assumes it is the only writer. Use one file per process, and do not edit the file while the program runs. To share users between processes, use a database or a KV namespace, as described under "Several processes" below.

:::caution
The file holds access tokens and refresh tokens. Add it to `.gitignore` and keep it out of anything you publish, container images included.
:::

`FileTokenStore` lives in a separate entry point because it imports `node:fs`. The main entry stays free of Node.js built-ins, which is what lets it run on other runtimes. See [Runtimes](/basics/runtimes/).

## How users are restored

When you pass a store, the client calls `twitch.auth.restore()` by itself before its first request. It asks the store for its list of IDs and loads each token. You do not have to call anything.

Tokens are loaded as they were saved, without a request to Twitch. An access token that expired while the program was stopped is refreshed the first time it is used.

Calling `restore()` yourself is useful at startup, when you need to know whether someone is already signed in:

```ts
const [saved] = await twitch.auth.restore();

if (saved) console.log(`Welcome back, ${saved.login}`);
else console.log("Nobody is signed in yet.");
```

A few details that matter:

- `restore()` resolves with the tokens it loaded. It runs once: later calls resolve with the same list and do not read the store again.
- `twitch.auth.users`, `getUser()` and `hasUser()` are synchronous and only know the users loaded so far. Before the first request or the first `restore()`, they are empty.
- A user you registered with `addUser` before the restore is kept as is. The stored copy does not replace it.
- If the store throws, the call that triggered the restore fails with that error, and the next call tries again.

## Write your own store

Anything that can save a JSON value under a key can be a store. Here is one for a SQL database, with one row per user. The `sql` function stands for your database client.

```ts title="src/token-store.ts"
import type { TokenStore, UserToken } from "@ix-xs/twitch.api";

// Your database client: a tagged template that returns rows.
declare function sql<Row = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;

export const store: TokenStore = {
  async get(userId) {
    const [row] = await sql<{ token: string }>`SELECT token FROM twitch_tokens WHERE user_id = ${userId}`;
    return row ? (JSON.parse(row.token) as UserToken) : undefined;
  },
  async set(userId, token) {
    await sql`
      INSERT INTO twitch_tokens (user_id, token) VALUES (${userId}, ${JSON.stringify(token)})
      ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token`;
  },
  async delete(userId) {
    await sql`DELETE FROM twitch_tokens WHERE user_id = ${userId}`;
  },
  async list() {
    const rows = await sql<{ user_id: string }>`SELECT user_id FROM twitch_tokens`;
    return rows.map((row) => row.user_id);
  },
};
```

And one for a key-value namespace, such as Cloudflare Workers KV. The declared `kv` has the shape of a KV binding.

```ts
import { Twitch, type TokenStore, type UserToken } from "@ix-xs/twitch.api";

declare const kv: {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
};

const store: TokenStore = {
  async get(userId) {
    const saved = await kv.get(`twitch:${userId}`);
    return saved ? (JSON.parse(saved) as UserToken) : undefined;
  },
  set: (userId, token) => kv.put(`twitch:${userId}`, JSON.stringify(token)),
  delete: (userId) => kv.delete(`twitch:${userId}`),
};

const twitch = new Twitch({ clientId, clientSecret, tokens: store });
```

### Leaving out the list

The second store has no `list()`, on purpose. Without it nothing is restored up front. A token is read from the store the first time a call names its user, with `{ as: userId }`, with `twitch.as(userId)`, or with the field that holds the acting user (a `broadcaster_id`, a `moderator_id`).

```ts
// Reads the token of this user from the store, then sends the request.
const me = await twitch.users.me({ as: userId });
```

That is the right shape for a server with many users, and for short-lived runtimes such as Workers: a store that lists ten thousand IDs makes the first request load ten thousand tokens, one `get` after the other. It has consequences you should know:

- `twitch.auth.users` only holds the users loaded so far.
- A call that names nobody cannot guess a user from the store. Always say who is acting.
- The hourly validation only covers loaded users.

### Several processes

Several processes can share one store, for example the instances of a server behind a load balancer. Each process keeps its own copy of the tokens in memory, and the store is how they stay in step:

- Before it refreshes a token, a process reads the store. If the token saved there is not the one it holds, another process already renewed it: the process adopts that token and sends nothing to Twitch. No `tokenRefresh` event fires for an adopted token.
- If Twitch refuses the refresh token, the process reads the store once more. A different refresh token there means another process spent the old one a moment ago: the newer token is adopted and the user is kept.

That makes sharing safe with a public client too, where a refresh token works once (see [Device code flow](/auth/device-code/)). Two limits remain. The store has to return what is saved right now, which a database or a KV namespace does and `FileTokenStore`, with its in-memory copy, does not. And two processes that refresh the same token at the very same instant can still race: with a single use refresh token, the one that loses may find nothing newer in the store yet and drop the user.

## Save tokens with events instead

If you would rather not hand over a store, listen to two events and register the saved tokens yourself at startup.

```ts
import type { UserToken } from "@ix-xs/twitch.api";

declare function loadTokens(): Promise<UserToken[]>;
declare function saveToken(token: UserToken): Promise<void>;
declare function forgetToken(userId: string): Promise<void>;

// A saved token has its owner and its scopes: no request is made here.
for (const saved of await loadTokens()) await twitch.auth.addUser(saved);

twitch.on("tokenRefresh", (token) => {
  saveToken(token).catch(console.error);
});
twitch.on("tokenInvalid", (userId) => {
  forgetToken(userId).catch(console.error);
});
```

`tokenRefresh` fires after each refresh, not when a user is first registered. Save the `UserToken` returned by `addUser`, `exchangeCode` or `flow.wait()` yourself. [Observability](/basics/observability/) describes the events.

## What to protect

An access token lets its holder do everything the user allowed your application to do. A refresh token lets its holder mint new access tokens for as long as the authorization lasts. Treat a saved `UserToken` like a password.

- Keep tokens on the server. A browser gets a session cookie, never the token.
- Do not log `UserToken` objects, and do not put tokens in URLs.
- Restrict who can read the store: file permissions, database roles, encryption at rest when your platform offers it. A store being four methods, wrapping one to encrypt values on the way in and decrypt them on the way out takes a few lines.
- When a user signs out, or when you suspect a leak, call `twitch.auth.removeUser(userId, { revoke: true })`. It deletes the token from the store and invalidates the access token at Twitch.

## See also

- [Managing users](/auth/managing-users/): register, list, refresh and remove users.
- [Device code flow](/auth/device-code/): sign in once, then restore from the store.
- [Observability](/basics/observability/): the `tokenRefresh` and `tokenInvalid` events.
- [Runtimes](/basics/runtimes/): why the file store has its own entry point.
