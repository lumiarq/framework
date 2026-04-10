/**
 * Config helpers — define*Config() functions that provide smart defaults
 * so developers only need to specify fields that differ from the baseline.
 *
 * Usage:
 *   // config/app.ts
 *   import { defineAppConfig } from '@lumiarq/framework'
 *   import env from '@/bootstrap/env'
 *
 *   export default defineAppConfig({ name: env.APP_NAME, url: env.APP_URL })
 *
 * After:  2 lines  (before: 8 lines with every optional field explicit)
 */

import type { AppConfig, AuthConfig, SessionConfig, SecurityConfig } from './types/config.js';

// ── defineAppConfig ───────────────────────────────────────────────────────────

/** Required fields that every app must provide. */
type AppConfigRequired = Pick<AppConfig, 'name' | 'url'>;

/**
 * Returns a full AppConfig by merging the caller's partial overrides
 * with sensible defaults. Only `name` and `url` are required.
 *
 * @example
 *   export default defineAppConfig({ name: env.APP_NAME, url: env.APP_URL })
 */
export function defineAppConfig(
  config: AppConfigRequired & Partial<Omit<AppConfig, 'name' | 'url'>>,
): AppConfig {
  return {
    locale: 'en',
    fallbackLocale: 'en',
    supportedLocales: ['en'],
    ...config,
  };
}

// ── defineAuthConfig ──────────────────────────────────────────────────────────

/**
 * Returns a full AuthConfig by merging overrides with sensible defaults.
 * All fields are optional — calling with no args gives a standard auth setup.
 *
 * @example
 *   // All defaults — registration + password reset enabled
 *   export default defineAuthConfig()
 *
 *   // Enable email verification
 *   export default defineAuthConfig({ features: { emailVerification: true } })
 */
export function defineAuthConfig(overrides?: Partial<AuthConfig>): AuthConfig {
  const base: AuthConfig = {
    jwtExpiresIn: '15m',
    refreshExpiresIn: '7d',
    sessionExpiresIn: '7d',
    verificationExpiry: '24h',
    confirmationWindow: '3h',
    features: {
      registration: true,
      passwordReset: true,
      emailVerification: false,
      passwordConfirmation: false,
      twoFactor: false,
    },
  };

  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    // Deep-merge features so callers can toggle individual flags
    features:
      overrides.features !== undefined
        ? { ...base.features, ...overrides.features }
        : base.features,
  };
}

// ── defineSessionConfig ───────────────────────────────────────────────────────

/**
 * Returns a full SessionConfig by merging overrides with sensible defaults.
 *
 * @example
 *   export default defineSessionConfig()
 *
 *   // Override lifetime only
 *   export default defineSessionConfig({ lifetime: 43200 }) // 12 h
 */
export function defineSessionConfig(overrides?: Partial<SessionConfig>): SessionConfig {
  const base: SessionConfig = {
    driver: 'memory',
    lifetime: 604800, // 7 days in seconds
    cookie: {
      name: 'lumiarq_session',
      secure: process.env['NODE_ENV'] === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    },
  };

  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    cookie: overrides.cookie !== undefined ? { ...base.cookie, ...overrides.cookie } : base.cookie,
  };
}

// ── defineSecurityConfig ─────────────────────────────────────────────────────

/**
 * Returns a full SecurityConfig by merging overrides with sensible defaults.
 *
 * @example
 *   export default defineSecurityConfig()
 *
 *   // Allow specific CORS origins
 *   export default defineSecurityConfig({
 *     cors: { origins: ['https://app.example.com'] },
 *   })
 */
export function defineSecurityConfig(overrides?: Partial<SecurityConfig>): SecurityConfig {
  const base: SecurityConfig = {
    cors: {
      origins: [],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      credentials: true,
    },
    rateLimit: {
      windowMs: 60_000,
      max: 100,
    },
    trustedProxies: ['loopback'],
  };

  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    cors: overrides.cors !== undefined ? { ...base.cors, ...overrides.cors } : base.cors,
    rateLimit:
      overrides.rateLimit !== undefined
        ? { ...base.rateLimit, ...overrides.rateLimit }
        : base.rateLimit,
  };
}
