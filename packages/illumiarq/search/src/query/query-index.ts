import type { SearchIndex, SearchResult } from '../types/search.types.js';

export interface QueryOptions {
  /** Maximum number of results to return (default: 8) */
  limit?: number;
}

/**
 * Scores a document against a query string.
 *
 * Scoring rules (additive):
 *   +10  title contains an exact word match for the query
 *   +5   title contains the query (substring)
 *   +3   section matches the query (substring, case-insensitive)
 *   +1   description contains the query (substring, case-insensitive)
 *   +1   any keyword contains the query (substring, case-insensitive)
 */
function score(
  doc: { title: string; section: string; description: string; keywords?: string[] },
  q: string,
): number {
  const lower = q.toLowerCase();
  let s = 0;

  const titleLower = doc.title.toLowerCase();
  // Exact word boundary match in title
  if (new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(titleLower)) {
    s += 10;
  } else if (titleLower.includes(lower)) {
    // Substring match in title (no word boundary)
    s += 5;
  }

  if (doc.section.toLowerCase().includes(lower)) s += 3;
  if (doc.description.toLowerCase().includes(lower)) s += 1;

  for (const kw of doc.keywords ?? []) {
    if (kw.toLowerCase().includes(lower)) {
      s += 1;
      break; // count keywords bonus at most once
    }
  }

  return s;
}

/**
 * Queries a SearchIndex with a plain-text search string.
 *
 * Results are sorted by score descending. Documents with a score of 0
 * (no match) are excluded. An empty or whitespace-only query returns [].
 *
 * Compatible with Algolia DocSearch result shape — swap the fetch URL to
 * migrate to Algolia without changing the UI rendering code.
 *
 * @param index  A SearchIndex produced by buildSearchIndex()
 * @param q      The search query string
 * @param opts   Optional query options (limit, etc.)
 * @returns      Ranked SearchResult array, best match first
 */
export function queryIndex(index: SearchIndex, q: string, opts: QueryOptions = {}): SearchResult[] {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const limit = opts.limit ?? 8;
  const results: SearchResult[] = [];

  for (const doc of index.pages) {
    const s = score(doc, trimmed);
    if (s > 0) {
      results.push({
        slug: doc.slug,
        title: doc.title,
        section: doc.section,
        description: doc.description,
        score: s,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
