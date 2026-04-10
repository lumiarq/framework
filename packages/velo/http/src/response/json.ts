import type { ResponseJsonOptions } from './types.js';

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
