/**
 * RedisCacheDriver — Redis-backed cache driver via ioredis.
 *
 * Node.js only. Requires `ioredis`:
 *   pnpm add ioredis
 *
 * Configure via config/cache.ts:
 *   driver: 'redis'
 *   redis: { host, port, password?, db?, keyPrefix? }
 *
 * @example
 * // bootstrap/providers.ts
 * import { RedisCacheDriver } from '@illumiarq/cache';
 * export const cache = new RedisCacheDriver({
 *   host: env.REDIS_HOST,
 *   port: 6379,
 *   keyPrefix: 'myapp:cache:',
 * });
 */
import type { CacheContract } from '@illumiarq/contracts';

export interface RedisCacheOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

// Minimal surface of ioredis.Redis we need
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(key: string): Promise<number>;
  quit(): Promise<'OK'>;
}

type RedisCtor = new (opts: Record<string, unknown>) => RedisClient;

async function createRedisClient(opts: RedisCacheOptions): Promise<RedisClient> {
  let IoRedis: { default: RedisCtor } | RedisCtor;
  try {
    IoRedis = (await import('ioredis')) as unknown as { default: RedisCtor };
  } catch {
    throw new Error('[RedisCacheDriver] ioredis is not installed. Run: pnpm add ioredis');
  }
  // Handle both default export and named export shapes
  const Ctor: RedisCtor =
    typeof IoRedis === 'function' ? IoRedis : (IoRedis as { default: RedisCtor }).default;
  return new Ctor({
    host: opts.host,
    port: opts.port,
    password: opts.password,
    db: opts.db ?? 0,
    keyPrefix: opts.keyPrefix ?? '',
  });
}

export class RedisCacheDriver implements CacheContract {
  private readonly opts: RedisCacheOptions;
  private client: RedisClient | null = null;

  constructor(opts: RedisCacheOptions) {
    this.opts = opts;
  }

  private async getClient(): Promise<RedisClient> {
    if (!this.client) {
      this.client = await createRedisClient(this.opts);
    }
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    const redis = await this.getClient();
    const raw = await redis.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const redis = await this.getClient();
    const serialized = JSON.stringify(value);
    if (ttl && ttl > 0) {
      await redis.set(key, serialized, 'EX', ttl);
    } else {
      await redis.set(key, serialized);
    }
  }

  async forget(key: string): Promise<void> {
    const redis = await this.getClient();
    await redis.del(key);
  }

  async remember<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== null) return existing;
    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  /** Cleanly close the Redis connection. */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}
