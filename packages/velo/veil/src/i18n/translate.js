/**
 * __t — runtime translation helper used inside compiled render functions.
 * Falls back to the key if no translation is found.
 */
export function __t(key, locale = {}) {
  return locale[key] ?? key;
}
/**
 * loadLocale — reads a JSON locale file from lang/<locale>.json at runtime.
 * Returns an empty map if the file does not exist or fails to parse.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
export function loadLocale(locale = 'en', cwd = process.cwd()) {
  const path = resolve(cwd, 'lang', `${locale}.json`);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}
//# sourceMappingURL=translate.js.map
