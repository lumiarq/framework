import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type AbsorbedTool = 'vitest' | 'drizzle' | 'prettier' | 'eslint' | 'tailwind' | 'lumis';

/** Flat filenames under `pkg/`, in preference order (TypeScript before ESM). */
const PKG_FLAT_FILES: Record<AbsorbedTool, string[]> = {
  vitest: ['vitest.config.ts', 'vitest.config.mjs'],
  drizzle: ['drizzle.config.ts', 'drizzle.config.mjs'],
  prettier: ['prettier.config.ts', 'prettier.config.mjs'],
  eslint: ['eslint.config.ts', 'eslint.config.mjs'],
  tailwind: ['tailwind.config.ts', 'tailwind.config.mjs'],
  lumis: ['lumis.config.ts'],
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

function firstExistingPath(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Resolve where a tool config lives for a Lumiarq app.
 * Canonical: flat file under `pkg/` (e.g. `pkg/vitest.config.ts` or `pkg/vitest.config.mjs`).
 */
export function resolveToolConfigPath(
  projectRoot: string,
  tool: AbsorbedTool,
): ResolvedToolConfig | null {
  const pkgFlatCandidates = PKG_FLAT_FILES[tool].map((name) => join(projectRoot, 'pkg', name));
  const pkgFlat = firstExistingPath(pkgFlatCandidates);
  if (pkgFlat) {
    return { path: pkgFlat, source: 'pkg-flat' };
  }

  const legacySubdir = LEGACY_PKG_SUBDIRS[tool];
  if (legacySubdir) {
    const legacy = join(projectRoot, 'pkg', legacySubdir);
    if (existsSync(legacy)) {
      return { path: legacy, source: 'pkg-legacy' };
    }
  }

  const rootCandidates = ROOT_FILES[tool].map((name) => join(projectRoot, name));
  const root = firstExistingPath(rootCandidates);
  if (root) {
    return { path: root, source: 'root' };
  }

  return null;
}
