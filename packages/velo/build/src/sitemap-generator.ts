import type { SitemapEntry } from '@velo/http';
import type { ClassifiedRoute } from './strategy-classifier.js';

export interface SitemapOptions {
  /** Base URL of the site, e.g. "https://example.com" — no trailing slash. */
  baseUrl: string;
  /** Classified routes to include. Only `ssg` routes appear in the sitemap. */
  routes: ClassifiedRoute[];
  /**
   * Dynamic URL entries returned by SitemapLoaders.
   * Merged with the static SSG route entries in the final XML.
   */
  sitemapEntries?: SitemapEntry[];
  /**
   * ISO-8601 date string to use as `<lastmod>` for all URLs that don't
   * carry their own `lastmod`. Defaults to today's date if not supplied.
   */
  lastmod?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function urlToXml(baseUrl: string, url: string, lastmod: string, priority?: number): string {
  const lines = ['  <url>', `    <loc>${baseUrl}${url}</loc>`, `    <lastmod>${lastmod}</lastmod>`];
  if (priority !== undefined) lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a standard XML sitemap merging two sources:
 *   1. Static SSG routes (from classified route definitions)
 *   2. Dynamic URLs from SitemapLoaders (SitemapLoader = sitemap only)
 *
 * Only classified routes with strategy `ssg` are included — dynamic routes
 * have no pre-determined URL and ISR is treated as SSG by the build layer.
 *
 * @param options - Sitemap configuration
 * @returns       - Well-formed XML sitemap string
 */
export function generateSitemap(options: SitemapOptions): string {
  const {
    baseUrl,
    routes,
    sitemapEntries = [],
    lastmod = new Date().toISOString().slice(0, 10),
  } = options;

  const staticUrls = routes
    .filter((r) => r.strategy === 'ssg')
    .map((r) => urlToXml(baseUrl, r.route.path, lastmod));

  const dynamicUrls = sitemapEntries.map((e) =>
    urlToXml(baseUrl, e.url, e.lastmod ?? lastmod, e.priority),
  );

  const urls = [...staticUrls, ...dynamicUrls].join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
  ].join('\n');
}
