import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { createLumiarqApp } from '../src/create-app.js';

describe('createLumiarqApp', () => {
  it('scaffolds api-only project with health route and env', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lumiarq-create-'));
    const result = createLumiarqApp({
      projectRoot: root,
      projectName: 'my-api',
      preset: 'api-only',
      skipInstall: true,
    });

    expect(result.preset).toBe('api-only');
    expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'bootstrap/entry.ts'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'src/modules/Health/http/routes/health.api.ts'))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(root, '.env'))).toBe(true);

    const env = fs.readFileSync(path.join(root, '.env'), 'utf8');
    expect(env).toContain('JWT_PRIVATE_KEY=');
    expect(env).toContain('SESSION_SECRET=');

    const loader = fs.readFileSync(
      path.join(root, 'src/storage/framework/cache/routes.loader.ts'),
      'utf8',
    );
    expect(loader).toContain('health.api');
  });

  it('full-stack includes welcome web route', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lumiarq-create-'));
    createLumiarqApp({
      projectRoot: root,
      projectName: 'my-full',
      preset: 'full-stack',
      skipInstall: true,
    });

    expect(fs.existsSync(path.join(root, 'src/modules/Welcome/http/routes/welcome.web.ts'))).toBe(
      true,
    );
  });

  it('rejects non-empty directory', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lumiarq-create-'));
    fs.writeFileSync(path.join(root, 'occupied.txt'), 'x');
    expect(() =>
      createLumiarqApp({ projectRoot: root, preset: 'api-only', skipInstall: true }),
    ).toThrow(/not empty/);
  });
});
