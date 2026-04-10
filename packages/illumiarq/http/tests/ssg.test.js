import { describe, it, expect, beforeEach } from 'vitest';
import { Route, clearRegisteredRoutes, prerenderRoutes } from '../src/index.js';
describe('ssg', () => {
  beforeEach(() => clearRegisteredRoutes());
  it('collects prerender paths', async () => {
    Route.get('/blog/:slug', () => new Response('ok'), {
      render: 'static',
      async generateParams() {
        return [{ slug: 'first' }, { slug: 'second' }];
      },
    });
    const entries = await prerenderRoutes();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.paths).toEqual(['/blog/first', '/blog/second']);
  });
});
//# sourceMappingURL=ssg.test.js.map
