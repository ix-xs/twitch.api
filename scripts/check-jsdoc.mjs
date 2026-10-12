// Fails when something a user can see in their editor has no doc comment:
// an exported declaration, a property of an exported interface or object
// type (at any depth, one-line object types aside), or a public member of an
// exported class.
//
//   node scripts/check-jsdoc.mjs
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sources(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sources(full));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const files = sources(path.join(root, "src"));
const program = ts.createProgram(files, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, noEmit: true });
const missing = [];

/** A doc comment with something in it: text or at least one tag. */
const documented = (node) => (node.jsDoc ?? []).some((doc) => doc.comment || doc.tags?.length);
const exported = (node) => ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
const hidden = (node) =>
  ts.canHaveModifiers(node) &&
  ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword);

function report(source, node, name) {
  const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
  missing.push(`${path.relative(root, source.fileName).replace(/\\/g, "/")}:${line + 1}  ${name}`);
}

/** Checks the properties of every object type found inside a type, however deep. */
function walkType(source, node, owner) {
  if (!node) return;
  if (ts.isTypeLiteralNode(node)) {
    // A small object type written on one line is described by the comment of the property that holds it.
    const first = source.getLineAndCharacterOfPosition(node.getStart(source)).line;
    const last = source.getLineAndCharacterOfPosition(node.getEnd()).line;
    if (first === last) return;
    for (const member of node.members) checkMember(source, member, owner);
    return;
  }
  ts.forEachChild(node, (child) => walkType(source, child, owner));
}

function checkMember(source, member, owner) {
  if (!ts.isPropertySignature(member) && !ts.isMethodSignature(member)) return;
  const name = `${owner}.${member.name.getText(source)}`;
  if (!documented(member)) report(source, member, name);
  if (ts.isPropertySignature(member)) walkType(source, member.type, name);
}

for (const file of files) {
  const source = program.getSourceFile(file);
  // Overloads share the doc comment of their first signature.
  const seenFunctions = new Set();
  ts.forEachChild(source, (node) => {
    if (!exported(node)) return;
    if (ts.isInterfaceDeclaration(node)) {
      if (!documented(node)) report(source, node, node.name.text);
      for (const member of node.members) checkMember(source, member, node.name.text);
    } else if (ts.isTypeAliasDeclaration(node)) {
      if (!documented(node)) report(source, node, node.name.text);
      walkType(source, node.type, node.name.text);
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      if (!seenFunctions.has(node.name.text) && !documented(node)) report(source, node, node.name.text);
      seenFunctions.add(node.name.text);
    } else if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!documented(node)) report(source, node, declaration.name.getText(source));
      }
    } else if (ts.isClassDeclaration(node) && node.name) {
      if (!documented(node)) report(source, node, node.name.text);
      const seenMembers = new Set();
      for (const member of node.members) {
        if (ts.isConstructorDeclaration(member) || hidden(member) || !member.name) continue;
        if (ts.isPrivateIdentifier(member.name)) continue;
        const name = member.name.getText(source);
        // `override name = "..."` on error classes repeats what the class comment says.
        if (name === "name" && ts.isPropertyDeclaration(member)) continue;
        // Implementations of a documented interface or base method inherit its comment.
        if (ts.getModifiers(member)?.some((modifier) => modifier.kind === ts.SyntaxKind.OverrideKeyword)) continue;
        if (seenMembers.has(name)) continue;
        seenMembers.add(name);
        if (!documented(member)) report(source, member, `${node.name.text}.${name}`);
      }
    }
  });
}

if (missing.length > 0) {
  console.error(missing.join("\n"));
  console.error(`\n${missing.length} declaration(s) without a doc comment.`);
  process.exit(1);
}
console.log(`Every exported declaration and member of ${files.length} files has a doc comment.`);
