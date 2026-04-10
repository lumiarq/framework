import { randomUUID } from 'node:crypto';

/**
 * Returns the x-request-id header from the incoming request if present,
 * otherwise generates a new UUID v4.
 *
 * Core is HTTP-framework agnostic — this utility operates on plain header maps.
 *
 * @param headers - Map of incoming request headers (lowercased keys)
 * @returns The request ID string
 */
export function generateRequestId(headers: Record<string, string | undefined>): string {
  return headers['x-request-id'] ?? randomUUID();
}
