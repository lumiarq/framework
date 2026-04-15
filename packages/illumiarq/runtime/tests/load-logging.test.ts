import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { getDefaultLoggingConfig, loadLoggingConfig } from '../src/config/load-logging.js';

describe('loadLoggingConfig', () => {
  it('returns default config when no config/logging file exists', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lumiarq-logging-default-'));
    const config = await loadLoggingConfig(root);
    expect(config.driver).toBe('console');
    expect(config.default).toBe('console');
    expect(config.channels?.console?.driver).toBe('console');
  });

  it('loads logging config from config/logging.json', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lumiarq-logging-json-'));
    const configDir = path.join(root, 'config');
    fs.mkdirSync(configDir, { recursive: true });

    fs.writeFileSync(
      path.join(configDir, 'logging.json'),
      JSON.stringify({
        level: 'debug',
        default: 'file',
        channels: {
          file: {
            driver: 'file',
            path: 'storage/logs/custom.log',
          },
        },
      }),
      'utf8',
    );

    const config = await loadLoggingConfig(root);
    expect(config.level).toBe('debug');
    expect(config.default).toBe('file');
    expect(config.channels?.file?.driver).toBe('file');
  });

  it('default config helper returns a stable baseline', () => {
    const config = getDefaultLoggingConfig();
    expect(config.level).toBe('info');
    expect(config.channels?.console?.driver).toBe('console');
  });
});