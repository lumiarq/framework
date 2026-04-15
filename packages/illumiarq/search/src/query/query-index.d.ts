import type { SearchIndex, SearchResult } from '../types/search.types.js';
export interface QueryOptions {
    /** Maximum number of results to return (default: 8) */
    limit?: number;
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
export declare function queryIndex(index: SearchIndex, q: string, opts?: QueryOptions): SearchResult[];
//# sourceMappingURL=query-index.d.ts.map