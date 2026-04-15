#!/usr/bin/env node
/**
 * scripts/publish.mjs — LumiArq publish script.
 *
 * Publishes all packages in correct dependency order:
 *   1. Leaf @illumiarq/* packages (no internal deps)
 *   2. @illumiarq/* packages with internal deps (level 2-5)
 *   3. @illumiarq/adapters (top-level)
 *   4. @lumiarq/framework (meta-package)
 *   5. Dev tools (eslint-plugin, create-lumiarq-app, prettier-plugin-veil)
 *
 * @lumiarq/lumis is published separately from the lumis repo.
 * @trazze/* packages are published separately from the traze repo.
 */

import { execSync } from 'node:child_process';

// Ordered by dependency depth (deepest deps first)
const PACKAGES = [
  // Level 1 — no internal deps
  'packages/illumiarq/contracts',
  'packages/illumiarq/core',
  'packages/illumiarq/support',
  'packages/illumiarq/search',
  'packages/illumiarq/tinker',
  'packages/illumiarq/veil',
  // Level 2
  'packages/illumiarq/auth',
  'packages/illumiarq/cache',
  'packages/illumiarq/context',
  'packages/illumiarq/database',
  'packages/illumiarq/http',
  'packages/illumiarq/modules',
  'packages/illumiarq/security',
  // Level 3
  'packages/illumiarq/build',
  'packages/illumiarq/query',
  'packages/illumiarq/testing',
  // Level 4
  'packages/illumiarq/auth-starter',
  'packages/illumiarq/migrations',
  // Level 5 — @illumiarq/runtime (depends on most of the above)
  'packages/illumiarq/runtime',
  // Level 6
  'packages/illumiarq/adapters',
  // Meta-package (root)
  '.',
  // Dev tools
  'packages/tools/eslint-plugin',
  'packages/tools/create-lumiarq-app',
  'packages/tools/prettier-plugin-veil',
];

function publish(pkg) {
  if (pkg === '.') {
    // Root package (@lumiarq/framework) — publish from repo root
    console.log(`\n→ Publishing @lumiarq/framework (root)...`);
    try {
      execSync(`pnpm publish --access public --no-git-checks`, {
        stdio: 'inherit',
      });
    } catch (err) {
      if (
        err.stdout?.includes('E403') ||
        err.stderr?.includes('E403') ||
        err.stdout?.includes('previously published') ||
        err.stderr?.includes('previously published')
      ) {
        console.log(`  (skipped — already at this version)`);
      } else {
        throw err;
      }
    }
    return;
  }
  console.log(`\n→ Publishing ${pkg}...`);
  try {
    execSync(`pnpm --filter ./${pkg} publish --access public --no-git-checks`, {
      stdio: 'inherit',
    });
  } catch (err) {
    // E403 = already published at this version — skip gracefully
    if (
      err.stdout?.includes('E403') ||
      err.stderr?.includes('E403') ||
      err.stdout?.includes('previously published') ||
      err.stderr?.includes('previously published')
    ) {
      console.log(`  (skipped — already at this version)`);
    } else {
      throw err;
    }
  }
}

console.log('\nLumiArq — publishing all packages to npm\n');
console.log(`Packages: ${PACKAGES.length}`);

for (const pkg of PACKAGES) {
  publish(pkg);
}

console.log('\n✓ All packages published.\n');
