export interface CacheContract {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  forget(key: string): Promise<void>;
  remember<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T>;
}
