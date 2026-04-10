import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
/**
 * Checks for a .maintenance sentinel file at the project root.
 * Returns 503 with Retry-After: 60 if the app is in maintenance mode,
 * unless the client IP is in allowedIps or provides the correct ?secret= param.
 */
export function maintenanceMiddleware(sentinelPath) {
  const filePath = sentinelPath ?? resolve(process.cwd(), '.maintenance');
  return async (req, next) => {
    if (!existsSync(filePath)) return next();
    let sentinel = {};
    try {
      sentinel = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      // Malformed JSON — treat as empty sentinel.
    }
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
    if (sentinel.allowedIps && clientIp && sentinel.allowedIps.includes(clientIp)) {
      return next();
    }
    const url = new URL(req.url);
    const secretParam = url.searchParams.get('secret');
    if (sentinel.secret && secretParam === sentinel.secret) {
      return next();
    }
    const message =
      sentinel.message ?? 'Service is temporarily unavailable. Please try again later.';
    return new Response(JSON.stringify({ message }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  };
}
//# sourceMappingURL=maintenance.js.map
