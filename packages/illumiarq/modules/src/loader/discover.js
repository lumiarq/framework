import { getModuleManifest } from '../manifest/get-manifest.js';
import { loadModule } from './load.js';
import { registerModule } from './register.js';
function isListenerDefinition(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'event' in value &&
    'handler' in value &&
    typeof value.handler === 'function'
  );
}
export async function discoverModules(_scheduler, importFn) {
  const manifest = await getModuleManifest();
  const modules = new Map();
  for (const entry of manifest.modules) {
    try {
      registerModule(modules, await loadModule(entry, importFn));
    } catch (error) {
      throw new Error(
        `Failed to load module "${entry.name}" from ${entry.path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return new Map(
    [...modules.entries()].sort(
      (left, right) => left[1].priority - right[1].priority || left[0].localeCompare(right[0]),
    ),
  );
}
export async function autoRegisterListeners(_moduleName, importFn, listenerPaths = []) {
  let registered = 0;
  for (const path of listenerPaths) {
    const exports = await importFn(path);
    for (const value of Object.values(exports)) {
      if (isListenerDefinition(value)) {
        registered += 1;
      }
    }
  }
  return { registered };
}
//# sourceMappingURL=discover.js.map
