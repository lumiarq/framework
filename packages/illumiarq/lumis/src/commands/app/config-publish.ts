import { existsSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { ui, writeError, writeLine } from '../../console.js';
import { KNOWN_CONFIG_NAMES, CONFIG_STUBS } from './config-stubs.js';
import { ensureParentDir } from './security.js';

export function publishConfig(configName: string, force = false, cwd = process.cwd()): number {
  if (configName === 'list' || !configName) {
    writeLine();
    writeLine(ui.section('Available Configs'));
    for (const name of KNOWN_CONFIG_NAMES) {
      const exists = existsSync(join(cwd, 'src', 'config', `${name}.ts`));
      writeLine(
        `  ${exists ? ui.ok(name) : ui.bullet(name)}${exists ? ui.dim(' (already published)') : ''}`,
      );
    }
    writeLine();
    writeLine(`  Run: ${ui.cyan('lumis publish config <name>')} to publish a config file.`);
    writeLine();
    return 0;
  }

  if (configName === 'all') {
    let published = 0;
    let skipped = 0;
    for (const name of KNOWN_CONFIG_NAMES) {
      const result = publishSingleConfig(name, force, cwd);
      if (result.action === 'created') published++;
      else skipped++;
    }
    writeLine();
    writeLine(ui.section('Config Publish'));
    writeLine(`  ${ui.ok(`Published ${published} config files`)}`);
    if (skipped > 0) {
      writeLine(
        `  ${ui.warn(`Skipped ${skipped} already existing files (use --force to overwrite)`)}`,
      );
    }
    writeLine();
    return 0;
  }

  const stub = CONFIG_STUBS[configName];
  if (!stub) {
    writeError(
      ui.fail(`Unknown config: "${configName}". Available: ${KNOWN_CONFIG_NAMES.join(', ')}`),
    );
    return 1;
  }

  const { action, filePath } = publishSingleConfig(configName, force, cwd);
  writeLine();
  writeLine(ui.section('Config Publish'));
  if (action === 'created') {
    writeLine(`  ${ui.ok(`Published src/config/${configName}.ts`)}`);
  } else {
    writeLine(
      `  ${ui.warn(`src/config/${configName}.ts already exists - use --force to overwrite`)}`,
    );
  }
  writeLine(`  ${ui.bullet(relative(cwd, filePath))}`);
  writeLine();
  return 0;
}

function publishSingleConfig(
  name: string,
  force: boolean,
  cwd: string,
): { action: 'created' | 'skipped'; filePath: string } {
  const filePath = join(cwd, 'src', 'config', `${name}.ts`);
  const stub = CONFIG_STUBS[name];
  if (!stub) return { action: 'skipped', filePath };

  if (existsSync(filePath) && !force) {
    return { action: 'skipped', filePath };
  }

  ensureParentDir(filePath);
  writeFileSync(filePath, stub, 'utf8');
  return { action: 'created', filePath };
}
