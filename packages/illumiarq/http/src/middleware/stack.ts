/**
 * Middleware stack — manages an ordered collection of named middleware.
 *
 * Middleware is sorted by priority (descending — higher priority runs first).
 * Supports adding, removing, and retrieving middleware by name.
 */

import type { MiddlewareDefinition, MiddlewareFn } from '../types/http.types.js';

export class MiddlewareStack {
  private readonly _entries: MiddlewareDefinition[] = [];

  /** Add a middleware definition to the stack. */
  add(definition: MiddlewareDefinition): this {
    this._entries.push(definition);
    return this;
  }

  /** Remove a middleware by name. Returns true if removed. */
  remove(name: string): boolean {
    const idx = this._entries.findIndex((e) => e.name === name);
    if (idx === -1) return false;
    this._entries.splice(idx, 1);
    return true;
  }

  /** Check if a middleware with the given name exists. */
  has(name: string): boolean {
    return this._entries.some((e) => e.name === name);
  }

  /** Get all entries, sorted by priority descending (higher priority first). */
  entries(): readonly MiddlewareDefinition[] {
    return [...this._entries].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Returns all middleware handlers in priority order,
   * ready to pass into composeMiddleware().
   */
  handlers(): MiddlewareFn[] {
    return this.entries().map((e) => e.handler);
  }

  /** Number of middleware in the stack. */
  get size(): number {
    return this._entries.length;
  }
}
