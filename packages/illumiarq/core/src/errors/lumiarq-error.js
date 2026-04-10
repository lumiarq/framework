/**
 * Base class for all LumiARQ framework errors.
 * All framework errors extend this — never use raw Error in framework code.
 */
export class LumiARQError extends Error {
  statusCode;
  constructor(
    message,
    /** HTTP status code associated with this error */
    statusCode = 500,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    // Restores correct prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
//# sourceMappingURL=lumiarq-error.js.map
