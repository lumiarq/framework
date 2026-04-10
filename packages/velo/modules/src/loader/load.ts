import { pathToFileURL } from 'node:url';
import type { ModuleManifestEntry } from '../types/manifest.types.js';
import type { ModuleDefinition } from '../types/module.types.js';

export type ModuleImportFn = (path: string) => Promise<Record<string, unknown>>;

const defaultImport: ModuleImportFn = async (path) =>
  import(pathToFileURL(path).href) as Promise<Record<string, unknown>>;

function isModuleDefinition(value: unknown): value is ModuleDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as { name?: unknown }).name === 'string'
  );
}

export async function loadModule(
  entry: ModuleManifestEntry,
  importFn: ModuleImportFn = defaultImport,
): Promise<ModuleDefinition> {
  const moduleExports = await importFn(entry.path);
  const candidate = moduleExports.default ?? moduleExports.module ?? moduleExports[entry.name];

  if (!isModuleDefinition(candidate)) {
    throw new Error(`Module at ${entry.path} does not export a valid ModuleDefinition`);
  }

  return candidate;
}
