/**
 * Node-only affordances for LumiARQ apps (filesystem config resolution, markdown content loader).
 * Import from `@illumiarq/core/node` or `@lumiarq/framework` — not from the portable `@illumiarq/core` entry.
 *
 * @see ADR-001
 */

export {
  resolveToolConfigPath,
  type AbsorbedTool,
  type ResolvedToolConfig,
} from '../config/resolve-tool-config.js';

export {
  defineContentLoader,
  type ContentPage,
  type TocEntry,
  type ContentLoaderOptions,
  type ContentLoader,
} from '../content/define-content-loader.js';

export { clearCache as clearContentCache } from '../content/content-cache.js';
