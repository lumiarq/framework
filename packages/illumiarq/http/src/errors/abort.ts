import { HttpError } from './http-errors.js';
import type { HttpStatusCode } from '../response/http-status-codes.js';

export function abort(status: HttpStatusCode, message?: string): never {
  throw new HttpError(message ?? `HTTP ${status}`, status);
}

export function abortIf(condition: boolean, status: HttpStatusCode, message?: string): void {
  if (condition) {
    abort(status, message);
  }
}

export function abortUnless(condition: boolean, status: HttpStatusCode, message?: string): void {
  if (!condition) {
    abort(status, message);
  }
}
