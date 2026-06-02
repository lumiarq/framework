import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const thisFile = fileURLToPath(import.meta.url);
const testDir = dirname(thisFile);
const packageRoot = resolve(testDir, '..');
const cliPath = resolve(packageRoot, 'src', 'cli.ts');
const tsxBin = resolve(packageRoot, 'node_modules', '.bin', 'tsx');

function runCli(cwd: string, args: string[]): { stdout: string; status: number | null } {
  const result = spawnSync(tsxBin, [cliPath, ...args], {
    encoding: 'utf8',
    timeout: 20_000,
    cwd,
  });

  return {
    stdout: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    status: result.status,
  };
}

describe('cli tool proxies (pkg/)', () => {
  const tmpPaths: string[] = [];

  afterEach(() => {
    for (const p of tmpPaths) {
      rmSync(p, { recursive: true, force: true });
    }
    tmpPaths.length = 0;
  });

  it('lumis test fails clearly when no vitest config exists', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'lumis-test-proxy-'));
    tmpPaths.push(cwd);
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'x', private: true }), 'utf8');

    const { stdout, status } = runCli(cwd, ['test']);
    expect(status).toBe(1);
    expect(stdout).toContain('pkg/vitest.config.ts');
  });

  it('lumis lint fails clearly when no eslint config exists', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'lumis-lint-proxy-'));
    tmpPaths.push(cwd);
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'x', private: true }), 'utf8');

    const { stdout, status } = runCli(cwd, ['lint']);
    expect(status).toBe(1);
    expect(stdout).toContain('pkg/eslint.config.mjs');
  });
});
