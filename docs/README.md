# Documentation site

An [Astro Starlight](https://starlight.astro.build) site for `@ix-xs/twitch.api`.

| Section | Source | Written by |
| --- | --- | --- |
| Home page | `src/content/docs/index.mdx`, `src/components/` | hand |
| Start, Basics, Authentication, Events, Recipes, Help | `src/content/docs/{basics,auth,events,recipes,help}/` and the two pages at the root | hand |
| Errors, Client options | `src/content/docs/reference/errors.md`, `reference/client-options.md` | hand |
| API groups, Event types, Scopes, Reference overview | `src/content/docs/reference/` | `scripts/reference.mjs`, from the source code |

Each topic has one page, and each fact has one home: a page links to the page
that owns something instead of explaining it again. A page has the same shape
everywhere: an opening paragraph, a first example, one section per need, then
`See also`. The `description` in the frontmatter is shown as the lead paragraph
under the title.

## Generated reference

The API group pages, the event types, the scopes and the list the home page
searches are generated from the doc comments and the types of the library:

```bash
npm run docs:reference      # from the repository root
```

Run it after changing a method, a type or a doc comment, and commit the
result. `npm run docs:check` fails when the pages are out of date, and CI runs
it.

## Examples are compiled

Every `ts` code block of the English pages is compiled against the library by
`scripts/check-snippets.mjs` (part of `npm run docs:check`). Each block is its
own module. The names a block may use without declaring them are listed in
`scripts/snippets.d.ts`. A block opened with `ts nocheck` is skipped: keep that
for signatures.

The samples of the home page console are real files (`src/console/samples/`),
compiled by `npm run test:types` at the root. The part above the `// ---` line
sets the stage for the compiler and is not shown.

## Languages

English is the original and sits at the root of `src/content/docs/`. A
translation mirrors it in a folder named after its language: the French page of
`basics/pagination.md` is `fr/basics/pagination.md`, served at
`/fr/basics/pagination/`. A page that has no translation yet falls back to
English, with a notice.

A translation changes the prose and nothing else:

- **Links** are written exactly as in English (`/basics/pagination/#totals`).
  The build adds the language.
- **Headings** stay in the same number and order. The build gives each one the
  id of its English counterpart, so anchors are the same in every language.
- **Code blocks** are copied as they are; only comments are translated.
- In an `.mdx` page, a relative import gains one `../`.

`npm run check-translation` compares every translated page with its original
(frontmatter keys, headings, code, link targets) and the deploy workflow runs
it. After changing an English page, change its translations in the same commit.

The words of the interface (header, search, home page) are in `src/i18n.ts`
and `src/console/scenes.ts`; Starlight translates its own. The generated
reference has its French labels in `scripts/reference.mjs`.

The site icon is drawn in `public/favicon.svg`. After changing it, run
`node scripts/icons.mjs` and commit the two PNG files it writes.

## Develop

```bash
cd docs
npm install
npm run dev        # serves http://localhost:4321/twitch.api
```

## Build and check

```bash
npm run check-translation   # translations mirror their originals
npm run build               # static site in dist/
npm run check-links         # every internal link of the built site resolves
```

The site is deployed to GitHub Pages by `.github/workflows/docs.yml` on every
push to `main` that touches `docs/`. To serve it from another address, set the
`DOCS_SITE` and `DOCS_BASE` repository variables (see `astro.config.mjs`).
