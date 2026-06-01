#!/usr/bin/env node
/**
 * Ensures published @illumiarq/lumis does not ship workspace:* dependency specifiers.
 * pnpm publish should rewrite these; this guard catches manual npm publish mistakes.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies };
const bad = Object.entries(deps).filter(
  ([, v]) => typeof v === 'string' && v.startsWith('workspace:'),
);
if (bad.length > 0) {
  console.error('@illumiarq/lumis: refuse to publish with workspace:* deps:', bad);
  console.error('Use: pnpm --filter @illumiarq/lumis publish --access public --no-git-checks');
  process.exit(1);
}
