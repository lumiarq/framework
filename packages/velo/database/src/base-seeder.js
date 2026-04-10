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
export class BaseSeeder {
  db;
  constructor(db) {
    this.db = db;
  }
}
//# sourceMappingURL=base-seeder.js.map
