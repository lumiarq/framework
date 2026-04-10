// ---------------------------------------------------------------------------
// Back helper — safe redirect to the Referer URL.
// ---------------------------------------------------------------------------
/**
 * Returns a 302 redirect `Response` targeting the `Referer` header when it
 * is same-origin relative to `appUrl`, otherwise falls back to `fallback`.
 *
 * Rules:
 * - Missing Referer → use fallback.
 * - Invalid Referer URL → use fallback.
 * - Cross-origin Referer → use fallback.
 * - Empty fallback → redirect to '/'.
 *
 * @param req      - The incoming request.
 * @param fallback - Fallback path/URL (e.g. '/dashboard'). Use '' or '/' for root.
 * @param appUrl   - The canonical application URL used for origin comparison.
 */
export function buildBackResponse(req, fallback, appUrl) {
  const safeTarget = fallback || '/';
  const referer = req.headers.get('referer') ?? '';
  let redirectTo = safeTarget;
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      const appOrigin = new URL(appUrl).origin;
      if (refererOrigin === appOrigin) {
        redirectTo = referer;
      }
    } catch {
      // Invalid URL — keep fallback.
    }
  }
  return new Response(null, {
    status: 302,
    headers: { Location: redirectTo },
  });
}
//# sourceMappingURL=back.js.map
