import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { defineModule } from '../define-module.js';
import type { ModuleImportFn } from '../loader/load.js';
import { findModuleDefinitionFiles } from '../porto/paths.js';
import type {
  GenerateManifestOptions,
  ModuleManifestEntry,
  ModulesManifest,
} from '../types/manifest.types.js';
import type { ModuleDefinition } from '../types/module.types.js';

const defaultImport: ModuleImportFn = async (path) =>
  import(path) as Promise<Record<string, unknown>>;

async function hashFile(path: string): Promise<string> {
  const content = await readFile(path);
  return createHash('sha256').update(content).digest('hex');
}

function normalizeModuleDefinition(candidate: unknown, fallbackName: string): ModuleDefinition {
  if (typeof candidate === 'object' && candidate !== null && 'name' in candidate) {
    const moduleDefinition = candidate as ModuleDefinition;
    return defineModule({
      name: moduleDefinition.name,
      alias: moduleDefinition.alias,
      priority: moduleDefinition.priority,
      middleware: moduleDefinition.middleware,
      ...(moduleDefinition.prefix !== undefined ? { prefix: moduleDefinition.prefix } : {}),
      ...(moduleDefinition.description !== undefined
        ? { description: moduleDefinition.description }
        : {}),
    });
  }

  return defineModule({ name: fallbackName });
}

export async function generateManifest(
  options: GenerateManifestOptions = {},
): Promise<ModulesManifest> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const modulesRoot = resolve(options.modulesRoot ?? join(cwd, 'src/modules'));
  const manifestPath = resolve(
    options.manifestPath ?? join(cwd, 'storage/framework/cache/modules.manifest.json'),
  );
  const importFn = options.importFn ?? defaultImport;
  const files = await findModuleDefinitionFiles(modulesRoot);

  const modules: ModuleManifestEntry[] = [];
  for (const file of files) {
    const fallbackName = file.split('/').slice(-2, -1)[0] ?? 'Module';
    const moduleExports = await importFn(file);
    const definition = normalizeModuleDefinition(moduleExports.default, fallbackName);
    modules.push({
      name: definition.name,
      alias: definition.alias,
      priority: definition.priority,
      path: file,
      contentHash: await hashFile(file),
      listeners: [],
      ...(definition.prefix !== undefined ? { prefix: definition.prefix } : {}),
    });
  }

  modules.sort(
    (left, right) => left.priority - right.priority || left.name.localeCompare(right.name),
  );

  const manifest: ModulesManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    autoDiscovered: true,
    modules,
  };

  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return manifest;
}
