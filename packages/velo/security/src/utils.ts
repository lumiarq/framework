/** Returns a new Response with extra headers merged in (immutable). */
export function withHeaders(res: Response, extra: Record<string, string>): Response {
  const headers = new Headers(res.headers);
  for (const [key, val] of Object.entries(extra)) headers.set(key, val);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
