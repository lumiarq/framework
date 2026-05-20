import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CORE_SRC_ROOT = join(process.cwd(), 'src');
const PROHIBITED_IMPORTS = ['@illumiarq/runtime', '@illumiarq/http', '@lumiarq/framework'];

function importPattern(pkg: string): RegExp {
  const escaped = pkg.replace('/', '\\/');
  return new RegExp(`^\\s*(import|export)\\s+.+from\\s+['\"]${escaped}['\"]`, 'm');
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

describe('core anti-coupling', () => {
  const coreFiles = walkTsFiles(CORE_SRC_ROOT);

  it('does not import prohibited framework-level packages', () => {
    for (const file of coreFiles) {
      const source = readFileSync(file, 'utf8');

      for (const pkg of PROHIBITED_IMPORTS) {
        expect(source, `${file} must not import ${pkg}`).not.toMatch(importPattern(pkg));
      }
    }
  });
});
