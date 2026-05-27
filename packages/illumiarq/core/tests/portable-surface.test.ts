import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CORE_SRC_ROOT = join(process.cwd(), 'src');

/** Node-only modules (import via `@illumiarq/core/node`, not portable `.` entry). */
const NODE_ONLY_ALLOWLIST = new Set([
  'config/resolve-tool-config.ts',
  'content/define-content-loader.ts',
  'content/content-cache.ts',
  'crypto/index.ts',
  'event/event-bus.ts',
  'http/request-id.ts',
  'testing/test-transaction.ts',
]);

const FORBIDDEN_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'node:fs', pattern: /from\s+['"]node:fs['"]/ },
  { label: 'node:path', pattern: /from\s+['"]node:path['"]/ },
  { label: 'node:crypto', pattern: /from\s+['"]node:crypto['"]/ },
  { label: 'node:async_hooks', pattern: /from\s+['"]node:async_hooks['"]/ },
  { label: 'child_process', pattern: /from\s+['"]node:child_process['"]/ },
  { label: 'process.', pattern: /\bprocess\.(env|cwd|exit|platform|version)\b/ },
];

function relativeSrcPath(absPath: string): string {
  return absPath.slice(CORE_SRC_ROOT.length + 1);
}

function walkTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walkTsFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith('.ts') && !fullPath.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('portable core surface (ADR-001)', () => {
  const coreFiles = walkTsFiles(CORE_SRC_ROOT);

  it('only allowlisted files may import Node built-ins or touch process.*', () => {
    for (const file of coreFiles) {
      const rel = relativeSrcPath(file);
      const source = readFileSync(file, 'utf8');
      const allowed = NODE_ONLY_ALLOWLIST.has(rel);

      for (const { label, pattern } of FORBIDDEN_PATTERNS) {
        if (allowed) continue;
        expect(source, `${rel} must not use ${label} (portable surface)`).not.toMatch(pattern);
      }
    }
  });

  it('documents known Node-only modules in allowlist', () => {
    expect(NODE_ONLY_ALLOWLIST.size).toBeGreaterThan(0);
    for (const rel of NODE_ONLY_ALLOWLIST) {
      expect(
        coreFiles.some((f) => relativeSrcPath(f) === rel),
        `allowlist entry ${rel} must exist under src/`,
      ).toBe(true);
    }
  });
});
