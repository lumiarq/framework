#!/usr/bin/env node
/**
 * @illumiarq/lumis — extended CLI entry point.
 *
 * Intercepts LumiARQ-specific commands (serve / build / preview) and
 * delegates everything else to the base @lumiarq/lumis runCli().
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { resolveToolConfigPath } from '@illumiarq/core/node';

import { ui, writeError, writeLine } from './console.js';
import { readStorageRoot } from './paths.js';
import { serveApp } from './commands/serve.js';
import { buildApp } from './commands/build.js';
import { buildVercelFunction } from './commands/build-vercel-fn.js';
import { previewApp } from './commands/preview.js';
import { showInfo } from './commands/info.js';
import { listModules } from './commands/module-list.js';
import { generateKeys, rotateKeys } from './commands/keys.js';
import { enableMaintenanceMode, disableMaintenanceMode } from './commands/maintenance.js';
import {
  cacheConfig,
  cacheRoutes,
  cacheSearchIndex,
  cacheViews,
  checkRoutes,
  clearConfigCache,
  clearOptimizationCaches,
  clearRouteCache,
  clearSearchIndex,
  clearViews,
  installAuth,
  listRoutes,
  makeLayout,
  makePage,
  optimizeForProduction,
  publishConfig,
  publishStubs,
  runDatabaseCommand,
  scheduleList,
  scheduleRun,
  showResolvedConfig,
  workerList,
  workerStart,
} from './commands/app-commands.js';

const argv = process.argv.slice(2);
const cmd = argv[0];

async function main(): Promise<number> {
  if (argv.includes('--help') || cmd === 'help') {
    return renderCombinedHelp();
  }

  // ── LumiARQ-specific commands ──────────────────────────────────────────────
  if (cmd === 'serve') {
    const port = parsePort(argv);
    const host = parseHost(argv);
    return serveApp({ ...(port !== undefined ? { port } : {}), ...(host ? { host } : {}) });
  }

  if (cmd === 'preview') {
    const port = parsePort(argv);
    const target = parsePreviewTarget(argv);
    return previewApp({ ...(port !== undefined ? { port } : {}), ...(target ? { target } : {}) });
  }

  if (cmd === 'build') {
    const target = parseTarget(argv);
    return buildApp(target !== undefined ? { target } : {});
  }

  if (cmd === 'build:vercel') {
    return buildApp({ target: 'vercel' });
  }

  if (cmd === 'build:vercel-fn') {
    return buildVercelFunction();
  }

  if (cmd === 'info') {
    return showInfo();
  }

  if (cmd === 'health') {
    runHealthPreChecks();
    const { runCli } = await import('@lumiarq/lumis');
    return runCli(['doctor', ...argv.slice(1)]);
  }

  if (cmd === 'doctor') {
    runHealthPreChecks();
    const { runCli } = await import('@lumiarq/lumis');
    return runCli(argv);
  }

  if (cmd === 'module:list') {
    return listModules();
  }

  if (cmd === 'test') {
    return runTest(argv.slice(1));
  }

  if (cmd === 'lint') {
    return runLint(argv.slice(1));
  }

  if (cmd === 'prettier:sync') {
    return syncPrettierConfig();
  }

  if (cmd === 'key:generate') {
    return generateKeys();
  }

  if (cmd === 'key:rotate') {
    return rotateKeys();
  }

  if (cmd === 'config:show') {
    const configName = argv[1];
    if (!configName) {
      writeError(ui.fail('Usage: lumis config:show <name> [--json]'));
      return 1;
    }
    return showResolvedConfig(configName);
  }

  if (cmd === 'config:cache') {
    return cacheConfig();
  }

  if (cmd === 'config:clear') {
    return clearConfigCache();
  }

  if (cmd?.startsWith('db:')) {
    return await runDatabaseCommand(cmd, argv.slice(1));
  }

  if (cmd === 'route:list') {
    return listRoutes();
  }

  if (cmd === 'route:check') {
    return checkRoutes();
  }

  if (cmd === 'route:cache') {
    return cacheRoutes();
  }

  if (cmd === 'make:page') {
    return makePage(argv[1] ?? '', process.cwd(), argv.includes('--force'));
  }

  if (cmd === 'make:layout') {
    return makeLayout(argv[1] ?? '', process.cwd(), argv.includes('--force'));
  }

  if (cmd === 'route:clear') {
    return clearRouteCache();
  }

  if (cmd === 'view:cache') {
    return cacheViews();
  }

  if (cmd === 'view:clear') {
    return clearViews();
  }

  if (cmd === 'search:index') {
    return cacheSearchIndex();
  }

  if (cmd === 'search:clear') {
    return clearSearchIndex();
  }

  if (cmd === 'optimize') {
    return optimizeForProduction();
  }

  if (cmd === 'optimize:clear') {
    return clearOptimizationCaches();
  }

  if (cmd === 'down') {
    const message = parseStringFlag(argv, '--message');
    const secret = parseStringFlag(argv, '--secret');
    const allowedIps = parseRepeatedFlag(argv, '--allow');
    return enableMaintenanceMode({
      ...(message ? { message } : {}),
      ...(secret ? { secret } : {}),
      ...(allowedIps.length > 0 ? { allowedIps } : {}),
    });
  }

  if (cmd === 'up') {
    return disableMaintenanceMode();
  }

  if (cmd === 'stub:publish') {
    return publishStubs({ all: argv.includes('--all'), iam: argv.includes('--iam') });
  }

  if (cmd === 'auth:install') {
    const uiFramework = parseStringFlag(argv, '--ui') as
      | 'react'
      | 'vue'
      | 'svelte'
      | 'solid'
      | undefined;
    return installAuth({
      iam: argv.includes('--iam'),
      ...(uiFramework ? { ui: uiFramework } : {}),
    });
  }

  if (cmd === 'publish') {
    const subCmd = argv[1];
    if (subCmd === 'config') {
      const configName = argv[2] ?? 'list';
      return publishConfig(configName, argv.includes('--force'));
    }
    if (subCmd === 'stub' || subCmd === 'stubs') {
      return publishStubs({ all: argv.includes('--all'), iam: argv.includes('--iam') });
    }
    writeError(ui.fail(`Unknown publish subcommand: "${subCmd}". Try: publish config <name>`));
    return 1;
  }

  if (cmd === 'worker:start') {
    return workerStart(argv.includes('--dev'));
  }

  if (cmd === 'worker:list') {
    return workerList();
  }

  if (cmd === 'schedule:list') {
    return scheduleList();
  }

  if (cmd === 'schedule:run') {
    return scheduleRun(argv[1] ?? '');
  }

  const projectCommandExit = await runProjectCommandDirect(argv);
  if (projectCommandExit !== null) {
    return projectCommandExit;
  }

  // ── Delegate to base @lumiarq/lumis (lazy import avoids auto-run side effect)
  const { runCli } = await import('@lumiarq/lumis');
  return runCli(argv);
}

async function renderCombinedHelp(): Promise<number> {
  renderWrapperHelp();
  writeLine(ui.section('Base Lumis Commands'));
  const { runCli } = await import('@lumiarq/lumis');
  return runCli(['--help']);
}

function renderWrapperHelp(): void {
  writeLine();
  writeLine(ui.section('LumiARQ CLI'));
  writeLine(
    `  ${ui.dim('Wrapper commands are shown first; core Lumis commands remain available underneath.')}`,
  );
  writeLine();
  writeLine(`  ${ui.bold('Runtime')}`);
  writeLine('    lumis serve [--port|-p <port>] [--host|-H <host>]');
  writeLine('    lumis build [--target|--to|--t|-t <node|static|cloudflare|vercel>]');
  writeLine('    lumis build:vercel');
  writeLine('    lumis preview [--target|--to|--t|-t <node|static|cloudflare>]');
  writeLine();
  writeLine(`  ${ui.bold('App')}`);
  writeLine('    lumis info');
  writeLine('    lumis health');
  writeLine('    lumis module:list');
  writeLine('    lumis config:show <name>');
  writeLine('    lumis config:cache | config:clear');
  writeLine('    lumis route:list | route:check | route:cache | route:clear');
  writeLine('    lumis make:page <route> [--force]');
  writeLine('    lumis make:layout <route> [--force]');
  writeLine('    lumis view:cache | view:clear');
  writeLine('    lumis search:index | search:clear');
  writeLine('    lumis optimize | optimize:clear');
  writeLine('    lumis key:generate | key:rotate');
  writeLine('    lumis down [--message <text>] [--secret <token>] [--allow <ip>]');
  writeLine('    lumis up');
  writeLine('    lumis auth:install [--iam] [--ui react]');
  writeLine('    lumis stub:publish [--all|--iam]');
  writeLine();
  writeLine(`  ${ui.bold('Database')}`);
  writeLine('    lumis db:generate | db:migrate');
  writeLine('    lumis db:ping        — verify DB connection and diagnose failures');
  writeLine('    lumis db:seed');
  writeLine('    lumis db:fresh       — migrate + seed (destructive)');
  writeLine('    lumis db:reset       — drop all tables + migrate');
  writeLine('    lumis db:studio      — open drizzle-kit studio');
  writeLine();
  writeLine(`  ${ui.bold('Config')}`);
  writeLine(
    '    lumis publish config <name>  — mail | queue | cache | storage | session | security | logging | auth',
  );
  writeLine('    lumis publish config all     — publish every config file');
  writeLine('    lumis publish config list    — show available configs');
  writeLine();
  writeLine(`  ${ui.bold('Workers & Scheduling')}`);
  writeLine('    lumis worker:start [--dev]   — start background worker process');
  writeLine('    lumis worker:list            — list registered workers + scheduled jobs');
  writeLine('    lumis schedule:list          — list all cron jobs');
  writeLine('    lumis schedule:run <name>    — run a specific cron job immediately');
  writeLine();
  writeLine(`  ${ui.bold('Core Lumis')}`);
  writeLine('    lumis doctor | init | make | intent | ir:* | runtime:* | tinker');
  writeLine();
  writeLine(`  ${ui.bold('Project Commands')}`);
  writeLine('    lumis <your:command>          — run projectCommands entries directly');
  writeLine('    lumis commands run project <name>');
  writeLine();
}

type NormalizedCommandEntry = {
  source: 'pack' | 'project';
  name: string;
};

const BASE_COMMAND_ROOTS = new Set([
  'use',
  'pack',
  'commands',
  'doctor',
  'init',
  'make',
  'intent',
  'ir',
  'runtime',
  'tinker',
]);

async function runProjectCommandDirect(args: string[]): Promise<number | null> {
  const candidate = args[0];
  if (!candidate) {
    return null;
  }
  if (BASE_COMMAND_ROOTS.has(candidate)) {
    return null;
  }

  const { runCli } = await import('@lumiarq/lumis');

  let stdout = '';
  let stderr = '';
  const listExit = await runCli(['commands', 'list', '--json'], {
    write: (chunk: string) => {
      stdout += chunk;
    },
    writeError: (chunk: string) => {
      stderr += chunk;
    },
  });

  if (listExit !== 0 || stderr.trim().length > 0) {
    return null;
  }

  let commands: NormalizedCommandEntry[] = [];
  try {
    commands = JSON.parse(stdout) as NormalizedCommandEntry[];
  } catch {
    return null;
  }

  const exists = commands.some((entry) => entry.source === 'project' && entry.name === candidate);
  if (!exists) {
    return null;
  }

  return runCli(['commands', 'run', 'project', candidate, ...args.slice(1)]);
}

function normalizeForwardedArgs(extraArgs: string[]): string[] {
  return extraArgs[0] === '--' ? extraArgs.slice(1) : extraArgs;
}

async function runTest(extraArgs: string[]): Promise<number> {
  const cwd = process.cwd();
  const { execSync } = await import('node:child_process');

  const resolved = resolveToolConfigPath(cwd, 'vitest');
  if (!resolved) {
    writeError(
      ui.fail(
        'No Vitest config found. Create pkg/vitest.config.ts (canonical) or pkg/vitest.config.mjs.\n',
      ),
    );
    return 1;
  }

  if (resolved.source === 'root') {
    writeLine(
      ui.warn(
        `Using legacy root config ${resolved.path}. Prefer pkg/vitest.config.ts — run lumis doctor.\n`,
      ),
    );
  }

  const userArgs = normalizeForwardedArgs(extraArgs);
  const vitestArgv = userArgs.length > 0 ? ['vitest', ...userArgs] : ['vitest', 'run'];
  const args = [...vitestArgv, '--config', resolved.path];

  try {
    execSync(`pnpm exec ${args.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`, {
      stdio: 'inherit',
      cwd,
    });
    return 0;
  } catch {
    return 1;
  }
}

async function runLint(extraArgs: string[]): Promise<number> {
  const cwd = process.cwd();
  const { execSync } = await import('node:child_process');

  const resolved = resolveToolConfigPath(cwd, 'eslint');
  if (!resolved) {
    writeError(
      ui.fail(
        'No ESLint config found. Create pkg/eslint.config.mjs (canonical) or pkg/eslint.config.ts.\n',
      ),
    );
    return 1;
  }

  if (resolved.source === 'root') {
    writeLine(
      ui.warn(
        `Using legacy root config ${resolved.path}. Prefer pkg/eslint.config.mjs — run lumis doctor.\n`,
      ),
    );
  }

  const userArgs = normalizeForwardedArgs(extraArgs);
  const eslintArgv = ['eslint', 'src', 'bootstrap', '--config', resolved.path, ...userArgs];

  try {
    execSync(`pnpm exec ${eslintArgv.join(' ')}`, { stdio: 'inherit', cwd });
    return 0;
  } catch {
    return 1;
  }
}

async function syncPrettierConfig(): Promise<number> {
  const cwd = process.cwd();
  const { writeFileSync } = await import('node:fs');
  const { pathToFileURL } = await import('node:url');

  const resolved = resolveToolConfigPath(cwd, 'prettier');
  const srcPath = join(cwd, 'pkg', 'prettier.config.ts');

  if (resolved?.path.endsWith('prettier.config.mjs') && !existsSync(srcPath)) {
    writeLine(ui.ok('pkg/prettier.config.mjs is already canonical — no sync needed.'));
    return 0;
  }

  if (!existsSync(srcPath)) {
    writeError(
      ui.fail(
        'pkg/prettier.config.ts not found. Create it or use pkg/prettier.config.mjs directly.\n',
      ),
    );
    return 1;
  }

  let config: unknown;
  try {
    const mod = await import(pathToFileURL(srcPath).href);
    config = mod.default ?? mod;
  } catch (e) {
    writeError(ui.fail(`Failed to load pkg/prettier.config.ts: ${String(e)}\n`));
    return 1;
  }

  const out = [
    '// Canonical Prettier config for Lumiarq apps (Wave 2 pkg/ layout).',
    "/** @type {import('prettier').Config} */",
    `export default ${JSON.stringify(config, null, 2)};`,
    '',
  ].join('\n');

  const target = join(cwd, 'pkg', 'prettier.config.mjs');
  writeFileSync(target, out, 'utf8');
  writeLine(ui.ok(`Wrote ${target} from pkg/prettier.config.ts`));
  return 0;
}

