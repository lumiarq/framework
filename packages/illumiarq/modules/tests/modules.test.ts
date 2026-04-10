import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { SchedulerContract } from '@illumiarq/contracts';
import {
  autoRegisterListeners,
  defineModule,
  discoverModules,
  generateManifest,
  getModuleManifest,
  validateModuleStructure,
} from '../src/index.js';

const mockScheduler = {} as SchedulerContract;

async function createTempApp(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'velo-modules-'));
}

describe('defineModule()', () => {
  it('derives alias and defaults from module config', () => {
    expect(defineModule({ name: 'BlogAdmin' })).toEqual({
      name: 'BlogAdmin',
      alias: 'blog-admin',
      priority: 100,
      prefix: undefined,
      middleware: {},
      description: undefined,
    });
  });
});

describe('discoverModules()', () => {
  it('returns an empty Map when the manifest file does not exist', async () => {
    const cwd = await createTempApp();
    const originalCwd = process.cwd();
    process.chdir(cwd);

    try {
      const result = await discoverModules(mockScheduler);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('loads modules declared in the manifest', async () => {
    const cwd = await createTempApp();
    await mkdir(join(cwd, 'bootstrap/cache'), { recursive: true });
    await writeFile(
      join(cwd, 'bootstrap/cache/modules.manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        autoDiscovered: true,
        modules: [
          {
            name: 'Blog',
            alias: 'blog',
            priority: 10,
            path: join(cwd, 'src/modules/Blog/module.ts'),
            contentHash: 'hash',
          },
        ],
      }),
      'utf8',
    );

    const originalCwd = process.cwd();
    process.chdir(cwd);

    try {
      const modules = await discoverModules(
        mockScheduler,
        vi.fn().mockResolvedValue({ default: defineModule({ name: 'Blog', priority: 10 }) }),
      );

      expect([...modules.keys()]).toEqual(['Blog']);
    } finally {
      process.chdir(originalCwd);
    }
  });
});

describe('generateManifest()', () => {
  it('scans src/modules and writes a manifest file', async () => {
    const cwd = await createTempApp();
    const moduleFile = join(cwd, 'src/modules/Blog/module.ts');
    await mkdir(join(cwd, 'src/modules/Blog'), { recursive: true });
    await writeFile(moduleFile, 'export default {}', 'utf8');

    const manifest = await generateManifest({
      cwd,
      importFn: vi.fn().mockResolvedValue({ default: defineModule({ name: 'Blog', priority: 5 }) }),
    });

    expect(manifest.modules).toHaveLength(1);
    expect(manifest.modules[0]?.name).toBe('Blog');

    const storedManifest = await getModuleManifest({ cwd });
    expect(storedManifest.modules[0]?.alias).toBe('blog');
  });
});

describe('validateModuleStructure()', () => {
  it('detects missing required Porto layers', async () => {
    const cwd = await createTempApp();
    const moduleRoot = join(cwd, 'src/modules/Billing');
    await mkdir(moduleRoot, { recursive: true });

    const result = validateModuleStructure(moduleRoot);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });
});

describe('autoRegisterListeners()', () => {
  it('counts listener definitions from provided listener paths', async () => {
    const importFn = vi.fn().mockResolvedValue({
      onCreated: {
        event: { name: 'created' },
        handler: async () => undefined,
      },
      ignored: 'value',
    });

    await expect(autoRegisterListeners('Blog', importFn, ['/tmp/listener.ts'])).resolves.toEqual({
      registered: 1,
    });
  });
});
