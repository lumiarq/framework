import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_LOGGING_CONFIG_PATH = 'config/logging.ts';

export type ScaffoldFile = {
  path: string;
  content: string;
};

export function createDefaultLoggingConfigSource(): string {
  return `export default {
  level: 'info',
  default: 'console',
  prettify: process.env.NODE_ENV !== 'production',
  channels: {
    console: {
      driver: 'console',
    },
  },
} as const;
`;
}

export function getDefaultScaffoldFiles(): ScaffoldFile[] {
  return [
    {
      path: DEFAULT_LOGGING_CONFIG_PATH,
      content: createDefaultLoggingConfigSource(),
    },
  ];
}

export function writeScaffoldFiles(projectRoot: string, files: ScaffoldFile[]): void {
  for (const file of files) {
    const absolutePath = path.join(projectRoot, file.path);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, file.content, 'utf8');
  }
}