import type { FilesystemContract } from '@illumiarq/contracts';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { Buffer } from 'node:buffer';

export type NodeFilesystemOptions = {
  /** Root directory where paths passed to the driver are resolved. */
  root: string;
};

function toRelativePath(path: string): string {
  // Prevent accidental absolute writes; keep it simple for now.
  return normalize(path)
    .replace(/^(\.\.(\/|\\))+/, '')
    .replace(/^\/+/, '');
}

export class NodeFilesystemDriver implements FilesystemContract {
  private readonly root: string;

  constructor(opts: NodeFilesystemOptions) {
    this.root = opts.root;
  }

  private fullPath(path: string): string {
    return join(this.root, toRelativePath(path));
  }

  async read(path: string): Promise<Uint8Array | null> {
    try {
      const full = this.fullPath(path);
      const buf = await readFile(full);
      return new Uint8Array(buf);
    } catch {
      return null;
    }
  }

  async write(path: string, content: Uint8Array | string): Promise<void> {
    const full = this.fullPath(path);
    await mkdir(dirname(full), { recursive: true });

    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    await writeFile(full, Buffer.from(bytes));
  }

  async delete(path: string): Promise<void> {
    const full = this.fullPath(path);
    try {
      await rm(full);
    } catch {
      // ignore missing
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await stat(this.fullPath(path));
      return true;
    } catch {
      return false;
    }
  }

  async mkdirp(dirPath: string): Promise<void> {
    await mkdir(this.fullPath(dirPath), { recursive: true });
  }
}
