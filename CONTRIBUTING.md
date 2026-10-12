# Contributing to `@ix-xs/twitch.api`

Thanks for helping out. Everything below runs from the repository root.

## Prerequisites

- Node.js 22 or later
- `npm install`

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run check` | Typecheck, typecheck the tests and examples, build, run the tests. Run it before pushing. |
| `npm test` | Unit tests (vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run typecheck` | `tsc --noEmit` on `src/` |
| `npm run test:types` | `tsc --noEmit` on `src/`, `test/` and `examples/` |
| `npm run build` | Dual ESM/CJS build and `.d.ts` into `dist/` |
| `npm run attw` | Checks that the published types resolve for every kind of consumer |

## Where things live

```
src/client.ts           the Twitch class
src/auth/               tokens, OAuth flows, scopes
src/http/               request pipeline, rate limiter, pagination, batching
src/api/                one file per Helix resource
src/eventsub/           listeners (WebSocket, webhook) and types/ for every subscription type
src/node.ts             Node.js only helpers, published as @ix-xs/twitch.api/node
test/                   mirrors src/, with a fake fetch in test/helpers.ts
examples/               runnable examples, plus readme.ts which holds every README snippet
```

Only `dist/`, `README.md`, `CHANGELOG.md` and `LICENSE` are published to npm.

## Adding or updating a Helix endpoint

Twitch ships endpoints regularly. Each one is a method on the group of its
resource, in `src/api/<resource>.ts`. `src/api/users.ts` and
`src/api/streams.ts` are the reference for style.

1. **Signature**: `method(params: XParams, options?: RequestOptions)`. Default
   `params` to `{}` when every field is optional. Always forward `options`.
2. **Params** are one flat object that uses Twitch's own field names, merging
   query parameters and body fields. The method splits them. A `data` wrapper
   that only exists for transport is flattened away.
3. **Return type**, never the raw `{ data: [...] }` envelope:
   - a cursor in the response: `Paginator<Item>` through `this.rest.paginate`
     (pass `{ max }` when the largest page is not 100, `{ sizeParam: null }`
     when there is no page size parameter);
   - a plain list: `this.rest.data`, or `this.rest.chunked` when it is looked
     up by a capped list of IDs;
   - exactly one object: `this.rest.one`; one or none: `this.rest.first`;
   - nothing: `this.rest.send`.
4. **`auth`**: `"user"` or `"app"` when the endpoint accepts only one kind of
   token. Leave it out when it accepts both.
5. **`scopes`**: every scope that satisfies the endpoint (one is enough).
6. **`context`**: the parameter that names the acting user (`broadcaster_id`,
   `moderator_id`, `user_id`...), when Twitch requires it to match the token.
   That field is optional in the params type and documented as "Defaults to
   the user making the call."
7. **Types**: export every type, with names specific to the group
   (`PollChoice`, not `Choice`). Closed sets are string literal unions.
   Timestamps are `string` in responses and `string | Date` in parameters.
8. **Documentation**: every type, field and method has a short comment in
   your own words. Do not paste sentences from the Twitch documentation.
   Methods end with a `Token:` line, an `@example` and an `@see` link to the
   official reference.
9. **Test**: one case per method in `test/api/<resource>.test.ts` that checks
   the HTTP method, the path, what went to the query and to the body, the
   token used and the returned value.

## Adding or updating an EventSub subscription type

Types live in `src/eventsub/types/`. Each file exports the condition and event
interfaces, an entry in its map interface, and the version in its versions
constant.

- The map key is the subscription type as Twitch spells it. The plain key is
  the newest version. Older versions use `"<type>@<version>"`.
- Type names start with the PascalCase form of the subscription type
  (`ChannelChatMessageEvent`).
- When a discriminator field decides which objects are present, model the
  event as a union so that narrowing works.

## Style

- TypeScript `strict`, no `any`, `import type` for types, relative imports
  ending in `.js`.
- The main entry point only uses web standard APIs. Anything that needs a
  Node.js built-in goes in `src/node.ts`.
- No runtime dependency.
- No em dashes in text. Plain, direct sentences.

## Pull requests

Keep them focused, add a `CHANGELOG.md` entry, and make sure `npm run check`
passes.
