// Compiles every TypeScript example of the documentation against the library:
//
//   node docs/scripts/check-snippets.mjs             every English page
//   node docs/scripts/check-snippets.mjs basics      only the pages under a folder
//
// Each ```ts block becomes its own module, so examples may declare the same
// names and use top-level await. Names an example uses without declaring
// (`twitch`, `channelId`...) come from scripts/snippets.d.ts. A block opened
// with ```ts nocheck is skipped: use it for signatures and pseudo code only.
//
// French pages are not compiled: check-translation.mjs already requires their
// code to match the English page.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const content = path.resolve(here, "..", "src", "content", "docs");
const ts = createRequire(path.join(repo, "package.json"))("typescript");
const only = process.argv[2];

function pages(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (dir === content && entry.name === "fr") continue;
      out.push(...pages(full));
    } else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const work = path.join(repo, "node_modules", ".cache", "doc-snippets");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

/** Compiled file to where its code came from. */
const origins = new Map();
const roots = [path.join(here, "snippets.d.ts")];
let count = 0;
for (const page of pages(only ? path.join(content, only) : content)) {
  const lines = readFileSync(page, "utf8").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const open = /^(\s*)```(ts|typescript)\b(.*)$/.exec(lines[i]);
    if (!open) continue;
    const start = i + 1;
    const body = [];
    for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) body.push(lines[i].slice(open[1].length));
    if (/\bnocheck\b/.test(open[3])) continue;
    const file = path.join(work, `snippet-${String(++count).padStart(4, "0")}.ts`);
    // The trailing export makes the file a module: its names stay its own.
    writeFileSync(file, body.join("\n") + "\nexport {};\n");
    origins.set(file.replace(/\\/g, "/"), { page: path.relative(repo, page).replace(/\\/g, "/"), line: start });
    roots.push(file);
  }
}

const program = ts.createProgram(roots, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  types: ["node"],
  typeRoots: [path.join(repo, "node_modules", "@types")],
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  noUncheckedIndexedAccess: true,
  allowImportingTsExtensions: true,
  paths: {
    "@ix-xs/twitch.api": [path.join(repo, "src/index.ts")],
    "@ix-xs/twitch.api/node": [path.join(repo, "src/node.ts")],
  },
});

let errors = 0;
for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
  const file = diagnostic.file?.fileName.replace(/\\/g, "/");
  const origin = file ? origins.get(file) : undefined;
  if (!origin) {
    // An error outside the examples (the library itself, the ambient file) is not ours to report twice.
    if (file && file.includes("/scripts/snippets.d.ts")) {
      console.error(`snippets.d.ts: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
      errors++;
    }
    continue;
  }
  const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
  console.error(`${origin.page}:${origin.line + line + 1}  ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
  errors++;
}

rmSync(work, { recursive: true, force: true });
if (errors > 0) {
  console.error(`\n${errors} error(s) in ${count} example(s).`);
  process.exit(1);
}
console.log(`${count} example(s) compile.`);
