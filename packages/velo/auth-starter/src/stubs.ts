/**
 * Stub file resolution for @velo/auth-starter.
 *
 * Resolution order (Laravel-style):
 *   1. {project}/stubs/auth/{name}  or  {project}/stubs/user/{name}  ← user-published
 *   2. {packageDir}/stubs/{name}                                       ← package default
 *
 * IAM resolution order:
 *   1. {project}/stubs/iam/{name}  ← user-published
 *   2. {packageDir}/stubs/iam/{name}  ← package default
 */
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const PKG_STUBS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'stubs');

export function loadAuthStub(name: string): string {
  // name is like 'auth/login.action.stub' or 'user/user.model.stub'
  const [group] = name.split('/') as [string, string];
  const file = name.slice(group.length + 1);
  const userStub = join(process.cwd(), 'stubs', group, file);
  if (existsSync(userStub)) return readFileSync(userStub, 'utf-8');
  return readFileSync(join(PKG_STUBS_DIR, name), 'utf-8');
}

/**
 * Loads an IAM stub by name (e.g. 'iam/module.stub').
 * Resolution order (Laravel-style):
 *   1. {project}/stubs/iam/{file}  ← user-published override
 *   2. {packageDir}/stubs/iam/{file}  ← package default
 */
export function loadIAMStub(name: string): string {
  // name is like 'iam/login.action.stub'
  const [group] = name.split('/') as [string, string];
  const file = name.slice(group.length + 1);
  const userStub = join(process.cwd(), 'stubs', group, file);
  if (existsSync(userStub)) return readFileSync(userStub, 'utf-8');
  return readFileSync(join(PKG_STUBS_DIR, name), 'utf-8');
}

/** Returns the package stubs root (used by lumis stub:publish --auth). */
export function getAuthStarterStubsDir(): string {
  return PKG_STUBS_DIR;
}

/** Copies all auth-starter stubs to {project}/stubs/{auth|user}/ for user customisation. */
export function publishAuthStubs(projectRoot: string): void {
  for (const group of ['auth', 'user']) {
    const src = join(PKG_STUBS_DIR, group);
    const dest = join(projectRoot, 'stubs', group);
    mkdirSync(dest, { recursive: true });
    for (const file of readdirSync(src)) {
      const dst = join(dest, file);
      if (!existsSync(dst)) copyFileSync(join(src, file), dst);
    }
  }
}

/** Copies all IAM stubs to {project}/stubs/iam/ for user customisation. */
export function publishIAMStubs(projectRoot: string): void {
  const src = join(PKG_STUBS_DIR, 'iam');
  const dest = join(projectRoot, 'stubs', 'iam');
  mkdirSync(dest, { recursive: true });
  for (const file of readdirSync(src)) {
    const dst = join(dest, file);
    if (!existsSync(dst)) copyFileSync(join(src, file), dst);
  }
}

/**
 * Loads a UI stub for the given framework and stub name.
 * Resolution order:
 *   1. {project}/stubs/ui/{framework}/{name}  ← user-published
 *   2. {packageDir}/stubs/ui/{framework}/{name} ← package default
 *   3. Placeholder comment if no stub exists for this framework yet
 */
export function loadUiStub(framework: string, name: string): string {
  const userStub = join(process.cwd(), 'stubs', 'ui', framework, name);
  if (existsSync(userStub)) return readFileSync(userStub, 'utf-8');
  const pkgStub = join(PKG_STUBS_DIR, 'ui', framework, name);
  if (existsSync(pkgStub)) return readFileSync(pkgStub, 'utf-8');
  return `// TODO: ${framework} UI stub for ${name}\n// Run: lumis auth:install --ui ${framework}\n`;
}
