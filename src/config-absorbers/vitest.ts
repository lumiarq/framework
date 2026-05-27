import { resolve } from 'node:path';
import type { UserConfig } from 'vitest/config';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeDeep<T extends Record<string, unknown>>(
  base: T,
  overrides: Record<string, unknown>,
): T {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const existing = out[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = mergeDeep(existing, value);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

/**
 * Lumiarq Vitest defaults — merge app-specific overrides on top.
 * Use with `defineConfig` from `vitest/config` in `pkg/vitest.config.ts`.
 */
export function defineVitestConfig(projectRoot: string, overrides: UserConfig = {}): UserConfig {
  const root = resolve(projectRoot);

  const defaults: UserConfig = {
    test: {
      root,
      globals: true,
      environment: 'node',
      include: ['src/modules/**/tests/**/*.test.ts', 'src/tests/**/*.test.ts'],
    },
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
        '@/modules': resolve(root, 'src/modules'),
        '@/shared': resolve(root, 'src/shared'),
        '@/bootstrap': resolve(root, 'bootstrap'),
        '@/config': resolve(root, 'src/config'),
        '@/lang': resolve(root, 'src/lang'),
        '@/storage': resolve(root, 'src/storage'),
      },
    },
  };

  return mergeDeep(
    defaults as Record<string, unknown>,
    overrides as Record<string, unknown>,
  ) as UserConfig;
}
