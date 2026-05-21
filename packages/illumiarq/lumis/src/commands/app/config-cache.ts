import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { ui, writeError, writeLine } from '../../console.js';
import { runBridge } from './command-runtime.js';

type ConfigCachePayload = {
  generatedAt: string;
  configs: Record<string, unknown>;
};

function configCachePath(cwd: string): string {
  return join(cwd, 'bootstrap', 'cache', 'config.cache.json');
}

function listConfigNames(cwd: string): string[] {
  const configDir = join(cwd, 'src', 'config');
  if (!existsSync(configDir)) {
    return [];
  }

  return readdirSync(configDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|js)$/i.test(entry.name))
    .map((entry) => entry.name.replace(/\.(ts|js)$/i, ''))
    .sort((a, b) => a.localeCompare(b));
}

export function cacheConfig(cwd = process.cwd()): number {
  const names = listConfigNames(cwd);
  if (names.length === 0) {
    writeError(ui.fail('No config files found in src/config/.'));
    return 1;
  }

  const cached: Record<string, unknown> = {};
  const failures: string[] = [];

  for (const name of names) {
    const result = runBridge(['config:show', cwd, name], cwd);
    if (result.status !== 0) {
      failures.push(`${name}: ${result.stderr.trim() || 'failed to resolve config'}`);
      continue;
    }

    try {
      const parsed = JSON.parse(result.stdout) as { config: unknown };
      cached[name] = parsed.config;
    } catch {
      failures.push(`${name}: invalid JSON returned from config resolver`);
    }
  }

  if (failures.length > 0) {
    writeLine();
    writeLine(ui.section('Config Cache'));
    writeError(ui.fail('Unable to cache config due to resolution errors:'));
    for (const failure of failures) {
      writeError(`  - ${failure}`);
    }
    writeLine();
    return 1;
  }

  const payload: ConfigCachePayload = {
    generatedAt: new Date().toISOString(),
    configs: cached,
  };
  const outputPath = configCachePath(cwd);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  writeLine();
  writeLine(ui.section('Config Cache'));
  writeLine(`  ${ui.ok(`Cached ${Object.keys(cached).length} config files`)}`);
  writeLine(`  ${ui.bullet(relative(cwd, outputPath))}`);
  writeLine();
  return 0;
}

export function clearConfigCache(cwd = process.cwd()): number {
  const outputPath = configCachePath(cwd);
  if (existsSync(outputPath)) {
    rmSync(outputPath, { force: true });
  }

  writeLine();
  writeLine(ui.section('Config Clear'));
  writeLine(`  ${ui.ok(`Removed ${relative(cwd, outputPath)}`)}`);
  writeLine();
  return 0;
}
