// Locale + translation catalog store
let _locale: string = 'en';
let _fallbackLocale: string = 'en';
const _catalog: Map<string, Record<string, string>> = new Map();

export function setLocaleConfig(locale: string, fallbackLocale: string): void {
  _locale = locale;
  _fallbackLocale = fallbackLocale;
}

export function loadTranslations(locale: string, translations: Record<string, string>): void {
  _catalog.set(locale, { ...(_catalog.get(locale) ?? {}), ...translations });
}

export function getActiveLocale(): string {
  return _locale;
}

/**
 * Core translation function.
 *
 * Looks up `key` in the active locale first, then the fallback locale.
 * Returns the raw `key` string if not found in either — never throws.
 *
 * Parameter interpolation: replaces `:key` tokens with `params[key]`.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const activeTranslations = _catalog.get(_locale);
  const fallbackTranslations = _catalog.get(_fallbackLocale);

  let template: string | undefined = activeTranslations?.[key] ?? fallbackTranslations?.[key];

  // Key not found in either catalog — return raw key
  if (template === undefined) return key;

  // Replace :param tokens
  if (params) {
    for (const [param, value] of Object.entries(params)) {
      template = template.replaceAll(`:${param}`, String(value));
    }
  }

  return template;
}
