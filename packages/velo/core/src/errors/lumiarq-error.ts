/**
 * Base class for all LumiARQ framework errors.
 * All framework errors extend this — never use raw Error in framework code.
 */
export class LumiARQError extends Error {
  constructor(
    message: string,
    /** HTTP status code associated with this error */
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Restores correct prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
