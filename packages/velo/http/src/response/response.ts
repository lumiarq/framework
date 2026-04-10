import type { ResponseJsonOptions, ResponseRedirectOptions } from './types.js';

/**
 * JSON response helper.
 */
export function json<T = unknown>(data: T, options: ResponseJsonOptions = {}): Response {
  const { status = 200, headers = {} } = options;
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Redirect response helper.
 */
export function redirect(location: string, options: ResponseRedirectOptions = {}): Response {
  const { status = 302, headers = {} } = options;
  return new Response(null, {
    status,
    headers: {
      Location: location,
      ...headers,
    },
  });
}
