import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, it } from 'vitest';

const thisFile = fileURLToPath(import.meta.url);
const testDir = dirname(thisFile);
const packageRoot = resolve(testDir, '..');
const cliPath = resolve(packageRoot, 'src', 'cli.ts');

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

    const command = `cd "${cwd}" && pnpm --dir "${packageRoot}" exec tsx "${cliPath}" doctor`;
    const result = spawnSync('sh', ['-lc', command], {
      encoding: 'utf8',
      timeout: 20_000,
    });

    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    expect(output).toContain('Health Pre-checks');
    expect(output).toContain('bootstrap/entry.ts present');
  });
});
