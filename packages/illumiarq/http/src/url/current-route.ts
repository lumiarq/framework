/**
 * Returns current route name/path from request context metadata when available.
 */
export function currentRoute(req: Request): string | null {
  return req.headers.get('x-lumiarq-route') ?? null;
}
