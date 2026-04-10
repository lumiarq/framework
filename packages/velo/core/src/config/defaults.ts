/**
 * defaults — Canonical framework-internal configuration defaults.
 *
 * Packages inside @lumiarq/* import from here instead of hardcoding
 * magic numbers. App code configures values via their own config files;
 * these defaults act as the fallback layer the framework itself relies on.
 *
 * Rules:
 *  - All values are `as const` and exported with explicit types.
 *  - No runtime logic — pure constant declarations.
 *  - Group by concern; add a new group when a package needs shared defaults.
 */

// ── Content loader ────────────────────────────────────────────────────────────

export const CONTENT_DEFAULTS = {
  /** Assumed reading speed in words per minute. */
  readingSpeedWpm: 200,
  /** Minimum reading time surface to the user (minutes). */
  minReadingTimeMinutes: 1,
  /** File extensions scanned by defineContentLoader(). */
  extensions: ['.md'] as string[],
  /** Whether code blocks are syntax-highlighted by default. */
  highlight: true,
} as const;

// ── Auth & identity ──────────────────────────────────────────────────────────

export const AUTH_DEFAULTS = {
  /** bcrypt rounds for password hashing. 12 is OWASP recommended minimum (2024). */
  bcryptRounds: 12,
  /** Short-lived access token lifetime. */
  jwtExpiresIn: '15m',
  /** Refresh / sliding session token lifetime. */
  refreshExpiresIn: '7d',
  /** Server-side session TTL (cookie + store). */
  sessionExpiresIn: '7d',
  /** Email verification token expiry window. */
  verificationExpiry: '24h',
  /** Re-authentication (password confirmation) grace window. */
  confirmationWindow: '3h',
  /** Raw reset/verification token byte length before hex encoding. */
  tokenBytes: 32,
} as const;

// ── HTTP & routing ────────────────────────────────────────────────────────────

export const HTTP_DEFAULTS = {
  /** Maximum request body size accepted by the JSON parser. */
  bodyLimitBytes: 1_048_576, // 1 MiB
  /** Timeout for outbound HTTP requests made inside actions/tasks (ms). */
  requestTimeoutMs: 10_000,
  /** Port the dev server listens on when PORT env var is absent. */
  devPort: 4000,
  /** Port the preview server listens on when PORT env var is absent. */
  previewPort: 4000,
} as const;

// ── Rate limiting ─────────────────────────────────────────────────────────────

export const RATE_LIMIT_DEFAULTS = {
  /** max requests per window. */
  max: 100,
  /** Sliding window duration in milliseconds. */
  windowMs: 60_000, // 1 minute
  /** Status code returned when the limit is exceeded. */
  statusCode: 429,
} as const;

// ── Pagination ────────────────────────────────────────────────────────────────

export const PAGINATION_DEFAULTS = {
  /** Default page size when the caller omits `perPage`. */
  perPage: 15,
  /** Hard upper bound on page size to prevent runaway queries. */
  maxPerPage: 100,
} as const;

// ── Security ──────────────────────────────────────────────────────────────────

export const SECURITY_DEFAULTS = {
  /** SESSION_SECRET minimum byte length. */
  sessionSecretMinBytes: 32,
  /** CSRF token header name checked by csrfMiddleware. */
  csrfHeaderName: 'x-csrf-token',
  /** Trusted proxy count used by trustProxiesMiddleware ('none' = no trust). */
  trustedProxies: 1,
} as const;

// ── Scheduler ────────────────────────────────────────────────────────────────

export const SCHEDULER_DEFAULTS = {
  /** Timezone assumed for cron expressions when none is specified. */
  timezone: 'UTC',
} as const;
