import { LumiARQError } from './lumiarq-error.js';
/** Thrown when a requested resource does not exist. */
export class NotFoundError extends LumiARQError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}
/** Thrown when input fails schema validation. */
export class ValidationError extends LumiARQError {
  constructor(message = 'Validation failed') {
    super(message, 422);
  }
}
//# sourceMappingURL=domain-errors.js.map
