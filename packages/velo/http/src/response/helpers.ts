import { HTTP_STATUS_CODES, type HttpStatusCode } from './http-status-codes.js';
import { json } from './json.js';
import type { ResponseJsonOptions } from './types.js';

type ResponseOptions = Omit<ResponseJsonOptions, 'status'>;

function withStatus(status: HttpStatusCode, options: ResponseOptions = {}): ResponseJsonOptions {
  return {
    ...options,
    status,
  };
}

export function ok<T = unknown>(data: T, options: ResponseOptions = {}): Response {
  return json(data, withStatus(HTTP_STATUS_CODES.OK, options));
}

export function created<T = unknown>(data: T, options: ResponseOptions = {}): Response {
  return json(data, withStatus(HTTP_STATUS_CODES.CREATED, options));
}

export function accepted<T = unknown>(data: T, options: ResponseOptions = {}): Response {
  return json(data, withStatus(HTTP_STATUS_CODES.ACCEPTED, options));
}

export function noContent(options: ResponseOptions = {}): Response {
  return new Response(null, {
    status: HTTP_STATUS_CODES.NO_CONTENT,
    ...(options.headers ? { headers: options.headers } : {}),
  });
}

export function badRequest<T = unknown>(data: T, options: ResponseOptions = {}): Response {
  return json(data, withStatus(HTTP_STATUS_CODES.BAD_REQUEST, options));
}

export function unauthorized<T = unknown>(data: T, options: ResponseOptions = {}): Response {
  return json(data, withStatus(HTTP_STATUS_CODES.UNAUTHORIZED, options));
}

export function forbidden<T = unknown>(data: T, options: ResponseOptions = {}): Response {
  return json(data, withStatus(HTTP_STATUS_CODES.FORBIDDEN, options));
}

export function notFound<T = unknown>(data: T, options: ResponseOptions = {}): Response {
  return json(data, withStatus(HTTP_STATUS_CODES.NOT_FOUND, options));
}

export function unprocessableEntity<T = unknown>(data: T, options: ResponseOptions = {}): Response {
  return json(data, withStatus(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY, options));
}

export function serverError<T = unknown>(data: T, options: ResponseOptions = {}): Response {
  return json(data, withStatus(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, options));
}
