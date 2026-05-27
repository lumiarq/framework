import type { Config } from 'prettier';

/**
 * Opinionated Prettier baseline for Lumiarq apps.
 * Apps extend via `definePrettierConfig({ ... })` in `pkg/prettier.config.ts`.
 */
export function definePrettierConfig(overrides: Config = {}): Config {
  const defaults: Config = {
    semi: false,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    printWidth: 100,
    bracketSpacing: true,
    arrowParens: 'always',
    endOfLine: 'lf',
  };

  return { ...defaults, ...overrides };
}
