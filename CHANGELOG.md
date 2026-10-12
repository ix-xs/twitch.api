# Changelog

All notable changes to `@ix-xs/twitch.api` are documented here. This project
adheres to [Semantic Versioning](https://semver.org).

## Unreleased

### Fixed

- `twitch.rateLimitOf()` returned `undefined` on a client with little traffic.
  Twitch reports a reset time that is already reached when the bucket is
  nearly full, and the client took that for a finished window. It now reports
  the bucket as full once its reset time has passed.

## 2.0.1

### Changed

- The package description, so that the npm page says the same thing as the
  repository. No change to the code.

## 2.0.0

A rewrite from scratch, in TypeScript. Version 1 covered 12 endpoints with an
app token. Version 2 covers the whole Twitch API, user tokens and EventSub.

### Breaking

- The client is the named export `Twitch` and takes `clientId` and
  `clientSecret`. Version 1 documented those names but read `client_id` and
  `client_secret`.
- `initialize()` is gone. Tokens are requested when a call needs them.
- Methods throw typed errors (`TwitchApiError`, `TwitchAuthError`...) instead
  of returning `{ ok, result }`.
- Methods are grouped (`twitch.users.get`, `twitch.streams.get`...) and take
  IDs, like the Twitch API. The README has the full mapping from version 1.
- Node.js 22 or later is required.

### Added

- **Every Helix endpoint**: 149 endpoints in 30 groups, with typed parameters
  and responses, an example and a link to the official reference on each method.
- **Every EventSub subscription type**: 83 typed conditions and events, with
  discriminated unions for the events that come in several shapes
  (`channel.chat.notification`, `channel.moderate`, `channel.bits.use`...).
- **EventSub listeners** for WebSocket, webhooks and conduits behind one typed
  `on()`: automatic reconnection and resubscription, Twitch's reconnect
  handover, keepalive watchdog, signature verification, replay and duplicate
  protection. Webhooks plug into Fetch API runtimes and Node.js servers.
- **User tokens**: authorization code flow, device code flow, automatic
  refresh, hourly validation, revocation, and a pluggable `TokenStore`
  (`FileTokenStore` in `@ix-xs/twitch.api/node`).
- **Automatic choice of token**: each endpoint knows whether it needs the app
  token or a user's, and whose. The acting user (`moderator_id`,
  `broadcaster_id`, `sender_id`...) defaults to the owner of the token. `{ as }`
  and `twitch.as()` choose a user explicitly, and `"app"` asks for the app
  token.
- **Scope checks before the request**, with the missing scope in the error.
- **Pagination helpers**: `await` for a page, `for await` for every item,
  `all()`, `take()`, `first()`, `total()`.
- **Batching**: ID lists longer than Twitch's cap are split and fetched in
  parallel, and single lookups made at the same moment are merged into one
  request.
- **Rate limit handling**: per token buckets followed from the response
  headers, waiting instead of failing, retries with backoff for what is safe
  to retry, timeouts and `AbortSignal` support.
- **Typed errors**: `TwitchApiError`, `TwitchRateLimitError`,
  `TwitchAuthError`, `TwitchScopeError`, `TwitchTimeoutError`,
  `TwitchNetworkError` and `TwitchEventSubError`, all extending `TwitchError`.
- `twitch.request()` and `twitch.paginate()` for endpoints newer than the
  library, and `request`, `response`, `rateLimit`, `tokenRefresh` and
  `tokenInvalid` events.
- ESM and CommonJS builds with type declarations for both.

### Fixed

- The token is no longer written inside `node_modules`, which broke on
  read-only file systems, with pnpm, in monorepos and on every reinstall.
- The client secret is sent in the request body, not in the URL.
- Query values are URL encoded.
- The validation timer no longer keeps the process alive.

### Removed

- Dependencies: there are none.
