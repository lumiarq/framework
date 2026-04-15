/**
 * Post-build: copy src/types/view-cache.d.ts → dist/types/view-cache.d.ts
 * and prepend a triple-slash reference to dist/index.d.ts so that every
 * consumer of @illumiarq/veil auto-loads the ambient view-cache declarations.
 *
 * TypeScript does not copy .d.ts source files to outDir, and `declare module`
 * cannot live in a module-mode .ts file (TS2664), so a post-build step is the
 * canonical solution for shipping ambient declarations alongside a module package.
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Copy ambient declaration to dist/
mkdirSync(resolve(root, 'dist/types'), { recursive: true });
copyFileSync(
  resolve(root, 'src/types/view-cache.d.ts'),
  resolve(root, 'dist/types/view-cache.d.ts'),
);

// Prepend reference directive to dist/index.d.ts
const indexPath = resolve(root, 'dist/index.d.ts');
const ref = '/// <reference path="./types/view-cache.d.ts" />\n';
const content = readFileSync(indexPath, 'utf8');
if (!content.startsWith(ref)) {
  writeFileSync(indexPath, ref + content);
}

console.log('✔ patched dist/index.d.ts with view-cache reference');
