// ─── @lumiarq/framework — Config type interfaces ───────────────────────────
// App code imports these with `import type { AppConfig } from '@lumiarq/framework'`
// and uses them as: `export default { ... } satisfies AppConfig`
//
// Note: All optional fields use `T | undefined` explicitly for compatibility
// with `exactOptionalPropertyTypes: true` — optional env vars are string | undefined.

// ── Extensible Base ────────────────────────────────────────────────────────────
export type ExtensibleConfig = Record<string, any>;

// ── App ──────────────────────────────────────────────────────────────────────

export interface AppFields {
  name: string;
  url: string;
  locale?: string | undefined;
  fallbackLocale?: string | undefined;
  supportedLocales?: string[] | undefined;
  idempotency?:
    | {
        ttl: string;
        store: 'session' | 'redis' | 'database';
      }
    | undefined;
  audit?:
    | {
        enabled: boolean;
        default: string;
      }
    | undefined;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Authentication configuration.
 *
 * NOTE: JWT keys (JWT_PRIVATE_KEY, JWT_PUBLIC_KEY) and SESSION_SECRET
 * are loaded from environment variables only — NOT from this config.
 * This is by design to prevent secrets from being checked into version control.
 *
 * Environment variables (required):
 *   JWT_PRIVATE_KEY  — RS256 private key (PEM format, newlines escaped as \n)
 *   JWT_PUBLIC_KEY   — RS256 public key (PEM format, newlines escaped as \n)
 *   SESSION_SECRET   — 32-byte hex string for session encryption
 */
export interface AuthFields {
  /** JWT token expiry. @example '1h', '7d' */
  jwtExpiresIn?: string | undefined;
  /** Refresh token expiry. @example '30d' */
  refreshExpiresIn?: string | undefined;
  /** Session cookie lifetime in seconds. @example '86400' for 1 day */
  sessionExpiresIn?: string | number | undefined;
  /** Email verification token validity. @example '24h' */
  verificationExpiry?: string | undefined;
  /** Password confirmation request validity window. @example '10m' */
  confirmationWindow?: string | undefined;
  /** Feature flags for the auth module. */
  features?:
    | {
        /** Enable user registration. @default true */
        registration?: boolean | undefined;
        /** Enable password reset. @default true */
        passwordReset?: boolean | undefined;
        /** Enable email verification during registration. @default false */
        emailVerification?: boolean | undefined;
        /** Enable password confirmation for sensitive operations. @default false */
        passwordConfirmation?: boolean | undefined;
        /** Enable two-factor authentication. @default false */
        twoFactor?: boolean | undefined;
      }
    | undefined;
}

// ── Database ─────────────────────────────────────────────────────────────────

export interface SqliteConnectionConfig {
  driver: 'sqlite';
  url: string;
  foreignKeyConstraints?: boolean | undefined;
}

export interface PostgresPoolFields {
  min?: number | undefined;
  max?: number | undefined;
  acquireTimeout?: number | undefined;
  idleTimeout?: number | undefined;
}

export interface PostgresConnectionConfig {
  driver: 'postgres';
  host?: string | undefined;
  port?: number | undefined;
  database?: string | undefined;
  username?: string | undefined;
  password?: string | undefined;
  ssl?: boolean | undefined;
  readonly?: boolean | undefined;
  pool?: PostgresPoolFields | undefined;
}

export type DatabaseConnectionConfig = SqliteConnectionConfig | PostgresConnectionConfig;

export interface DatabaseFields {
  default: string;
  connections: Record<string, DatabaseConnectionConfig>;
}

// ── Mail ─────────────────────────────────────────────────────────────────────

export interface MailFromFields {
  address: string;
  name: string;
}

export interface SmtpDriverFields {
  host?: string | undefined;
  port?: number | undefined;
  username?: string | undefined;
  password?: string | undefined;
  encryption?: string | undefined;
}

export interface ResendDriverFields {
  apiKey?: string | undefined;
}

export interface MailDriversFields {
  stub?: Record<string, never> | undefined;
  resend?: ResendDriverFields | undefined;
  smtp?: SmtpDriverFields | undefined;
  [key: string]: unknown;
}

export interface MailFields {
  driver?: string | undefined;
  from: MailFromFields;
  drivers?: MailDriversFields | undefined;
}

// ── Queue ────────────────────────────────────────────────────────────────────

export interface QueueOptions {
  tries?: number | undefined;
  backoff?: number | undefined;
  /** Max concurrent jobs for this queue. */
  concurrency?: number | undefined;
}

export interface BullMQDriverFields {
  connection?: { host?: string | undefined; port?: number | undefined } | undefined;
}

export interface QueueDriversFields {
  stub?: Record<string, never> | undefined;
  bullmq?: BullMQDriverFields | undefined;
  [key: string]: unknown;
}

export interface QueueFields {
  driver?: string | undefined;
  /** Name of the default queue. @default 'default' */
  default?: string | undefined;
  queues?: Record<string, QueueOptions> | undefined;
  drivers?: QueueDriversFields | undefined;
}

// ── Storage ──────────────────────────────────────────────────────────────────

export interface LocalDiskFields {
  driver: 'local';
  root?: string | undefined;
  visibility?: 'public' | 'private' | undefined;
}

export interface S3DiskFields {
  driver: 's3';
  bucket?: string | undefined;
  region?: string | undefined;
  accessKey?: string | undefined;
  secretKey?: string | undefined;
  visibility?: 'public' | 'private' | undefined;
}

export type DiskFields = LocalDiskFields | S3DiskFields;

export interface StorageFields {
  driver?: string | undefined;
  /** Default disk to use when none specified. */
  default?: string | undefined;
  disks?: Record<string, DiskFields> | undefined;
}

// ── Cache ────────────────────────────────────────────────────────────────────

export interface CacheTtlFields {
  default?: number | undefined;
  short?: number | undefined;
  long?: number | undefined;
}

export interface CacheFields {
  driver?: string | undefined;
  prefix?: string | undefined;
  /** TTL in seconds (number) or per-tier config object. */
  ttl?: number | CacheTtlFields | undefined;
  drivers?: Record<string, unknown> | undefined;
}

// ── Session ──────────────────────────────────────────────────────────────────

export interface SessionCookieFields {
  name?: string | undefined;
  secure?: boolean | undefined;
  httpOnly?: boolean | undefined;
  sameSite?: 'lax' | 'strict' | 'none' | 'Lax' | 'Strict' | 'None' | undefined;
  path?: string | undefined;
}

export interface SessionFields {
  driver?: string | undefined;
  lifetime?: number | undefined;
  cookie?: SessionCookieFields | undefined;
}

// ── Security ─────────────────────────────────────────────────────────────────

export interface SecurityFields {
  cors?:
    | {
        origins?: string[] | undefined;
        methods?: string[] | undefined;
        allowedHeaders?: string[] | undefined;
        credentials?: boolean | undefined;
      }
    | undefined;
  rateLimit?:
    | {
        windowMs?: number | undefined;
        max?: number | undefined;
      }
    | undefined;
  /** Shorthand max requests per minute (used when rateLimit not set). */
  rateLimitPerMinute?: number | undefined;
  trustedProxies?: string[] | undefined;
  /** Body scanning for malicious content patterns. */
  bodyScanning?:
    | {
        enabled: boolean;
        patterns: string[];
      }
    | undefined;
}

// ── Logging ──────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggingFields {
  level?: LogLevel | undefined;
  driver?: 'console' | 'file' | string | undefined;
  /** Pretty-print log output in development (default: true in local env). */
  prettify?: boolean | undefined;
  /** Default channel to use when none specified. */
  default?: string | undefined;
  channels?:
    | Record<
        string,
        {
          driver?: string | undefined;
          level?: LogLevel | undefined;
          /** File path for file-based channels. */
          path?: string | undefined;
        }
      >
    | undefined;
}

