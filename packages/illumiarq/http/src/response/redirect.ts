import type { ResponseRedirectOptions } from './types.js';

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
