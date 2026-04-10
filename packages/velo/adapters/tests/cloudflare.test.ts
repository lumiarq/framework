import { describe, it, expect } from 'vitest';
import { buildCloudflareAdapter } from '../src/cloudflare/index.js';
import { Hono } from 'hono';

describe('buildCloudflareAdapter', () => {
  it('returns an object with a fetch property', () => {
    const app = new Hono();
    const adapter = buildCloudflareAdapter(app);
    expect(adapter).toHaveProperty('fetch');
  });

  it('the fetch property is a function', () => {
    const app = new Hono();
    const adapter = buildCloudflareAdapter(app);
    expect(typeof adapter.fetch).toBe('function');
  });

  it('the fetch function handles a GET request and returns a Response', async () => {
    const app = new Hono();
    app.get('/', (c) => c.text('hello from cloudflare'));

    const adapter = buildCloudflareAdapter(app);
    const response = await adapter.fetch(new Request('http://localhost/'));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hello from cloudflare');
  });

  it('returns distinct adapter objects for distinct app instances', () => {
    const app1 = new Hono();
    const app2 = new Hono();
    const a1 = buildCloudflareAdapter(app1);
    const a2 = buildCloudflareAdapter(app2);
    expect(a1).not.toBe(a2);
  });

  it("each adapter's fetch is bound to its specific app instance", async () => {
    const app1 = new Hono().get('/', (c) => c.text('app1'));
    const app2 = new Hono().get('/', (c) => c.text('app2'));

    const a1 = buildCloudflareAdapter(app1);
    const a2 = buildCloudflareAdapter(app2);

    const r1 = await a1.fetch(new Request('http://localhost/'));
    const r2 = await a2.fetch(new Request('http://localhost/'));

    expect(await r1.text()).toBe('app1');
    expect(await r2.text()).toBe('app2');
  });
});
