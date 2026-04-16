#!/usr/bin/env node
/**
 * @illumiarq/lumis — extended CLI entry point.
 *
 * Intercepts LumiARQ-specific commands (serve / build / preview) and
 * delegates everything else to the base @lumiarq/lumis runCli().
 */
import { ui, writeError, writeLine } from './console.js';
import { serveApp } from './commands/serve.js';
import { buildApp } from './commands/build.js';
import { previewApp } from './commands/preview.js';
import { showInfo } from './commands/info.js';
import { listModules } from './commands/module-list.js';
import { generateKeys, rotateKeys } from './commands/keys.js';
import { enableMaintenanceMode, disableMaintenanceMode } from './commands/maintenance.js';
import {
  cacheRoutes,
  cacheSearchIndex,
  cacheViews,
  checkRoutes,
  clearRouteCache,
  clearSearchIndex,
  clearViews,
  installAuth,
  listRoutes,
  publishStubs,
  runDatabaseCommand,
  showResolvedConfig,
} from './commands/app-commands.js';

const argv = process.argv.slice(2);
const cmd = argv[0];

async function main(): Promise<number> {
  if (argv.includes('--help') || argv.length === 0) {
    renderWrapperHelp();
    return 0;
  }

  // ── LumiARQ-specific commands ──────────────────────────────────────────────
  if (cmd === 'serve') {
    const port = parsePort(argv);
    const host = parseHost(argv);
    return serveApp({ ...(port !== undefined ? { port } : {}), ...(host ? { host } : {}) });
  }

  if (cmd === 'preview') {
    const port = parsePort(argv);
    const target = parseTarget(argv);
    return previewApp({ ...(port !== undefined ? { port } : {}), ...(target ? { target } : {}) });
  }

  if (cmd === 'build') {
    const target = parseTarget(argv);
    return buildApp(target !== undefined ? { target } : {});
  }

  if (cmd === 'info') {
    return showInfo();
  }

  if (cmd === 'health') {
    const { runCli } = await import('@lumiarq/lumis');
    return runCli(['doctor', ...argv.slice(1)]);
  }

  if (cmd === 'module:list') {
    return listModules();
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

  if (cmd?.startsWith('db:')) {
    return runDatabaseCommand(cmd, argv.slice(1));
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

  // ── Delegate to base @lumiarq/lumis (lazy import avoids auto-run side effect)
  const { runCli } = await import('@lumiarq/lumis');
  return runCli(argv);
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
  writeLine('    lumis build [--target|--to|--t|-t <node|static|cloudflare>]');
  writeLine('    lumis preview [--target|--to|--t|-t <node|static|cloudflare>]');
  writeLine();
  writeLine(`  ${ui.bold('App')}`);
  writeLine('    lumis info');
  writeLine('    lumis health');
  writeLine('    lumis module:list');
  writeLine('    lumis config:show <name>');
  writeLine('    lumis route:list | route:check | route:cache | route:clear');
  writeLine('    lumis view:cache | view:clear');
  writeLine('    lumis search:index | search:clear');
  writeLine('    lumis key:generate | key:rotate');
  writeLine('    lumis down [--message <text>] [--secret <token>] [--allow <ip>]');
  writeLine('    lumis up');
  writeLine('    lumis auth:install [--iam] [--ui react]');
  writeLine('    lumis stub:publish [--all|--iam]');
  writeLine('    lumis db:generate | db:migrate');
  writeLine();
  writeLine(`  ${ui.bold('Core Lumis')}`);
  writeLine('    lumis doctor | init | make | intent | ir:* | runtime:* | tinker');
  writeLine();
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

function parseTarget(args: string[]): 'node' | 'static' | 'cloudflare' | undefined {
  const idx = args.findIndex((a) => a === '--target' || a === '--to' || a === '--t' || a === '-t');
  const inline = args.find(
    (a) => a.startsWith('--target=') || a.startsWith('--to=') || a.startsWith('--t='),
  );
  if (inline) {
    const val = inline.slice(inline.indexOf('=') + 1);
    if (val === 'node' || val === 'static' || val === 'cloudflare') return val;
  }
  if (idx !== -1) {
    const val = args[idx + 1];
    if (val === 'node' || val === 'static' || val === 'cloudflare') return val;
  }
  return undefined;
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
