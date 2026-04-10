export interface HttpEntry {
  method: string;
  path: string;
  status: number;
  durationMs: number;
}

export interface QueryEntry {
  sql: string;
  durationMs: number;
  bindings?: unknown[];
}

export interface QueryWarning {
  sql: string;
  count: number;
  type: 'n-plus-one';
}

export interface EventEntry {
  name: string;
  durationMs?: number;
  payload?: unknown;
}

export interface CacheEntry {
  operation: 'hit' | 'miss' | 'put' | 'forget';
  key: string;
  durationMs?: number;
}
