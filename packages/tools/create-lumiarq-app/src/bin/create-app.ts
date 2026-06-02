#!/usr/bin/env node

import path from 'node:path';
import { Command } from 'commander';
import * as p from '@clack/prompts';
import { createLumiarqApp } from '../create-app.js';
import { PRESETS, type Preset } from '../types.js';

const program = new Command();

program
  .name('create-lumiarq-app')
  .description('Create a new LumiARQ application')
  .argument('[directory]', 'project directory', '.')
  .option('--preset <preset>', 'api-only | full-stack | domain-only')
  .option('--skip-install', 'skip pnpm install')
  .option('--stubs-only', 'only write bootstrap/config stubs into an existing project')
  .action(
    async (
      directory: string,
      opts: { preset?: string; skipInstall?: boolean; stubsOnly?: boolean },
    ) => {
      let preset = opts.preset as Preset | undefined;
      let targetDir = path.resolve(directory);

      if (!opts.stubsOnly && process.stdin.isTTY && !preset) {
        p.intro('create-lumiarq-app');

        const name = await p.text({
          message: 'Project name',
          initialValue: path.basename(targetDir) === '.' ? 'my-app' : path.basename(targetDir),
          validate: (v) =>
            v && /^[a-z0-9-]+$/i.test(v) ? undefined : 'Use letters, numbers, and hyphens',
        });
        if (p.isCancel(name)) {
          p.cancel('Cancelled');
          process.exit(0);
        }

        if (directory === '.' || directory === '') {
          targetDir = path.resolve(String(name));
        }

        const chosen = await p.select({
          message: 'Preset',
          options: [
            {
              value: 'api-only' as Preset,
              label: 'api-only',
              hint: 'API with health + JWT-ready env',
            },
            { value: 'full-stack' as Preset, label: 'full-stack', hint: 'API + welcome HTML page' },
            {
              value: 'domain-only' as Preset,
              label: 'domain-only',
              hint: 'Modules/logic only, no HTTP routes',
            },
          ],
        });
        if (p.isCancel(chosen)) {
          p.cancel('Cancelled');
          process.exit(0);
        }
        preset = chosen;
        p.outro(`Scaffolding ${String(name)} (${preset})…`);
      }

      if (preset && !PRESETS.includes(preset)) {
        console.error(`Invalid preset "${preset}". Use: ${PRESETS.join(', ')}`);
        process.exit(1);
      }

      try {
        const result = createLumiarqApp({
          projectRoot: targetDir,
          projectName: path.basename(targetDir),
          preset: preset ?? 'api-only',
          ...(opts.skipInstall ? { skipInstall: true } : {}),
          ...(opts.stubsOnly ? { stubsOnly: true } : {}),
        });

        const lines = [
          `Created LumiARQ project at ${result.projectRoot}`,
          `Preset: ${result.preset}`,
          result.installed ? 'Dependencies installed with pnpm.' : 'Run: pnpm install',
          'Start: pnpm dev',
        ];
        console.log(lines.join('\n'));
      } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

program.parse(process.argv);
