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

function runDoctor(cwd: string): string {
  const result = spawnSync(tsxBin, [cliPath, 'doctor'], {
    encoding: 'utf8',
    timeout: 20_000,
    cwd,
  });

  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

function runHealth(cwd: string): string {
  const result = spawnSync(tsxBin, [cliPath, 'health'], {
    encoding: 'utf8',
    timeout: 20_000,
    cwd,
  });

  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

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

    const output = runDoctor(cwd);
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

    const output = runDoctor(cwd);
    expect(output).toContain('route loader cache path is canonical');
    expect(output).toContain('Duplicate route cache detected.');
  });

  it('uses configured storage root in duplicate route cache warning text', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'lumis-doctor-custom-storage-root-'));
    tmpPaths.push(cwd);

    writeFileSync(
      join(cwd, 'lumis.config.json'),
      JSON.stringify({ paths: { storage: 'src/storage' } }, null, 2),
      'utf8',
    );

    mkdirSync(join(cwd, 'bootstrap', 'cache'), { recursive: true });
    writeFileSync(
      join(cwd, 'bootstrap', 'cache', 'routes.loader.ts'),
      '// bootstrap cache\n',
      'utf8',
    );

    mkdirSync(join(cwd, 'src', 'storage', 'framework', 'cache'), { recursive: true });
    writeFileSync(
      join(cwd, 'src', 'storage', 'framework', 'cache', 'routes.loader.ts'),
      '// storage cache\n',
      'utf8',
    );

    const output = runDoctor(cwd);
    expect(output).toContain('Duplicate route cache detected.');
    expect(output).toContain('Keep only src/storage/framework/cache/routes.loader.ts');
  });

  it('does not warn for duplicate route loader when only canonical storage path exists', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'lumis-doctor-canonical-routes-loader-'));
    tmpPaths.push(cwd);

    mkdirSync(join(cwd, 'storage', 'framework', 'cache'), { recursive: true });
    writeFileSync(
      join(cwd, 'storage', 'framework', 'cache', 'routes.loader.ts'),
      '// storage cache\n',
      'utf8',
    );

    const output = runDoctor(cwd);
    expect(output).not.toContain('route loader cache path is canonical');
    expect(output).not.toContain('Duplicate route cache detected.');
  });

  it('emits both duplicate-path and stale-route warnings when both conditions are true', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'lumis-doctor-duplicate-and-stale-'));
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

    // Make route files newer than the cached loader to trigger stale-route warning.
    mkdirSync(join(cwd, 'src', 'modules', 'Docs', 'http', 'routes'), { recursive: true });
    writeFileSync(
      join(cwd, 'src', 'modules', 'Docs', 'http', 'routes', 'docs.web.ts'),
      'export {}\n',
      'utf8',
    );

    const output = runDoctor(cwd);
    expect(output).toContain('route loader cache path is canonical');
    expect(output).toContain('Duplicate route cache detected.');
    expect(output).toContain('route cache is fresh');
    expect(output).toContain('Route files have changed since last cache. Run: lumis route:cache');
  });

  it('health alias surfaces duplicate route-cache warning just like doctor', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'lumis-health-alias-parity-'));
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

    const output = runHealth(cwd);
    expect(output).toContain('Health Pre-checks');
    expect(output).toContain('route loader cache path is canonical');
    expect(output).toContain('Duplicate route cache detected.');
  });

  it('health alias uses configured storage root in duplicate warning text', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'lumis-health-custom-storage-root-'));
    tmpPaths.push(cwd);

    writeFileSync(
      join(cwd, 'lumis.config.json'),
      JSON.stringify({ paths: { storage: 'src/storage' } }, null, 2),
      'utf8',
    );

    mkdirSync(join(cwd, 'bootstrap', 'cache'), { recursive: true });
    writeFileSync(
      join(cwd, 'bootstrap', 'cache', 'routes.loader.ts'),
      '// bootstrap cache\n',
      'utf8',
    );

    mkdirSync(join(cwd, 'src', 'storage', 'framework', 'cache'), { recursive: true });
    writeFileSync(
      join(cwd, 'src', 'storage', 'framework', 'cache', 'routes.loader.ts'),
      '// storage cache\n',
      'utf8',
    );

    const output = runHealth(cwd);
    expect(output).toContain('Duplicate route cache detected.');
    expect(output).toContain('Keep only src/storage/framework/cache/routes.loader.ts');
  });
});
