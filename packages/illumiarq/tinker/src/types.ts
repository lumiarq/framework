export interface TinkerConfig {
  cwd?: string;
  prompt?: string;
  useGlobal?: boolean;
  inject?: Record<string, unknown>;
}
