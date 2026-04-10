import type { HttpStatusCode } from './http-status-codes.js';

export interface ResponseJsonOptions {
  status?: HttpStatusCode;
  headers?: Record<string, string>;
}

export interface ResponseRedirectOptions {
  status?: 301 | 302 | 303 | 307 | 308;
  headers?: Record<string, string>;
}