export type AppConfig = ExtensibleConfig & AppFields;
export type AuthConfig = ExtensibleConfig & AuthFields;
export type DatabaseConfig = ExtensibleConfig & DatabaseFields;
export type MailConfig = ExtensibleConfig & MailFields;
export type QueueConfig = ExtensibleConfig & QueueFields;
export type StorageConfig = ExtensibleConfig & StorageFields;
export type CacheConfig = ExtensibleConfig & CacheFields;
export type SessionConfig = ExtensibleConfig & SessionFields;
export type SecurityConfig = ExtensibleConfig & SecurityFields;
export type LoggingConfig = ExtensibleConfig & LoggingFields;

// ── Neat ───────────────────────────────────────────────────────────────────
// Config for `lumis neat` — framework-aware formatter and structure validator.
// Place in config/neat.ts: `export default { ... } satisfies NeatConfig`

export interface NeatFormatFields {
  /** Prettier printWidth override for Veil templates. Default: 120. */
  printWidth?: number | undefined;
  /** Prettier tabWidth override. Default: 2. */
  tabWidth?: number | undefined;
  /** Use tabs instead of spaces. Default: false. */
  useTabs?: boolean | undefined;
  /** Sort Tailwind utility classes in .veil.html files. Default: true. */
  sortTailwindClasses?: boolean | undefined;
  /** Extra Prettier options passed through verbatim. */
  prettierOptions?: Record<string, unknown> | undefined;
}

