import type { ModuleDefinition } from '../types/module.types.js';

export function registerModule(
  modules: Map<string, ModuleDefinition>,
  moduleDefinition: ModuleDefinition,
): Map<string, ModuleDefinition> {
  modules.set(moduleDefinition.name, moduleDefinition);
  return modules;
}
