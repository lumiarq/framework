import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ARC_DIR = '.arc';
export const ARC_NODE_APP = `${ARC_DIR}/node/app.js`;
export const ARC_SERVER = `${ARC_DIR}/.server.mjs`;
export const VERCEL_API_DIR = 'api';
export const VERCEL_API_ENTRY = `${VERCEL_API_DIR}/index.js`;

export const APP_ENV_FILE = '.env';

export function arcDir(cwd: string): string {
  return resolve(cwd, ARC_DIR);
}

export function arcNodeApp(cwd: string): string {
  return resolve(cwd, ARC_NODE_APP);
}

export function arcServer(cwd: string): string {
  return resolve(cwd, ARC_SERVER);
}

export function vercelApiDir(cwd: string): string {
  return resolve(cwd, VERCEL_API_DIR);
}

export function vercelApiEntry(cwd: string): string {
  return resolve(cwd, VERCEL_API_ENTRY);
}

export function appEnvFile(cwd: string): string {
  return resolve(cwd, APP_ENV_FILE);
}

type MinimalLumisConfig = {
  paths?: {
    storage?: string;
  };
};

const STORAGE_ROOT_DEFAULT = 'storage';

const LUMIS_CONFIG_CANDIDATES = [
  'pkg/lumis/config.ts',
  'src/config/lumis.ts',
  'lumis.config.ts',
  'pkg/lumis/config.json',
  'lumis.config.json',
] as const;

function extractStorageRootFromTs(raw: string): string | null {
  const match = raw.match(/storage\s*:\s*['"]([^'"]+)['"]/);
  return match?.[1] ?? null;
}

function readStorageRootFromConfigFile(filePath: string): string | null {
  try {
    const raw = readFileSync(filePath, 'utf8');

    if (filePath.endsWith('.json')) {
      const config = JSON.parse(raw) as MinimalLumisConfig;
      return config.paths?.storage ?? null;
    }

    return extractStorageRootFromTs(raw);
  } catch {
    return null;
  }
}

/**
 * Reads the `paths.storage` key from canonical Lumis config locations.
 * Defaults to `"storage"` if not set.
 *
 * Resolution order:
 *   1. pkg/lumis/config.ts
 *   2. src/config/lumis.ts
 *   3. lumis.config.ts
 *   4. pkg/lumis/config.json
 *   5. lumis.config.json
 */
export function readStorageRoot(cwd = process.cwd()): string {
  for (const candidate of LUMIS_CONFIG_CANDIDATES) {
    const configPath = join(cwd, candidate);
    if (!existsSync(configPath)) {
      continue;
    }

    const storageRoot = readStorageRootFromConfigFile(configPath);
    if (storageRoot) {
      return storageRoot;
    }
  }

  return STORAGE_ROOT_DEFAULT;
}
