import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'vitest';

import { readProjectLayout } from '../../src/commands/info.js';

describe('project layout summary', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'lumis-layout-test-'));
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('detects the canonical framework scaffold folders and root configs', () => {
    mkdirSync(join(cwd, 'bootstrap'), { recursive: true });
    mkdirSync(join(cwd, 'src', 'config'), { recursive: true });
    mkdirSync(join(cwd, 'entry'), { recursive: true });
    mkdirSync(join(cwd, 'src', 'modules'), { recursive: true });

    writeFileSync(join(cwd, 'tsconfig.json'), '{}\n', 'utf8');
    writeFileSync(join(cwd, 'eslint.config.mjs'), 'export default []\n', 'utf8');
    writeFileSync(join(cwd, 'README.md'), '# app\n', 'utf8');

    const layout = readProjectLayout(cwd);

    expect(layout.bootstrap).toBe(true);
    expect(layout.config).toBe(true);
    expect(layout.entry).toBe(true);
    expect(layout.modules).toBe(true);
    expect(layout.rootConfigs).toEqual(['eslint.config.mjs', 'tsconfig.json']);
  });
});
