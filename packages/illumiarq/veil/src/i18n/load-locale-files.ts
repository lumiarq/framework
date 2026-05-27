import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

function mergeJsonFile(target: Record<string, string>, filePath: string): void {
  try {
    Object.assign(target, JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, string>);
  } catch {
    // Skip malformed JSON files
  }
}

function mergeLocaleDirectory(target: Record<string, string>, dirPath: string): void {
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
    return;
  }

  for (const file of readdirSync(dirPath)) {
    if (!file.endsWith('.json')) {
      continue;
    }
    mergeJsonFile(target, join(dirPath, file));
  }
}

/**
 * Load and merge locale strings for a Lumiarq app.
 *
 * Resolution order (first match wins for single-file; directories merge all *.json):
 *   1. lang/<locale>.json
 *   2. src/lang/<locale>.json
 *   3. src/lang/<locale>/*.json  (canonical modular layout)
 *   4. lang/<locale>/*.json
 */
export function loadLocaleFiles(locale = 'en', cwd = process.cwd()): Record<string, string> {
  const lang: Record<string, string> = {};

  const singleFileCandidates = [
    resolve(cwd, 'lang', `${locale}.json`),
    resolve(cwd, 'src', 'lang', `${locale}.json`),
  ];

  for (const filePath of singleFileCandidates) {
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      mergeJsonFile(lang, filePath);
      return lang;
    }
  }

  const directoryCandidates = [resolve(cwd, 'src', 'lang', locale), resolve(cwd, 'lang', locale)];

  for (const dirPath of directoryCandidates) {
    mergeLocaleDirectory(lang, dirPath);
  }

  return lang;
}
