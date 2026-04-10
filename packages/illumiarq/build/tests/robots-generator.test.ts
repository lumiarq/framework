import { describe, it, expect } from 'vitest';
import { generateRobots } from '../src/robots-generator.js';

describe('generateRobots', () => {
  it('uses "*" as the default user-agent', () => {
    const txt = generateRobots({ sitemapUrl: 'https://example.com/sitemap.xml' });
    expect(txt).toContain('User-agent: *');
  });

  it('includes "Allow: /" when no disallowed paths are specified', () => {
    const txt = generateRobots({ sitemapUrl: 'https://example.com/sitemap.xml' });
    expect(txt).toContain('Allow: /');
  });

  it('includes the Sitemap directive', () => {
    const txt = generateRobots({ sitemapUrl: 'https://example.com/sitemap.xml' });
    expect(txt).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('uses a custom user-agent when provided', () => {
    const txt = generateRobots({
      sitemapUrl: 'https://example.com/sitemap.xml',
      userAgent: 'Googlebot',
    });
    expect(txt).toContain('User-agent: Googlebot');
  });

  it('emits Disallow directives for each provided path', () => {
    const txt = generateRobots({
      sitemapUrl: 'https://example.com/sitemap.xml',
      disallowedPaths: ['/admin', '/api'],
    });
    expect(txt).toContain('Disallow: /admin');
    expect(txt).toContain('Disallow: /api');
    expect(txt).not.toContain('Allow: /');
  });

  it('does not include "Allow: /" when disallowed paths are provided', () => {
    const txt = generateRobots({
      sitemapUrl: 'https://example.com/sitemap.xml',
      disallowedPaths: ['/admin'],
    });
    expect(txt).not.toContain('Allow: /');
  });

  it('uses the provided sitemap URL verbatim', () => {
    const url = 'https://custom.domain.io/seo/sitemap.xml';
    const txt = generateRobots({ sitemapUrl: url });
    expect(txt).toContain(`Sitemap: ${url}`);
  });
});