function runHealthPreChecks(): void {
  const cwd = process.cwd();
  const checks: Array<{ label: string; pass: boolean; fix?: string }> = [];

  // Required bootstrap files
  checks.push({
    label: 'bootstrap/entry.ts present',
    pass: existsSync(join(cwd, 'bootstrap', 'entry.ts')),
    fix: 'bootstrap/entry.ts is missing — this is the HTTP server entrypoint.',
  });
  checks.push({
    label: 'bootstrap/providers.ts present',
    pass: existsSync(join(cwd, 'bootstrap', 'providers.ts')),
    fix: "bootstrap/providers.ts is missing — service container won't boot.",
  });
  checks.push({
    label: 'src/config/app.ts present',
    pass: existsSync(join(cwd, 'src', 'config', 'app.ts')),
    fix: 'src/config/app.ts is missing — run: lumis publish config app',
  });
  checks.push({
    label: '@types/node installed',
    pass:
      existsSync(join(cwd, 'node_modules', '@types', 'node')) ||
      existsSync(join(cwd, '..', 'node_modules', '@types', 'node')),
    fix: 'Install @types/node: pnpm add -D @types/node',
  });

  checks.push({
    label: 'drizzle config uses canonical pkg path',
    pass:
      !existsSync(join(cwd, 'drizzle.config.ts')) ||
      existsSync(join(cwd, 'pkg', 'drizzle.config.ts')) ||
      existsSync(join(cwd, 'pkg', 'drizzle', 'config.ts')), // legacy subdir — migrate to flat
    fix: 'Move Drizzle config to pkg/drizzle.config.ts. No root shim needed — lumis db:* reads pkg/ directly.',
  });

  checks.push({
    label: 'vitest config uses canonical pkg path',
    pass:
      !existsSync(join(cwd, 'vitest.config.ts')) ||
      existsSync(join(cwd, 'pkg', 'vitest.config.ts')) ||
      existsSync(join(cwd, 'pkg', 'vitest', 'config.ts')), // legacy subdir — migrate to flat
    fix: 'Move Vitest config to pkg/vitest.config.ts. No root shim needed — lumis test reads pkg/ directly.',
  });

  checks.push({
    label: 'lumis config uses canonical pkg path',
    pass:
      (!existsSync(join(cwd, 'lumis.config.ts')) && !existsSync(join(cwd, 'lumis.config.json'))) ||
      existsSync(join(cwd, 'pkg', 'lumis.config.ts')) ||
      existsSync(join(cwd, 'pkg', 'lumis', 'config.ts')), // legacy subdir — migrate to flat
    fix: 'Move lumis config to pkg/lumis.config.ts and remove the root lumis.config.* file.',
  });

  checks.push({
    label: 'prettier config uses canonical pkg path',
    pass:
      (!existsSync(join(cwd, '.prettierrc')) &&
        !existsSync(join(cwd, 'prettier.config.ts')) &&
        !existsSync(join(cwd, 'prettier.config.mjs'))) ||
      existsSync(join(cwd, 'pkg', 'prettier.config.ts')) ||
      existsSync(join(cwd, 'pkg', 'prettier.config.mjs')),
    fix: 'Move Prettier config to pkg/prettier.config.mjs (or .ts). Delete root .prettierrc / prettier.config.*.',
  });

  checks.push({
    label: 'eslint config uses canonical pkg path',
    pass:
      (!existsSync(join(cwd, 'eslint.config.ts')) &&
        !existsSync(join(cwd, 'eslint.config.mjs')) &&
        !existsSync(join(cwd, '.eslintrc')) &&
        !existsSync(join(cwd, '.eslintrc.json'))) ||
      existsSync(join(cwd, 'pkg', 'eslint.config.ts')) ||
      existsSync(join(cwd, 'pkg', 'eslint.config.mjs')),
    fix: 'Move ESLint config to pkg/eslint.config.mjs and point lint scripts at --config pkg/eslint.config.mjs.',
  });

  // Warn if queue driver isn't stub but worker.ts is missing
  const queueConfigPath = existsSync(join(cwd, 'src', 'config', 'queue.ts'))
    ? join(cwd, 'src', 'config', 'queue.ts')
    : join(cwd, 'config', 'queue.ts'); // legacy fallback
  if (existsSync(queueConfigPath)) {
    const queueSrc = readFileSync(queueConfigPath, 'utf8');
    const usesBullmq = queueSrc.includes("'bullmq'") || queueSrc.includes('"bullmq"');
    if (usesBullmq) {
      checks.push({
        label: 'bootstrap/worker.ts present (queue driver: bullmq)',
        pass: existsSync(join(cwd, 'bootstrap', 'worker.ts')),
        fix: "Queue driver is 'bullmq' but bootstrap/worker.ts is missing. Create it to process queued jobs.",
      });
    }
  }

  // Vercel deployment hygiene (Phase 0)
  const vercelJsonPath = join(cwd, 'vercel.json');
  if (existsSync(vercelJsonPath)) {
    let vercelRaw = '';
    try {
      vercelRaw = readFileSync(vercelJsonPath, 'utf8');
    } catch {
      vercelRaw = '';
    }

    const usesLegacyRoutes =
      vercelRaw.includes('"routes"') &&
      vercelRaw.includes('"handle"') &&
      vercelRaw.includes('filesystem');

    checks.push({
      label: 'vercel.json uses rewrites (not legacy routes + filesystem)',
      pass: !usesLegacyRoutes && vercelRaw.includes('"rewrites"'),
      fix: 'Replace deprecated routes/handle:filesystem with rewrites → /api/index. See lumiarq-vercel-deployment-fix skill.',
    });

    checks.push({
      label: 'vercel.json installCommand pins pnpm',
      pass: vercelRaw.includes('"installCommand"') && vercelRaw.includes('pnpm'),
      fix: 'Add installCommand: "corepack enable && pnpm install --frozen-lockfile" to vercel.json.',
    });

    checks.push({
      label: 'vercel.json bundles framework cache for serverless',
      pass:
        vercelRaw.includes('"includeFiles"') && vercelRaw.includes('src/storage/framework/cache'),
      fix: 'Add functions.api/index.js.includeFiles: "src/storage/framework/cache/**" so route/view caches ship with the function.',
    });
  }

  checks.push({
    label: 'api/index.js present (run pnpm run build:vercel first)',
    pass: existsSync(join(cwd, 'api', 'index.js')),
    fix: 'Run pnpm run build:vercel locally — Vercel requires api/index.js as the serverless entry.',
  });

  // Route loader cache path checks (Wave 2 canonical layout)
  const storageRoot = readStorageRoot(cwd);
  const routesLoader = join(cwd, storageRoot, 'framework', 'cache', 'routes.loader.ts');
  const staleRootStorageLoader = join(cwd, 'storage', 'framework', 'cache', 'routes.loader.ts');

  if (storageRoot !== 'storage' && existsSync(staleRootStorageLoader)) {
    checks.push({
      label: 'no stale root storage/ cache (use configured storage root)',
      pass: false,
      fix: `Remove storage/framework/cache — lumis should write to ${storageRoot}/framework/cache only.`,
    });
  }

  const bootstrapRoutesLoader = join(cwd, 'bootstrap', 'cache', 'routes.loader.ts');

  checks.push({
    label: 'route loader cache path is canonical',
    pass: !(existsSync(routesLoader) && existsSync(bootstrapRoutesLoader)),
    fix: `Duplicate route cache detected. Keep only ${storageRoot}/framework/cache/routes.loader.ts and remove bootstrap/cache/routes.loader.ts`,
  });

  // Stale route loader warning
  if (existsSync(routesLoader)) {
    const loaderMtime = statSync(routesLoader).mtimeMs;
    const routesRoot = join(cwd, 'src', 'modules');
    let stale = false;
    if (existsSync(routesRoot)) {
      const stack = [routesRoot];
      while (stack.length > 0) {
        const dir = stack.pop()!;
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            stack.push(join(dir, entry.name));
            continue;
          }
          if (/\/http\/routes\/.+\.(ts|js)$/.test(join(dir, entry.name))) {
            if (statSync(join(dir, entry.name)).mtimeMs > loaderMtime) {
              stale = true;
              break;
            }
          }
        }
        if (stale) break;
      }
    }
    checks.push({
      label: 'route cache is fresh',
      pass: !stale,
      fix: 'Route files have changed since last cache. Run: lumis route:cache',
    });
  }

  const warnings = checks.filter((c) => !c.pass);
  if (warnings.length > 0) {
    writeLine();
    writeLine(ui.section('Health Pre-checks'));
    for (const w of warnings) {
      writeLine(`  ${ui.warn(w.label)}`);
      if (w.fix) writeLine(`    ${ui.dim(w.fix)}`);
    }
    writeLine();
  }
}

