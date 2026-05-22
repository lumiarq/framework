import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, it } from 'vitest';

const thisFile = fileURLToPath(import.meta.url);
const testDir = dirname(thisFile);
const packageRoot = resolve(testDir, '..');
const cliPath = resolve(packageRoot, 'src', 'cli.ts');
const tsxBin = resolve(packageRoot, 'node_modules', '.bin', 'tsx');

describe('cli doctor pre-checks', () => {
  const tmpPaths: string[] = [];

  afterEach(() => {
    for (const p of tmpPaths) {
      rmSync(p, { recursive: true, force: true });
    }
    tmpPaths.length = 0;
  });

  it('runs wrapper pre-checks on direct doctor command', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'lumis-doctor-check-'));
    tmpPaths.push(cwd);

    const result = spawnSync(tsxBin, [cliPath, 'doctor'], {
      encoding: 'utf8',
      timeout: 20_000,
      cwd,
    });

    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    expect(output).toContain('Health Pre-checks');
    expect(output).toContain('bootstrap/entry.ts present');
  });

  it('warns when routes.loader cache exists in both bootstrap and storage paths', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'lumis-doctor-duplicate-routes-loader-'));
    tmpPaths.push(cwd);

    mkdirSync(join(cwd, 'bootstrap', 'cache'), { recursive: true });
    writeFileSync(
      join(cwd, 'bootstrap', 'cache', 'routes.loader.ts'),
      '// bootstrap cache\n',
      'utf8',
    );

    mkdirSync(join(cwd, 'storage', 'framework', 'cache'), { recursive: true });
    writeFileSync(
      join(cwd, 'storage', 'framework', 'cache', 'routes.loader.ts'),
      '// storage cache\n',
      'utf8',
    );

    const result = spawnSync(tsxBin, [cliPath, 'doctor'], {
      encoding: 'utf8',
      timeout: 20_000,
      cwd,
    });

    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    expect(output).toContain('route loader cache path is canonical');
    expect(output).toContain('Duplicate route cache detected.');
  });
});
