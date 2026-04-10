/**
 * Returns true when the given value looks like a RouteDefinition.
 * Used to filter module exports.
 */
function isRouteDefinition(value) {
  if (typeof value !== 'object' || value === null) return false;
  const v = value;
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
export function scanRouteModules(modules) {
  const discovered = [];
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
//# sourceMappingURL=route-scanner.js.map
