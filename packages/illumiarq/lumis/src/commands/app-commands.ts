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

  if (commandName === 'db:studio') {
    return runPnpm(['exec', 'drizzle-kit', 'studio', ...args], cwd);
  }

  if (commandName === 'db:seed') {
    return runDatabaseSeed(args, cwd);
  }

  if (commandName === 'db:fresh') {
    writeLine();
    writeLine(ui.section('DB Fresh'));
    writeLine(`  ${ui.bullet('Pushing schema (--force)…')}`);
    const pushStatus = runPnpm(['exec', 'drizzle-kit', 'push', '--force', ...args], cwd, 'pipe');
    if (pushStatus !== 0) return pushStatus;
    writeLine(`  ${ui.bullet('Running migrations…')}`);
    const migrateStatus = runPnpm(['exec', 'drizzle-kit', 'migrate'], cwd, 'pipe');
    if (migrateStatus !== 0) return migrateStatus;
    writeLine(`  ${ui.bullet('Running seeds…')}`);
    const seedStatus = runDatabaseSeed([], cwd);
    if (seedStatus !== 0) return seedStatus;
    writeLine(`  ${ui.ok('Database refreshed.')}`);
    writeLine();
    return 0;
  }

  if (commandName === 'db:reset') {
    writeLine();
    writeLine(ui.section('DB Reset'));
    writeLine(`  ${ui.bullet('Dropping all tables (drizzle-kit drop)…')}`);
    const dropStatus = runPnpm(['exec', 'drizzle-kit', 'drop', '--force'], cwd, 'pipe');
    if (dropStatus !== 0) {
      writeLine(`  ${ui.warn('drizzle-kit drop failed — trying push --force to reset schema…')}`);
      runPnpm(['exec', 'drizzle-kit', 'push', '--force'], cwd, 'pipe');
    }
    writeLine(`  ${ui.bullet('Running migrations…')}`);
    const migrateStatus = runPnpm(['exec', 'drizzle-kit', 'migrate'], cwd, 'pipe');
    if (migrateStatus !== 0) return migrateStatus;
    writeLine(`  ${ui.ok('Database reset.')}`);
    writeLine();
    return 0;
  }

  writeError(
    ui.fail(
      `No handler configured for ${commandName}. Add a package.json script named ${commandName}.`,
    ),
  );
  return 1;
}

function runDatabaseSeed(args: string[], cwd: string): number {
  const packageJson = readPackageJson(cwd);

  // Honour package.json script override
  if (packageJson.scripts?.['db:seed']) {
    return runPnpm(['run', 'db:seed', ...args], cwd);
  }

  // Convention: src/shared/database/seeds/index.ts
  const candidates = [
    join(cwd, 'src', 'shared', 'database', 'seeds', 'index.ts'),
    join(cwd, 'database', 'seeds', 'index.ts'),
    join(cwd, 'seeds', 'index.ts'),
  ];

  const seedFile = candidates.find((f) => existsSync(f));
  if (!seedFile) {
    writeError(
      ui.fail(
        'No seed file found. Create src/shared/database/seeds/index.ts or add a db:seed script to package.json.',
      ),
    );
    return 1;
  }

  writeLine();
  writeLine(ui.section('DB Seed'));
  writeLine(`  ${ui.bullet(`Running ${relative(cwd, seedFile)}…`)}`);
  const status = runPnpm(['exec', 'tsx', seedFile, ...args], cwd);
  if (status === 0) {
    writeLine(`  ${ui.ok('Seed complete.')}`);
  }
  writeLine();
  return status;
}

// ─── Config publish ───────────────────────────────────────────────────────────

