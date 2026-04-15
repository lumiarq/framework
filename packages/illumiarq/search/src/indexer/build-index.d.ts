import type { SearchableDoc, SearchIndex } from '../types/search.types.js';
/**
 * Builds a serialisable SearchIndex from an array of SearchableDoc objects.
 *
 * Intended to be called at build time (e.g. by `lumis search:index`).
 * The resulting index can be written to disk as JSON and served as a static
 * asset (e.g. GET /api/docs/search-index).
 *
 * @param docs  Array of documents to index
 * @returns     SearchIndex ready to pass to queryIndex() or serialise as JSON
 */
export declare function buildSearchIndex(docs: SearchableDoc[]): SearchIndex;
//# sourceMappingURL=build-index.d.ts.map