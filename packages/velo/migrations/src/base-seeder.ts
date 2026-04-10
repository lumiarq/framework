import type { LibSQLDatabase } from '@velo/database';

/**
 * Abstract base class for all database seeders.
 * Extend this class — NEVER modify it (OCP).
 *
 * @example
 * export class UserSeeder extends BaseSeeder {
 *   async run(): Promise<void> {
 *     await this.db.insert(users).values({ id: '1', email: 'admin@example.com' })
 *   }
 * }
 */
export abstract class BaseSeeder {
  constructor(protected readonly db: LibSQLDatabase) {}

  /** Execute the seeder. Must be idempotent. */
  abstract run(): Promise<void>;
}
