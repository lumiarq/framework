import type { LibSQLDatabase } from './connection.js';

/**
 * Abstract base class for database seeders.
 * Extend and implement run() to seed your module's data.
 *
 * @example
 * class UserSeeder extends BaseSeeder {
 *   async run() {
 *     await this.db.insert(users).values([...]);
 *   }
 * }
 */
export abstract class BaseSeeder {
  constructor(protected readonly db: LibSQLDatabase) {}

  /** Execute the seeder. */
  abstract run(): Promise<void>;
}
