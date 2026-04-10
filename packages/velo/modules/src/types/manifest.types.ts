import type { ModuleDefinition } from './module.types.js';

export interface ModuleManifestEntry {
  name: string;
  alias: string;
  priority: number;
  prefix?: string;
  path: string;
  contentHash: string;
  listeners?: string[];
}

export interface ModulesManifest {
  version: string;
  generatedAt: string;
  autoDiscovered: boolean;
  modules: ModuleManifestEntry[];
}

export interface ManifestModuleSource {
  path: string;
  definition: ModuleDefinition;
  contentHash: string;
}

export interface GenerateManifestOptions {
  cwd?: string;
  modulesRoot?: string;
  manifestPath?: string;
  importFn?: (path: string) => Promise<Record<string, unknown>>;
}

export interface GetModuleManifestOptions {
  cwd?: string;
  manifestPath?: string;
}
