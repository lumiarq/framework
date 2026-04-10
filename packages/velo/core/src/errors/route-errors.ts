import { LumiARQError } from './lumiarq-error.js';

/** Thrown at router startup when a .web.ts route is missing a render declaration. */
export class MissingRenderStrategyError extends LumiARQError {
  constructor(path: string) {
    super(
      `Web route "${path}" is missing a required render declaration ('static' | 'dynamic').`,
      500,
    );
  }
}

/** Thrown at router startup when a .api.ts route declares render, meta, or loaders. */
export class InvalidApiRouteError extends LumiARQError {
  constructor(path: string, field: string) {
    super(
      `API route "${path}" must not declare "${field}" — that field is for web routes only.`,
      500,
    );
  }
}

/** Thrown at router startup when two routes share the same method + path. */
export class DuplicateRouteError extends LumiARQError {
  constructor(method: string, path: string) {
    super(`Duplicate route: ${method} ${path} is registered more than once.`, 500);
  }
}

/** Thrown at router startup when a public web route is missing a meta() function. */
export class MissingMetaError extends LumiARQError {
  constructor(path: string) {
    super(`Public web route "${path}" is missing a required meta() function.`, 500);
  }
}

/** Thrown by route() when no route with the given name has been registered. */
export class RouteNotFoundError extends Error {
  constructor(name: string) {
    super(`No route registered with name "${name}".`);
    this.name = 'RouteNotFoundError';
  }
}
