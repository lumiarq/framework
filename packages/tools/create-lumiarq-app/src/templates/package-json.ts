import { PIN_OVERRIDES } from '../consumer-pins.js';
import type { Preset } from '../types.js';

export function createPackageJson(projectName: string, _preset: Preset): string {
  const pkg = {
    name: projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    packageManager: 'pnpm@10.32.0',
    engines: { node: '>=20' },
    scripts: {
      dev: 'lumis serve',
      build: 'pnpm run build:node',
      'build:node':
        'lumis route:cache && esbuild bootstrap/entry.ts --bundle --platform=node --target=node20 --format=esm --outfile=.arc/node/app.js --packages=external --tsconfig=tsconfig.json',
      tc: 'tsc --noEmit',
      test: 'vitest run --passWithNoTests',
      lint: 'eslint src bootstrap --ext .ts',
    },
    pnpm: { overrides: PIN_OVERRIDES },
    dependencies: {
      '@illumiarq/adapters': '^1.2.0',
      '@illumiarq/http': '^1.1.5',
      '@illumiarq/runtime': '^1.2.0',
      '@lumiarq/framework': '^1.0.6',
    },
    devDependencies: {
      '@illumiarq/lumis': '^1.3.2',
      '@types/node': '^22.0.0',
      esbuild: '^0.25.0',
      typescript: '^5.7.0',
      vitest: '^2.1.0',
      zod: '^3.24.0',
    },
  };

  return `${JSON.stringify(pkg, null, 2)}\n`;
}
