import type { HandlerType } from '../router/types.js';

export type { HandlerType };

export interface HandlerContext {
  req: {
    json<T = unknown>(): Promise<T>;
    text(): Promise<string>;
    header(name: string): string | undefined;
    param(name: string): string | undefined;
    query(name: string): string | undefined;
  };
  json<T = unknown>(data: T, status?: number): Response;
  text(data: string, status?: number): Response;
  html(data: string, status?: number): Response;
  get<T = unknown>(key: string): T;
  set<T = unknown>(key: string, value: T): void;
  bound<T = unknown>(name: string): T;
}
