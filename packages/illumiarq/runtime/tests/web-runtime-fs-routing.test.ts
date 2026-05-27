import { equal, match } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it } from 'vitest';

import { discoverFilesystemPageRoutes } from '../src/web-runtime/fs-routing.js';

describe('discoverFilesystemPageRoutes', () => {
  it('applies nested layouts and extracts dynamic params', async () => {
    const root = mkdtempSync(join(tmpdir(), 'lumiarq-fs-routing-'));
    const appRoot = join(root, 'src', 'app');
    mkdirSync(join(appRoot, 'blog', '[slug]'), { recursive: true });
    writeFileSync(
      join(appRoot, 'layout.js'),
      'export default ({ childrenHtml }) => `<main>${childrenHtml}</main>`;\n',
      'utf8',
    );
    writeFileSync(
      join(appRoot, 'blog', 'layout.js'),
      'export default ({ childrenHtml }) => `<section>${childrenHtml}</section>`;\n',
      'utf8',
    );
    writeFileSync(
      join(appRoot, 'blog', '[slug]', 'page.js'),
      [
        'export async function loader({ request }) {',
        '  return { slug: request.params.slug };',
        '}',
        'export async function render({ data }) {',
        "  return { html: `<h1>${data.slug}</h1>`, payload: { initialData: data, pageVersion: 'test' }, status: 200 };",
        '}',
        '',
      ].join('\n'),
      'utf8',
    );

    try {
      const routes = await discoverFilesystemPageRoutes(root);
      const blogRoute = routes.find(
        (route) => route.routePath === '/blog/:slug' && route.method === 'GET',
      );
      if (!blogRoute) throw new Error('Expected blog route');

      const response = await blogRoute.handler({
        req: { raw: new Request('http://localhost/blog/hello-world') },
        text: (body: string, status = 200) => new Response(body, { status }),
      });

      equal(response.status, 200);
      equal(await response.text(), '<main><section><h1>hello-world</h1></section></main>');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('uses nearest error boundary and not-found boundary', async () => {
    const root = mkdtempSync(join(tmpdir(), 'lumiarq-fs-routing-boundary-'));
    const appRoot = join(root, 'src', 'app');
    mkdirSync(join(appRoot, 'users'), { recursive: true });
    writeFileSync(
      join(appRoot, 'users', 'error.js'),
      "export function renderError() { return { html: '<p>fallback error</p>', status: 500 }; }\n",
      'utf8',
    );
    writeFileSync(
      join(appRoot, 'users', 'not-found.js'),
      "export function renderNotFound() { return { html: '<p>not found</p>', status: 404 }; }\n",
      'utf8',
    );
    writeFileSync(
      join(appRoot, 'users', 'page.js'),
      [
        'export async function loader({ request }) {',
        "  if (request.searchParams.fail === '1') throw new Error('boom');",
        "  if (request.searchParams.missing === '1') return { missing: true };",
        '  return { missing: false };',
        '}',
        'export async function render({ data }) {',
        "  if (data.missing) return { html: '<p>missing</p>', payload: { initialData: data, pageVersion: 'test' }, status: 404 };",
        "  return { html: '<p>ok</p>', payload: { initialData: data, pageVersion: 'test' }, status: 200 };",
        '}',
        '',
      ].join('\n'),
      'utf8',
    );

    try {
      const routes = await discoverFilesystemPageRoutes(root);
      const usersRoute = routes.find(
        (route) => route.routePath === '/users' && route.method === 'GET',
      );
      if (!usersRoute) throw new Error('Expected users route');

      const missingResponse = await usersRoute.handler({
        req: { raw: new Request('http://localhost/users?missing=1') },
        text: (body: string, status = 200) => new Response(body, { status }),
      });
      equal(missingResponse.status, 404);
      equal(await missingResponse.text(), '<p>not found</p>');

      const errorResponse = await usersRoute.handler({
        req: { raw: new Request('http://localhost/users?fail=1') },
        text: (body: string, status = 200) => new Response(body, { status }),
      });
      equal(errorResponse.status, 500);
      match(await errorResponse.text(), /fallback error/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
