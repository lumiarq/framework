import type { KeyValueStorageContract, FilesystemContract } from '@illumiarq/contracts';
import { NodeFilesystemDriver } from '@illumiarq/filesystem';

export type NodeKeyValueStorageOptions = {
  /** Root directory where the underlying filesystem driver stores data. */
  root: string;
  /** Subdirectory name under the filesystem root. Default: `kv`. */
  kvDir?: string;
};

function kvPath(kvDir: string, key: string): string {
  // Encode the key so it can safely map to a single filename.
  return `${kvDir}/${encodeURIComponent(key)}.json`;
}

export class NodeKeyValueStorageDriver implements KeyValueStorageContract {
  private readonly filesystem: FilesystemContract;
  private readonly kvDir: string;

  constructor(opts: NodeKeyValueStorageOptions) {
    this.kvDir = opts.kvDir ?? 'kv';
    this.filesystem = new NodeFilesystemDriver({ root: opts.root });
  }

  async get<T>(key: string): Promise<T | null> {
    const path = kvPath(this.kvDir, key);
    const bytes = await this.filesystem.read(path);
    if (!bytes) return null;

    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const path = kvPath(this.kvDir, key);
    const text = JSON.stringify(value);
    await this.filesystem.write(path, text);
  }

  async delete(key: string): Promise<void> {
    const path = kvPath(this.kvDir, key);
    await this.filesystem.delete(path);
  }

  async exists(key: string): Promise<boolean> {
    const path = kvPath(this.kvDir, key);
    return this.filesystem.exists(path);
  }
}
