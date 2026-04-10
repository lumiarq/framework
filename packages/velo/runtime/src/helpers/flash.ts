import type { SessionStore } from '../session/store.js';

const FLASH_KEY = '__flash';
const OLD_KEY = '__old';
const DEFAULT_TTL = 604_800; // 7 days in seconds

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

/**
 * Stores a flash key/value pair in the session under `__flash`.
 * Flash data survives exactly one request transition.
 */
export async function writeFlash(
  sessionId: string,
  store: SessionStore,
  key: string,
  value: string,
  ttl?: number,
): Promise<void> {
  const session = (await store.get(sessionId)) ?? {};
  const flash = isPlainObject(session[FLASH_KEY])
    ? { ...(session[FLASH_KEY] as Record<string, unknown>) }
    : {};
  flash[key] = value;
  await store.set(sessionId, { ...session, [FLASH_KEY]: flash }, ttl ?? DEFAULT_TTL);
}

/**
 * Stores previous-input (old) data in the session under `__flash.__old`.
 * Used to repopulate form fields after a failed validation.
 */
export async function writeOld(
  sessionId: string,
  store: SessionStore,
  dto: Record<string, unknown>,
  ttl?: number,
): Promise<void> {
  const session = (await store.get(sessionId)) ?? {};
  const flash = isPlainObject(session[FLASH_KEY])
    ? { ...(session[FLASH_KEY] as Record<string, unknown>) }
    : {};
  flash[OLD_KEY] = dto;
  await store.set(sessionId, { ...session, [FLASH_KEY]: flash }, ttl ?? DEFAULT_TTL);
}

// ---------------------------------------------------------------------------
// Read helper
// ---------------------------------------------------------------------------

/**
 * Reads the current flash from the session, removes it, and returns both
 * `flash` (key → string pairs) and `old` (arbitrary previous-input values).
 *
 * Calling this twice for the same session returns empty on the second call
 * (flash is consumed on first read).
 */
export async function readAndClearFlash(
  sessionId: string,
  store: SessionStore,
): Promise<{ flash: Record<string, string>; old: Record<string, unknown> }> {
  const session = await store.get(sessionId);
  if (!session) return { flash: {}, old: {} };

  const rawFlash = session[FLASH_KEY];
  if (!isPlainObject(rawFlash)) return { flash: {}, old: {} };

  const flashData = rawFlash as Record<string, unknown>;
  const old = isPlainObject(flashData[OLD_KEY])
    ? (flashData[OLD_KEY] as Record<string, unknown>)
    : {};

  // Extract string-valued keys (excluding __old) as the flash payload.
  const flash: Record<string, string> = {};
  for (const [key, val] of Object.entries(flashData)) {
    if (key !== OLD_KEY && typeof val === 'string') {
      flash[key] = val;
    }
  }

  // Clear __flash from the session; write back.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [FLASH_KEY]: _removed, ...restSession } = session;
  await store.set(sessionId, restSession, DEFAULT_TTL);

  return { flash, old };
}

// ---------------------------------------------------------------------------
// Sync helper
// ---------------------------------------------------------------------------

/**
 * Returns the value of a single old-input field from already-read old data.
 * Non-async — operates on the plain object returned by `readAndClearFlash`.
 */
export function getOld(old: Record<string, unknown>, key: string): string | undefined {
  const val = old[key];
  return typeof val === 'string' ? val : undefined;
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