const CONFIG_STUBS: Record<string, string> = {
  mail: `import { env } from '../bootstrap/env.js';

const mail = {
  driver: env.MAIL_DRIVER ?? 'stub',

  smtp: {
    host: env.SMTP_HOST ?? 'localhost',
    port: Number(env.SMTP_PORT ?? 1025),
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },

  resend: {
    apiKey: env.RESEND_API_KEY ?? '',
  },

  from: {
    address: env.MAIL_FROM_ADDRESS ?? 'hello@example.com',
    name: env.MAIL_FROM_NAME ?? 'Example App',
  },
} as const;

export default mail;
`,

  queue: `import { env } from '../bootstrap/env.js';

const queue = {
  driver: env.QUEUE_DRIVER ?? 'stub',

  bullmq: {
    connection: {
      host: env.REDIS_HOST ?? '127.0.0.1',
      port: Number(env.REDIS_PORT ?? 6379),
    },
    defaultQueue: 'default',
    concurrency: Number(env.QUEUE_CONCURRENCY ?? 5),
  },
} as const;

export default queue;
`,

  cache: `import { env } from '../bootstrap/env.js';

const cache = {
  driver: env.CACHE_DRIVER ?? 'memory',

  ttl: Number(env.CACHE_TTL ?? 3600),

  redis: {
    host: env.REDIS_HOST ?? '127.0.0.1',
    port: Number(env.REDIS_PORT ?? 6379),
    password: env.REDIS_PASSWORD,
    db: Number(env.REDIS_DB ?? 0),
    keyPrefix: env.CACHE_PREFIX ?? 'cache:',
  },
} as const;

export default cache;
`,

  storage: `import { env } from '../bootstrap/env.js';

const storage = {
  disks: {
    default: {
      driver: env.STORAGE_DRIVER ?? 'local',
      root: env.STORAGE_ROOT ?? 'storage/app',
    },

    s3: {
      driver: 's3' as const,
      bucket: env.AWS_BUCKET ?? '',
      region: env.AWS_REGION ?? 'us-east-1',
      endpoint: env.AWS_ENDPOINT,
      accessKeyId: env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  },
} as const;

export default storage;
`,

  session: `import { env } from '../bootstrap/env.js';

const session = {
  driver: env.SESSION_DRIVER ?? 'cookie',
  secret: env.SESSION_SECRET ?? 'change-me-in-production',
  ttl: Number(env.SESSION_TTL ?? 86400),
  cookieName: 'lumiarq_session',
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
} as const;

export default session;
`,

  security: `import { env } from '../bootstrap/env.js';

const security = {
  jwtSecret: env.JWT_SECRET ?? 'change-me-in-production',
  jwtTtl: Number(env.JWT_TTL ?? 3600),

  cors: {
    allowOrigins: (env.CORS_ORIGINS ?? '*').split(',').map((s) => s.trim()),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  },

  rateLimit: {
    max: Number(env.RATE_LIMIT_MAX ?? 100),
    windowMs: Number(env.RATE_LIMIT_WINDOW ?? 60000),
  },
} as const;

export default security;
`,

  logging: `import { env } from '../bootstrap/env.js';

const logging = {
  level: (env.LOG_LEVEL ?? 'info') as 'debug' | 'info' | 'warn' | 'error',
  driver: (env.LOG_DRIVER ?? 'console') as 'console' | 'traze',

  traze: {
    endpoint: env.TRAZE_ENDPOINT ?? '',
    apiKey: env.TRAZE_API_KEY ?? '',
    service: env.TRAZE_SERVICE ?? 'lumiarq-app',
  },
} as const;

export default logging;
`,

  auth: `import { env } from '../bootstrap/env.js';

const auth = {
  guard: (env.AUTH_GUARD ?? 'jwt') as 'jwt' | 'session',
  secret: env.JWT_SECRET ?? 'change-me-in-production',

  jwt: {
    ttl: Number(env.JWT_TTL ?? 3600),
    refreshTtl: Number(env.JWT_REFRESH_TTL ?? 604800),
    algorithm: 'HS256' as const,
  },

  password: {
    rounds: Number(env.BCRYPT_ROUNDS ?? 12),
  },
} as const;

export default auth;
`,
};

const KNOWN_CONFIG_NAMES = Object.keys(CONFIG_STUBS);

export function publishConfig(configName: string, force = false, cwd = process.cwd()): number {
  if (configName === 'list' || !configName) {
    writeLine();
    writeLine(ui.section('Available Configs'));
    for (const name of KNOWN_CONFIG_NAMES) {
      const exists = existsSync(join(cwd, 'config', `${name}.ts`));
      writeLine(
        `  ${exists ? ui.ok(name) : ui.bullet(name)}${exists ? ui.dim(' (already published)') : ''}`,
      );
    }
    writeLine();
    writeLine(`  Run: ${ui.cyan('lumis publish config <name>')} to publish a config file.`);
    writeLine();
    return 0;
  }

  if (configName === 'all') {
    let published = 0;
    let skipped = 0;
    for (const name of KNOWN_CONFIG_NAMES) {
      const result = publishSingleConfig(name, force, cwd);
      if (result.action === 'created') published++;
      else skipped++;
    }
    writeLine();
    writeLine(ui.section('Config Publish'));
    writeLine(`  ${ui.ok(`Published ${published} config files`)}`);
    if (skipped > 0)
      writeLine(
        `  ${ui.warn(`Skipped ${skipped} already existing files (use --force to overwrite)`)}`,
      );
    writeLine();
    return 0;
  }

  const stub = CONFIG_STUBS[configName];
  if (!stub) {
    writeError(
      ui.fail(`Unknown config: "${configName}". Available: ${KNOWN_CONFIG_NAMES.join(', ')}`),
    );
    return 1;
  }

  const { action, filePath } = publishSingleConfig(configName, force, cwd);
  writeLine();
  writeLine(ui.section('Config Publish'));
  if (action === 'created') {
    writeLine(`  ${ui.ok(`Published config/${configName}.ts`)}`);
  } else {
    writeLine(`  ${ui.warn(`config/${configName}.ts already exists — use --force to overwrite`)}`);
  }
  writeLine(`  ${ui.bullet(relative(cwd, filePath))}`);
  writeLine();
  return 0;
}

