// Generates the reference from the source code of the library:
//
//   node docs/scripts/reference.mjs          write the pages and the index
//   node docs/scripts/reference.mjs --check  fail if they are out of date
//
// It writes, in English and in French:
//   src/content/docs/reference/overview.md      the entry page, with every group
//   src/content/docs/reference/api/<group>.md   one page per API group
//   src/content/docs/reference/event-types.md   every EventSub subscription type
//   src/content/docs/reference/scopes.md        every scope and the methods it unlocks
// and src/data/api-index.json, the list the home page searches.
//
// Descriptions come from the doc comments, so they stay in English on the
// French pages too: only the headings and labels around them are translated.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const docs = path.resolve(here, "..");
const ts = createRequire(path.join(repo, "package.json"))("typescript");
const check = process.argv.includes("--check");

// --------------------------------------------------------------- the program
const program = ts.createProgram([path.join(repo, "src/index.ts")], {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  types: ["node"],
  lib: ["lib.es2023.d.ts"],
});
const checker = program.getTypeChecker();
const typeFlags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType;

const docOf = (symbol) => ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
const tagsOf = (symbol) => symbol.getJsDocTags(checker).map((tag) => ({ name: tag.name, text: ts.displayPartsToString(tag.text ?? []).trim() }));
const oneLine = (text) => text.replace(/\s+/g, " ").trim();
/** First sentence of a description. */
const firstSentence = (text) => {
  const flat = oneLine(text);
  const end = flat.search(/[.:](\s|$)/);
  return end < 0 ? flat : flat.slice(0, end + 1).replace(/:$/, ".");
};
/** A type as text, in the quoting style of the docs, without the noise. */
const typeText = (type) =>
  checker
    .typeToString(type, undefined, typeFlags)
    .replace(/'/g, '"')
    .replace(/, unknown>/g, ">")
    .replace(/ \| undefined$/, "");
const cell = (text) => oneLine(text).replace(/\|/g, "\\|").replace(/</g, "&lt;").replace(/\{/g, "&#123;");
const code = (text) => "`" + text.replace(/\|/g, "\\|") + "`";

/** Group getters of the client: class name to `twitch.<getter>`. */
const getters = new Map();
for (const match of readFileSync(path.join(repo, "src/client.ts"), "utf8").matchAll(/get (\w+)\(\): (\w+Api) \{/g)) {
  getters.set(match[2], match[1]);
}

/** Properties of an object type, as rows. Empty when the type is not a plain object. */
function fieldsOf(type) {
  if (!type || type.isUnion() || !(type.flags & ts.TypeFlags.Object)) return [];
  if (checker.isArrayType(type) || checker.isTupleType(type)) return [];
  return type
    .getProperties()
    .filter((property) => !(property.flags & ts.SymbolFlags.Method))
    .map((property) => {
      const declaration = property.valueDeclaration ?? property.declarations?.[0];
      const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration ?? program.getSourceFiles()[0]);
      const optional = Boolean(property.flags & ts.SymbolFlags.Optional);
      const deprecated = tagsOf(property).find((tag) => tag.name === "deprecated");
      return {
        name: property.name,
        optional,
        type: typeText(optional ? checker.getNonNullableType(propertyType) : propertyType),
        doc: (deprecated ? `Deprecated. ${deprecated.text} ` : "") + docOf(property),
      };
    });
}

/** Peels Promise, Paginator, arrays and null to find what a method hands back. */
function payloadOf(type) {
  let current = type;
  for (let depth = 0; depth < 4; depth++) {
    const name = current.symbol?.name ?? current.aliasSymbol?.name;
    const args = current.aliasTypeArguments ?? checker.getTypeArguments?.(current) ?? [];
    if ((name === "Promise" || name === "Paginator" || name === "Array" || name === "ReadonlyArray") && args[0]) {
      current = args[0];
      continue;
    }
    if (current.isUnion()) {
      const rest = current.types.filter((part) => !(part.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)));
      if (rest.length === 1) {
        current = rest[0];
        continue;
      }
    }
    break;
  }
  return current;
}

// ------------------------------------------------------------------ API groups
const groups = [];
for (const file of readdirSync(path.join(repo, "src/api")).sort()) {
  if (file === "base.ts" || file === "index.ts") continue;
  const source = program.getSourceFile(path.join(repo, "src/api", file));
  if (!source) throw new Error(`not in the program: ${file}`);
  ts.forEachChild(source, (node) => {
    if (!ts.isClassDeclaration(node) || !node.name || !getters.has(node.name.text)) return;
    const classSymbol = checker.getSymbolAtLocation(node.name);
    const group = { getter: getters.get(node.name.text), className: node.name.text, doc: docOf(classSymbol), methods: [] };
    const seen = new Set();
    for (const member of node.members) {
      if (!ts.isMethodDeclaration(member) || !ts.isIdentifier(member.name)) continue;
      if (member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword)) continue;
      const name = member.name.text;
      if (seen.has(name)) continue;
      const symbol = checker.getSymbolAtLocation(member.name);
      const signature = checker.getSignatureFromDeclaration(member);
      const fullDoc = ts.displayPartsToString(signature.getDocumentationComment(checker)).trim();
      if (!fullDoc) continue;
      seen.add(name);
      const tags = signature.getJsDocTags().map((tag) => ({ name: tag.name, text: ts.displayPartsToString(tag.text ?? []).trim() }));
      const lines = fullDoc.split(/\r?\n/);
      const tokenIndex = lines.findIndex((line) => line.startsWith("Token:"));
      const tokenLine = tokenIndex < 0 ? "" : oneLine(lines.slice(tokenIndex).join(" ").replace(/^Token:\s*/, ""));
      const summary = (tokenIndex < 0 ? lines : lines.slice(0, tokenIndex)).join("\n").trim();
      const parameters = signature.getParameters().map((parameter) => {
        const declaration = parameter.valueDeclaration;
        const type = checker.getTypeOfSymbolAtLocation(parameter, declaration);
        const optional = Boolean(declaration && (declaration.questionToken || declaration.initializer));
        return { name: parameter.name, optional, type, typeName: typeText(optional ? checker.getNonNullableType(type) : type) };
      });
      const returns = checker.getReturnTypeOfSignature(signature);
      const payload = payloadOf(returns);
      const see = tags.find((tag) => tag.name === "see")?.text ?? "";
      group.methods.push({
        name,
        summary,
        token: tokenLine,
        beta: /Beta:/.test(fullDoc),
        deprecated: tags.find((tag) => tag.name === "deprecated")?.text,
        example: tags.find((tag) => tag.name === "example")?.text ?? "",
        // The compiler splits "https://..." at the colon: put it back together.
        see: see.replace(/^https?\s*:\s*\/\//, "https://").split(/\s/)[0],
        parameters,
        returns: typeText(returns),
        payloadName: payload.aliasSymbol?.name ?? payload.symbol?.name ?? "",
        payloadFields: fieldsOf(payload),
      });
      void symbol;
    }
    groups.push(group);
  });
}
groups.sort((a, b) => a.getter.localeCompare(b.getter));

// ------------------------------------------------------------- EventSub types
const events = [];
const versions = {};
for (const file of ["activity.ts", "channel.ts", "chat.ts"]) {
  const source = program.getSourceFile(path.join(repo, "src/eventsub/types", file));
  ts.forEachChild(source, (node) => {
    if (!ts.isInterfaceDeclaration(node) || !node.name.text.endsWith("EventSubTypes")) return;
    const type = checker.getTypeAtLocation(node);
    for (const property of type.getProperties()) {
      const declaration = property.valueDeclaration;
      const definition = checker.getTypeOfSymbolAtLocation(property, declaration);
      const part = (name) => checker.getTypeOfSymbolAtLocation(definition.getProperty(name), declaration);
      const doc = docOf(property);
      const lines = doc.split(/\r?\n/);
      const scopeIndex = lines.findIndex((line) => line.startsWith("Scope:"));
      const see = tagsOf(property).find((tag) => tag.name === "see")?.text ?? "";
      const condition = part("condition");
      const event = part("event");
      events.push({
        key: property.name,
        type: property.name.split("@")[0],
        version: typeText(part("version")).replace(/"/g, ""),
        summary: oneLine((scopeIndex < 0 ? lines : lines.slice(0, scopeIndex)).join(" ")),
        scope: scopeIndex < 0 ? "" : oneLine(lines.slice(scopeIndex).join(" ").replace(/^Scope:\s*/, "")),
        see: see.replace(/^https?\s*:\s*\/\//, "https://").split(/\s/)[0],
        conditionFields: fieldsOf(condition),
        eventName: typeText(event),
      });
      versions[property.name] = events.at(-1).version;
    }
  });
}
events.sort((a, b) => a.key.localeCompare(b.key));

// ---------------------------------------------------------------------- words
const WORDS = {
  en: {
    note: "",
    token: "Token",
    parameters: "Parameters",
    noParameters: "This method takes no parameters of its own.",
    name: "Name",
    type: "Type",
    description: "Description",
    required: "required",
    options: "Request options for this call: `as`, `token`, `signal`, `timeout`, `retries`.",
    optionsLink: "/basics/request-options/",
    returns: "Returns",
    fields: (name) => `Fields of ${name}`,
    example: "Example",
    twitch: "Twitch reference",
    beta: "Beta: Twitch may change this endpoint.",
    deprecated: "Deprecated.",
    groupLead: (group) => `Every method of \`twitch.${group.getter}\`, with its parameters, what it returns and the token it needs.`,
    methods: "Methods",
    eventsTitle: "Event types",
    eventsLead: "Every EventSub subscription type the library knows, with its version, its condition and the scope it needs.",
    eventsIntro:
      "The name autocompletes in `on()` and `subscribe()`, and the condition and the event are typed from it. A type that exists in several versions is listed under its plain name for the newest one and under `name@version` for the older ones.",
    all: "All types",
    version: "Version",
    when: "Fires when",
    scope: "Scope",
    condition: "Condition",
    event: "Event",
    noCondition: "No condition field.",
    scopesTitle: "Scopes",
    scopesLead: "Every OAuth scope, and the methods of the library it unlocks.",
    scopesIntro:
      "Ask for the scopes your application needs when you send a user to Twitch. A method lists several scopes when any one of them is enough. Event subscriptions have their own requirements: see the event types.",
    scopeColumn: "Scope",
    unlocks: "Unlocks",
    eventsOnly: "Used by event subscriptions only.",
  },
  fr: {
    note: "Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.",
    token: "Jeton",
    parameters: "Paramètres",
    noParameters: "Cette méthode ne prend aucun paramètre propre.",
    name: "Nom",
    type: "Type",
    description: "Description",
    required: "requis",
    options: "Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.",
    optionsLink: "/basics/request-options/",
    returns: "Renvoie",
    fields: (name) => `Champs de ${name}`,
    example: "Exemple",
    twitch: "Référence Twitch",
    beta: "Bêta : Twitch peut modifier cet endpoint.",
    deprecated: "Obsolète.",
    groupLead: (group) => `Toutes les méthodes de \`twitch.${group.getter}\`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.`,
    methods: "Méthodes",
    eventsTitle: "Types d'événements",
    eventsLead: "Tous les types d'abonnement EventSub connus de la bibliothèque, avec leur version, leur condition et le scope nécessaire.",
    eventsIntro:
      "Le nom s'autocomplète dans `on()` et `subscribe()`, et la condition comme l'événement sont typés à partir de lui. Un type qui existe en plusieurs versions figure sous son nom simple pour la plus récente et sous `nom@version` pour les anciennes.",
    all: "Tous les types",
    version: "Version",
    when: "Se déclenche quand",
    scope: "Scope",
    condition: "Condition",
    event: "Événement",
    noCondition: "Aucun champ de condition.",
    scopesTitle: "Scopes",
    scopesLead: "Tous les scopes OAuth, et les méthodes de la bibliothèque que chacun débloque.",
    scopesIntro:
      "Demandez les scopes dont votre application a besoin au moment d'envoyer un utilisateur vers Twitch. Une méthode cite plusieurs scopes quand un seul d'entre eux suffit. Les abonnements aux événements ont leurs propres exigences : voir les types d'événements.",
    scopeColumn: "Scope",
    unlocks: "Débloque",
    eventsOnly: "Utilisé uniquement par des abonnements aux événements.",
  },
};

const fieldTable = (fields, w, withRequired) =>
  [
    `| ${w.name} | ${w.type} | ${w.description} |`,
    "| --- | --- | --- |",
    ...fields.map((field) => {
      const name = code(field.name) + (withRequired && !field.optional ? ` <small>${w.required}</small>` : "");
      return `| ${name} | ${code(field.type)} | ${cell(field.doc)} |`;
    }),
  ].join("\n");

/** Turns `{@link Class.method}` into plain code. */
const prose = (text) => text.replace(/\{@link ([^}]+)\}/g, (_, target) => "`" + target.split(".").pop() + "`");

function groupPage(group, locale) {
  const w = WORDS[locale];
  const out = [
    "---",
    `title: twitch.${group.getter}`,
    `description: ${JSON.stringify(prose(group.doc))}`,
    "sidebar:",
    `  label: ${group.getter}`,
    "---",
    "",
    w.groupLead(group),
    "",
  ];
  if (w.note) out.push(`:::note`, w.note, `:::`, "");
  for (const method of group.methods) {
    const [first, ...rest] = method.parameters;
    const args = method.parameters.map((parameter) => parameter.name + (parameter.optional ? "?" : "")).join(", ");
    out.push(`## ${method.name}`, "");
    out.push("```ts nocheck", `twitch.${group.getter}.${method.name}(${args}): ${method.returns}`, "```", "");
    if (method.deprecated !== undefined) out.push(`**${w.deprecated}** ${prose(method.deprecated)}`, "");
    out.push(prose(method.summary), "");
    if (method.token) out.push(`**${w.token}:** ${method.token}`, "");

    out.push(`### ${w.parameters}`, "");
    const own = first && first.name !== "options" ? first : undefined;
    const ownFields = own ? fieldsOf(checker.getNonNullableType(own.type)) : [];
    if (!own) {
      out.push(w.noParameters, "");
    } else if (ownFields.length > 0) {
      out.push(fieldTable(ownFields, w, true), "");
    } else {
      out.push(`${code(own.name)}: ${code(own.typeName)}`, "");
    }
    for (const extra of own ? rest : method.parameters) {
      if (extra.name === "options") out.push(`${code("options")}: ${w.options}`, "");
      else out.push(`${code(extra.name)}: ${code(extra.typeName)}`, "");
    }

    out.push(`### ${w.returns}`, "", code(method.returns), "");
    if (method.payloadFields.length > 0 && method.payloadName && !method.payloadName.startsWith("__")) {
      out.push("<details>", `<summary>${w.fields(method.payloadName)}</summary>`, "", fieldTable(method.payloadFields, w, false), "", "</details>", "");
    }
    if (method.example) out.push(`### ${w.example}`, "", "```ts", method.example, "```", "");
    if (method.see) out.push(`[${w.twitch}](${method.see})`, "");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function eventsPage(locale) {
  const w = WORDS[locale];
  const anchor = (key) => key.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const out = ["---", `title: ${w.eventsTitle}`, `description: ${JSON.stringify(w.eventsLead)}`, "---", "", w.eventsIntro, ""];
  if (w.note) out.push(`:::note`, w.note, `:::`, "");
  out.push(`## ${w.all}`, "", `| ${w.type} | ${w.version} | ${w.when} |`, "| --- | --- | --- |");
  for (const event of events) out.push(`| [${code(event.key)}](#${anchor(event.key)}) | ${event.version} | ${cell(event.summary)} |`);
  out.push("");
  for (const event of events) {
    out.push(`## ${event.key}`, "", event.summary, "");
    if (event.scope) out.push(`**${w.scope}:** ${event.scope}`, "");
    out.push(`**${w.condition}**`, "");
    out.push(event.conditionFields.length > 0 ? fieldTable(event.conditionFields, w, true) : w.noCondition, "");
    out.push(`**${w.event}:** ${code(event.eventName)}`, "");
    if (event.see) out.push(`[${w.twitch}](${event.see})`, "");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function scopesPage(locale) {
  const w = WORDS[locale];
  const scopes = [...readFileSync(path.join(repo, "src/auth/scopes.ts"), "utf8").matchAll(/^\s+"([a-z:_]+)",$/gm)].map((match) => match[1]);
  const users = new Map(scopes.map((scope) => [scope, []]));
  for (const group of groups) {
    for (const method of group.methods) {
      for (const match of method.token.matchAll(/`([a-z:_]+)`/g)) users.get(match[1])?.push(`[\`${group.getter}.${method.name}\`](/reference/api/${fileOf(group)}/#${method.name.toLowerCase()})`);
    }
  }
  const out = ["---", `title: ${w.scopesTitle}`, `description: ${JSON.stringify(w.scopesLead)}`, "---", "", w.scopesIntro, "", `| ${w.scopeColumn} | ${w.unlocks} |`, "| --- | --- |"];
  for (const scope of scopes) out.push(`| ${code(scope)} | ${users.get(scope).length > 0 ? users.get(scope).join(", ") : w.eventsOnly} |`);
  return out.join("\n") + "\n";
}

/** What each group covers, in French. English comes from the doc comment of the class. */
const GROUPS_FR = {
  ads: "Publicités : lancer une coupure, lire le planning, repousser la prochaine.",
  analytics: "Rapports téléchargeables pour vos extensions et vos jeux.",
  bits: "Bits : classement, Cheermotes, Power-ups personnalisés et transactions d'extension.",
  channelPoints: "Points de chaîne : récompenses personnalisées et leurs utilisations.",
  channels: "Chaînes : titre, catégorie et tags, éditeurs, abonnements suivis et followers.",
  charity: "Collectes caritatives : la campagne en cours et ses dons.",
  chat: "Chat : messages, annonces, spectateurs présents, emotes, badges, réglages, couleurs, épingles et shoutouts.",
  clips: "Clips : créer, retrouver et télécharger.",
  conduits: "Conduits : le transport EventSub qui répartit les événements sur plusieurs shards.",
  contentLabels: "Étiquettes de classification du contenu et leurs noms traduits.",
  entitlements: "Droits liés aux Drops : les lister et les marquer comme remis.",
  eventsub: "EventSub : abonnements, et écouteurs WebSocket, webhook et conduit.",
  extensions: "Extensions : configuration, secrets, messages PubSub et de chat, produits Bits.",
  games: "Jeux et catégories : les retrouver, lister les plus regardés.",
  goals: "Objectifs de créateur d'une chaîne.",
  guestStar: "Guest Star (bêta) : sessions, invitations et emplacements.",
  hypeTrain: "Hype Train : le train en cours et les records de la chaîne.",
  moderation: "Modération : bannissements, exclusions temporaires, avertissements, AutoMod, termes bloqués, modérateurs, VIP et mode Bouclier.",
  polls: "Sondages : créer, lire et clore.",
  predictions: "Prédictions : créer, lire, verrouiller et résoudre.",
  raids: "Raids : en lancer un, annuler celui en attente.",
  schedule: "Planning de diffusion : créneaux, vacances et flux iCalendar.",
  search: "Recherche de catégories et de chaînes.",
  streams: "Streams : qui est en direct, clés de stream et marqueurs.",
  subscriptions: "Abonnements : les abonnés d'une chaîne, et savoir si un utilisateur l'est.",
  tags: "Tags de stream (abandonnés par Twitch, conservés par souci d'exhaustivité).",
  teams: "Équipes : en retrouver une, lister celles d'une chaîne.",
  users: "Utilisateurs : profils, liste de blocage et extensions installées.",
  videos: "Vidéos : rediffusions, temps forts et mises en ligne.",
  whispers: "Chuchotements : envoyer un message privé à un utilisateur.",
};

function overviewPage(locale) {
  const fr = locale === "fr";
  const out = [
    "---",
    `title: ${fr ? "Référence" : "Reference"}`,
    `description: ${JSON.stringify(fr ? "Chaque méthode, chaque type d'événement, chaque scope et chaque erreur de la bibliothèque." : "Every method, every event type, every scope and every error of the library.")}`,
    "---",
    "",
    fr
      ? `La bibliothèque compte ${counts.methods} méthodes réparties en ${counts.groups} groupes, qui couvrent tous les endpoints de l'API Helix, et type les ${counts.events} types d'événements EventSub. Les pages de groupe et la liste des événements sont générées à partir du code source : elles sont toujours à jour avec la version publiée.`
      : `The library has ${counts.methods} methods in ${counts.groups} groups, which cover every endpoint of the Helix API, and types the ${counts.events} EventSub event types. The group pages and the list of events are generated from the source code, so they always match the published version.`,
    "",
    `## ${fr ? "Groupes de l'API" : "API groups"}`,
    "",
    fr
      ? "Chaque groupe est une propriété du client : `twitch.chat`, `twitch.moderation`... Sa page donne, pour chaque méthode, la signature, le jeton nécessaire, les paramètres, ce qui est renvoyé et un exemple."
      : "Each group is a property of the client: `twitch.chat`, `twitch.moderation`... Its page gives, for each method, the signature, the token it needs, the parameters, what comes back and an example.",
    "",
    `| ${fr ? "Groupe" : "Group"} | ${fr ? "Couvre" : "Covers"} | ${fr ? "Méthodes" : "Methods"} |`,
    "| --- | --- | --- |",
    ...groups.map((group) => `| [\`twitch.${group.getter}\`](/reference/api/${fileOf(group)}/) | ${cell(fr ? (GROUPS_FR[group.getter] ?? prose(group.doc)) : prose(group.doc))} | ${group.methods.length} |`),
    "",
    `## ${fr ? "Le reste de la référence" : "The rest of the reference"}`,
    "",
    ...(fr
      ? [
          "- [Types d'événements](/reference/event-types/) : chaque type d'abonnement EventSub, sa version, sa condition et son scope.",
          "- [Scopes](/reference/scopes/) : chaque scope OAuth et les méthodes qu'il débloque.",
          "- [Erreurs](/reference/errors/) : chaque classe d'erreur, ses champs et quand elle est levée.",
          "- [Options du client](/reference/client-options/) : les options de `new Twitch()`, les méthodes du client et les options de requête.",
        ]
      : [
          "- [Event types](/reference/event-types/): every EventSub subscription type, its version, its condition and its scope.",
          "- [Scopes](/reference/scopes/): every OAuth scope and the methods it unlocks.",
          "- [Errors](/reference/errors/): every error class, its fields and when it is thrown.",
          "- [Client options](/reference/client-options/): the options of `new Twitch()`, the methods of the client and the request options.",
        ]),
  ];
  return out.join("\n") + "\n";
}

/** File name of a group page: `channelPoints` becomes `channel-points`. */
function fileOf(group) {
  return group.getter.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// --------------------------------------------------------------------- output
const counts = { methods: groups.reduce((sum, group) => sum + group.methods.length, 0), groups: groups.length, events: events.length };
const files = new Map();
for (const locale of ["en", "fr"]) {
  const root = path.join(docs, "src/content/docs", locale === "en" ? "" : locale, "reference");
  for (const group of groups) files.set(path.join(root, "api", `${fileOf(group)}.md`), groupPage(group, locale));
  files.set(path.join(root, "overview.md"), overviewPage(locale));
  files.set(path.join(root, "event-types.md"), eventsPage(locale));
  files.set(path.join(root, "scopes.md"), scopesPage(locale));
}

const index = [
  ...groups.flatMap((group) =>
    group.methods.map((method) => ({
      kind: "method",
      name: `twitch.${group.getter}.${method.name}()`,
      summary: firstSentence(prose(method.summary)),
      token: /^app or user/.test(method.token) ? "any" : /^app/.test(method.token) ? "app" : /^user/.test(method.token) ? "user" : "other",
      href: `/reference/api/${fileOf(group)}/#${method.name.toLowerCase()}`,
    })),
  ),
  ...events.map((event) => ({
    kind: "event",
    name: event.key,
    summary: firstSentence(event.summary),
    token: "",
    href: `/reference/event-types/#${event.key.toLowerCase().replace(/[^a-z0-9_-]/g, "")}`,
  })),
];
files.set(path.join(docs, "src/data/api-index.json"), JSON.stringify({ counts, entries: index }, null, 1) + "\n");

let stale = 0;
if (!check) {
  for (const locale of ["", "fr"]) rmSync(path.join(docs, "src/content/docs", locale, "reference/api"), { recursive: true, force: true });
}
for (const [file, content] of files) {
  const current = existsSync(file) ? readFileSync(file, "utf8").replace(/\r\n/g, "\n") : undefined;
  if (current === content) continue;
  stale++;
  if (check) console.error(`out of date: ${path.relative(repo, file)}`);
  else {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
}
if (check && stale > 0) {
  console.error(`\n${stale} generated file(s) are out of date. Run: node docs/scripts/reference.mjs`);
  process.exit(1);
}
console.log(`${counts.groups} groups, ${counts.methods} methods, ${counts.events} event types${check ? ", up to date" : `, ${stale} file(s) written`}`);
