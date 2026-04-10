import { describe, it, expect } from 'vitest';
import { scanRouteModules } from '../src/route-scanner.js';
import type { ModuleRecord } from '../src/route-scanner.js';

const handler = async () => new Response('ok');

describe('scanRouteModules — discovery', () => {
  it('returns empty array when no modules are provided', () => {
    expect(scanRouteModules([])).toEqual([]);
  });

  it('discovers a valid static RouteDefinition from a module', () => {
    const modules: ModuleRecord[] = [
      {
        filePath: '/routes/about.ts',
        exports: {
          route: { path: '/about', handler, render: 'static', revalidate: false },
        },
      },
    ];
    const found = scanRouteModules(modules);
    expect(found).toHaveLength(1);
    expect(found[0]!.definition.path).toBe('/about');
    expect(found[0]!.filePath).toBe('/routes/about.ts');
  });

  it('discovers a valid dynamic RouteDefinition from a module', () => {
    const modules: ModuleRecord[] = [
      {
        filePath: '/routes/dashboard.ts',
        exports: { route: { path: '/dashboard', handler, render: 'dynamic' } },
      },
    ];
    const found = scanRouteModules(modules);
    expect(found).toHaveLength(1);
    expect(found[0]!.definition.path).toBe('/dashboard');
  });

  it('skips modules where no export is a RouteDefinition', () => {
    const modules: ModuleRecord[] = [
      { filePath: '/routes/util.ts', exports: { helper: () => 'utility' } },
    ];
    expect(scanRouteModules(modules)).toHaveLength(0);
  });

  it('collects only one route per file (the first matching export)', () => {
    const modules: ModuleRecord[] = [
      {
        filePath: '/routes/multi.ts',
        exports: {
          routeA: { path: '/a', handler, render: 'static', revalidate: false },
          routeB: { path: '/b', handler, render: 'dynamic' },
        },
      },
    ];
    const found = scanRouteModules(modules);
    expect(found).toHaveLength(1);
  });

  it('collects routes from multiple files', () => {
    const modules: ModuleRecord[] = [
      {
        filePath: '/routes/home.ts',
        exports: { route: { path: '/', handler, render: 'static', revalidate: false } },
      },
      {
        filePath: '/routes/blog.ts',
        exports: { route: { path: '/blog', handler, render: 'dynamic' } },
      },
    ];
    const found = scanRouteModules(modules);
    expect(found).toHaveLength(2);
    expect(found.map((f) => f.definition.path)).toEqual(['/', '/blog']);
  });

  it('rejects an export missing the handler function', () => {
    const modules: ModuleRecord[] = [
      { filePath: '/routes/broken.ts', exports: { route: { path: '/broken', render: 'dynamic' } } },
    ];
    expect(scanRouteModules(modules)).toHaveLength(0);
  });

  it('rejects an export missing the path field', () => {
    const modules: ModuleRecord[] = [
      { filePath: '/routes/broken.ts', exports: { route: { handler, render: 'static' } } },
    ];
    expect(scanRouteModules(modules)).toHaveLength(0);
  });

  it('rejects an export with an invalid render value', () => {
    const modules: ModuleRecord[] = [
      {
        filePath: '/routes/broken.ts',
        exports: { route: { path: '/x', handler, render: 'unknown' } },
      },
    ];
    expect(scanRouteModules(modules)).toHaveLength(0);
  });
});
