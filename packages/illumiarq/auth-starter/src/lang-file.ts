import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import type { GeneratedFile } from '@illumiarq/support';

const STUB_DIR = join(dirname(fileURLToPath(import.meta.url)), 'stubs');

/**
 * Generates the lang/en.json seed file with all auth error keys.
 * Additive: returns existing keys merged with new ones.
 * Existing keys in the project's lang/en.json are preserved.
 */
export function generateLangFile(cwd = process.cwd()): GeneratedFile {
  // Load the default stub translations.
  const stubPath = join(STUB_DIR, 'lang.en.json.stub');
  const defaults = JSON.parse(readFileSync(stubPath, 'utf-8')) as Record<string, string>;

  // Check for existing lang file in either lang/ or src/lang/ (src/lang/ preferred)
  const existing: Record<string, string> = {};
  let projectPath = join(cwd, 'src', 'lang', 'en.json');
  let targetPath = 'src/lang/en.json';

  if (!existsSync(projectPath)) {
    projectPath = join(cwd, 'lang', 'en.json');
    targetPath = 'lang/en.json';
  }

  if (existsSync(projectPath)) {
    try {
      Object.assign(existing, JSON.parse(readFileSync(projectPath, 'utf-8')));
    } catch {
      // Malformed JSON — ignore, use defaults only.
    }
  }

  const merged = { ...defaults, ...existing }; // existing keys win (additive)

  return {
    path: targetPath,
    content: JSON.stringify(merged, null, 2) + '\n',
  };
}
