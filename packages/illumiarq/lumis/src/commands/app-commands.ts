import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateAuthModule,
  generateAuthUI,
  generateIAMModule,
  generateLangFile,
  generateUserModule,
  publishAuthStubs,
  publishIAMStubs,
} from '@illumiarq/auth-starter';
import { buildSearchIndex } from '@illumiarq/search';
import { viewCache, viewClear } from '@illumiarq/veil';

import { ui, writeError, writeLine } from '../console.js';

type PackageJson = { scripts?: Record<string, string> };
type AuthInstallOptions = { iam?: boolean; ui?: 'react' | 'vue' | 'svelte' | 'solid' };
type StubPublishOptions = { all?: boolean; iam?: boolean };

function readPackageJson(cwd: string): PackageJson {
  const target = join(cwd, 'package.json');
  if (!existsSync(target)) {
    return {};
  }

  return JSON.parse(readFileSync(target, 'utf8')) as PackageJson;
}

function bridgePath(): string {
  return fileURLToPath(new URL('../bridges/project-bridge.ts', import.meta.url));
}

function runBridge(
  args: string[],
  cwd: string,
): { status: number; stdout: string; stderr: string } {
  const result = spawnSync('pnpm', ['exec', 'tsx', bridgePath(), ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function runPnpm(args: string[], cwd: string, stdio: 'inherit' | 'pipe' = 'inherit'): number {
  const result = spawnSync('pnpm', args, {
    cwd,
    stdio,
    encoding: stdio === 'pipe' ? 'utf8' : undefined,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  if (stdio === 'pipe') {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  return result.status ?? 1;
}

function ensureParentDir(filePath: string): void {
  mkdirSync(join(filePath, '..'), { recursive: true });
}

function writeGeneratedFiles(
  cwd: string,
  files: Array<{ path: string; content: string }>,
): { created: number; skipped: number } {
  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const target = join(cwd, file.path);
    mkdirSync(join(target, '..'), { recursive: true });
    if (existsSync(target) && file.path !== 'lang/en.json') {
      skipped += 1;
      continue;
    }
    writeFileSync(target, file.content, 'utf8');
    created += 1;
  }

  return { created, skipped };
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  if (!raw.startsWith('---\n')) {
    return { data: {}, body: raw };
  }

  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) {
    return { data: {}, body: raw };
  }

  const header = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const data: Record<string, unknown> = {};

  for (const line of header.split(/\r?\n/g)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (rawValue === 'true') {
      data[key] = true;
    } else if (rawValue === 'false') {
      data[key] = false;
    } else if (/^\d+$/.test(rawValue)) {
      data[key] = Number(rawValue);
    } else {
      data[key] = rawValue.replace(/^"|"$/g, '');
    }
  }

  return { data, body };
}

function walkMarkdownFiles(dir: string, bucket: string[] = []): string[] {
  if (!existsSync(dir)) {
    return bucket;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(fullPath, bucket);
      continue;
    }

    if (entry.name.endsWith('.md')) {
      bucket.push(fullPath);
    }
  }

  return bucket;
}

function findDocsRoots(cwd: string): string[] {
  return [
    join(cwd, 'content', 'docs'),
    join(cwd, 'src', 'content', 'docs'),
    join(cwd, 'src', 'shared', 'database', 'content', 'docs'),
    join(cwd, 'storage', 'docs-cache'),
  ].filter((candidate, index, all) => existsSync(candidate) && all.indexOf(candidate) === index);
}

export function showResolvedConfig(configName: string, cwd = process.cwd()): number {
  const result = runBridge(['config:show', cwd, configName], cwd);
  if (result.status !== 0) {
    writeError(ui.fail(result.stderr.trim() || `Unable to load config/${configName}.ts`));
    return result.status;
  }

  const parsed = JSON.parse(result.stdout) as { config: unknown };
  writeLine();
  writeLine(ui.section(`Config ${configName}`));
  writeLine(JSON.stringify(parsed.config, null, 2));
  writeLine();
  return 0;
}

export function cacheRoutes(cwd = process.cwd()): number {
  const routesRoot = join(cwd, 'src', 'modules');
  if (!existsSync(routesRoot)) {
    writeError(ui.fail('No src/modules directory found.'));
    return 1;
  }

  const routeFiles = walkMarkdownFiles(join(cwd, '__never__'));
  void routeFiles;
  const imports = readdirSync(routesRoot, { withFileTypes: true });
  const discovered: string[] = [];
  const stack = [routesRoot];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (/\/http\/routes\/.+\.(ts|js)$/.test(fullPath)) {
        discovered.push(fullPath);
      }
    }
  }

  discovered.sort((left, right) => left.localeCompare(right));

  const loaderPath = join(cwd, 'storage', 'framework', 'cache', 'routes.loader.ts');
  mkdirSync(join(loaderPath, '..'), { recursive: true });
  const importLines = discovered.map((filePath) => {
    const relativeImport = relative(
      join(cwd, 'storage', 'framework', 'cache'),
      filePath,
    ).replaceAll('\\', '/');
    return `import '../../../${relativeImport.replace(/^\.\.\//, '')}'`;
  });

  const content = [
    '// storage/framework/cache/routes.loader.ts',
    '// Auto-generated by `lumis route:cache` — do not edit manually.',
    '// Commit this file; re-run `lumis route:cache` whenever routes change.',
    '',
    ...importLines.map((line) => `${line};`),
    '',
  ].join('\n');

  writeFileSync(loaderPath, content, 'utf8');

  writeLine();
  writeLine(ui.section('Route Cache'));
  writeLine(`  ${ui.ok(`Cached ${discovered.length} route files`)}`);
  writeLine(`  ${ui.bullet(relative(cwd, loaderPath))}`);
  writeLine();
  return 0;
}

export function clearRouteCache(cwd = process.cwd()): number {
  const loaderPath = join(cwd, 'storage', 'framework', 'cache', 'routes.loader.ts');
  if (existsSync(loaderPath)) {
    rmSync(loaderPath, { force: true });
  }

  writeLine();
  writeLine(ui.section('Route Clear'));
  writeLine(`  ${ui.ok(`Removed ${relative(cwd, loaderPath)}`)}`);
  writeLine();
  return 0;
}

export function listRoutes(cwd = process.cwd()): number {
  const result = runBridge(['route:list', cwd], cwd);
  if (result.status !== 0) {
    writeError(ui.fail(result.stderr.trim() || 'Route listing failed.'));
    return result.status;
  }

  const parsed = JSON.parse(result.stdout) as {
    routes: Array<{
      method: string;
      path: string;
      name: string;
      render: string;
      middleware: string[];
    }>;
  };

  writeLine();
  writeLine(ui.section(`Routes (${parsed.routes.length})`));
  for (const route of parsed.routes) {
    const meta = [route.name || '-', route.render || '-', route.middleware.join(', ') || '-'].join(
      ' · ',
    );
    writeLine(`  ${ui.cyan(route.method.padEnd(6, ' '))} ${route.path} ${ui.dim(meta)}`);
  }
  writeLine();
  return 0;
}

export function checkRoutes(cwd = process.cwd()): number {
  const result = runBridge(['route:check', cwd], cwd);
  if (result.status !== 0) {
    writeError(ui.fail(result.stderr.trim() || 'Route check failed.'));
    return result.status;
  }

  const parsed = JSON.parse(result.stdout) as { routes: Array<unknown> };
  writeLine();
  writeLine(ui.section('Route Check'));
  writeLine(`  ${ui.ok(`${parsed.routes.length} routes validated`)}`);
  writeLine();
  return 0;
}

export async function cacheViews(cwd = process.cwd()): Promise<number> {
  const result = await viewCache(cwd);
  writeLine();
  writeLine(ui.section('View Cache'));
  writeLine(`  ${ui.ok(`Compiled ${result.compiled} views`)}`);
  for (const filePath of result.paths.slice(0, 5)) {
    writeLine(`  ${ui.bullet(relative(cwd, filePath))}`);
  }
  if (result.paths.length > 5) {
    writeLine(`  ${ui.dim(`…and ${result.paths.length - 5} more`)}`);
  }
  writeLine();
  return 0;
}

export async function clearViews(cwd = process.cwd()): Promise<number> {
  const result = await viewClear(cwd);
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
  const outputPath = join(cwd, 'bootstrap', 'cache', 'search.index.json');
  mkdirSync(join(outputPath, '..'), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

  writeLine();
  writeLine(ui.section('Search Index'));
  writeLine(`  ${ui.ok(`Indexed ${pages.length} documents`)}`);
  writeLine(`  ${ui.bullet(relative(cwd, outputPath))}`);
  writeLine();
  return 0;
}

export function clearSearchIndex(cwd = process.cwd()): number {
  const outputPath = join(cwd, 'bootstrap', 'cache', 'search.index.json');
  if (existsSync(outputPath)) {
    rmSync(outputPath, { force: true });
  }

  writeLine();
  writeLine(ui.section('Search Clear'));
  writeLine(`  ${ui.ok(`Removed ${relative(cwd, outputPath)}`)}`);
  writeLine();
  return 0;
}

export function publishStubs(options: StubPublishOptions = {}, cwd = process.cwd()): number {
  if (options.all || !options.iam) {
    publishAuthStubs(cwd);
  }
  if (options.all || options.iam) {
    publishIAMStubs(cwd);
  }

  writeLine();
  writeLine(ui.section('Stub Publish'));
  writeLine(`  ${ui.ok(`Published stubs into ${relative(cwd, join(cwd, 'stubs')) || 'stubs'}`)}`);
  writeLine();
  return 0;
}

export function installAuth(options: AuthInstallOptions = {}, cwd = process.cwd()): number {
  const generated = options.iam
    ? generateIAMModule()
    : [...generateAuthModule(), ...generateUserModule()];
  const uiFiles = options.ui ? generateAuthUI(options.ui) : [];
  const langFile = generateLangFile(cwd);
  const result = writeGeneratedFiles(cwd, [...generated, ...uiFiles, langFile]);

  writeLine();
  writeLine(ui.section('Auth Install'));
  writeLine(`  ${ui.ok(`Created ${result.created} files`)}`);
  if (result.skipped > 0) {
    writeLine(`  ${ui.warn(`Skipped ${result.skipped} existing files`)}`);
  }
  if (options.ui) {
    writeLine(`  ${ui.bullet(`UI scaffold: ${options.ui}`)}`);
  }
  if (options.iam) {
    writeLine(`  ${ui.bullet('Installed IAM module scaffold')}`);
  }
  writeLine();
  return 0;
}

export function runDatabaseCommand(
  commandName: string,
  args: string[],
  cwd = process.cwd(),
): number {
  const packageJson = readPackageJson(cwd);
  if (packageJson.scripts?.[commandName]) {
    return runPnpm(['run', commandName, ...args], cwd);
  }

  if (commandName === 'db:generate') {
    return runPnpm(['exec', 'drizzle-kit', 'generate', ...args], cwd);
  }

  if (commandName === 'db:migrate') {
    return runPnpm(['exec', 'drizzle-kit', 'migrate', ...args], cwd);
  }

  writeError(
    ui.fail(
      `No handler configured for ${commandName}. Add a package.json script named ${commandName}.`,
    ),
  );
  return 1;
}
