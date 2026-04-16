import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOGGING_CONFIG_PATH,
  createDefaultLoggingConfigSource,
  getDefaultScaffoldFiles,
  writeScaffoldFiles,
} from '../src/scaffold.js';

describe('create-lumiarq-app scaffold defaults', () => {
  it('provides a default logging config file path', () => {
    expect(DEFAULT_LOGGING_CONFIG_PATH).toBe('config/logging.ts');
  });

  it('generates logging config source with console defaults', () => {
    const source = createDefaultLoggingConfigSource();
    expect(source).toContain("default: 'console'");
    expect(source).toContain("driver: 'console'");
  });

  it('includes config/logging.ts in scaffold files', () => {
    const files = getDefaultScaffoldFiles();
    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('config/logging.ts');
    expect(files[0]?.content).toContain("level: 'info'");
  });

  it('writes scaffold files to the target project root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lumiarq-scaffold-'));
    const files = getDefaultScaffoldFiles();

    writeScaffoldFiles(root, files);

    const written = path.join(root, DEFAULT_LOGGING_CONFIG_PATH);
    expect(fs.existsSync(written)).toBe(true);
    expect(fs.readFileSync(written, 'utf8')).toContain("default: 'console'");
  });
});
