import type { MiddlewareFn } from '../middleware-pipeline.js';
import type { SessionStore } from '../session/store.js';
import { readAndClearFlash } from '../helpers/flash.js';

export interface FlashMiddlewareOptions {
  sessionStore: SessionStore;
}

/**
 * Flash middleware — reads `__flash` from the session at the start of each
 * request, clears it (flash survives exactly one transition), and injects the
 * payload into the `x-flash-data` response header as base64-encoded JSON.
 *
 * The view layer (or downstream tooling) can decode the header:
 * ```ts
 * const raw     = res.headers.get('x-flash-data') ?? '';
 * const payload = JSON.parse(Buffer.from(raw, 'base64').toString());
 * // payload.flash — Record<string, string>
 * // payload.old   — Record<string, unknown>
 * ```
 *
 * The header is NOT set when no session is found, so handlers can test for
 * its presence to determine whether flash data was available.
 */
export function flashMiddleware(options: FlashMiddlewareOptions): MiddlewareFn {
  return async (req, next) => {
    const sessionId = deriveSessionId(req);

    if (!sessionId) return next();

    const { flash, old } = await readAndClearFlash(sessionId, options.sessionStore);

    const res = await next();
    const encoded = Buffer.from(JSON.stringify({ flash, old })).toString('base64');

    const headers = new Headers(res.headers);
    headers.set('x-flash-data', encoded);

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  };
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

/**
 * Extracts the session ID from the `x-session-id` header (set by sessionMiddleware).
 * Falls back to the `lumiarq_session` cookie for standalone usage.
 */
function deriveSessionId(req: Request): string | null {
  const header = req.headers.get('x-session-id');
  if (header) return header;

  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(/lumiarq_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : null;
}
