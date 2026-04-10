import { describe, it, expect } from 'vitest';
import { planStaticBuild } from '../src/static/index.js';
const handler = async () => new Response('ok');
const routes = [
  {
    route: { path: '/', handler, render: 'static', revalidate: false },
    strategy: 'ssg',
    cacheControl: 'public, max-age=31536000, immutable',
    staleTime: Infinity,
  },
  {
    route: { path: '/blog/:slug', handler, render: 'static', revalidate: 86400 },
    strategy: 'isr',
    cacheControl: 'public, s-maxage=86400, stale-while-revalidate=432000',
    staleTime: 43200000,
  },
  {
    route: { path: '/dashboard', handler, render: 'dynamic' },
    strategy: 'dynamic',
    cacheControl: 'no-store',
    staleTime: 0,
  },
];
describe('planStaticBuild', () => {
  it('includes SSG routes in output files', () => {
    const result = planStaticBuild(routes, { siteUrl: 'https://example.com' });
    expect(result.files).toContain('/');
    expect(result.files).not.toContain('/blog/:slug');
    expect(result.files).not.toContain('/dashboard');
  });
  it('skips ISR routes with a warning', () => {
    const result = planStaticBuild(routes, { siteUrl: 'https://example.com' });
    const isrSkip = result.skipped.find((s) => s.path === '/blog/:slug');
    expect(isrSkip).toBeDefined();
    expect(isrSkip.reason).toMatch(/ISR/);
  });
  it('skips dynamic routes with a warning', () => {
    const result = planStaticBuild(routes, { siteUrl: 'https://example.com' });
    const dynSkip = result.skipped.find((s) => s.path === '/dashboard');
    expect(dynSkip).toBeDefined();
    expect(dynSkip.reason).toMatch(/Dynamic/);
  });
});
//# sourceMappingURL=static-build.test.js.map
