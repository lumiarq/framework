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

type AlpineLoader = () => Promise<{ default: AlpineLike }>;

const preregisteredComponents = new Map<string, () => Record<string, unknown>>();
let alpineInstance: AlpineLike | null = null;
let hasStarted = false;

const importRuntime = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<unknown>;

let alpineLoader: AlpineLoader = async () => {
  const module = (await importRuntime('alpinejs')) as { default?: AlpineLike };
  if (!module.default) {
    throw new Error('Alpine.js module loaded without a default export.');
  }
  return { default: module.default };
};

function toFactory(component: unknown): () => Record<string, unknown> {
  if (typeof component === 'function') {
    return component as () => Record<string, unknown>;
  }
  return () => component as Record<string, unknown>;
}

export function registerComponents(defs: Record<string, unknown>): void {
  if (hasStarted) {
    console.warn('Alpine.js has already started. Register components before calling start().');
    return;
  }

  for (const [name, component] of Object.entries(defs)) {
    preregisteredComponents.set(name, toFactory(component));
  }
}

export async function start(): Promise<AlpineLike | null> {
  if (hasStarted) {
    return alpineInstance;
  }
  hasStarted = true;

  try {
    const module = await alpineLoader();
    alpineInstance = module.default;

    for (const [name, factory] of preregisteredComponents.entries()) {
      alpineInstance.data(name, factory);
    }

    alpineInstance.start();
    return alpineInstance;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/alpinejs|Cannot find module|Cannot resolve/.test(message)) {
      console.warn('[Veil] Alpine.js is not installed. Install it with: pnpm add alpinejs');
    } else {
      console.error('[Veil] Failed to initialize Alpine.js:', message);
    }
    alpineInstance = null;
    return null;
  }
}

export function getAlpine(): AlpineLike | null {
  return alpineInstance;
}

export function isStarted(): boolean {
  return hasStarted;
}

export function __resetForTesting(): void {
  preregisteredComponents.clear();
  alpineInstance = null;
  hasStarted = false;
}

export function __setAlpineLoaderForTesting(loader: AlpineLoader): void {
  alpineLoader = loader;
}
