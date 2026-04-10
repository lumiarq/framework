import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
function emptyManifest() {
  return {
    version: '1.0.0',
    generatedAt: new Date(0).toISOString(),
    autoDiscovered: true,
    modules: [],
  };
}
export async function getModuleManifest(options = {}) {
  const cwd = resolve(options.cwd ?? process.cwd());
  const manifestPath = resolve(
    options.manifestPath ?? join(cwd, 'storage/framework/cache/modules.manifest.json'),
  );
  try {
    const content = await readFile(manifestPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return emptyManifest();
  }
}
//# sourceMappingURL=get-manifest.js.map
