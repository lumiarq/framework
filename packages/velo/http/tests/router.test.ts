import { describe, it, expect, beforeEach } from 'vitest';
import {
  Route,
  clearRegisteredRoutes,
  getRegisteredRoutes,
  route,
  setAppUrl,
} from '../src/index.js';

const h = () => new Response('ok');

describe('router', () => {
  beforeEach(() => {
    clearRegisteredRoutes();
    setAppUrl('https://example.test');
  });

  it('registers routes', () => {
    Route.get('/posts/:id', h, { render: 'dynamic', name: 'posts.show' });

    const routes = getRegisteredRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0]?.path).toBe('/posts/:id');
  });

  it('generates named route urls', () => {
    Route.get('/posts/:id', h, { render: 'dynamic', name: 'posts.show' });
    expect(route('posts.show', { id: 12 })).toBe('https://example.test/posts/12');
  });
});

describe('Route.group()', () => {
  beforeEach(() => clearRegisteredRoutes());

  it('prepends prefix to all routes in the group', () => {
    Route.group({ prefix: '/api/v1' }, () => {
      Route.get('/users', h, { name: 'v1.users.index' });
    });
    const routes = getRegisteredRoutes();
    expect(routes[0]?.path).toBe('/api/v1/users');
  });

  it('attaches version to all routes in the group', () => {
    Route.group({ prefix: '/api/v1', version: 1 }, () => {
      Route.get('/users', h, { name: 'v1.users.index' });
    });
    expect(getRegisteredRoutes()[0]?.version).toBe(1);
  });

  it('merges group middleware with route middleware (outer → inner)', () => {
    Route.group({ prefix: '/api', middleware: ['throttle'] }, () => {
      Route.group({ prefix: '/v1', version: 1 }, () => {
        Route.get('/posts', h, { name: 'v1.posts.index', middleware: ['auth'] });
      });
    });
    const routes = getRegisteredRoutes();
    expect(routes[0]?.path).toBe('/api/v1/posts');
    expect(routes[0]?.middleware).toEqual(['throttle', 'auth']);
    expect(routes[0]?.version).toBe(1);
  });

  it('propagates deprecated and sunset to all routes', () => {
    Route.group({ prefix: '/api/v1', deprecated: true, sunset: '2026-12-31' }, () => {
      Route.get('/old', h, { name: 'v1.old' });
    });
    const r = getRegisteredRoutes()[0];
    expect(r?.deprecated).toBe(true);
    expect(r?.sunset).toBe('2026-12-31');
  });

  it('does not leak group context after the callback', () => {
    Route.group({ prefix: '/scoped' }, () => {
      Route.get('/inside', h, { name: 'scoped.inside' });
    });
    Route.get('/outside', h, { name: 'outside' });
    const routes = getRegisteredRoutes();
    expect(routes[1]?.path).toBe('/outside');
  });
});

describe('Route.resource()', () => {
  const handlers = { index: h, create: h, store: h, show: h, edit: h, update: h, destroy: h };

  beforeEach(() => clearRegisteredRoutes());

  it('generates all 7 CRUD routes', () => {
    Route.resource('/photos', handlers);
    expect(getRegisteredRoutes()).toHaveLength(7);
  });

  it('generates correct paths and names', () => {
    Route.resource('/photos', handlers);
    const routes = getRegisteredRoutes();
    const map = Object.fromEntries(routes.map((r) => [r.name, `${r.method} ${r.path}`]));
    expect(map['photos.index']).toBe('GET /photos');
    expect(map['photos.create']).toBe('GET /photos/create');
    expect(map['photos.store']).toBe('POST /photos');
    expect(map['photos.show']).toBe('GET /photos/:id');
    expect(map['photos.edit']).toBe('GET /photos/:id/edit');
    expect(map['photos.update']).toBe('PUT /photos/:id');
    expect(map['photos.destroy']).toBe('DELETE /photos/:id');
  });

  it('respects only option', () => {
    Route.resource('/photos', handlers, { only: ['index', 'show'] });
    expect(getRegisteredRoutes()).toHaveLength(2);
  });

  it('respects except option', () => {
    Route.resource('/photos', handlers, { except: ['destroy'] });
    expect(getRegisteredRoutes()).toHaveLength(6);
  });

  it('allows custom names', () => {
    Route.resource('/photos', handlers, { names: { index: 'gallery.list' } });
    const names = getRegisteredRoutes().map((r) => r.name);
    expect(names).toContain('gallery.list');
  });

  it('works inside a Route.group()', () => {
    Route.group({ prefix: '/api/v1', version: 1 }, () => {
      Route.resource('/photos', handlers);
    });
    const routes = getRegisteredRoutes();
    expect(routes[0]?.path).toBe('/api/v1/photos');
    expect(routes[0]?.version).toBe(1);
    expect(routes).toHaveLength(7);
  });
});

describe('Route.apiResource()', () => {
  const handlers = { index: h, create: h, store: h, show: h, edit: h, update: h, destroy: h };

  beforeEach(() => clearRegisteredRoutes());

  it('generates 5 API routes (no create/edit)', () => {
    Route.apiResource('/photos', handlers);
    const routes = getRegisteredRoutes();
    expect(routes).toHaveLength(5);
    expect(routes.every((r) => !r.name?.endsWith('.create') && !r.name?.endsWith('.edit'))).toBe(true);
  });

  it('generates correct paths and names', () => {
    Route.apiResource('/photos', handlers);
    const map = Object.fromEntries(getRegisteredRoutes().map((r) => [r.name, `${r.method} ${r.path}`]));
    expect(map['photos.index']).toBe('GET /photos');
    expect(map['photos.store']).toBe('POST /photos');
    expect(map['photos.show']).toBe('GET /photos/:id');
    expect(map['photos.update']).toBe('PUT /photos/:id');
    expect(map['photos.destroy']).toBe('DELETE /photos/:id');
  });
});
