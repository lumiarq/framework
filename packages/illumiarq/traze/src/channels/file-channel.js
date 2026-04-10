import { appendFile } from 'node:fs/promises';
export function createFileChannel(options) {
  return {
    async handle(entry) {
      if (!options.path) {
        throw new Error('createFileChannel requires a path option.');
      }
      const payload = options.pretty ? JSON.stringify(entry, null, 2) : JSON.stringify(entry);
      await appendFile(options.path, `${payload}\n`, 'utf8');
    },
  };
}
//# sourceMappingURL=file-channel.js.map
