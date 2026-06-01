import { describe, it, expect } from 'vitest';
import { createCloudflareAdapter } from '../src/cloudflare/index.js';
import { Hono } from 'hono';
import type { LumiARQApp } from '@illumiarq/runtime';

function createApp(): LumiARQApp {
  return {
    router: new Hono(),
    modules: new Map(),
    scheduler: {
      // Minimal stub that satisfies the current SchedulerContract shape.
      call: () => {},
      jobs: () => [],
      due: () => [],
    },
  };
}

describe('createCloudflareAdapter', () => {
  it('returns an object with a fetch property', () => {
    const app = createApp();
    const adapter = createCloudflareAdapter(app);
    expect(adapter).toHaveProperty('fetch');
  });

  it('the fetch property is a function', () => {
    const app = createApp();
    const adapter = createCloudflareAdapter(app);
    expect(typeof adapter.fetch).toBe('function');
  });

  it('the fetch function handles a GET request and returns a Response', async () => {
    const app = createApp();
    app.router.get('/', (c) => c.text('hello from cloudflare'));

    const adapter = createCloudflareAdapter(app);
    const response = await adapter.fetch(new Request('http://localhost/'));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hello from cloudflare');
  });

  it('returns distinct adapter objects for distinct app instances', () => {
    const app1 = createApp();
    const app2 = createApp();
    const a1 = createCloudflareAdapter(app1);
    const a2 = createCloudflareAdapter(app2);
    expect(a1).not.toBe(a2);
  });

  it("each adapter's fetch is bound to its specific app instance", async () => {
    const app1 = createApp();
    const app2 = createApp();
    app1.router.get('/', (c) => c.text('app1'));
    app2.router.get('/', (c) => c.text('app2'));

    const a1 = createCloudflareAdapter(app1);
    const a2 = createCloudflareAdapter(app2);

    const r1 = await a1.fetch(new Request('http://localhost/'));
    const r2 = await a2.fetch(new Request('http://localhost/'));

    expect(await r1.text()).toBe('app1');
    expect(await r2.text()).toBe('app2');
  });
});
