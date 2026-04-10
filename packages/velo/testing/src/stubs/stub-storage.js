import { createWriteStream } from 'node:fs';
import { mkdir, unlink, access, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
export class StubStorage {
  root;
  logger;
  constructor(opts) {
    this.root = opts.root;
    this.logger = opts.logger;
  }
  async put(path, file, options) {
    const full = join(this.root, path);
    await mkdir(dirname(full), { recursive: true });
    const readable = file instanceof Buffer ? Readable.from(file) : Readable.fromWeb(file);
    await pipeline(readable, createWriteStream(full));
    const size = file instanceof Buffer ? file.length : 0;
    const storedFile = {
      path,
      url: this.url(path),
      size,
      mimeType: options?.contentType ?? 'application/octet-stream',
    };
    if (options?.metadata !== undefined) {
      storedFile.metadata = options.metadata;
    }
    this.logger.debug('[StubStorage] put', { path, size });
    return storedFile;
  }
  async get(path) {
    const full = join(this.root, path);
    try {
      return await readFile(full);
    } catch {
      return null;
    }
  }
  async delete(path) {
    const full = join(this.root, path);
    try {
      await unlink(full);
    } catch {
      /* file may not exist */
    }
  }
  async exists(path) {
    const full = join(this.root, path);
    try {
      await access(full);
      return true;
    } catch {
      return false;
    }
  }
  url(path) {
    return `file://${join(this.root, path)}`;
  }
  async temporaryUrl(path, _expiry) {
    return this.url(path);
  }
}
//# sourceMappingURL=stub-storage.js.map
