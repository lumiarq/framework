import { createConnection } from './connection.js';
// ─── Module-level state ────────────────────────────────────────────────────
let _config = null;
const _cache = new Map();
// ─── Public API ────────────────────────────────────────────────────────────
/**
 * Registers the database configuration used by `getConnection()`.
 * Call this once in `bootstrap/providers.ts` before any repository is used.
 *
 * Re-calling this (e.g. in tests) clears the connection cache so the next
 * `getConnection()` call creates a fresh connection from the new config.
 */
export function setConnectionConfig(cfg) {
  _config = cfg;
  _cache.clear();
}
/**
 * Returns (or lazily creates) the named database connection.
 *
 * Connections are cached — the same `LibSQLDatabase` instance is returned on
 * subsequent calls with the same name. Call `clearConnectionCache()` to force
 * a fresh connection (useful in tests).
 *
 * @param name - Connection name as defined in `config/database.ts`.
 *               Defaults to `_config.default` when omitted.
 * @throws When `setConnectionConfig()` has not been called.
 * @throws When the requested connection name is not in the config.
 * @throws When the connection entry is missing a `url` field.
 */
export function getConnection(name) {
  const key = name ?? _config?.default ?? 'default';
  if (_cache.has(key)) return _cache.get(key);
  if (!_config) {
    throw new Error(
      `Database config not initialised. ` +
        `Call setConnectionConfig(databaseConfig) in bootstrap/providers.ts before ` +
        `using any repository.`,
    );
  }
  const entry = _config.connections[key];
  if (!entry) {
    throw new Error(
      `Unknown database connection "${key}". ` +
        `Available connections: ${Object.keys(_config.connections).join(', ')}.`,
    );
  }
  const url = entry.url;
  if (!url) {
    throw new Error(`Database connection "${key}" is missing a required \`url\` field.`);
  }
  const authToken = entry.authToken;
  const conn = createConnection({
    url,
    ...(authToken !== undefined && { authToken }),
  });
  _cache.set(key, conn);
  return conn;
}
/**
 * Clears the connection cache, forcing `getConnection()` to create fresh
 * connections on next call. Primarily useful in tests that call
 * `setConnectionConfig()` multiple times.
 */
export function clearConnectionCache() {
  _cache.clear();
}
//# sourceMappingURL=connection-factory.js.map
