/**
 * lumis view:cache — Compiles HTML templates into cached TypeScript render functions.
 *
 * Template syntax (EJS-compatible subset):
 *   @import type { Foo } from 'bar'   — pass-through TypeScript import (typed vars only)
 *   @vars({ a: TypeA, b: string })    — typed render function (generates RenderVars interface)
 *   @vars({ a, b, c })               — untyped render function (falls back to Record<string,any>)
 *   @extends('layouts/base')         — layout inheritance (compile-time merge)
 *   @include('partials/nav')         — inlines a partial template file at compile time
 *   @section('name') ... @endsection — child section content (used with @extends)
 *   @yield('name')                   — section placeholder in a layout template
 *   @t('key')                        — runtime translation key resolved via locale map
 *   @styles('file.css')              — inlines the CSS file at compile time
 *   @scripts('file.js')              — inlines the JS file at compile time
 *   <%= expr %>                      — HTML-escaped output
 *   <%- expr %>                      — raw HTML output
 *   <% stmt %>                       — TypeScript/JS statement (if, for, etc.)
 *
 * Layout resolution (for @extends) — first match wins:
 *   1. Module-local (nested):  src/modules/<Name>/ui/web/templates/layouts/<path>.{html|veil.html}
 *   2. Module-local (sibling): src/modules/<Name>/ui/web/layouts/<path>.{html|veil.html}
 *   3. Shared module (full):   src/modules/Shared/ui/web/templates/<path>.{html|veil.html}
 *   4. Shared module (simple): src/modules/Shared/<path>.{html|veil.html}
 *   5. App-level shared:       src/shared/ui/<path>.{html|veil.html}
 *
 * Asset resolution (for @styles / @scripts) — first match wins:
 *   1. Module-local (nested):  src/modules/<Name>/ui/web/assets/<file>
 *   2. Module-local (flat):    src/modules/<Name>/ui/assets/<file>
 *   3. Shared module (full):   src/modules/Shared/ui/web/assets/<file>
 *   4. Shared module (simple): src/modules/Shared/assets/<file>
 *   5. App-level shared:       src/shared/ui/assets/<file>
 *
 * Conventions (any of these three layouts structures work):
 *   Per-module:      src/modules/<Name>/ui/web/layouts/       → module-scoped layouts
 *   Shared module:   src/modules/Shared/layouts/               → shared across modules
 *   App-level:       src/shared/ui/layouts/                    → app-wide shared
 *   --- assets follow the same 3-tier pattern ---
 *   Per-module:      src/modules/<Name>/ui/web/assets/
 *   Shared module:   src/modules/Shared/assets/
 *   App-level:       src/shared/ui/assets/
 *
 * Auto-run on: lumis serve, lumis preview, lumis build
 * Options:
 *   --min   Minify the compiled HTML output (whitespace + comment stripping)
 */
export interface ViewCacheResult {
    compiled: number;
    paths: string[];
}
export interface ViewClearResult {
    cleared: boolean;
    dir: string;
}
/** Options for the viewCache compiler pass. */
export interface ViewCacheOptions {
    /**
     * When true, strips HTML comments and collapses whitespace between tags
     * in the compiled output. <style> and <script> blocks are preserved as-is.
     * Activate with: lumis view:cache --min
     */
    minify?: boolean;
}
/** Internal context passed through the compile pipeline. */
interface CompileContext {
    /** Ordered list of module-local asset directories to check (first match wins). */
    assetDirs: string[];
    /** Ordered list of fallback asset directories (first match wins). */
    sharedAssetDirs?: string[];
    templatesDir: string;
    /** Ordered list of fallback template directories (first match wins). */
    sharedTemplatesDirs?: string[];
    minify?: boolean;
}
/**
 * Compiles a single `.html` template into a TypeScript render-function module.
 *
 * @param template  Raw template source string
 * @param ctx       Compile context: asset dirs, templates dir, options
 * @param lang      Optional lang map for @t() substitution hint (runtime-resolved)
 */
export declare function compileTemplate(template: string, ctx: CompileContext, lang?: Record<string, string>): string;
export declare function viewCache(cwd?: string, options?: ViewCacheOptions): Promise<ViewCacheResult>;
/**
 * Removes the `storage/framework/cache/views/` directory entirely.
 */
export declare function viewClear(cwd?: string): Promise<ViewClearResult>;
export {};
//# sourceMappingURL=compiler.d.ts.map