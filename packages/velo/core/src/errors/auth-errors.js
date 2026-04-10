import { LumiARQError } from './lumiarq-error.js';
/**
 * Thrown when a request is not authenticated.
 * Message is deliberately generic — never expose the specific reason.
 */
export class AuthenticationError extends LumiARQError {
  constructor() {
    super('Unauthorized', 401);
  }
}
/**
 * Thrown when an authenticated user lacks permission for an action.
 * Message is deliberately generic — never expose the specific reason.
 */
export class ForbiddenError extends LumiARQError {
  constructor() {
    super('Unauthorized', 403);
  }
}
//# sourceMappingURL=auth-errors.js.map
