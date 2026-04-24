import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type PackageJson = { scripts?: Record<string, string> };

export function readPackageJson(cwd: string): PackageJson {
  const target = `${cwd}/package.json`;
  if (!existsSync(target)) {
    return {};
  }

  return JSON.parse(readFileSync(target, 'utf8')) as PackageJson;
}

function bridgePath(): string {
  return fileURLToPath(new URL('../../bridges/project-bridge.ts', import.meta.url));
}

export function runBridge(
  args: string[],
  cwd: string,
): { status: number; stdout: string; stderr: string } {
  const result = spawnSync('pnpm', ['exec', 'tsx', bridgePath(), ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

export function runPnpm(
  args: string[],
  cwd: string,
  stdio: 'inherit' | 'pipe' = 'inherit',
): number {
  const result = spawnSync('pnpm', args, {
    cwd,
    stdio,
    encoding: stdio === 'pipe' ? 'utf8' : undefined,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  if (stdio === 'pipe') {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  return result.status ?? 1;
}
