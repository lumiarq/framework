#!/usr/bin/env node
/**
 * scripts/publish.mjs — LumiArq publish script.
 *
 * Publishes all packages in correct dependency order:
 *   1. Leaf @velo/* packages (no internal deps)
 *   2. @velo/* packages with internal deps (level 2-5)
 *   3. @velo/adapters (top-level)
 *   4. @lumiarq/framework (meta-package)
 *   5. Dev tools (eslint-plugin, create-lumiarq-app, prettier-plugin-veil)
 *
 * @lumiarq/lumis is published separately from the lumis repo.
 * @traze/* packages are published separately from the traze repo.
 */

import { execSync } from 'node:child_process';

// Ordered by dependency depth (deepest deps first)
const PACKAGES = [
  // Level 1 — no internal deps
  'packages/velo/contracts',
  'packages/velo/core',
  'packages/velo/support',
  'packages/velo/search',
  'packages/velo/tinker',
  'packages/velo/veil',
  // Level 2
  'packages/velo/auth',
  'packages/velo/cache',
  'packages/velo/context',
  'packages/velo/database',
  'packages/velo/http',
  'packages/velo/modules',
  'packages/velo/security',
  // Level 3
  'packages/velo/build',
  'packages/velo/query',
  'packages/velo/testing',
  // Level 4
  'packages/velo/auth-starter',
  'packages/velo/migrations',
  // Level 5 — @velo/runtime (depends on most of the above)
  'packages/velo/runtime',
  // Level 6
  'packages/velo/adapters',
  // Meta-package
  'packages/framework',
  // Dev tools
  'packages/tools/eslint-plugin',
  'packages/tools/create-lumiarq-app',
  'packages/tools/prettier-plugin-veil',
];

function publish(pkg) {
  console.log(`\n→ Publishing ${pkg}...`);
  try {
    execSync(`pnpm --filter ./${pkg} publish --access public --no-git-checks`, {
      stdio: 'inherit',
    });
  } catch (err) {
    // E403 = already published at this version — skip gracefully
    if (err.stdout?.includes('E403') || err.stderr?.includes('E403') ||
        err.stdout?.includes('previously published') || err.stderr?.includes('previously published')) {
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
