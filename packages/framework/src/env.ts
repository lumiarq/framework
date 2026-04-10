// ─── Public environment store ─────────────────────────────────────────────────
// Call setPublicEnv() at bootstrap with the values you want to expose to the
// UI layer. Components then read them via usePublicEnv().

let _publicEnv: Record<string, string> = {};

/**
 * Sets the public environment variables that should be accessible in UI code.
 * Typically called once at application bootstrap before rendering.
 */
export function setPublicEnv(env: Record<string, string>): void {
  _publicEnv = env;
}

/**
 * Returns the public environment object previously set via setPublicEnv().
 *
 * @example
 * const { APP_ENV } = usePublicEnv()
 */
export function usePublicEnv<T = Record<string, string>>(): T {
  return _publicEnv as unknown as T;
}
