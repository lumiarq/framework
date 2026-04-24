import { closeSync, existsSync, mkdirSync, openSync } from 'node:fs';
import { dirname, relative, resolve, join } from 'node:path';
import net from 'node:net';

import { ui, writeError, writeLine } from '../../console.js';
import { readPackageJson, runBridge, runPnpm } from './command-runtime.js';

type DatabaseConnectionConfig = Record<string, unknown>;

function readDatabaseConfig(cwd: string): {
  defaultConnection: string;
  connection: DatabaseConnectionConfig | null;
  error?: string;
} {
  const result = runBridge(['config:show', cwd, 'database'], cwd);
  if (result.status !== 0) {
    return {
      defaultConnection: 'unknown',
      connection: null,
      error: result.stderr.trim() || 'Unable to resolve config/database.ts',
    };
  }

  try {
    const parsed = JSON.parse(result.stdout) as {
      config?: {
        default?: string;
        connections?: Record<string, DatabaseConnectionConfig>;
      };
    };
    const defaultConnection = parsed.config?.default ?? 'unknown';
    const connection = parsed.config?.connections?.[defaultConnection] ?? null;
    if (!connection) {
      return {
        defaultConnection,
        connection: null,
        error: `Connection '${defaultConnection}' not found in database config`,
      };
    }
    return { defaultConnection, connection };
  } catch {
    return {
      defaultConnection: 'unknown',
      connection: null,
      error: 'Could not parse resolved database config output',
    };
  }
}

function toNumber(value: unknown, fallback: number): number {
  const asNumber = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(asNumber) ? asNumber : fallback;
}

async function pingPostgres(
  host: string,
  port: number,
  timeoutMs = 3000,
): Promise<{ ok: boolean; message: string }> {
  return new Promise((resolvePromise) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (ok: boolean, message: string): void => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolvePromise({ ok, message });
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => finish(true, `TCP connection established to ${host}:${port}`));
    socket.on('timeout', () => finish(false, `Timed out connecting to ${host}:${port}`));
    socket.on('error', (error: NodeJS.ErrnoException) => {
      finish(false, `${error.code ?? 'ERROR'}: ${error.message}`);
    });
  });
}

function pingSqlite(url: string, cwd: string): { ok: boolean; message: string } {
  if (!url) {
    return { ok: false, message: 'SQLite url is empty in database config' };
  }

  const resolvedPath = url.startsWith('file:')
    ? resolve(cwd, url.replace(/^file:/, ''))
    : resolve(cwd, url);

  try {
    mkdirSync(dirname(resolvedPath), { recursive: true });
    const handle = openSync(resolvedPath, 'a');
    closeSync(handle);
    return { ok: true, message: `SQLite file is accessible at ${relative(cwd, resolvedPath)}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown file access error';
    return { ok: false, message };
  }
}

export async function pingDatabaseConnection(cwd = process.cwd()): Promise<number> {
  writeLine();
  writeLine(ui.section('DB Ping'));

  const configState = readDatabaseConfig(cwd);
  if (!configState.connection) {
    writeError(ui.fail(configState.error ?? 'Database configuration is invalid.'));
    writeLine();
    return 1;
  }

  const driver = String(
    configState.connection.driver ?? configState.defaultConnection ?? 'unknown',
  );
  writeLine(`  ${ui.bullet(`Driver: ${driver}`)}`);

  if (driver === 'postgres') {
    const host = String(configState.connection.host ?? '').trim();
    const port = toNumber(configState.connection.port, 5432);
    const database = String(configState.connection.database ?? '').trim();
    const username = String(configState.connection.username ?? '').trim();

    const diagnostics: string[] = [];
    if (!host) diagnostics.push('host is missing');
    if (!database) diagnostics.push('database name is missing');
    if (!username) diagnostics.push('username is missing');
    if (diagnostics.length > 0) {
      writeError(ui.fail('Postgres configuration is incomplete:'));
      for (const diagnostic of diagnostics) {
        writeError(`  - ${diagnostic}`);
      }
      writeLine();
      return 1;
    }

    const ping = await pingPostgres(host, port);
    if (!ping.ok) {
      writeError(ui.fail(`Connection failed: ${ping.message}`));
      writeLine(
        `  ${ui.dim('Diagnosis: check DB_HOST/DB_PORT, network access, and postgres service status.')}`,
      );
      writeLine();
      return 1;
    }

    writeLine(`  ${ui.ok(ping.message)}`);
    writeLine(
      `  ${ui.dim('Authentication was not validated by this ping; it checks network reachability.')}`,
    );
    writeLine();
    return 0;
  }

  if (driver === 'sqlite') {
    const url = String(configState.connection.url ?? '').trim();
    const ping = pingSqlite(url, cwd);
    if (!ping.ok) {
      writeError(ui.fail(`Connection failed: ${ping.message}`));
      writeLine(
        `  ${ui.dim('Diagnosis: verify DATABASE_URL/DB_CONNECTION points to a writable sqlite file path.')}`,
      );
      writeLine();
      return 1;
    }

    writeLine(`  ${ui.ok(ping.message)}`);
    writeLine();
    return 0;
  }

  writeError(ui.fail(`Unsupported database driver '${driver}' for db:ping.`));
  writeLine();
  return 1;
}

function runDatabaseSeed(args: string[], cwd: string): number {
  const packageJson = readPackageJson(cwd);

  if (packageJson.scripts?.['db:seed']) {
    return runPnpm(['run', 'db:seed', ...args], cwd);
  }

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
  writeLine(`  ${ui.bullet(`Running ${relative(cwd, seedFile)}...`)}`);
  const status = runPnpm(['exec', 'tsx', seedFile, ...args], cwd);
  if (status === 0) {
    writeLine(`  ${ui.ok('Seed complete.')}`);
  }
  writeLine();
  return status;
}

export async function runDatabaseCommand(
  commandName: string,
  args: string[],
  cwd = process.cwd(),
): Promise<number> {
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

  if (commandName === 'db:ping') {
    return pingDatabaseConnection(cwd);
  }

  if (commandName === 'db:fresh') {
    writeLine();
    writeLine(ui.section('DB Fresh'));
    writeLine(`  ${ui.bullet('Pushing schema (--force)...')}`);
    const pushStatus = runPnpm(['exec', 'drizzle-kit', 'push', '--force', ...args], cwd, 'pipe');
    if (pushStatus !== 0) return pushStatus;
    writeLine(`  ${ui.bullet('Running migrations...')}`);
    const migrateStatus = runPnpm(['exec', 'drizzle-kit', 'migrate'], cwd, 'pipe');
    if (migrateStatus !== 0) return migrateStatus;
    writeLine(`  ${ui.bullet('Running seeds...')}`);
    const seedStatus = runDatabaseSeed([], cwd);
    if (seedStatus !== 0) return seedStatus;
    writeLine(`  ${ui.ok('Database refreshed.')}`);
    writeLine();
    return 0;
  }

  if (commandName === 'db:reset') {
    writeLine();
    writeLine(ui.section('DB Reset'));
    writeLine(`  ${ui.bullet('Dropping all tables (drizzle-kit drop)...')}`);
    const dropStatus = runPnpm(['exec', 'drizzle-kit', 'drop', '--force'], cwd, 'pipe');
    if (dropStatus !== 0) {
      writeLine(`  ${ui.warn('drizzle-kit drop failed - trying push --force to reset schema...')}`);
      runPnpm(['exec', 'drizzle-kit', 'push', '--force'], cwd, 'pipe');
    }
    writeLine(`  ${ui.bullet('Running migrations...')}`);
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
