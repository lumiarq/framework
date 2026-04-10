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
export class BaseSeeder {
  db;
  constructor(db) {
    this.db = db;
  }
}
//# sourceMappingURL=base-seeder.js.map
