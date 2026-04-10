// ─── Application environment helper ──────────────────────────────────────────
class Application {
  environment() {
    return process.env['APP_ENV'] ?? 'local';
  }
  isLocal() {
    return this.environment() === 'local';
  }
  isTesting() {
    return this.environment() === 'testing';
  }
  isStaging() {
    return this.environment() === 'staging';
  }
  isProduction() {
    return this.environment() === 'production';
  }
  isEnvironment(...envs) {
    return envs.includes(this.environment());
  }
}
// Singleton instance — app() always returns the same object
const application = new Application();
export const app = () => application;
//# sourceMappingURL=app.js.map
