export interface RequestHelpers {
  query(name?: string): string | Record<string, string> | undefined;
  params(name?: string): string | Record<string, string> | undefined;
  body<T = unknown>(): Promise<T>;
}
