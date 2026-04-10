import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface ModulePaths {
  moduleRoot: string;
  moduleFile: string;
  httpDir: string;
  logicDir: string;
  contractsDir: string;
  uiDir: string;
  databaseDir: string;
  eventsDir: string;
  bootstrapDir: string;
}

export function getModulePaths(moduleRoot: string): ModulePaths {
  const root = resolve(moduleRoot);

  return {
    moduleRoot: root,
    moduleFile: join(root, 'module.ts'),
    httpDir: join(root, 'http'),
    logicDir: join(root, 'logic'),
    contractsDir: join(root, 'contracts'),
    uiDir: join(root, 'ui'),
    databaseDir: join(root, 'database'),
    eventsDir: join(root, 'events'),
    bootstrapDir: join(root, 'bootstrap'),
  };
}

export async function findModuleDefinitionFiles(modulesRoot: string): Promise<string[]> {
  const root = resolve(modulesRoot);
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, entry.name, 'module.ts'))
    .sort((left, right) => left.localeCompare(right));
}
