import { describe, it, expect } from 'vitest';
import { classifyRoute } from '../src/strategy-classifier.js';
const handler = async () => new Response('ok');
describe('classifyRoute — dynamic', () => {
  it('emits no-store Cache-Control and staleTime 0', () => {
    const r = { path: '/dashboard', handler, render: 'dynamic' };
    const c = classifyRoute(r);
    expect(c.strategy).toBe('dynamic');
    expect(c.cacheControl).toBe('no-store');
    expect(c.staleTime).toBe(0);
  });
});
describe('classifyRoute — SSG (static + revalidate:false)', () => {
  it('emits immutable Cache-Control and Infinity staleTime', () => {
    const r = { path: '/', handler, render: 'static', revalidate: false };
    const c = classifyRoute(r);
    expect(c.strategy).toBe('ssg');
    expect(c.cacheControl).toBe('public, max-age=31536000, immutable');
    expect(c.staleTime).toBe(Infinity);
  });
});
describe('classifyRoute — ISR (static + revalidate:N)', () => {
  it('emits s-maxage and stale-while-revalidate headers', () => {
    const r = {
      path: '/blog/:slug',
      handler,
      render: 'static',
      revalidate: 86400,
    };
    const c = classifyRoute(r);
    expect(c.strategy).toBe('isr');
    expect(c.cacheControl).toBe('public, s-maxage=86400, stale-while-revalidate=432000');
    expect(c.staleTime).toBe(43200000);
  });
  it('scales correctly for small revalidate values', () => {
    const r = { path: '/prices', handler, render: 'static', revalidate: 60 };
    const c = classifyRoute(r);
    expect(c.cacheControl).toBe('public, s-maxage=60, stale-while-revalidate=300');
    expect(c.staleTime).toBe(30000);
  });
});
//# sourceMappingURL=strategy-classifier.test.js.map
