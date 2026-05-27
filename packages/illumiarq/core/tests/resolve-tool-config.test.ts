import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

import { resolveToolConfigPath } from '../src/config/resolve-tool-config.js';

describe('resolveToolConfigPath', () => {
  let projectRoot = '';

  afterEach(() => {
    if (projectRoot && existsSync(projectRoot)) {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it('prefers pkg/vitest.config.ts over root vitest.config.ts', () => {
    projectRoot = join(tmpdir(), `lumiarq-tool-config-${Date.now()}`);
    mkdirSync(join(projectRoot, 'pkg'), { recursive: true });
    writeFileSync(join(projectRoot, 'vitest.config.ts'), 'export default {}\n', 'utf8');
    writeFileSync(join(projectRoot, 'pkg', 'vitest.config.ts'), 'export default {}\n', 'utf8');

    const resolved = resolveToolConfigPath(projectRoot, 'vitest');
    expect(resolved?.source).toBe('pkg-flat');
    expect(resolved?.path).toContain('pkg/vitest.config.ts');
  });

  it('falls back to legacy pkg/vitest/config.ts', () => {
    projectRoot = join(tmpdir(), `lumiarq-tool-config-${Date.now()}`);
    mkdirSync(join(projectRoot, 'pkg', 'vitest'), { recursive: true });
    writeFileSync(join(projectRoot, 'pkg', 'vitest', 'config.ts'), 'export default {}\n', 'utf8');

    const resolved = resolveToolConfigPath(projectRoot, 'vitest');
    expect(resolved?.source).toBe('pkg-legacy');
  });
});
