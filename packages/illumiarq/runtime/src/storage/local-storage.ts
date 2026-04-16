/**
 * LocalStorage — filesystem-backed storage driver.
 *
 * Stores files under a configurable root directory (default: storage/app/).
 * Node.js only. No additional packages required.
 *
 * Configure via config/storage.ts:
 *   driver: 'local'
 *   local: { root: './storage/app', baseUrl: 'https://yourapp.com/storage' }
 *
 * @example
 * // bootstrap/providers.ts
 * import { LocalStorage } from '@lumiarq/framework/runtime';
 * export const storage = new LocalStorage({ root: './storage/app', baseUrl: env.APP_URL + '/storage' });
 */
import type { StorageContract, StoredFile, PutOptions } from '@illumiarq/contracts';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink, access, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

export interface LocalStorageOptions {
  /** Absolute or relative path to storage root directory. Default: './storage/app' */
  root: string;
  /** Base URL for generating public file URLs. */
  baseUrl?: string;
}

export class LocalStorage implements StorageContract {
  private readonly root: string;
  private readonly baseUrl: string;

  constructor(opts: LocalStorageOptions) {
    this.root = opts.root;
    this.baseUrl = opts.baseUrl?.replace(/\/$/, '') ?? `file://${opts.root}`;
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
    return storedFile;
  }

  async get(path: string): Promise<Buffer | null> {
    try {
      return await readFile(join(this.root, path));
    } catch {
      return null;
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await unlink(join(this.root, path));
    } catch {
      /* file may not exist */
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(join(this.root, path));
      return true;
    } catch {
      return false;
    }
  }

  url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\//, '')}`;
  }

  async temporaryUrl(path: string, _expiry: Date): Promise<string> {
    // Local driver does not support signed URLs — return permanent URL.
    return this.url(path);
  }
}
