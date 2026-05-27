// ─── Application environment helper ──────────────────────────────────────────
// Safe before boot(): uses configureAppEnvironment (set by runtime on Node).
// Portable default is "local" when no reader is configured.

export type AppEnvironment = 'local' | 'testing' | 'staging' | 'production';

let environmentReader: (() => AppEnvironment) | undefined;

/** Wire APP_ENV (or equivalent) from the host runtime — call from boot(), not from portable core. */
export function configureAppEnvironment(reader: () => AppEnvironment): void {
  environmentReader = reader;
}

/** Reset reader (tests). */
export function resetAppEnvironment(): void {
  environmentReader = undefined;
}

class Application {
  environment(): AppEnvironment {
    return environmentReader?.() ?? 'local';
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

const application = new Application();

export const app = (): Application => application;
