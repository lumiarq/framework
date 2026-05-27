import type { IRequest } from './irequest.js';

const DEFAULT_REQUEST_BASE = 'http://localhost';

/** Minimal request shape for URL parsing (Web `Request` or `IRequest`). */
export type RequestUrlSource = IRequest | Pick<Request, 'url'>;

/**
 * Parses a request URL safely on serverless runtimes where `req.url` may be relative.
 */
export function parseRequestUrl(req: RequestUrlSource, base = DEFAULT_REQUEST_BASE): URL {
  return new URL(req.url, base);
}
