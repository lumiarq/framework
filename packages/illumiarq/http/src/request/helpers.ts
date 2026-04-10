import { HttpRequest } from './request.js';
import type { ParsedParams, ParsedQuery } from '../types/http.types.js';

export function query(req: Request, name?: string): string | string[] | ParsedQuery | undefined {
  return new HttpRequest(req).query(name);
}

export function params(
  req: Request,
  routeParams: ParsedParams = {},
  name?: string,
): string | ParsedParams | undefined {
  return new HttpRequest(req, routeParams).params(name);
}

export function body<T = unknown>(req: Request): Promise<T> {
  return new HttpRequest(req).body<T>();
}

function appendField(target: Record<string, unknown>, key: string, value: string): void {
  const existing = target[key];
  if (existing === undefined) {
    target[key] = value;
    return;
  }

  if (Array.isArray(existing)) {
    existing.push(value);
    return;
  }

  target[key] = [existing, value];
}

function parseMultipartTextFields(body: string, contentType: string): Record<string, unknown> {
  const parsed: Record<string, unknown> = {};
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];

  if (!boundary) return parsed;

  for (const rawPart of body.split(`--${boundary}`)) {
    const part = rawPart.trim();
    if (!part || part === '--') continue;

    const normalized = rawPart.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const separatorIndex = normalized.indexOf('\r\n\r\n');
    if (separatorIndex === -1) continue;

    const headerBlock = normalized.slice(0, separatorIndex);
    if (/filename=/i.test(headerBlock)) continue;

    const fieldName = headerBlock.match(/name="([^"]+)"/i)?.[1];
    if (!fieldName) continue;

    const value = normalized.slice(separatorIndex + 4).replace(/\r\n$/, '');
    appendField(parsed, fieldName, value);
  }

  return parsed;
}

async function readInputBody(req: Request): Promise<Record<string, unknown>> {
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const parsed = await req.clone().json();
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const text = await req.clone().text();
      const params = new URLSearchParams(text);
      const parsed: Record<string, unknown> = {};

      for (const key of new Set(params.keys())) {
        const values = params.getAll(key);
        parsed[key] = values.length === 1 ? values[0] : values;
      }

      return parsed;
    } catch {
      return {};
    }
  }

  if (contentType.includes('multipart/form-data')) {
    try {
      const text = await req.clone().text();
      return parseMultipartTextFields(text, contentType);
    } catch {
      return {};
    }
  }

  return {};
}

/**
 * Reads merged input from query string and request body.
 * When a key is provided, returns that value (query takes precedence, then body, then fallback).
 * When no key is provided, returns the full merged input object.
 */
export async function input(req: Request, key?: string, fallback?: unknown): Promise<unknown> {
  const url = new URL(req.url);
  const queryData: Record<string, unknown> = {};
  for (const k of url.searchParams.keys()) {
    const all = url.searchParams.getAll(k);
    queryData[k] = all.length === 1 ? all[0] : all;
  }

  const bodyData = await readInputBody(req);

  const merged: Record<string, unknown> = { ...bodyData, ...queryData };

  if (key === undefined) return merged;
  return Object.prototype.hasOwnProperty.call(merged, key) ? merged[key] : fallback;
}

/** Returns the value of a named request header, or `fallback` if absent. */
export function header(req: Request, name: string, fallback?: string): string | undefined {
  return req.headers.get(name) ?? fallback;
}

/**
 * Extracts the Bearer token from the Authorization header.
 * Returns `null` if the header is absent or uses a different scheme.
 */
export function bearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

/** Returns `true` if the client signals it accepts a JSON response (via Accept header). */
export function wantsJson(req: Request): boolean {
  const accept = req.headers.get('accept') ?? '';
  return accept.includes('application/json');
}

/** Returns `true` if the request body is JSON (via Content-Type header). */
export function expectsJson(req: Request): boolean {
  const contentType = req.headers.get('content-type') ?? '';
  return contentType.includes('application/json');
}

/** Returns the full URL string of the request. */
export function fullUrl(req: Request): string {
  return req.url;
}

/**
 * Returns the full URL with the given query parameters merged in.
 * Existing params with the same key are overwritten.
 */
export function fullUrlWithQuery(req: Request, patch: Record<string, string>): string {
  const url = new URL(req.url);
  for (const [k, v] of Object.entries(patch)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}
