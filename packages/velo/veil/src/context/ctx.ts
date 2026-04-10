/**
 * ctx.view(name, vars, locale?) — helper for use inside Handlers.
 * Loads the compiled render function from storage/framework/cache/views/<name>.ts
 * and calls render(vars, locale), returning the HTML string.
 *
 * Usage in a handler:
 *   import { ctx } from '@lumiarq/framework/veil'
 *   const html = await ctx.view('home', { title: 'Home', user })
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ViewHelper {
  view(
    name: string,
    vars?: Record<string, unknown>,
    locale?: Record<string, string>,
  ): Promise<string>;
}

function buildViewHelper(cwd: string): ViewHelper {
  return {
    async view(name, vars = {}, locale = {}): Promise<string> {
      const viewPath = resolve(cwd, 'bootstrap', 'cache', 'views', `${name}.js`);
      if (!existsSync(viewPath)) {
        throw new Error(`View "${name}" not found. Run: lumis view:cache`);
      }
      // Dynamic import of the compiled render module
      const mod = (await import(viewPath)) as {
        render: (vars: Record<string, unknown>, locale: Record<string, string>) => string;
      };
      return mod.render(vars, locale);
    },
  };
}

/** Singleton helper bound to process.cwd() */
export const ctx: ViewHelper = buildViewHelper(process.cwd());

/** Factory for custom cwd (useful in tests) */
export function createCtx(cwd = process.cwd()): ViewHelper {
  return buildViewHelper(cwd);
}
