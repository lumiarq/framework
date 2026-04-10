import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import type { GeneratedFile } from '@velo/support';

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

  // If the project already has lang/en.json, merge: existing wins.
  const existing: Record<string, string> = {};
  const projectPath = join(cwd, 'lang', 'en.json');
  if (existsSync(projectPath)) {
    try {
      Object.assign(existing, JSON.parse(readFileSync(projectPath, 'utf-8')));
    } catch {
      // Malformed JSON — ignore, use defaults only.
    }
  }

  const merged = { ...defaults, ...existing }; // existing keys win (additive)

  return {
    path: 'lang/en.json',
    content: JSON.stringify(merged, null, 2) + '\n',
  };
}
