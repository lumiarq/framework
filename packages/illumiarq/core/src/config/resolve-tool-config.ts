import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type AbsorbedTool = 'vitest' | 'drizzle' | 'prettier' | 'eslint' | 'tailwind' | 'lumis';

const FLAT_PKG_FILES: Record<AbsorbedTool, string> = {
  vitest: 'vitest.config.ts',
  drizzle: 'drizzle.config.ts',
  prettier: 'prettier.config.ts',
  eslint: 'eslint.config.ts',
  tailwind: 'tailwind.config.ts',
  lumis: 'lumis.config.ts',
};

const LEGACY_PKG_SUBDIRS: Partial<Record<AbsorbedTool, string>> = {
  vitest: 'vitest/config.ts',
  drizzle: 'drizzle/config.ts',
  prettier: 'prettier/config.ts',
  eslint: 'eslint/config.ts',
  tailwind: 'tailwind/config.ts',
  lumis: 'lumis/config.ts',
};

const ROOT_FILES: Record<AbsorbedTool, string[]> = {
  vitest: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'],
  drizzle: ['drizzle.config.ts', 'drizzle.config.js', 'drizzle.config.mjs'],
  prettier: [
    'prettier.config.ts',
    'prettier.config.js',
    'prettier.config.mjs',
    '.prettierrc',
    '.prettierrc.json',
  ],
  eslint: [
    'eslint.config.ts',
    'eslint.config.js',
    'eslint.config.mjs',
    '.eslintrc',
    '.eslintrc.json',
  ],
  tailwind: ['tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs'],
  lumis: ['lumis.config.ts', 'lumis.config.json'],
};

export type ResolvedToolConfig = {
  path: string;
  source: 'pkg-flat' | 'pkg-legacy' | 'root';
};

/**
 * Resolve where a tool config lives for a Lumiarq app.
 * Canonical: flat file under `pkg/` (e.g. `pkg/vitest.config.ts`).
 */
export function resolveToolConfigPath(
  projectRoot: string,
  tool: AbsorbedTool,
): ResolvedToolConfig | null {
  const flat = join(projectRoot, 'pkg', FLAT_PKG_FILES[tool]);
  if (existsSync(flat)) {
    return { path: flat, source: 'pkg-flat' };
  }

  const legacySubdir = LEGACY_PKG_SUBDIRS[tool];
  if (legacySubdir) {
    const legacy = join(projectRoot, 'pkg', legacySubdir);
    if (existsSync(legacy)) {
      return { path: legacy, source: 'pkg-legacy' };
    }
  }

  for (const name of ROOT_FILES[tool]) {
    const rootPath = join(projectRoot, name);
    if (existsSync(rootPath)) {
      return { path: rootPath, source: 'root' };
    }
  }

  return null;
}
