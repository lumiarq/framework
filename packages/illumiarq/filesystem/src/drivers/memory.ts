import type { FilesystemContract } from '@illumiarq/contracts';

export class MemoryFilesystemDriver implements FilesystemContract {
  private readonly store = new Map<string, Uint8Array>();

  async read(path: string): Promise<Uint8Array | null> {
    const bytes = this.store.get(path);
    return bytes ? bytes : null;
  }

  async write(path: string, content: Uint8Array | string): Promise<void> {
    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    this.store.set(path, bytes);
  }

  async delete(path: string): Promise<void> {
    this.store.delete(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.store.has(path);
  }

  async mkdirp(_dirPath: string): Promise<void> {
    // In-memory driver: directories are implicit.
  }
}
