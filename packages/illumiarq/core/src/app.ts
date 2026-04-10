// ─── Application environment helper ──────────────────────────────────────────

export type AppEnvironment = 'local' | 'testing' | 'staging' | 'production';

class Application {
  environment(): AppEnvironment {
    return (process.env['APP_ENV'] ?? 'local') as AppEnvironment;
  }

  isLocal(): boolean {
    return this.environment() === 'local';
  }

  isTesting(): boolean {
    return this.environment() === 'testing';
  }

  isStaging(): boolean {
    return this.environment() === 'staging';
  }

  isProduction(): boolean {
    return this.environment() === 'production';
  }

  isEnvironment(...envs: AppEnvironment[]): boolean {
    return envs.includes(this.environment());
  }
}

// Singleton instance — app() always returns the same object
const application = new Application();

export const app = (): Application => application;
