import { describe, it, expect } from 'vitest';
import { generateSitemap } from '../src/sitemap-generator.js';
import { classifyRoute } from '../src/strategy-classifier.js';
import type { RouteDefinition } from '@illumiarq/http';

const handler = async () => new Response('ok');

const ssgRoute = (path: string): RouteDefinition => ({
  path,
  handler,
  render: 'static',
  revalidate: false,
});
const dynRoute = (path: string): RouteDefinition => ({ path, handler, render: 'dynamic' });

describe('generateSitemap', () => {
  it('returns a valid XML sitemap root element', () => {
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [classifyRoute(ssgRoute('/'))],
    });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
  });

  it('includes SSG route URLs in the sitemap', () => {
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [classifyRoute(ssgRoute('/about'))],
      lastmod: '2025-01-01',
    });
    expect(xml).toContain('<loc>https://example.com/about</loc>');
    expect(xml).toContain('<lastmod>2025-01-01</lastmod>');
  });

  it('excludes dynamic routes from the sitemap', () => {
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [classifyRoute(dynRoute('/dashboard'))],
    });
    expect(xml).not.toContain('/dashboard');
    expect(xml).not.toContain('<url>');
  });

  it('includes multiple SSG routes', () => {
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [
        classifyRoute(ssgRoute('/')),
        classifyRoute(ssgRoute('/about')),
        classifyRoute(ssgRoute('/blog')),
      ],
      lastmod: '2025-01-01',
    });
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/about</loc>');
    expect(xml).toContain('<loc>https://example.com/blog</loc>');
  });

  it('returns a sitemap with no URLs when all routes are dynamic', () => {
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [classifyRoute(dynRoute('/app')), classifyRoute(dynRoute('/settings'))],
    });
    expect(xml).not.toContain('<url>');
  });

  it("uses today's date as default lastmod when none is provided", () => {
    const today = new Date().toISOString().slice(0, 10);
    const xml = generateSitemap({
      baseUrl: 'https://example.com',
      routes: [classifyRoute(ssgRoute('/'))],
    });
    expect(xml).toContain(`<lastmod>${today}</lastmod>`);
  });
});
