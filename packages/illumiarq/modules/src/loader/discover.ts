import type { SchedulerContract } from '@illumiarq/contracts';
import { getModuleManifest } from '../manifest/get-manifest.js';
import type { ModuleDefinition } from '../types/module.types.js';
import { loadModule, type ModuleImportFn } from './load.js';
import { registerModule } from './register.js';

interface ListenerLike {
  event: unknown;
  handler: (...args: unknown[]) => unknown;
}

function isListenerDefinition(value: unknown): value is ListenerLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'event' in value &&
    'handler' in value &&
    typeof (value as ListenerLike).handler === 'function'
  );
}

export async function discoverModules(
  _scheduler: SchedulerContract,
  importFn?: ModuleImportFn,
): Promise<Map<string, ModuleDefinition>> {
  const manifest = await getModuleManifest();
  const modules = new Map<string, ModuleDefinition>();

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

export async function autoRegisterListeners(
  _moduleName: string,
  importFn: ModuleImportFn,
  listenerPaths: string[] = [],
): Promise<{ registered: number }> {
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