export interface NeatStructureFields {
  /** Enforce the src/modules/Name/ui/web/templates/ layout. Default: true. */
  enforceModuleConventions?: boolean | undefined;
  /** Verify config/*.ts files export the expected satisfies type. Default: true. */
  enforceConfigTypes?: boolean | undefined;
  /** Verify that every route references a file that exists. Default: true. */
  enforceRouteFiles?: boolean | undefined;
}

export interface NeatAuditFields {
  /** Show suggested fixes in neat output. Default: true. */
  showFixes?: boolean | undefined;
  /** Show stable rule identifiers in neat output. Default: true. */
  showRuleIds?: boolean | undefined;
  /** Maximum number of audit items to print before truncating. Default: 50. */
  maxItems?: number | undefined;
  /** Write SARIF report for GitHub code scanning integrations. */
  sarif?:
    | {
        enabled?: boolean | undefined;
        output?: string | undefined;
      }
    | undefined;
}

export type NeatRuleSeverity = 'off' | 'warn' | 'error';

export interface NeatOverrideFields {
  /** Glob pattern(s) this override applies to. */
  files: string | string[];
  /** Optional glob pattern(s) excluded from this override. */
  exclude?: string | string[] | undefined;
  /** When true, matched files are skipped by neat. */
  ignore?: boolean | undefined;
  /** Per-rule severity override for matched files. */
  rules?: Record<string, NeatRuleSeverity> | undefined;
}

export interface NeatFields {
  /** Formatter options. All fields are optional — neat supplies sane defaults. */
  format?: NeatFormatFields | undefined;
  /** Structural convention checks. */
  structure?: NeatStructureFields | undefined;
  /** Global per-rule severity map. */
  rules?: Record<string, NeatRuleSeverity> | undefined;
  /** Glob-scoped overrides for rule severity and ignore behaviour. */
  overrides?: NeatOverrideFields[] | undefined;
  /** Output and audit-report behaviour. */
  audit?: NeatAuditFields | undefined;
  /**
   * Paths to exclude from both formatting and structure checks.
   * Relative to project root. Default: ['public/', 'storage/', 'node_modules/'].
   */
  ignore?: string[] | undefined;
}

export type NeatConfig = NeatFields;
