import type { MiddlewareFn } from './types.js';
import { withHeaders } from './utils.js';

export interface TrustProxiesOptions {
  trust: string[] | '*';
}

/**
 * Reads X-Forwarded-For and X-Forwarded-Proto from trusted proxies and
 * normalises them into x-real-ip and x-forwarded-proto response headers.
 * Must run as the FIRST middleware in the pipeline.
 */
export function trustProxiesMiddleware(options: TrustProxiesOptions): MiddlewareFn {
  return async (req, next) => {
    const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
    const forwardedProto = req.headers.get('x-forwarded-proto') ?? '';

    const realIp = forwardedFor.split(',')[0]?.trim() ?? '';
    const proxyIp = forwardedFor.split(',').pop()?.trim() ?? '';
    const trusted =
      options.trust === '*' || options.trust.includes(proxyIp) || options.trust.includes(realIp);

    if (!trusted) return next();

    const res = await next();
    const extra: Record<string, string> = {};
    if (realIp) extra['x-real-ip'] = realIp;
    if (forwardedProto) extra['x-forwarded-proto'] = forwardedProto;
    extra['x-is-secure'] = forwardedProto === 'https' ? '1' : '0';

    return withHeaders(res, extra);
  };
}
