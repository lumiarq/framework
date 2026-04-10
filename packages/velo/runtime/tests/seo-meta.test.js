import { describe, it, expect, vi } from 'vitest';
import { orchestrateLoaders, createRequestCache } from '../src/loader-orchestrator.js';
import { defineRoute } from '@velo/http';
// ─── Helpers ─────────────────────────────────────────────────────────────────
const h = async () => new Response('ok');
function makeLoader(id, fetchFn, dependsOn = []) {
  return { id, fetch: fetchFn, dependsOn };
}
// ─── Meta execution order ─────────────────────────────────────────────────────
describe('meta() execution order — Loaders → meta() → render → Cache-Control', () => {
  it('meta() receives fully-resolved loaderData', async () => {
    const route = defineRoute({
      path: '/products/1',
      handler: h,
      render: 'static',
      revalidate: false,
      meta: async ({ loaderData }) => {
        const product = loaderData['product'];
        return { title: `${product.name} — Store`, description: `$${product.price}` };
      },
    });
    // Step 1: Loaders run first
    const loaderData = Object.fromEntries(
      await orchestrateLoaders(
        [makeLoader('product', async () => ({ name: 'Widget', price: 9.99 }))],
        {},
        createRequestCache(),
      ),
    );
    // Step 2: meta() receives the resolved loaderData
    const meta = await route.meta({ params: { id: '1' }, loaderData });
    expect(meta.title).toBe('Widget — Store');
    expect(meta.description).toBe('$9.99');
  });
  it('execution order is Loaders first, meta second, render third', async () => {
    const callOrder = [];
    const loader = makeLoader('page', async () => {
      callOrder.push('loader');
      return { title: 'Home Page' };
    });
    const route = defineRoute({
      path: '/',
      handler: h,
      render: 'static',
      revalidate: false,
      meta: async ({ loaderData }) => {
        callOrder.push('meta');
        const page = loaderData['page'];
        return { title: page.title };
      },
    });
    // ── Loaders phase ────────────────────────────────
    const loaderData = Object.fromEntries(
      await orchestrateLoaders([loader], {}, createRequestCache()),
    );
    callOrder.push('loaders-settled');
    // ── Meta phase ───────────────────────────────────
    const meta = await route.meta({ params: {}, loaderData });
    callOrder.push('meta-settled');
    // ── Render phase (simulated) ─────────────────────
    const render = vi.fn().mockResolvedValue('<html>Home Page</html>');
    await render(meta);
    callOrder.push('render');
    expect(callOrder).toEqual(['loader', 'loaders-settled', 'meta', 'meta-settled', 'render']);
  });
  it('meta() cannot access loaderData before loaders resolve', async () => {
    // The type system and async sequencing guarantee this:
    // meta() takes `{ loaderData }` which is the RESOLVED output of orchestrateLoaders.
    // This test shows the contract holds when loaders have async delay.
    let loaderFinished = false;
    const slowLoader = makeLoader('slow', async () => {
      await new Promise((r) => setTimeout(r, 20));
      loaderFinished = true;
      return { value: 42 };
    });
    const route = defineRoute({
      path: '/slow',
      handler: h,
      render: 'static',
      revalidate: false,
      meta: async ({ loaderData }) => {
        // By the time meta() runs, the loader must already be finished
        expect(loaderFinished).toBe(true);
        const d = loaderData['slow'];
        return { title: `Value: ${d.value}` };
      },
    });
    const loaderData = Object.fromEntries(
      await orchestrateLoaders([slowLoader], {}, createRequestCache()),
    );
    const meta = await route.meta({ params: {}, loaderData });
    expect(meta.title).toBe('Value: 42');
  });
  it('meta() receives merged data from multiple independent loaders', async () => {
    const userLoader = makeLoader('user', async () => ({ name: 'Alice' }));
    const productLoader = makeLoader('product', async () => ({ title: 'Widget' }));
    const route = defineRoute({
      path: '/dashboard',
      handler: h,
      render: 'dynamic',
      meta: async ({ loaderData }) => {
        const user = loaderData['user'];
        const product = loaderData['product'];
        return { title: `${user.name} — ${product.title}` };
      },
    });
    const loaderData = Object.fromEntries(
      await orchestrateLoaders([userLoader, productLoader], {}, createRequestCache()),
    );
    const meta = await route.meta({ params: {}, loaderData });
    expect(meta.title).toBe('Alice — Widget');
  });
  it('meta() receives URL params alongside loaderData', async () => {
    const route = defineRoute({
      path: '/blog/:slug',
      handler: h,
      render: 'static',
      revalidate: 3600,
      meta: async ({ params, loaderData }) => {
        const post = loaderData['post'];
        return {
          title: params['slug'] ?? '',
          description: post.excerpt,
          og: { title: params['slug'] ?? '' },
        };
      },
    });
    const loaderData = Object.fromEntries(
      await orchestrateLoaders(
        [makeLoader('post', async () => ({ excerpt: 'A great post' }))],
        {},
        createRequestCache(),
      ),
    );
    const meta = await route.meta({ params: { slug: 'my-post' }, loaderData });
    expect(meta.title).toBe('my-post');
    expect(meta.description).toBe('A great post');
    expect(meta.og?.title).toBe('my-post');
  });
});
// ─── Optional meta — routes without meta() work normally ─────────────────────
describe('meta() is optional', () => {
  it('a route without meta() has an undefined meta field', () => {
    const route = defineRoute({ path: '/', handler: h, render: 'dynamic' });
    expect(route.meta).toBeUndefined();
  });
  it('calling loaders for a route without meta() does not throw', async () => {
    const route = defineRoute({ path: '/', handler: h, render: 'dynamic' });
    const loader = makeLoader('data', async () => ({ ok: true }));
    const loaderData = Object.fromEntries(
      await orchestrateLoaders([loader], {}, createRequestCache()),
    );
    // No meta to call — loaders still resolve cleanly
    expect(loaderData['data']).toEqual({ ok: true });
    // Calling meta conditionally is safe
    const meta = route.meta ? await route.meta({ params: {}, loaderData }) : null;
    expect(meta).toBeNull();
  });
});
// ─── MetaData shape ───────────────────────────────────────────────────────────
describe('meta() return shape (MetaData)', () => {
  it('supports title and description', async () => {
    const route = defineRoute({
      path: '/about',
      handler: h,
      render: 'static',
      revalidate: false,
      meta: async () => ({ title: 'About Us', description: 'Learn more.' }),
    });
    const meta = await route.meta({ params: {}, loaderData: {} });
    expect(meta.title).toBe('About Us');
    expect(meta.description).toBe('Learn more.');
  });
  it('supports og fields', async () => {
    const route = defineRoute({
      path: '/product',
      handler: h,
      render: 'dynamic',
      meta: async () => ({
        title: 'Widget',
        og: { title: 'Widget', image: 'https://cdn.example.com/widget.png', type: 'product' },
      }),
    });
    const meta = await route.meta({ params: {}, loaderData: {} });
    expect(meta.og?.image).toBe('https://cdn.example.com/widget.png');
    expect(meta.og?.type).toBe('product');
  });
  it('supports JSON-LD structured data', async () => {
    const route = defineRoute({
      path: '/recipe',
      handler: h,
      render: 'static',
      revalidate: false,
      meta: async ({ loaderData }) => {
        const recipe = loaderData['recipe'];
        return {
          title: recipe.name,
          jsonLd: { '@context': 'https://schema.org', '@type': 'Recipe', name: recipe.name },
        };
      },
    });
    const loaderData = Object.fromEntries(
      await orchestrateLoaders(
        [makeLoader('recipe', async () => ({ name: 'Pasta Carbonara' }))],
        {},
        createRequestCache(),
      ),
    );
    const meta = await route.meta({ params: {}, loaderData });
    expect(meta.jsonLd?.['@type']).toBe('Recipe');
    expect(meta.jsonLd?.['name']).toBe('Pasta Carbonara');
  });
});
//# sourceMappingURL=seo-meta.test.js.map
