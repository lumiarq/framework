import { describe, it, expect } from 'vitest';
import { generateShells } from '../src/shell-generator.js';
import { classifyRoute } from '../src/strategy-classifier.js';
import type { RouteDefinition } from '@illumiarq/http';

const handler = async () => new Response('ok');
const SHELL_HTML = '<html><body><div id="app"></div></body></html>';

const ssgRoute = (path: string): RouteDefinition => ({
  path,
  handler,
  render: 'static',
  revalidate: false,
});
const dynRoute = (path: string): RouteDefinition => ({ path, handler, render: 'dynamic' });

describe('generateShells', () => {
  it('returns empty array when no dynamic routes are present', () => {
    const classified = [classifyRoute(ssgRoute('/about'))];
    expect(generateShells(classified, SHELL_HTML)).toHaveLength(0);
  });

  it('generates a shell for a dynamic route', () => {
    const classified = [classifyRoute(dynRoute('/dashboard'))];
    const shells = generateShells(classified, SHELL_HTML);

    expect(shells).toHaveLength(1);
    expect(shells[0]!.path).toBe('/dashboard');
    expect(shells[0]!.html).toBe(SHELL_HTML);
    expect(shells[0]!.outFile).toBe('dashboard/index.html');
  });

  it('generates a shell for the root "/" dynamic route', () => {
    const classified = [classifyRoute(dynRoute('/'))];
    const shells = generateShells(classified, SHELL_HTML);

    expect(shells[0]!.outFile).toBe('index.html');
  });

  it('skips SSG and ISR routes — only dynamic routes get a shell', () => {
    const classified = [
      classifyRoute(ssgRoute('/about')),
      classifyRoute(dynRoute('/dashboard')),
      classifyRoute({ path: '/prices', handler, render: 'static', revalidate: 60 }),
    ];
    const shells = generateShells(classified, SHELL_HTML);

    expect(shells).toHaveLength(1);
    expect(shells[0]!.path).toBe('/dashboard');
  });

  it('generates shells for multiple dynamic routes', () => {
    const classified = [classifyRoute(dynRoute('/app')), classifyRoute(dynRoute('/settings'))];
    const shells = generateShells(classified, SHELL_HTML);

    expect(shells).toHaveLength(2);
    expect(shells.map((s) => s.path)).toEqual(['/app', '/settings']);
  });

  it('each shell uses the provided appShellHtml verbatim', () => {
    const customShell = '<html><head><title>App</title></head><body></body></html>';
    const classified = [classifyRoute(dynRoute('/dashboard'))];
    const shells = generateShells(classified, customShell);

    expect(shells[0]!.html).toBe(customShell);
  });
});
