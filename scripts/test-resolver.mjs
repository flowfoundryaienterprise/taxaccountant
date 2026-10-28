import module from "node:module";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Makes the app's own import style resolvable under `node --test`.
 *
 * The suite runs on Node's built-in test runner against TypeScript that
 * Node type-strips itself, so it needs no test framework, no bundler and no
 * new dependency. Two things Node does not do on its own, both of which the
 * source relies on because a bundler normally provides them:
 *
 *  1. the `@/*` alias from `compilerOptions.paths` in `tsconfig.json`; and
 *  2. extensionless specifiers, which `moduleResolution: "bundler"` allows
 *     and Node's ESM resolver does not.
 *
 * Keep the alias list in step with `tsconfig.json`.
 */
const root = path.resolve(import.meta.dirname, "..");

const ALIASES = [
  { prefix: "@/convex/", target: path.join(root, "convex") },
  { prefix: "@/", target: path.join(root, "src") },
];

const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs"];

/** Mirrors a bundler's extension search, including the `index` form. */
function withExtension(absolute) {
  if (path.extname(absolute) && existsSync(absolute)) return absolute;

  for (const extension of EXTENSIONS) {
    const candidate = `${absolute}${extension}`;
    if (existsSync(candidate)) return candidate;
  }
  for (const extension of EXTENSIONS) {
    const candidate = path.join(absolute, `index${extension}`);
    if (existsSync(candidate)) return candidate;
  }
  return absolute;
}

module.registerHooks({
  resolve(specifier, context, nextResolve) {
    const alias = ALIASES.find((entry) => specifier.startsWith(entry.prefix));
    if (alias) {
      const resolved = withExtension(path.join(alias.target, specifier.slice(alias.prefix.length)));
      return nextResolve(pathToFileURL(resolved).href, context);
    }

    // Relative specifiers inside aliased modules need the same extension
    // search; Node would otherwise reject `./taxonomy`.
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const parentDir = path.dirname(new URL(context.parentURL).pathname);
      const absolute = path.resolve(decodeURIComponent(parentDir), specifier);
      if (!path.extname(absolute) || !existsSync(absolute)) {
        const resolved = withExtension(absolute);
        if (existsSync(resolved)) return nextResolve(pathToFileURL(resolved).href, context);
      }
    }

    return nextResolve(specifier, context);
  },
});
