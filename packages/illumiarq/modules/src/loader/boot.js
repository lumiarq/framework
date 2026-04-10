import { getModuleManifest } from '../manifest/get-manifest.js';
import { autoRegisterListeners, discoverModules } from './discover.js';
export async function bootModules(scheduler, importFn) {
  const manifest = await getModuleManifest();
  const modules = await discoverModules(scheduler, importFn);
  if (importFn) {
    for (const entry of manifest.modules) {
      await autoRegisterListeners(entry.name, importFn, entry.listeners ?? []);
    }
  }
  return modules;
}
//# sourceMappingURL=boot.js.map
