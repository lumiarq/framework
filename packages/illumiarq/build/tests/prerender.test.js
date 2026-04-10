import { describe, it, expect, vi } from 'vitest';
import { prerenderRoutes, routePathToOutFile } from '../src/prerender.js';
import { classifyRoute } from '../src/strategy-classifier.js';
import { StaticBuildError } from '@illumiarqcore';
const handler = async () => new Response('ok');
// Helpers to create classified routes
const ssgRoute = (path) => ({
  path,
  handler,
  render: 'static',
  revalidate: false,
});
const isrRoute = (path, revalidate) => ({
  path,
  handler,
  render: 'static',
  revalidate,
});
const dynamicRoute = (path) => ({ path, handler, render: 'dynamic' });
// ─── routePathToOutFile ───────────────────────────────────────────────────────
describe('routePathToOutFile', () => {
  it('maps "/" to "index.html"', () => {
    expect(routePathToOutFile('/')).toBe('index.html');
  });
  it('maps "/about" to "about/index.html"', () => {
    expect(routePathToOutFile('/about')).toBe('about/index.html');
  });
  it('maps nested path to nested directory', () => {
    expect(routePathToOutFile('/blog/my-post')).toBe('blog/my-post/index.html');
  });
});
// ─── prerenderRoutes ──────────────────────────────────────────────────────────
describe('prerenderRoutes — SSG routes', () => {
  it('renders an SSG route and returns HTML + outFile', async () => {
    const classified = [classifyRoute(ssgRoute('/about'))];
    const renderer = vi.fn().mockResolvedValue('<html>about</html>');
    const results = await prerenderRoutes(classified, renderer);
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('/about');
    expect(results[0].html).toBe('<html>about</html>');
    expect(results[0].outFile).toBe('about/index.html');
    expect(renderer).toHaveBeenCalledOnce();
  });
  it('renders the root "/" SSG route to "index.html"', async () => {
    const classified = [classifyRoute(ssgRoute('/'))];
    const renderer = vi.fn().mockResolvedValue('<html>home</html>');
    const results = await prerenderRoutes(classified, renderer);
    expect(results[0].outFile).toBe('index.html');
  });
  it('skips dynamic routes — does not call renderer', async () => {
    const classified = [classifyRoute(dynamicRoute('/dashboard'))];
    const renderer = vi.fn().mockResolvedValue('<html>dashboard</html>');
    const results = await prerenderRoutes(classified, renderer);
    expect(results).toHaveLength(0);
    expect(renderer).not.toHaveBeenCalled();
  });
  it('processes multiple SSG routes', async () => {
    const classified = [
      classifyRoute(ssgRoute('/')),
      classifyRoute(ssgRoute('/about')),
      classifyRoute(ssgRoute('/blog')),
    ];
    const renderer = vi.fn().mockImplementation((r) => `<html>${r.route.path}</html>`);
    const results = await prerenderRoutes(classified, renderer);
    expect(results).toHaveLength(3);
    expect(renderer).toHaveBeenCalledTimes(3);
  });
});
describe('prerenderRoutes — ISR fallback', () => {
  it('falls back ISR to SSG with a console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const classified = [classifyRoute(isrRoute('/prices', 60))];
    const renderer = vi.fn().mockResolvedValue('<html>prices</html>');
    const results = await prerenderRoutes(classified, renderer);
    expect(results).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain('ISR');
    expect(warnSpy.mock.calls[0][0]).toContain('SSG');
    warnSpy.mockRestore();
  });
});
describe('prerenderRoutes — error handling', () => {
  it('throws StaticBuildError when renderer throws', async () => {
    const classified = [classifyRoute(ssgRoute('/crash'))];
    const renderer = vi.fn().mockRejectedValue(new Error('render exploded'));
    await expect(prerenderRoutes(classified, renderer)).rejects.toThrow(StaticBuildError);
  });
  it('StaticBuildError message contains the failing route path', async () => {
    const classified = [classifyRoute(ssgRoute('/crash'))];
    const renderer = vi.fn().mockRejectedValue(new Error('render exploded'));
    try {
      await prerenderRoutes(classified, renderer);
    } catch (err) {
      expect(err.message).toContain('/crash');
    }
  });
});
//# sourceMappingURL=prerender.test.js.map
