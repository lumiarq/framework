/**
 * hydrate.ts — Alpine.js hydration for Veil templates.
 *
 * Alpine is optional and loaded lazily. This file handles preregistered
 * components and graceful fallback when alpinejs is not installed.
 */
export interface AlpineLike {
    start(): void;
    data(name: string, callback: () => Record<string, unknown>): void;
}
type AlpineLoader = () => Promise<{
    default: AlpineLike;
}>;
export declare function registerComponents(defs: Record<string, unknown>): void;
export declare function start(): Promise<AlpineLike | null>;
export declare function getAlpine(): AlpineLike | null;
export declare function isStarted(): boolean;
export declare function __resetForTesting(): void;
export declare function __setAlpineLoaderForTesting(loader: AlpineLoader): void;
export {};
//# sourceMappingURL=hydrate.d.ts.map