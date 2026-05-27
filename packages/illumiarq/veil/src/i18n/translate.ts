/**
 * __t — runtime translation helper used inside compiled render functions.
 * Falls back to the key if no translation is found.
 */
export function __t(key: string, locale: Record<string, string> = {}): string {
  return locale[key] ?? key;
}

export { loadLocaleFiles } from './load-locale-files.js';

import { loadLocaleFiles } from './load-locale-files.js';

/**
 * loadLocale — merges locale JSON for the active language tag.
 * Supports lang/<locale>.json and src/lang/<locale>/*.json layouts.
 */
export function loadLocale(locale = 'en', cwd = process.cwd()): Record<string, string> {
  return loadLocaleFiles(locale, cwd);
}
