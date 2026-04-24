import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

export function resolvePathWithinRoot(root: string, targetPath: string): string {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(resolvedRoot, targetPath);
  const rel = relative(resolvedRoot, resolvedTarget);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Refusing to write outside project root: ${targetPath}`);
  }

  return resolvedTarget;
}

export function ensureParentDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}
