import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, it } from 'vitest';

import {
  cacheRoutes,
  clearRouteCache,
  makeLayout,
  makePage,
} from '../../src/commands/app/routes.js';

describe('routes command tooling', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'lumis-routes-test-'));
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('writes loader and manifest with collision diagnostics', () => {
    mkdirSync(join(cwd, 'src', 'modules', 'Docs', 'http', 'routes'), { recursive: true });
    writeFileSync(
      join(cwd, 'src', 'modules', 'Docs', 'http', 'routes', 'index.web.ts'),
      'export {};\n',
      'utf8',
    );
    mkdirSync(join(cwd, 'src', 'app', 'docs'), { recursive: true });
    writeFileSync(
      join(cwd, 'src', 'app', 'docs', 'page.ts'),
      "export default { async render() { return { html: '<h1>Docs</h1>', payload: { initialData: null, pageVersion: 'test' }, status: 200 }; } };\n",
      'utf8',
    );

    const status = cacheRoutes(cwd);
    expect(status).toBe(0);

    const loaderPath = join(cwd, 'src', 'storage', 'framework', 'cache', 'routes.loader.ts');
    const manifestPath = join(cwd, 'src', 'storage', 'framework', 'cache', 'routes.manifest.json');
    expect(existsSync(loaderPath)).toBe(true);
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      routes: Array<{ method: string; source: string; path: string }>;
      diagnostics: { collisions: Array<{ key: string }> };
    };
    expect(
      manifest.routes.some((entry) => entry.path === '/docs' && entry.source === 'filesystem'),
    ).toBe(true);
    expect(Array.isArray(manifest.diagnostics.collisions)).toBe(true);
  });

  it('creates page and layout scaffolds', () => {
    expect(makePage('/reports/monthly', cwd)).toBe(0);
    expect(makeLayout('/reports', cwd)).toBe(0);

    const pagePath = join(cwd, 'src', 'app', 'reports', 'monthly', 'page.ts');
    const layoutPath = join(cwd, 'src', 'app', 'reports', 'layout.ts');
    expect(existsSync(pagePath)).toBe(true);
    expect(existsSync(layoutPath)).toBe(true);
  });

  it('clears route cache artifacts', () => {
    mkdirSync(join(cwd, 'src', 'modules', 'Health', 'http', 'routes'), { recursive: true });
    writeFileSync(
      join(cwd, 'src', 'modules', 'Health', 'http', 'routes', 'index.web.ts'),
      'export {};\n',
      'utf8',
    );

    expect(cacheRoutes(cwd)).toBe(0);
    expect(clearRouteCache(cwd)).toBe(0);
    expect(existsSync(join(cwd, 'src', 'storage', 'framework', 'cache', 'routes.loader.ts'))).toBe(
      false,
    );
    expect(
      existsSync(join(cwd, 'src', 'storage', 'framework', 'cache', 'routes.manifest.json')),
    ).toBe(false);
  });
});
