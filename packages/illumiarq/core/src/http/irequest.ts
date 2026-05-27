/**
 * Platform-neutral request surface for framework middleware and boot.
 * Implementations: Web API Request, Node IncomingMessage (+ url), Hono raw request.
 *
 * @see ADR-001 — IRequest migration; consumers must not depend on Node-only types.
 */

export type IRequestHeaders = Headers | Record<string, string | string[] | undefined>;

export interface IRequest {
  readonly method: string;
  /** Absolute or origin-relative URL string (see parseRequestUrl). */
  readonly url: string;
  readonly headers: IRequestHeaders;
}
