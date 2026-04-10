// ---------------------------------------------------------------------------
// Cookie helpers — pure functions, no Hono dependency.
// ---------------------------------------------------------------------------

export interface CookieOptions {
  /** Default: true */
  httpOnly?: boolean;
  /** Default: 'Lax' */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /** Default: false */
  secure?: boolean;
  /** Cookie lifetime in seconds. */
  maxAge?: number;
  /** Absolute expiry date. */
  expires?: Date;
  /** Default: '/' */
  path?: string;
  domain?: string;
}

/**
 * Builds a `Set-Cookie` header value string from the given name, value, and options.
 *
 * @example
 * buildSetCookieHeader('token', 'abc123', { maxAge: 3600, secure: true })
 * // → 'token=abc123; HttpOnly; SameSite=Lax; Secure; Max-Age=3600; Path=/'
 */
export function buildSetCookieHeader(name: string, value: string, options?: CookieOptions): string {
  const httpOnly = options?.httpOnly ?? true;
  const sameSite = options?.sameSite ?? 'Lax';
  const secure = options?.secure ?? false;
  const path = options?.path ?? '/';

  const parts: string[] = [`${name}=${value}`];

  if (httpOnly) parts.push('HttpOnly');
  parts.push(`SameSite=${sameSite}`);
  if (secure) parts.push('Secure');
  if (options?.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options?.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  parts.push(`Path=${path}`);
  if (options?.domain) parts.push(`Domain=${options.domain}`);

  return parts.join('; ');
}

/**
 * Builds a `Set-Cookie` header value that immediately expires the named cookie.
 *
 * @example
 * buildClearCookieHeader('token')
 * // → 'token=; Max-Age=0; Path=/'
 */
export function buildClearCookieHeader(name: string, path?: string): string {
  return `${name}=; Max-Age=0; Path=${path ?? '/'}`;
}
