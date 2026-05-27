import { deepEqual, equal } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it } from 'vitest';
import type { RouteDefinition } from '@illumiarq/http';

import { buildWebRuntimeManifest } from '../src/web-runtime/manifest.js';

const legacyHandler = async () => new Response('legacy');

describe('buildWebRuntimeManifest', () => {
  it('ranks routes deterministically with static routes before dynamic routes', async () => {
    const legacyRoutes: RouteDefinition[] = [
      { method: 'GET', path: '/users/:id', handler: legacyHandler, render: 'dynamic' },
      { method: 'GET', path: '/users/new', handler: legacyHandler, render: 'dynamic' },
      { method: 'GET', path: '/users', handler: legacyHandler, render: 'dynamic' },
    ];

    const manifest = await buildWebRuntimeManifest({
      legacyRoutes,
      projectRoot: process.cwd(),
      enableFilesystemRouting: false,
    });

    deepEqual(
      manifest.routes.map((route) => route.path),
      ['/users/new', '/users', '/users/:id'],
    );
  });

  it('detects collisions for equivalent dynamic route signatures', async () => {
    const legacyRoutes: RouteDefinition[] = [
      { method: 'GET', path: '/teams/:id', handler: legacyHandler, render: 'dynamic' },
      { method: 'GET', path: '/teams/:slug', handler: legacyHandler, render: 'dynamic' },
    ];

    const manifest = await buildWebRuntimeManifest({
      legacyRoutes,
      projectRoot: process.cwd(),
      enableFilesystemRouting: false,
    });

    equal(manifest.diagnostics.collisions.length, 1);
    equal(manifest.diagnostics.collisions[0]?.signature, '/teams/:param');
  });

  it('loads src/app filesystem routes when feature is enabled', async () => {
    const root = mkdtempSync(join(tmpdir(), 'lumiarq-web-runtime-'));
    const appDir = join(root, 'src', 'app', 'about');
    mkdirSync(appDir, { recursive: true });
    writeFileSync(
      join(appDir, 'page.js'),
      [
        'export async function render() {',
        "  return { html: '<h1>About</h1>', payload: { initialData: null, pageVersion: 'test' }, status: 200 };",
        '}',
        '',
      ].join('\n'),
      'utf8',
    );

    try {
      const manifest = await buildWebRuntimeManifest({
        legacyRoutes: [],
        projectRoot: root,
        enableFilesystemRouting: true,
      });

      equal(manifest.routes.length, 1);
      equal(manifest.routes[0]?.source, 'filesystem');
      equal(manifest.routes[0]?.path, '/about');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
