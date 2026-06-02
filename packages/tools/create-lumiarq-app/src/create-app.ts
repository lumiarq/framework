import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { generateRs256KeyPair, generateSessionSecret } from './keygen.js';
import { getDefaultScaffoldFiles, writeScaffoldFiles } from './scaffold.js';
import { getProjectFiles } from './templates/project-files.js';
import type { Preset } from './types.js';

export type CreateLumiarqAppOptions = {
  projectRoot?: string;
  projectName?: string;
  preset?: Preset;
  skipInstall?: boolean;
  /** Merge default bootstrap stubs into an existing directory only */
  stubsOnly?: boolean;
};

export type CreateLumiarqAppResult = {
  projectRoot: string;
  preset: Preset;
  installed: boolean;
};

function isDirectoryEmpty(dir: string): boolean {
  if (!fs.existsSync(dir)) return true;
  const entries = fs.readdirSync(dir).filter((e) => e !== '.DS_Store');
  return entries.length === 0;
}

function escapeEnvValue(value: string): string {
  if (/[\n#"']/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }
  return value;
}

function writeEnvFile(projectRoot: string, projectName: string): void {
  const examplePath = path.join(projectRoot, '.env.example');
  const envPath = path.join(projectRoot, '.env');
  let base = fs.existsSync(examplePath) ? fs.readFileSync(examplePath, 'utf8') : '';

  const keys = generateRs256KeyPair();
  const sessionSecret = generateSessionSecret();

  const replacements: Record<string, string> = {
    APP_NAME: projectName,
    JWT_PRIVATE_KEY: keys.privateKey,
    JWT_PUBLIC_KEY: keys.publicKey,
    SESSION_SECRET: sessionSecret,
  };

  for (const [key, value] of Object.entries(replacements)) {
    const line = new RegExp(`^${key}=.*$`, 'm');
    const formatted = `${key}=${escapeEnvValue(value)}`;
    base = line.test(base) ? base.replace(line, formatted) : `${base.trimEnd()}\n${formatted}\n`;
  }

  fs.writeFileSync(envPath, base, 'utf8');
}

function runPnpmInstall(projectRoot: string): boolean {
  const which = spawnSync('pnpm', ['--version'], { encoding: 'utf8' });
  if (which.status !== 0) {
    return false;
  }

  const install = spawnSync('pnpm', ['install'], { cwd: projectRoot, stdio: 'inherit' });
  return install.status === 0;
}

export function createLumiarqApp(options: CreateLumiarqAppOptions = {}): CreateLumiarqAppResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const preset = options.preset ?? 'api-only';
  const projectName =
    options.projectName ??
    (projectRoot === process.cwd() ? 'lumiarq-app' : path.basename(projectRoot));

  if (options.stubsOnly) {
    writeScaffoldFiles(projectRoot, getDefaultScaffoldFiles());
    return { projectRoot, preset, installed: false };
  }

  if (!isDirectoryEmpty(projectRoot)) {
    throw new Error(`Target directory is not empty: ${projectRoot}`);
  }

  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(path.join(projectRoot, 'storage', 'app'), { recursive: true });

  const files = getProjectFiles(projectName, preset);
  writeScaffoldFiles(projectRoot, files);
  writeEnvFile(projectRoot, projectName);

  let installed = false;
  if (!options.skipInstall) {
    installed = runPnpmInstall(projectRoot);
  }

  return { projectRoot, preset, installed };
}
