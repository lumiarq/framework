/**
 * Framework built-in middleware.
 *
 * Importing this module registers all LumiARQ built-in middleware into the
 * global registry so they can be referenced by name in route definitions:
 *
 * ```ts
 * Route.get('/dashboard', handler, { middleware: ['lumiarq.auth'] })
 * Route.post('/submit', handler, { middleware: ['lumiarq.csrf'] })
 * Route.post('/login', handler, { middleware: ['lumiarq.throttle'] })
 * ```
 *
 * This file is imported automatically by the framework's boot.ts — you do not
 * need to import it manually in application code.
 */

export { authMiddleware } from './auth.js';
export { csrfMiddleware } from './csrf.js';
export { throttleMiddleware } from './throttle.js';