function parsePort(args: string[]): number | undefined {
  const idx = args.findIndex((a) => a === '--port' || a === '-p');
  const inline = args.find((a) => a.startsWith('--port='));
  const raw = inline ? inline.split('=')[1] : idx !== -1 ? args[idx + 1] : undefined;
  if (raw) return parseInt(raw, 10);
  return undefined;
}

function parseHost(args: string[]): string | undefined {
  const idx = args.findIndex((a) => a === '--host' || a === '-H');
  const inline = args.find((a) => a.startsWith('--host='));
  if (inline) return inline.split('=')[1];
  if (idx !== -1) return args[idx + 1];
  return undefined;
}

function parseTarget(args: string[]): 'node' | 'static' | 'cloudflare' | 'vercel' | undefined {
  const idx = args.findIndex((a) => a === '--target' || a === '--to' || a === '--t' || a === '-t');
  const inline = args.find(
    (a) => a.startsWith('--target=') || a.startsWith('--to=') || a.startsWith('--t='),
  );
  if (inline) {
    const val = inline.slice(inline.indexOf('=') + 1);
    if (val === 'node' || val === 'static' || val === 'cloudflare' || val === 'vercel') return val;
  }
  if (idx !== -1) {
    const val = args[idx + 1];
    if (val === 'node' || val === 'static' || val === 'cloudflare' || val === 'vercel') return val;
  }
  return undefined;
}

function parsePreviewTarget(args: string[]): 'node' | 'static' | 'cloudflare' | undefined {
  const target = parseTarget(args);
  if (target === 'vercel') {
    writeError(
      ui.fail('`preview` does not support target "vercel". Use: lumis build --target vercel'),
    );
    return undefined;
  }
  return target;
}

function parseStringFlag(args: string[], flag: string): string | undefined {
  const index = args.findIndex((value) => value === flag);
  const inline = args.find((value) => value.startsWith(`${flag}=`));
  if (inline) {
    return inline.slice(flag.length + 1);
  }
  if (index !== -1) {
    return args[index + 1];
  }
  return undefined;
}

function parseRepeatedFlag(args: string[], flag: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === flag && args[index + 1]) {
      values.push(args[index + 1]!);
    }
    if (token?.startsWith(`${flag}=`)) {
      values.push(token.slice(flag.length + 1));
    }
  }
  return values;
}

main().then((code) => process.exit(code));
