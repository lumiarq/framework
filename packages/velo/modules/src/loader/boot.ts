import type { SchedulerContract } from '@velo/contracts';
import { getModuleManifest } from '../manifest/get-manifest.js';
import type { ModuleDefinition } from '../types/module.types.js';
import { autoRegisterListeners, discoverModules } from './discover.js';
import { type ModuleImportFn } from './load.js';

export async function bootModules(
  scheduler: SchedulerContract,
  importFn?: ModuleImportFn,
): Promise<Map<string, ModuleDefinition>> {
  const manifest = await getModuleManifest();
  const modules = await discoverModules(scheduler, importFn);

  if (importFn) {
    for (const entry of manifest.modules) {
      await autoRegisterListeners(entry.name, importFn, entry.listeners ?? []);
    }
  }

  return modules;
}
