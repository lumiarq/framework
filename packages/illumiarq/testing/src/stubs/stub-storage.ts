// ─── StubStorage — reads/writes local filesystem ─────────────────────────────
import type { StorageContract, StoredFile, PutOptions } from '@illumiarq/contracts';
import type { LoggerContract } from '@illumiarq/contracts';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink, access, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

export interface StubStorageOptions {
  root: string;
  logger: LoggerContract;
}

export class StubStorage implements StorageContract {
  private readonly root: string;
  private readonly logger: LoggerContract;

  constructor(opts: StubStorageOptions) {
    this.root = opts.root;
    this.logger = opts.logger;
  }

  async put(
    path: string,
    file: Buffer | ReadableStream,
    options?: PutOptions,
  ): Promise<StoredFile> {
    const full = join(this.root, path);
    await mkdir(dirname(full), { recursive: true });

    const readable =
      file instanceof Buffer
        ? Readable.from(file)
        : Readable.fromWeb(file as unknown as NodeReadableStream<Uint8Array>);

    await pipeline(readable, createWriteStream(full));

    const size = file instanceof Buffer ? file.length : 0;

    const storedFile: StoredFile = {
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

  async get(path: string): Promise<Buffer | null> {
    const full = join(this.root, path);
    try {
      return await readFile(full);
    } catch {
      return null;
    }
  }

  async delete(path: string): Promise<void> {
    const full = join(this.root, path);
    try {
      await unlink(full);
    } catch {
      /* file may not exist */
    }
  }

  async exists(path: string): Promise<boolean> {
    const full = join(this.root, path);
    try {
      await access(full);
      return true;
    } catch {
      return false;
    }
  }

  url(path: string): string {
    return `file://${join(this.root, path)}`;
  }

  async temporaryUrl(path: string, _expiry: Date): Promise<string> {
    return this.url(path);
  }
}
