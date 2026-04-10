// @velo/veil — Veil template engine public API
// ── Template compilation + cache ─────────────────────────────────────────────
export { viewCache, viewClear, compileTemplate } from './compiler.js';
// ── i18n ─────────────────────────────────────────────────────────────────────
export { __t, loadLocale } from './i18n/translate.js';
// ── ctx.view() helper ────────────────────────────────────────────────────────
export { ctx, createCtx } from './context/ctx.js';
// ── Alpine.js hydration (client-side only) ───────────────────────────────────
// Import hydrate.ts in your client bundle to boot Alpine.js.
// Re-exported here for discoverability.
export {
  registerComponents,
  start,
  getAlpine,
  isStarted,
  __resetForTesting,
} from './render/hydrate.js';
//# sourceMappingURL=index.js.map
