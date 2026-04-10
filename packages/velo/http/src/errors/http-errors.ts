/** Base HTTP/package error. */
export class HttpError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export class MissingRenderStrategyError extends HttpError {
  constructor(path: string) {
    super(
      `Web route \"${path}\" is missing a required render declaration ('static' | 'dynamic').`,
      500,
    );
    this.name = 'MissingRenderStrategyError';
  }
}

export class InvalidApiRouteError extends HttpError {
  constructor(path: string, field: string) {
    super(
      `API route \"${path}\" must not declare \"${field}\" — that field is for web routes only.`,
      500,
    );
    this.name = 'InvalidApiRouteError';
  }
}

export class DuplicateRouteError extends HttpError {
  constructor(method: string, path: string) {
    super(`Duplicate route: ${method} ${path} is registered more than once.`, 500);
    this.name = 'DuplicateRouteError';
  }
}

export class MissingMetaError extends HttpError {
  constructor(path: string) {
    super(`Public web route \"${path}\" is missing a required meta() function.`, 500);
    this.name = 'MissingMetaError';
  }
}

export class RouteNotFoundError extends Error {
  constructor(name: string) {
    super(`No route registered with name \"${name}\".`);
    this.name = 'RouteNotFoundError';
  }
}
