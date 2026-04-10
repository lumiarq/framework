import { LumiARQError } from './lumiarq-error.js';
/** Thrown by an Action when a business rule is violated. */
export class BusinessRuleError extends LumiARQError {
  constructor(message) {
    super(message, 409);
  }
}
/** Thrown when an operation conflicts with existing state. */
export class ConflictError extends LumiARQError {
  constructor(resource = 'Resource') {
    super(`${resource} already exists`, 409);
  }
}
//# sourceMappingURL=action-errors.js.map
