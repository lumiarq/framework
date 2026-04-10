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
export function generateRobots(options) {
  const { sitemapUrl, userAgent = '*', disallowedPaths = [] } = options;
  const lines = [`User-agent: ${userAgent}`];
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
//# sourceMappingURL=robots-generator.js.map
