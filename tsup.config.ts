import { readFile } from "node:fs/promises";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    node: "src/node.ts",
  },
  format: ["esm", "cjs"],
  // tsup passes `baseUrl` to the declaration build, which TypeScript 6
  // reports as deprecated. The option silences that one report.
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  clean: true,
  // src/ is not published, so source maps would only add weight.
  sourcemap: false,
  treeshake: true,
  splitting: true,
  target: "es2022",
  platform: "neutral",
  external: [/^node:/],
  esbuildPlugins: [
    {
      // The documentation lives in the .d.ts files, where editors read it.
      // Keeping a second copy in the JavaScript would more than double its size.
      name: "strip-doc-comments",
      setup(build) {
        build.onLoad({ filter: /[\\/]src[\\/].*\.ts$/ }, async (args) => ({
          contents: (await readFile(args.path, "utf8")).replace(/^[ \t]*\/\*\*[\s\S]*?\*\/\r?\n/gm, ""),
          loader: "ts",
        }));
      },
    },
  ],
});
