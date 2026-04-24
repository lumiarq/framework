import { existsSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  generateAuthModule,
  generateAuthUI,
  generateIAMModule,
  generateLangFile,
  generateUserModule,
  publishAuthStubs,
  publishIAMStubs,
} from '@illumiarq/auth-starter';
import { ui, writeError, writeLine } from '../console.js';
import { runBridge } from './app/command-runtime.js';
import {
  cacheSearchIndex,
  cacheViews,
  clearOptimizationCaches,
  clearSearchIndex,
  clearViews,
  optimizeForProduction,
} from './app/cache-workflows.js';
import { cacheConfig, clearConfigCache } from './app/config-cache.js';
import { pingDatabaseConnection, runDatabaseCommand } from './app/database.js';
import { publishConfig } from './app/config-publish.js';
import { cacheRoutes, checkRoutes, clearRouteCache, listRoutes } from './app/routes.js';
import { ensureParentDir, resolvePathWithinRoot } from './app/security.js';
import { scheduleList, scheduleRun, workerList, workerStart } from './app/worker-schedule.js';

export {
  cacheConfig,
  cacheRoutes,
  cacheSearchIndex,
  cacheViews,
  clearConfigCache,
  clearOptimizationCaches,
  checkRoutes,
  clearRouteCache,
  clearSearchIndex,
  clearViews,
  listRoutes,
  optimizeForProduction,
  pingDatabaseConnection,
  publishConfig,
  runDatabaseCommand,
  scheduleList,
  scheduleRun,
  workerList,
  workerStart,
};

type AuthInstallOptions = { iam?: boolean; ui?: 'react' | 'vue' | 'svelte' | 'solid' };
type StubPublishOptions = { all?: boolean; iam?: boolean };

function writeGeneratedFiles(
  cwd: string,
  files: Array<{ path: string; content: string }>,
): { created: number; skipped: number } {
  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const target = resolvePathWithinRoot(cwd, file.path);
    ensureParentDir(target);
    if (existsSync(target) && file.path !== 'lang/en.json') {
      skipped += 1;
      continue;
    }
    writeFileSync(target, file.content, 'utf8');
    created += 1;
  }

  return { created, skipped };
}

export function showResolvedConfig(configName: string, cwd = process.cwd()): number {
  const result = runBridge(['config:show', cwd, configName], cwd);
  if (result.status !== 0) {
    writeError(ui.fail(result.stderr.trim() || `Unable to load config/${configName}.ts`));
    return result.status;
  }

  const parsed = JSON.parse(result.stdout) as { config: unknown };
  writeLine();
  writeLine(ui.section(`Config ${configName}`));
  writeLine(JSON.stringify(parsed.config, null, 2));
  writeLine();
  return 0;
}

export function publishStubs(options: StubPublishOptions = {}, cwd = process.cwd()): number {
  if (options.all || !options.iam) {
    publishAuthStubs(cwd);
  }
  if (options.all || options.iam) {
    publishIAMStubs(cwd);
  }

  writeLine();
  writeLine(ui.section('Stub Publish'));
  writeLine(`  ${ui.ok(`Published stubs into ${relative(cwd, join(cwd, 'stubs')) || 'stubs'}`)}`);
  writeLine();
  return 0;
}

export function installAuth(options: AuthInstallOptions = {}, cwd = process.cwd()): number {
  const generated = options.iam
    ? generateIAMModule()
    : [...generateAuthModule(), ...generateUserModule()];
  const uiFiles = options.ui ? generateAuthUI(options.ui) : [];
  const langFile = generateLangFile(cwd);
  const result = writeGeneratedFiles(cwd, [...generated, ...uiFiles, langFile]);

  writeLine();
  writeLine(ui.section('Auth Install'));
  writeLine(`  ${ui.ok(`Created ${result.created} files`)}`);
  if (result.skipped > 0) {
    writeLine(`  ${ui.warn(`Skipped ${result.skipped} existing files`)}`);
  }
  if (options.ui) {
    writeLine(`  ${ui.bullet(`UI scaffold: ${options.ui}`)}`);
  }
  if (options.iam) {
    writeLine(`  ${ui.bullet('Installed IAM module scaffold')}`);
  }
  writeLine();
  return 0;
}
