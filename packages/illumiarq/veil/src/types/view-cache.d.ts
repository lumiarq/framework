/**
 * Ambient module declarations for compiled Veil view-cache files.
 *
 * Every LumiARQ app stores compiled templates at
 *   storage/framework/cache/views/*.veil.ts
 * That path is excluded from the app's tsconfig so that `lumis view:clear`
 * never breaks `tsc`. These declarations satisfy TypeScript's import resolver
 * for the cache path while the concrete types are absent; re-running
 * `lumis view:cache` restores the real, strongly-typed render functions.
 */
declare module '@/storage/framework/cache/views/*.veil' {
  export interface RenderVars {
    [key: string]: unknown;
  }
  export function render(vars: Record<string, unknown>, locale?: Record<string, string>): string;
}
