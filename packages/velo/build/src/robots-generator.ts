export interface RobotsOptions {
  /** Full URL of the sitemap, e.g. "https://example.com/sitemap.xml" */
  sitemapUrl: string;
  /** User-agent string; defaults to "*" (all crawlers) */
  userAgent?: string;
  /** Paths that should not be crawled, e.g. ["/admin", "/api"] */
  disallowedPaths?: string[];
}

/**
 * Generates a robots.txt content string.
 *
 * The output always contains:
 * - A `User-agent` directive
 * - One or more `Allow` or `Disallow` directives
 * - A `Sitemap` directive
 *
 * @param options - robots.txt configuration
 * @returns       - robots.txt content as a string
 */
export function generateRobots(options: RobotsOptions): string {
  const { sitemapUrl, userAgent = '*', disallowedPaths = [] } = options;

  const lines: string[] = [`User-agent: ${userAgent}`];

  if (disallowedPaths.length === 0) {
    lines.push('Allow: /');
  } else {
    for (const path of disallowedPaths) {
      lines.push(`Disallow: ${path}`);
    }
  }

  lines.push(`Sitemap: ${sitemapUrl}`);

  return lines.join('\n');
}
