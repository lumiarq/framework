import type { ParsedParams, ParsedQuery } from '../types/http.types.js';

/**
 * Request abstraction over the Web Request object.
 */
export class HttpRequest {
  constructor(
    private readonly request: Request,
    private readonly routeParams: ParsedParams = {},
  ) {}

  raw(): Request {
    return this.request;
  }

  params(name?: string): string | ParsedParams | undefined {
    if (!name) return this.routeParams;
    return this.routeParams[name];
  }

  query(name?: string): string | string[] | ParsedQuery | undefined {
    const url = new URL(this.request.url);
    const values = url.searchParams.getAll(name ?? '');

    if (name) {
      if (values.length === 0) return undefined;
      if (values.length === 1) return values[0];
      return values;
    }

    const parsed: ParsedQuery = {};
    for (const key of url.searchParams.keys()) {
      const all = url.searchParams.getAll(key);
      parsed[key] = all.length <= 1 ? all[0] : all;
    }
    return parsed;
  }

  async body<T = unknown>(): Promise<T> {
    const contentType = this.request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await this.request.json()) as T;
    }
    return (await this.request.text()) as T;
  }
}
