export interface ViewHelper {
  view(
    name: string,
    vars?: Record<string, unknown>,
    locale?: Record<string, string>,
  ): Promise<string>;
}
/** Singleton helper bound to process.cwd() */
export declare const ctx: ViewHelper;
/** Factory for custom cwd (useful in tests) */
export declare function createCtx(cwd?: string): ViewHelper;
//# sourceMappingURL=ctx.d.ts.map
