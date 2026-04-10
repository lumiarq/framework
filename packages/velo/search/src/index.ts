/**
 * @velo/search
 *
 * Build-time index construction and client-side query engine for LumiARQ docs.
 *
 * Usage:
 *   // Build time (lumis search:index)
 *   import { buildSearchIndex } from '@velo/search'
 *   const index = buildSearchIndex(docs)
 *   fs.writeFileSync('bootstrap/cache/search.index.json', JSON.stringify(index))
 *
 *   // Client/runtime (GET /api/docs/search-index → queryIndex)
 *   import { queryIndex } from '@velo/search'
 *   const results = queryIndex(index, 'routing')
 */

export type { SearchableDoc, SearchIndex, SearchResult } from './types/search.types.js';
export type { QueryOptions } from './query/query-index.js';
export { buildSearchIndex } from './indexer/build-index.js';
export { queryIndex } from './query/query-index.js';
