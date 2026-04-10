import { rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export async function invalidateManifest(
  cwd = process.cwd(),
  manifestPath?: string,
): Promise<void> {
  const target = resolve(
    manifestPath ?? join(resolve(cwd), 'storage/framework/cache/modules.manifest.json'),
  );
  await rm(target, { force: true });
}
