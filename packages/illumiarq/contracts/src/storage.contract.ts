export interface StoredFile {
  path: string;
  url: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, string>;
}

export interface PutOptions {
  visibility?: 'public' | 'private';
  metadata?: Record<string, string>;
  contentType?: string;
}

export interface StorageContract {
  put(path: string, file: Buffer | ReadableStream, options?: PutOptions): Promise<StoredFile>;
  get(path: string): Promise<Buffer | null>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  url(path: string): string;
  temporaryUrl(path: string, expiry: Date): Promise<string>;
}
