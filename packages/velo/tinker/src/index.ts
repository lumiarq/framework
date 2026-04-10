import * as repl from 'node:repl';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import type { TinkerConfig } from './types.js';

/** Tries to read the app name from package.json */
export function readAppName(cwd: string): string {
  const pkgPath = resolve(cwd, 'package.json');
  if (!existsSync(pkgPath)) return 'App';
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
    return pkg.name ?? 'App';
  } catch {
    return 'App';
  }
}

/** Attempts dynamic import of a path, returning exports or null on failure. */
export async function tryImport(path: string): Promise<Record<string, unknown> | null> {
  try {
    const mod = (await import(path)) as Record<string, unknown>;
    return mod;
  } catch {
    return null;
  }
}

export async function loadTinkerContext(
  cwd: string,
): Promise<{ context: Record<string, unknown>; loaded: string[] }> {
  const context: Record<string, unknown> = {};
  const loaded: string[] = [];

  const envModPath = resolve(cwd, 'dist/bootstrap/env.js');
  const providersModPath = resolve(cwd, 'dist/bootstrap/providers.js');

  const envMod = await tryImport(envModPath);
  if (envMod) {
    context['env'] = envMod['env'] ?? envMod;
    loaded.push('env');
  }

  const providersMod = await tryImport(providersModPath);
  if (providersMod) {
    for (const [key, value] of Object.entries(providersMod)) {
      if (key !== 'default') {
        context[key] = value;
        loaded.push(key);
      }
    }
  }

  return { context, loaded };
}

export async function evalCode(
  code: string,
  context: Record<string, unknown> = {},
): Promise<unknown> {
  const keys = Object.keys(context);
  const values = Object.values(context);
  const AsyncFunction = Object.getPrototypeOf(async function noop() {}).constructor as new (
    ...args: string[]
  ) => (...fnArgs: unknown[]) => Promise<unknown>;

  try {
    const expression = new AsyncFunction(...keys, `return (${code});`);
    return await expression(...values);
  } catch {
    const statement = new AsyncFunction(...keys, code);
    return statement(...values);
  }
}

/**
 * lumis tinker — REPL with full application context.
 *
 * Boots env + providers, then drops into a Node.js REPL.
 * Available in REPL: db, env, and any named exports from bootstrap/providers.
 *
 * Note: requires the application to be compiled (or to use tsx).
 * Run `pnpm build:node` first, then `lumis tinker` from the dist/.
 * For TypeScript source: `npx tsx node_modules/.bin/lumis tinker`
 */
export async function startTinker(config: TinkerConfig = {}): Promise<void> {
  const cwd = config.cwd ?? process.cwd();
  const appName = readAppName(cwd);
  const env = process.env['APP_ENV'] ?? 'unknown';

  console.log('');
  console.log('  LumiARQ Tinker v1.0.0');
  console.log('  ' + '─'.repeat(37));
  console.log(`  App: ${appName}  |  Env: ${env}`);

  const { context, loaded } = await loadTinkerContext(cwd);
  Object.assign(context, config.inject ?? {});

  if (loaded.length === 0) {
    console.log('  ⚠ Application context not loaded.');
    console.log('    Run `lumis build --target node` first,');
    console.log('    or launch via `npx tsx lumis/src/cli.ts tinker`.');
  } else {
    console.log(`  Context: ${loaded.join(', ')}`);
  }

  console.log('  Type .exit to quit, .help for commands.');
  console.log('');

  const server = repl.start({
    prompt: config.prompt ?? '> ',
    useGlobal: config.useGlobal ?? false,
  });

  // Inject discovered context into REPL
  for (const [key, value] of Object.entries(context)) {
    Object.defineProperty(server.context, key, {
      configurable: false,
      enumerable: true,
      value,
    });
  }

  return new Promise<void>((resolvePromise) => {
    server.on('exit', () => {
      console.log('');
      resolvePromise();
    });
  });
}

export async function tinker(cwd = process.cwd()): Promise<void> {
  return startTinker({ cwd });
}

export type { TinkerConfig } from './types.js';
