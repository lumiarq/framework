import { describe, it, expect } from 'vitest';
import { defineRoute, defineSitemapLoader } from '@velo/http';
import { generateSitemap } from '../src/sitemap-generator.js';
import { classifyRoute } from '../src/strategy-classifier.js';
// ─── Helpers ─────────────────────────────────────────────────────────────────
const h = async () => new Response('ok');
const ssgRoute = (path) => defineRoute({ path, handler: h, render: 'static', revalidate: false });
const dynRoute = (path) => defineRoute({ path, handler: h, render: 'dynamic' });
// ─── generateParams vs SitemapLoader coexistence ─────────────────────────────
describe('generateParams vs SitemapLoader coexistence', () => {
  it('a route can declare both generateParams and coexist with a SitemapLoader', async () => {
    const route = defineRoute({
      path: '/blog/:slug',
      handler: h,
      render: 'static',
      revalidate: false,
      generateParams: async () => [{ slug: 'post-a' }, { slug: 'post-b' }],
    });
    const blogSitemapLoader = defineSitemapLoader(async () => [
      { url: '/blog/post-a', lastmod: '2025-01-01', priority: 0.8 },
      { url: '/blog/post-b', lastmod: '2025-01-02', priority: 0.8 },
    ]);
    const params = await route.generateParams();
    const entries = await blogSitemapLoader({});
    // generateParams returns param objects — drives prerender URL expansion
    expect(params).toHaveLength(2);
    expect(params[0]).toEqual({ slug: 'post-a' });
    expect(params[1]).toEqual({ slug: 'post-b' });
    // SitemapLoader returns URL entries — drives sitemap only
    expect(entries).toHaveLength(2);
    expect(entries[0].url).toBe('/blog/post-a');
    expect(entries[1].url).toBe('/blog/post-b');
  });
  it('generateParams result has no url/lastmod/priority fields (prerender-only shape)', async () => {
    const route = defineRoute({
      path: '/products/:id',
      handler: h,
      render: 'static',
      revalidate: false,
      generateParams: async () => [{ id: '1' }, { id: '2' }],
    });
    const params = await route.generateParams();
    expect(params[0]).not.toHaveProperty('url');
    expect(params[0]).not.toHaveProperty('lastmod');
    expect(params[0]).not.toHaveProperty('priority');
  });
  it('SitemapLoader result has no param-shape slug/id fields', async () => {
    const loader = defineSitemapLoader(async () => [
      { url: '/products/widget', lastmod: '2025-01-01' },
    ]);
    const entries = await loader({});
    expect(entries[0]).not.toHaveProperty('id');
    expect(entries[0]).not.toHaveProperty('slug');
    expect(entries[0]).toHaveProperty('url');
  });
  it('generateParams does NOT automatically populate the sitemap', async () => {
    // A route with generateParams but no SitemapLoader produces no dynamic sitemap entries.
    // The static route path /blog/:slug (with param) would not be a valid sitemap URL.
    const route = defineRoute({
      path: '/blog/:slug',
      handler: h,
      render: 'static',
      revalidate: false,
      generateParams: async () => [{ slug: 'post-x' }],
    });
    const classified = [classifyRoute(route)];
    const xml = generateSitemap({ baseUrl: 'https://example.com', routes: classified });
    // The parameterised path appears literally — this is intentional
    // (real apps pass SitemapLoader entries instead)
    expect(xml).not.toContain('post-x'); // param value not interpolated
  });
  it('SitemapLoader result does NOT trigger prerender (no generateParams contract)', async () => {
    // defineSitemapLoader returns a plain async function.
    // It has no generateParams property — the two APIs are separate.
    const loader = defineSitemapLoader(async () => [{ url: '/blog/post-a' }]);
    // Calling it returns SitemapEntry[], not param arrays
    const entries = await loader({});
    expect(Array.isArray(entries)).toBe(true);
    expect(entries[0]).toHaveProperty('url');
    expect(entries[0]).not.toHaveProperty('slug'); // not a param map
  });
});
// ─── generateSitemap — merges both sources ────────────────────────────────────
describe('generateSitemap — merges static SSG routes with SitemapLoader entries', () => {
  it('includes both SSG route paths and SitemapLoader URLs in the same sitemap', () => {
    const routes = [classifyRoute(ssgRoute('/')), classifyRoute(ssgRoute('/about'))];
    const sitemapEntries = [
      { url: '/blog/post-1', lastmod: '2025-01-01' },
      { url: '/blog/post-2', lastmod: '2025-01-02' },
    ];
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes,
      sitemapEntries,
      lastmod: '2025-01-01',
    });
    // Static SSG routes
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/about</loc>');
    // Dynamic SitemapLoader URLs
    expect(xml).toContain('<loc>https://example.com/blog/post-1</loc>');
    expect(xml).toContain('<loc>https://example.com/blog/post-2</loc>');
  });
  it('SitemapLoader entry with its own lastmod overrides the global default', () => {
    const sitemapEntries = [{ url: '/blog/new-post', lastmod: '2025-06-15' }];
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [],
      sitemapEntries,
      lastmod: '2025-01-01', // global default
    });
    expect(xml).toContain('<lastmod>2025-06-15</lastmod>'); // entry's own lastmod wins
    expect(xml).not.toContain('<lastmod>2025-01-01</lastmod>');
  });
  it('SitemapLoader entry without lastmod falls back to global default', () => {
    const sitemapEntries = [
      { url: '/products/widget' }, // no lastmod
    ];
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [],
      sitemapEntries,
      lastmod: '2025-03-01',
    });
    expect(xml).toContain('<lastmod>2025-03-01</lastmod>');
  });
  it('emits <priority> only when SitemapEntry provides it', () => {
    const withPriority = [{ url: '/important', priority: 0.9 }];
    const withoutPriority = [{ url: '/normal' }];
    const xmlWith = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [],
      sitemapEntries: withPriority,
    });
    const xmlWithout = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [],
      sitemapEntries: withoutPriority,
    });
    expect(xmlWith).toContain('<priority>0.9</priority>');
    expect(xmlWithout).not.toContain('<priority>');
  });
  it('SitemapLoader entries appear after SSG route entries (declaration order preserved)', () => {
    const routes = [classifyRoute(ssgRoute('/'))];
    const sitemapEntries = [{ url: '/blog/post-1' }];
    const xml = generateSitemap({ baseUrl: 'https://example.com', routes, sitemapEntries });
    const locRoot = xml.indexOf('https://example.com/</loc>');
    const locBlog = xml.indexOf('https://example.com/blog/post-1</loc>');
    expect(locRoot).toBeLessThan(locBlog);
  });
  it('dynamic (non-SSG) classified routes are excluded even when sitemapEntries is empty', () => {
    const routes = [classifyRoute(dynRoute('/dashboard'))];
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes,
      sitemapEntries: [],
    });
    expect(xml).not.toContain('/dashboard');
    expect(xml).not.toContain('<url>');
  });
  it('produces a valid XML document with both sources present', () => {
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [classifyRoute(ssgRoute('/about'))],
      sitemapEntries: [{ url: '/blog/hello' }],
    });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
    // Both entries present
    const urlCount = (xml.match(/<url>/g) ?? []).length;
    expect(urlCount).toBe(2);
  });
  it('works correctly when only SitemapLoader entries are provided (no static routes)', () => {
    const sitemapEntries = [
      { url: '/dynamic/page-1', priority: 0.5 },
      { url: '/dynamic/page-2', priority: 0.5 },
    ];
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [],
      sitemapEntries,
    });
    expect(xml).toContain('<loc>https://example.com/dynamic/page-1</loc>');
    expect(xml).toContain('<loc>https://example.com/dynamic/page-2</loc>');
    const urlCount = (xml.match(/<url>/g) ?? []).length;
    expect(urlCount).toBe(2);
  });
});
//# sourceMappingURL=seo.test.js.map
