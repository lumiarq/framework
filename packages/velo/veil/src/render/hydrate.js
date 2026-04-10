/**
 * hydrate.ts — Alpine.js hydration for Veil templates.
 *
 * Alpine is optional and loaded lazily. This file handles preregistered
 * components and graceful fallback when alpinejs is not installed.
 */
const preregisteredComponents = new Map();
let alpineInstance = null;
let hasStarted = false;
const importRuntime = new Function('specifier', 'return import(specifier)');
let alpineLoader = async () => {
  const module = await importRuntime('alpinejs');
  if (!module.default) {
    throw new Error('Alpine.js module loaded without a default export.');
  }
  return { default: module.default };
};
function toFactory(component) {
  if (typeof component === 'function') {
    return component;
  }
  return () => component;
}
export function registerComponents(defs) {
  if (hasStarted) {
    console.warn('Alpine.js has already started. Register components before calling start().');
    return;
  }
  for (const [name, component] of Object.entries(defs)) {
    preregisteredComponents.set(name, toFactory(component));
  }
}
export async function start() {
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
export function getAlpine() {
  return alpineInstance;
}
export function isStarted() {
  return hasStarted;
}
export function __resetForTesting() {
  preregisteredComponents.clear();
  alpineInstance = null;
  hasStarted = false;
}
export function __setAlpineLoaderForTesting(loader) {
  alpineLoader = loader;
}
//# sourceMappingURL=hydrate.js.map
