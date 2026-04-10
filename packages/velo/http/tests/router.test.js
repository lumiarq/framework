import { describe, it, expect, beforeEach } from 'vitest';
import {
  Route,
  clearRegisteredRoutes,
  getRegisteredRoutes,
  route,
  setAppUrl,
} from '../src/index.js';
describe('router', () => {
  beforeEach(() => {
    clearRegisteredRoutes();
    setAppUrl('https://example.test');
  });
  it('registers routes', () => {
    Route.get('/posts/:id', () => new Response('ok'), { render: 'dynamic', name: 'posts.show' });
    const routes = getRegisteredRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0]?.path).toBe('/posts/:id');
  });
  it('generates named route urls', () => {
    Route.get('/posts/:id', () => new Response('ok'), { render: 'dynamic', name: 'posts.show' });
    expect(route('posts.show', { id: 12 })).toBe('https://example.test/posts/12');
  });
});
//# sourceMappingURL=router.test.js.map
