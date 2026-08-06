// Node ESM loader hook: rewrites the "@/" path alias (which Next's bundler
// resolves via tsconfig "paths") to a real file URL under src/, so plain
// `node --test` can load the same source files Next builds — no separate
// test-only import style needed anywhere in the codebase.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const srcRoot = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const withoutPrefix = specifier.slice(2);
    const candidate = new URL(withoutPrefix, srcRoot);
    const resolved = existsSync(fileURLToPath(candidate)) ? candidate : new URL(`${withoutPrefix}.ts`, srcRoot);
    return nextResolve(pathToFileURL(fileURLToPath(resolved)).href, context);
  }
  return nextResolve(specifier, context);
}
