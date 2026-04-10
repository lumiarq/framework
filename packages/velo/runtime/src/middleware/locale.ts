import type { MiddlewareFn } from '../middleware-pipeline.js';
import { withHeaders } from '../middleware-pipeline.js';

export interface LocaleOptions {
  /** Supported locale tags (BCP 47), e.g. ['en', 'fr', 'es']. */
  supported: string[];
  /** Fallback locale when no match is found. */
  default: string;
}

/**
 * Detects the request locale from Accept-Language header.
 * Priority: 1) user preference (auth.getUser().locale), 2) Accept-Language, 3) default.
 *
 * Adds `x-resolved-locale` to the response headers so that the runtime and
 * createRequestContext() can read it when building the RequestContext.
 */
export function localeMiddleware(options: LocaleOptions): MiddlewareFn {
  return async (req, next) => {
    const resolved = resolveLocale(req, options);
    const res = await next();
    return withHeaders(res, { 'x-resolved-locale': resolved });
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses the Accept-Language header and returns the best matching supported locale.
 * Falls back to options.default when nothing matches.
 */
function resolveLocale(req: Request, options: LocaleOptions): string {
  const acceptLanguage = req.headers.get('accept-language') ?? '';

  if (!acceptLanguage) return options.default;

  // Parse Accept-Language value: e.g. "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7"
  const candidates = parseAcceptLanguage(acceptLanguage);

  for (const candidate of candidates) {
    // Exact match (e.g. 'en', 'fr')
    if (options.supported.includes(candidate)) return candidate;

    // Primary subtag match: 'fr-CH' → try 'fr'
    const primary = candidate.split('-')[0]!;
    if (options.supported.includes(primary)) return primary;
  }

  return options.default;
}

/**
 * Returns language tags ordered by quality value (descending).
 * Strips quality values and whitespace.
 */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: (tag ?? '').trim(), q: parseFloat(q ?? '1') };
    })
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag)
    .filter(Boolean);
}
