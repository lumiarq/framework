import { pathToFileURL } from 'node:url';
const defaultImport = async (path) => import(pathToFileURL(path).href);
function isModuleDefinition(value) {
  return (
    typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string'
  );
}
export async function loadModule(entry, importFn = defaultImport) {
  const moduleExports = await importFn(entry.path);
  const candidate = moduleExports.default ?? moduleExports.module ?? moduleExports[entry.name];
  if (!isModuleDefinition(candidate)) {
    throw new Error(`Module at ${entry.path} does not export a valid ModuleDefinition`);
  }
  return candidate;
}
//# sourceMappingURL=load.js.map
