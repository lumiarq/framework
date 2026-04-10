import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocaleConfig, loadTranslations, getActiveLocale } from '../src/i18n/index.js';

beforeEach(() => {
  // Reset to English defaults for each test
  setLocaleConfig('en', 'en');
  loadTranslations('en', {
    'auth.failed': 'Authentication failed.',
    'auth.throttle': 'Too many attempts. Please wait :seconds seconds.',
    'auth.welcome': 'Welcome, :name! You have :count messages.',
  });
  loadTranslations('fr', {
    'auth.failed': 'Authentification échouée.',
  });
});

describe('i18n — t()', () => {
  it('returns the correct translation for a key in the active locale', () => {
    expect(t('auth.failed')).toBe('Authentication failed.');
  });

  it('replaces :param tokens with provided values', () => {
    expect(t('auth.throttle', { seconds: 60 })).toBe('Too many attempts. Please wait 60 seconds.');
  });

  it('returns the raw key when the key is missing in both locales', () => {
    expect(t('missing.key')).toBe('missing.key');
  });

  it('falls back to fallback locale when key is missing in active locale', () => {
    setLocaleConfig('fr', 'en');
    // 'auth.throttle' exists in 'en' but not in 'fr'
    expect(t('auth.throttle', { seconds: 30 })).toBe('Too many attempts. Please wait 30 seconds.');
  });

  it('returns raw key when missing in both active and fallback locales', () => {
    setLocaleConfig('fr', 'en');
    expect(t('completely.missing')).toBe('completely.missing');
  });

  it('replaces multiple params in one string', () => {
    expect(t('auth.welcome', { name: 'Alice', count: 5 })).toBe(
      'Welcome, Alice! You have 5 messages.',
    );
  });

  it('getActiveLocale returns the locale set by setLocaleConfig', () => {
    setLocaleConfig('fr', 'en');
    expect(getActiveLocale()).toBe('fr');
  });
});
