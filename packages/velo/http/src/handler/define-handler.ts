import type { HandlerType } from '../router/types.js';

/**
 * Defines an HTTP handler — the entry point for every route.
 */
export function defineHandler(fn: HandlerType): HandlerType {
  return fn;
}
