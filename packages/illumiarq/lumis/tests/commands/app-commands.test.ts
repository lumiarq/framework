import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

vi.mock('@illumiarq/veil', () => ({
  viewCache: vi.fn(async () => ({ compiled: 0, paths: [] })),
  viewClear: vi.fn(async (cwd: string) => ({
    cleared: true,
    dir: join(cwd, 'storage', 'framework', 'cache', 'views'),
  })),
}));

vi.mock('@illumiarq/search', () => ({
  buildSearchIndex: vi.fn(() => ({ entries: [] })),
}));

import { spawnSync } from 'node:child_process';
import {
  cacheConfig,
  clearOptimizationCaches,
  optimizeForProduction,
  pingDatabaseConnection,
} from '../../src/commands/app-commands.js';
import { resolvePathWithinRoot } from '../../src/commands/app/security.js';

describe('app command extensions', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'lumis-wrapper-test-'));
    vi.mocked(spawnSync).mockReset();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('caches resolved config into bootstrap cache', () => {
    mkdirSync(join(cwd, 'src', 'config'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'config', 'app.ts'), 'export default {}\n', 'utf8');
    writeFileSync(join(cwd, 'src', 'config', 'database.ts'), 'export default {}\n', 'utf8');

    vi.mocked(spawnSync).mockImplementation((_cmd, args) => {
      const argv = args as string[];
      const command = argv[3];
      const configName = argv[5];
      if (command === 'config:show' && configName) {
        return {
          status: 0,
          stdout: JSON.stringify({ config: { name: configName, ok: true } }),
          stderr: '',
        } as never;
      }
      return { status: 1, stdout: '', stderr: 'unexpected invocation' } as never;
    });

    const status = cacheConfig(cwd);
    expect(status).toBe(0);

    const cachePath = join(cwd, 'bootstrap', 'cache', 'config.cache.json');
    expect(existsSync(cachePath)).toBe(true);

    const cached = JSON.parse(readFileSync(cachePath, 'utf8')) as {
      generatedAt: string;
      configs: Record<string, unknown>;
    };

    expect(cached.generatedAt).toBeTypeOf('string');
    expect(cached.configs.app).toEqual({ name: 'app', ok: true });
    expect(cached.configs.database).toEqual({ name: 'database', ok: true });
  });

  it('returns diagnosis failure for incomplete postgres config during db ping', async () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 0,
      stdout: JSON.stringify({
        config: {
          default: 'postgres',
          connections: {
            postgres: {
              driver: 'postgres',
              host: '',
              port: 5432,
              database: '',
              username: '',
            },
          },
        },
      }),
      stderr: '',
    } as never);

    const status = await pingDatabaseConnection(cwd);
    expect(status).toBe(1);
  });

  it('passes sqlite db ping for writable sqlite file url', async () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 0,
      stdout: JSON.stringify({
        config: {
          default: 'sqlite',
          connections: {
            sqlite: {
              driver: 'sqlite',
              url: 'file:./storage/test.sqlite',
            },
          },
        },
      }),
      stderr: '',
    } as never);

    const status = await pingDatabaseConnection(cwd);
    expect(status).toBe(0);
    expect(existsSync(join(cwd, 'storage', 'test.sqlite'))).toBe(true);
  });

  it('optimize builds caches including config cache and clear removes artifacts', async () => {
    mkdirSync(join(cwd, 'src', 'config'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'config', 'app.ts'), 'export default {}\n', 'utf8');

    mkdirSync(join(cwd, 'src', 'modules', 'Docs', 'http', 'routes'), { recursive: true });
    writeFileSync(
      join(cwd, 'src', 'modules', 'Docs', 'http', 'routes', 'docs.web.ts'),
      'export {}\n',
      'utf8',
    );

    mkdirSync(join(cwd, 'content', 'docs'), { recursive: true });
    writeFileSync(
      join(cwd, 'content', 'docs', 'index.md'),
      [
        '---',
        'title: Home',
        'section: Intro',
        'order: 1',
        'draft: false',
        '---',
        '',
        '# Home',
      ].join('\n'),
      'utf8',
    );

    vi.mocked(spawnSync).mockImplementation((_cmd, args) => {
      const argv = args as string[];
      const command = argv[3];
      if (command === 'config:show') {
        const configName = argv[5];
        return {
          status: 0,
          stdout: JSON.stringify({ config: { name: configName } }),
          stderr: '',
        } as never;
      }
      return { status: 1, stdout: '', stderr: 'unexpected invocation' } as never;
    });

    const optimizeStatus = await optimizeForProduction(cwd);
    expect(optimizeStatus).toBe(0);
    expect(existsSync(join(cwd, 'bootstrap', 'cache', 'config.cache.json'))).toBe(true);
    expect(existsSync(join(cwd, 'src', 'storage', 'framework', 'cache', 'routes.loader.ts'))).toBe(
      true,
    );
    expect(existsSync(join(cwd, 'src', 'storage', 'framework', 'cache', 'search.index.json'))).toBe(
      true,
    );

    const clearStatus = await clearOptimizationCaches(cwd);
    expect(clearStatus).toBe(0);
    expect(existsSync(join(cwd, 'bootstrap', 'cache', 'config.cache.json'))).toBe(false);
    expect(existsSync(join(cwd, 'src', 'storage', 'framework', 'cache', 'routes.loader.ts'))).toBe(
      false,
    );
    expect(existsSync(join(cwd, 'src', 'storage', 'framework', 'cache', 'search.index.json'))).toBe(
      false,
    );
  });

  it('rejects path traversal outside project root', () => {
    expect(() => resolvePathWithinRoot(cwd, '../outside.txt')).toThrowError(
      /Refusing to write outside project root/,
    );

    const inside = resolvePathWithinRoot(cwd, 'lang/en.json');
    expect(inside.startsWith(cwd)).toBe(true);
  });
});
