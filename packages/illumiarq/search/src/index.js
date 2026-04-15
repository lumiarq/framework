/**
 * @illumiarq/search
 *
 * Build-time index construction and client-side query engine for LumiARQ docs.
 *
 * Usage:
 *   // Build time (lumis search:index)
 *   import { buildSearchIndex } from '@illumiarq/search'
 *   const index = buildSearchIndex(docs)
 *   fs.writeFileSync('bootstrap/cache/search.index.json', JSON.stringify(index))
 *
 *   // Client/runtime (GET /api/docs/search-index → queryIndex)
 *   import { queryIndex } from '@illumiarq/search'
 *   const results = queryIndex(index, 'routing')
 */
export { buildSearchIndex } from './indexer/build-index.js';
export { queryIndex } from './query/query-index.js';
//# sourceMappingURL=index.js.map