export type FileBytes = Uint8Array;

export interface FilesystemContract {
  read(path: string): Promise<FileBytes | null>;
  write(path: string, content: FileBytes | string): Promise<void>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdirp(dirPath: string): Promise<void>;
}
