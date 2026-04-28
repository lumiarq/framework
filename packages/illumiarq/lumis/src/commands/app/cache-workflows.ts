import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { buildSearchIndex } from '@illumiarq/search';
import { viewCache, viewClear } from '@illumiarq/veil';

import { ui, writeError, writeLine } from '../../console.js';
import { readStorageRoot } from '../../paths.js';
import { findDocsRoots, parseFrontmatter, walkMarkdownFiles } from './docs.js';
import { cacheConfig, clearConfigCache } from './config-cache.js';
import { cacheRoutes, clearRouteCache } from './routes.js';

export async function cacheViews(cwd = process.cwd()): Promise<number> {
  const storageRoot = readStorageRoot(cwd);
  const result = await viewCache(cwd, { viewsCacheDir: `${storageRoot}/framework/cache/views` });
  writeLine();
  writeLine(ui.section('View Cache'));
  writeLine(`  ${ui.ok(`Compiled ${result.compiled} views`)}`);
  for (const filePath of result.paths.slice(0, 5)) {
    writeLine(`  ${ui.bullet(relative(cwd, filePath))}`);
  }
  if (result.paths.length > 5) {
    writeLine(`  ${ui.dim(`...and ${result.paths.length - 5} more`)}`);
  }
  writeLine();
  return 0;
}

export async function clearViews(cwd = process.cwd()): Promise<number> {
  const storageRoot = readStorageRoot(cwd);
  const result = await viewClear(cwd, { viewsCacheDir: `${storageRoot}/framework/cache/views` });
  writeLine();
  writeLine(ui.section('View Clear'));
  writeLine(
    `  ${ui.ok(result.cleared ? `Cleared ${relative(cwd, result.dir)}` : `Nothing to clear at ${relative(cwd, result.dir)}`)}`,
  );
  writeLine();
  return 0;
}

export function cacheSearchIndex(cwd = process.cwd()): number {
  const docsRoots = findDocsRoots(cwd);
  const docs = docsRoots.flatMap((root) => walkMarkdownFiles(root)).sort();
  const pages = docs
    .map((filePath) => {
      const raw = readFileSync(filePath, 'utf8');
      const parsed = parseFrontmatter(raw);
      if (parsed.data['draft'] === true) {
        return null;
      }
      const rel = relative(cwd, filePath).replace(/\\/g, '/');
      return {
        slug: `/${rel.replace(/\.md$/i, '')}`,
        title: String(parsed.data['title'] ?? relative(cwd, filePath)),
        section: String(parsed.data['section'] ?? ''),
        description: String(parsed.data['description'] ?? ''),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const index = buildSearchIndex(pages);
  const storageRoot = readStorageRoot(cwd);
  const outputPath = join(cwd, storageRoot, 'framework', 'cache', 'search.index.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

  writeLine();
  writeLine(ui.section('Search Index'));
  writeLine(`  ${ui.ok(`Indexed ${pages.length} documents`)}`);
  writeLine(`  ${ui.bullet(relative(cwd, outputPath))}`);
  writeLine();
  return 0;
}

export function clearSearchIndex(cwd = process.cwd()): number {
  const storageRoot = readStorageRoot(cwd);
  const outputPath = join(cwd, storageRoot, 'framework', 'cache', 'search.index.json');
  if (existsSync(outputPath)) {
    rmSync(outputPath, { force: true });
  }

  writeLine();
  writeLine(ui.section('Search Clear'));
  writeLine(`  ${ui.ok(`Removed ${relative(cwd, outputPath)}`)}`);
  writeLine();
  return 0;
}

export async function optimizeForProduction(cwd = process.cwd()): Promise<number> {
  writeLine();
  writeLine(ui.section('Optimize'));

  writeLine(`  ${ui.bullet('Caching config...')}`);
  const configStatus = cacheConfig(cwd);
  if (configStatus !== 0) {
    writeError(ui.fail('Failed while caching config.'));
    return configStatus;
  }

  writeLine(`  ${ui.bullet('Caching routes...')}`);
  const routesStatus = cacheRoutes(cwd);
  if (routesStatus !== 0) {
    writeError(ui.fail('Failed while caching routes.'));
    return routesStatus;
  }

  writeLine(`  ${ui.bullet('Caching views...')}`);
  const viewsStatus = await cacheViews(cwd);
  if (viewsStatus !== 0) {
    writeError(ui.fail('Failed while caching views.'));
    return viewsStatus;
  }

  writeLine(`  ${ui.bullet('Building search index...')}`);
  const searchStatus = cacheSearchIndex(cwd);
  if (searchStatus !== 0) {
    writeError(ui.fail('Failed while building search index.'));
    return searchStatus;
  }

  writeLine(`  ${ui.ok('Optimization complete.')}`);
  writeLine();
  return 0;
}

export async function clearOptimizationCaches(cwd = process.cwd()): Promise<number> {
  writeLine();
  writeLine(ui.section('Optimize Clear'));

  writeLine(`  ${ui.bullet('Clearing config cache...')}`);
  const configStatus = clearConfigCache(cwd);
  if (configStatus !== 0) {
    writeError(ui.fail('Failed while clearing config cache.'));
    return configStatus;
  }

  writeLine(`  ${ui.bullet('Clearing route cache...')}`);
  const routesStatus = clearRouteCache(cwd);
  if (routesStatus !== 0) {
    writeError(ui.fail('Failed while clearing route cache.'));
    return routesStatus;
  }

  writeLine(`  ${ui.bullet('Clearing view cache...')}`);
  const viewsStatus = await clearViews(cwd);
  if (viewsStatus !== 0) {
    writeError(ui.fail('Failed while clearing view cache.'));
    return viewsStatus;
  }

  writeLine(`  ${ui.bullet('Clearing search index...')}`);
  const searchStatus = clearSearchIndex(cwd);
  if (searchStatus !== 0) {
    writeError(ui.fail('Failed while clearing search index.'));
    return searchStatus;
  }

  writeLine(`  ${ui.ok('Optimization caches cleared.')}`);
  writeLine();
  return 0;
}
