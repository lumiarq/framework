import { existsSync } from 'node:fs';
import { buildApp } from './build.js';
import { ui, writeError, writeLine } from '../console.js';
import { arcNodeApp } from '../paths.js';
import { writeVercelFunctionWrapper } from '../vercel-wrapper.js';

/**
 * `lumis build:vercel-fn` — build a Vercel-compatible serverless entrypoint.
 *
 * Steps:
 *  1. Build .arc/node/app.js (project-owned build:node script)
 *  2. Write api/index.js wrapper using hono/vercel handle()
 */
export function buildVercelFunction(cwd = process.cwd()): number {
  writeLine();
  writeLine(ui.section('Vercel Function Build'));

  const buildExit = buildApp({ target: 'node' }, cwd);
  if (buildExit !== 0) {
    writeError(ui.fail('Build failed while producing .arc/node/app.js'));
    return buildExit;
  }

  if (!existsSync(arcNodeApp(cwd))) {
    writeError(ui.fail('Expected .arc/node/app.js after build:node, but file is missing.'));
    return 1;
  }

  const wrapperPath = writeVercelFunctionWrapper(cwd);
  writeLine(`  ${ui.ok('Generated Vercel entrypoint')}`);
  writeLine(`  ${ui.bullet(wrapperPath)}`);
  writeLine(
    `  ${ui.dim('Add vercel.json rewrite: { "source": "/(.*)", "destination": "/api/index" }')}`,
  );
  writeLine();

  return 0;
}
