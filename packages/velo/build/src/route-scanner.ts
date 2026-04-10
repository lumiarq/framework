import type { RouteDefinition } from '@velo/http';

/**
 * A route definition discovered from a module file.
 */
export interface DiscoveredRoute {
  /** Absolute path of the source file exporting this route. */
  filePath: string;
  /** The RouteDefinition extracted from the module export. */
  definition: RouteDefinition;
}

/**
 * A module record provided to the scanner.
 * The scanner is filesystem-agnostic — callers supply module records.
 */
export interface ModuleRecord {
  filePath: string;
  exports: Record<string, unknown>;
}

/**
 * Returns true when the given value looks like a RouteDefinition.
 * Used to filter module exports.
 */
function isRouteDefinition(value: unknown): value is RouteDefinition {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['path'] === 'string' &&
    typeof v['handler'] === 'function' &&
    (v['render'] === 'static' || v['render'] === 'dynamic')
  );
}

/**
 * Scans an array of module records and returns all valid RouteDefinitions.
 * The first export that passes `isRouteDefinition` per file is collected.
 *
 * @param modules - Module records to scan
 * @returns Discovered route definitions with their source file paths
 */
export function scanRouteModules(modules: ModuleRecord[]): DiscoveredRoute[] {
  const discovered: DiscoveredRoute[] = [];

  for (const mod of modules) {
    for (const value of Object.values(mod.exports)) {
      if (isRouteDefinition(value)) {
        discovered.push({ filePath: mod.filePath, definition: value });
        break; // one route per file
      }
    }
  }

  return discovered;
}
