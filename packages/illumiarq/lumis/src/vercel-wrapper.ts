import { mkdirSync, writeFileSync } from 'node:fs';
import { vercelApiDir, vercelApiEntry } from './paths.js';

function wrapperSource(): string {
  return [
    `import appPromise from '../.arc/node/app.js';`,
    `import { handle } from 'hono/vercel';`,
    '',
    `const app = await appPromise;`,
    `const router = app?.router ?? app;`,
    '',
    `if (!router || typeof router.fetch !== 'function') {`,
    `  throw new Error('LumiARQ Vercel adapter expected a Hono app at app.router.');`,
    `}`,
    '',
    `export const config = { runtime: 'nodejs' };`,
    `export default handle(router);`,
    '',
  ].join('\n');
}

/**
 * Writes a Vercel function entry at api/index.js that proxies every request
 * to the booted LumiARQ Hono router from .arc/node/app.js.
 */
export function writeVercelFunctionWrapper(cwd: string): string {
  const apiDir = vercelApiDir(cwd);
  const apiEntry = vercelApiEntry(cwd);

  mkdirSync(apiDir, { recursive: true });
  writeFileSync(apiEntry, `${wrapperSource()}`, 'utf8');

  return apiEntry;
}
