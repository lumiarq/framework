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

/**
 * Reads the `paths.storage` key from `lumis.config.json` in the app's root.
 * Defaults to `"storage"` if not set.
 *
 * Apps that keep their storage directory under `src/` should set:
 *   { "paths": { "storage": "src/storage" } }
 */
export function readStorageRoot(cwd = process.cwd()): string {
  const configPath = join(cwd, 'lumis.config.json');
  if (!existsSync(configPath)) return 'storage';
  try {
    const raw = readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw) as { paths?: { storage?: string } };
    return config.paths?.storage ?? 'storage';
  } catch {
    return 'storage';
  }
}
