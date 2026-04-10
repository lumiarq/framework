import type { MiddlewareFn, CorsOptions } from './types.js';
import { withHeaders } from './utils.js';

export type { CorsOptions };

/**
 * Cross-Origin Resource Sharing middleware.
 * Handles preflight OPTIONS requests and annotates responses with CORS headers.
 */
export function corsMiddleware(options: CorsOptions): MiddlewareFn {
  return async (req, next) => {
    const incoming = req.headers.get('origin') ?? '';
    const allowed = resolveOrigin(options.origin, incoming);
    const corsH = buildCorsHeaders(options, allowed);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsH });
    }

    const headersObject: Record<string, string> = {};
    corsH.forEach((value, key) => {
      headersObject[key] = value;
    });

    return withHeaders(await next(), headersObject);
  };
}

function resolveOrigin(policy: string | string[] | '*', incoming: string): string {
  if (policy === '*') return '*';
  if (typeof policy === 'string') return policy === incoming ? incoming : '';
  return (policy as string[]).includes(incoming) ? incoming : '';
}

function buildCorsHeaders(options: CorsOptions, origin: string): Headers {
  const h = new Headers();
  if (origin) h.set('Access-Control-Allow-Origin', origin);
  const methods = options.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  h.set('Access-Control-Allow-Methods', methods.join(', '));
  const allowed = options.allowedHeaders ?? ['Content-Type', 'Authorization'];
  h.set('Access-Control-Allow-Headers', allowed.join(', '));
  if (options.credentials) h.set('Access-Control-Allow-Credentials', 'true');
  return h;
}
