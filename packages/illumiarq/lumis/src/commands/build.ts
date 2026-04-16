import { spawnSync } from 'node:child_process';

export interface BuildOptions {
  /** Target to build. Omit for full project build script. */
  target?: 'node' | 'static' | 'cloudflare';
}

/**
 * `lumis build` — build the LumiARQ application.
 *
 * Delegates to the project's own `build`, `build:node`, or `build:web`
 * pnpm scripts so each app controls its own build pipeline.
 *
 * @returns Exit code.
 */
export function buildApp(options: BuildOptions = {}, cwd = process.cwd()): number {
  const target = options.target;
  const script = target ? `build:${target}` : 'build';

  const result = spawnSync('pnpm', ['run', script], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });

  return result.status ?? 1;
}