function publishSingleConfig(
  name: string,
  force: boolean,
  cwd: string,
): { action: 'created' | 'skipped'; filePath: string } {
  const filePath = join(cwd, 'config', `${name}.ts`);
  const stub = CONFIG_STUBS[name];
  if (!stub) return { action: 'skipped', filePath };

  if (existsSync(filePath) && !force) {
    return { action: 'skipped', filePath };
  }

  ensureParentDir(filePath);
  writeFileSync(filePath, stub, 'utf8');
  return { action: 'created', filePath };
}

// ─── Worker commands ──────────────────────────────────────────────────────────

export function workerStart(dev = false, cwd = process.cwd()): number {
  const workerFile = join(cwd, 'bootstrap', 'worker.ts');
  const workerBuilt = join(cwd, '.arc', 'node', 'worker.js');

  if (dev || !existsSync(workerBuilt)) {
    if (!existsSync(workerFile)) {
      writeError(
        ui.fail(
          'No bootstrap/worker.ts found. Run: lumis publish config queue  (then create bootstrap/worker.ts)',
        ),
      );
      return 1;
    }
    writeLine();
    writeLine(ui.section('Worker Start (dev)'));
    writeLine(`  ${ui.bullet(`Starting ${relative(cwd, workerFile)} via tsx…`)}`);
    writeLine(`  ${ui.dim('Press Ctrl+C to stop.')}`);
    writeLine();
    return runPnpm(['exec', 'tsx', workerFile], cwd);
  }

  writeLine();
  writeLine(ui.section('Worker Start'));
  writeLine(`  ${ui.bullet(`Starting ${relative(cwd, workerBuilt)}…`)}`);
  writeLine(`  ${ui.dim('Press Ctrl+C to stop.')}`);
  writeLine();
  return runPnpm(['exec', 'node', workerBuilt], cwd);
}

export function workerList(cwd = process.cwd()): number {
  const result = runBridge(['schedule:list', cwd], cwd);
  writeLine();
  writeLine(ui.section('Worker Status'));

  const workerFile = join(cwd, 'bootstrap', 'worker.ts');
  const workerBuilt = join(cwd, '.arc', 'node', 'worker.js');

  writeLine(
    `  ${ui.bullet('bootstrap/worker.ts')}  ${existsSync(workerFile) ? ui.ok('present') : ui.warn('missing')}`,
  );
  writeLine(
    `  ${ui.bullet('.arc/node/worker.js')}  ${existsSync(workerBuilt) ? ui.ok('built') : ui.dim('not built')}`,
  );
  writeLine();

  if (result.status === 0) {
    try {
      const parsed = JSON.parse(result.stdout) as {
        jobs: Array<{ name: string; cron: string; nextRun?: string }>;
      };
      if (parsed.jobs.length > 0) {
        writeLine(`  ${ui.bold('Scheduled Jobs')}`);
        for (const job of parsed.jobs) {
          const next = job.nextRun ? ui.dim(` next: ${job.nextRun}`) : '';
          writeLine(`    ${ui.bullet(job.name)}  ${ui.cyan(job.cron)}${next}`);
        }
        writeLine();
      }
    } catch {
      // ignore parse errors
    }
  }

  return 0;
}

// ─── Schedule commands ────────────────────────────────────────────────────────

export function scheduleList(cwd = process.cwd()): number {
  const result = runBridge(['schedule:list', cwd], cwd);
  if (result.status !== 0) {
    writeError(ui.fail(result.stderr.trim() || 'Failed to list scheduled jobs.'));
    return result.status;
  }

  const parsed = JSON.parse(result.stdout) as {
    jobs: Array<{ name: string; cron: string; description?: string; nextRun?: string }>;
  };

  writeLine();
  writeLine(ui.section(`Scheduled Jobs (${parsed.jobs.length})`));
  if (parsed.jobs.length === 0) {
    writeLine(`  ${ui.dim('No scheduled jobs registered.')}`);
    writeLine(
      `  ${ui.dim('Export a scheduler from bootstrap/providers.ts and register jobs in bootstrap/schedule.ts.')}`,
    );
  } else {
    for (const job of parsed.jobs) {
      const desc = job.description ? ui.dim(` — ${job.description}`) : '';
      const next = job.nextRun ? ui.dim(`  (next: ${job.nextRun})`) : '';
      writeLine(`  ${ui.cyan(job.name.padEnd(30, ' '))} ${job.cron}${desc}${next}`);
    }
  }
  writeLine();
  return 0;
}

export function scheduleRun(jobName: string, cwd = process.cwd()): number {
  if (!jobName) {
    writeError(ui.fail('Usage: lumis schedule:run <JobName>'));
    return 1;
  }

  writeLine();
  writeLine(ui.section('Schedule Run'));
  writeLine(`  ${ui.bullet(`Running job: ${jobName}…`)}`);

  const result = runBridge(['schedule:run', cwd, jobName], cwd);
  if (result.status !== 0) {
    writeError(ui.fail(result.stderr.trim() || `Failed to run job "${jobName}".`));
    return result.status;
  }

  writeLine(`  ${ui.ok(`Job "${jobName}" completed.`)}`);
  writeLine();
  return 0;
}
