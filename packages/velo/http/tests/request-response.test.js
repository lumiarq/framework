import { describe, it, expect } from 'vitest';
import {
  HttpError,
  HttpRequest,
  abort,
  abortIf,
  abortUnless,
  badRequest,
  bearerToken,
  created,
  expectsJson,
  fullUrl,
  fullUrlWithQuery,
  header,
  input,
  json,
  noContent,
  notFound,
  ok,
  redirect,
  unprocessableEntity,
  wantsJson,
} from '../src/index.js';
describe('request/response helpers', () => {
  it('reads query params and json body', async () => {
    const req = new Request('https://example.test/posts?tag=a&tag=b', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    });
    const wrapped = new HttpRequest(req, { id: '42' });
    expect(wrapped.params('id')).toBe('42');
    expect(wrapped.query('tag')).toEqual(['a', 'b']);
    expect(await wrapped.body()).toEqual({ ok: true });
  });
  it('creates json and redirect responses', async () => {
    const j = json({ ok: true }, { status: 201 });
    expect(j.status).toBe(201);
    expect(await j.json()).toEqual({ ok: true });
    const r = redirect('/login');
    expect(r.status).toBe(302);
    expect(r.headers.get('Location')).toBe('/login');
  });
  it('creates Laravel-style response shortcuts', async () => {
    const success = ok({ ok: true });
    expect(success.status).toBe(200);
    expect(await success.json()).toEqual({ ok: true });
    const createdResponse = created({ id: '1' });
    expect(createdResponse.status).toBe(201);
    const invalid = badRequest({ error: 'invalid' });
    expect(invalid.status).toBe(400);
    const missing = notFound({ error: 'missing' });
    expect(missing.status).toBe(404);
    const invalidEntity = unprocessableEntity({ errors: { email: ['required'] } });
    expect(invalidEntity.status).toBe(422);
    const empty = noContent();
    expect(empty.status).toBe(204);
    expect(await empty.text()).toBe('');
  });
  it('throws typed HttpError via abort helpers', () => {
    expect(() => abort(404, 'Missing post')).toThrow(HttpError);
    expect(() => abortIf(true, 403, 'Forbidden')).toThrow(HttpError);
    expect(() => abortUnless(false, 401, 'Login required')).toThrow(HttpError);
    try {
      abort(404, 'Missing post');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Missing post');
    }
  });
});
describe('request input helpers', () => {
  it('reads header and bearer token', () => {
    const req = new Request('https://example.test/', {
      headers: {
        authorization: 'Bearer secret-token',
        'x-custom': 'value',
        accept: 'application/json',
        'content-type': 'application/json',
      },
    });
    expect(header(req, 'x-custom')).toBe('value');
    expect(header(req, 'x-missing')).toBeUndefined();
    expect(header(req, 'x-missing', 'default')).toBe('default');
    expect(bearerToken(req)).toBe('secret-token');
    expect(wantsJson(req)).toBe(true);
    expect(expectsJson(req)).toBe(true);
  });
  it('returns null bearer token when Authorization header is absent or non-Bearer', () => {
    const req1 = new Request('https://example.test/');
    expect(bearerToken(req1)).toBeNull();
    const req2 = new Request('https://example.test/', {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(bearerToken(req2)).toBeNull();
  });
  it('detects wantsJson / expectsJson independently', () => {
    const apiReq = new Request('https://example.test/', {
      headers: { accept: 'text/html', 'content-type': 'application/json' },
    });
    expect(wantsJson(apiReq)).toBe(false);
    expect(expectsJson(apiReq)).toBe(true);
    const browserReq = new Request('https://example.test/', {
      headers: { accept: 'application/json', 'content-type': 'text/plain' },
    });
    expect(wantsJson(browserReq)).toBe(true);
    expect(expectsJson(browserReq)).toBe(false);
  });
  it('returns fullUrl and merges query params with fullUrlWithQuery', () => {
    const req = new Request('https://example.test/posts?page=1&sort=asc');
    expect(fullUrl(req)).toBe('https://example.test/posts?page=1&sort=asc');
    const patched = fullUrlWithQuery(req, { page: '2', filter: 'active' });
    const patched_url = new URL(patched);
    expect(patched_url.searchParams.get('page')).toBe('2');
    expect(patched_url.searchParams.get('sort')).toBe('asc');
    expect(patched_url.searchParams.get('filter')).toBe('active');
  });
  it('reads merged input from query + JSON body', async () => {
    const req = new Request('https://example.test/submit?source=web', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', role: 'admin' }),
    });
    const name = await input(req, 'name');
    expect(name).toBe('Alice');
    const source = await input(req, 'source');
    expect(source).toBe('web');
    const missing = await input(req, 'missing', 'fallback');
    expect(missing).toBe('fallback');
    const all = await input(req);
    expect(all['name']).toBe('Alice');
    expect(all['source']).toBe('web');
  });
  it('reads urlencoded bodies without using Request.formData()', async () => {
    const req = new Request('https://example.test/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'name=Alice&role=admin&role=owner',
    });
    expect(await input(req, 'name')).toBe('Alice');
    expect(await input(req, 'role')).toEqual(['admin', 'owner']);
  });
  it('reads multipart text fields without using Request.formData()', async () => {
    const form = new FormData();
    form.set('name', 'Alice');
    form.set('role', 'admin');
    const req = new Request('https://example.test/submit', {
      method: 'POST',
      body: form,
    });
    expect(await input(req, 'name')).toBe('Alice');
    expect(await input(req, 'role')).toBe('admin');
  });
});
//# sourceMappingURL=request-response.test.js.map
