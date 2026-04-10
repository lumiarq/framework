import { LumiARQError } from './lumiarq-error.js';
/** Thrown when the application is missing required bootstrap configuration. */
export class ConfigurationError extends LumiARQError {
  constructor(message) {
    super(message, 500);
  }
}
//# sourceMappingURL=configuration-error.js.map
