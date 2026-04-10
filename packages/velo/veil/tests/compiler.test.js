import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { compileTemplate } from '../src/compiler.js';
import { __t, loadLocale } from '../src/i18n/translate.js';
import { tmpdir } from 'node:os';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
// ─── Shared fixtures ──────────────────────────────────────────────────────
const ASSET_DIR = '/tmp/assets';
const TEMPLATES_DIR = '/tmp/templates';
// ─── @t() runtime compilation ────────────────────────────────────────────
describe('compileTemplate — @t() runtime interpolation', () => {
  it('emits ${__t("key")} instead of substituting compile-time value', () => {
    const src = `<h1>@t('nav.docs')</h1>`;
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    expect(out).toContain("${__t('nav.docs')}");
    expect(out).not.toContain('Documentation'); // no compile-time bake-in
  });
  it('defines __t inside the render function body', () => {
    const src = `<p>@t('greeting')</p>`;
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    expect(out).toContain('const __t = (key: string): string => locale[key] ?? key');
  });
  it('render function accepts a locale parameter', () => {
    const src = `<p>@t('greeting')</p>`;
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    expect(out).toMatch(/render\(vars:.*locale.*Record<string, string>/);
  });
  it('falls back to key when locale map is empty', () => {
    const src = `<p>@t('missing.key')</p>`;
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    // The compiled __t function: locale[key] ?? key  → returns key when missing
    expect(out).toContain('locale[key] ?? key');
  });
  it('handles multiple @t() calls in one template', () => {
    const src = `<nav><a>@t('nav.home')</a><a>@t('nav.docs')</a></nav>`;
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    expect(out).toContain("${__t('nav.home')}");
    expect(out).toContain("${__t('nav.docs')}");
  });
});
// ─── @vars typed / untyped ───────────────────────────────────────────────
describe('compileTemplate — @vars', () => {
  it('emits typed RenderVars interface for typed @vars', () => {
    const src = '@vars({ title: string, count: number })\n<h1><%= title %></h1>';
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    expect(out).toContain('export interface RenderVars');
    expect(out).toContain('title: string');
    expect(out).toContain('count: number');
    expect(out).toContain('render(vars: RenderVars');
  });
  it('uses Record<string, any> for untyped @vars', () => {
    const src = '@vars({ title, count })\n<h1><%= title %></h1>';
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    expect(out).not.toContain('export interface RenderVars');
    expect(out).toContain('Record<string, any>');
  });
});
// ─── EJS tags ────────────────────────────────────────────────────────────
describe('compileTemplate — EJS output tags', () => {
  it('<%= expr %> emits HTML-escaped output', () => {
    const src = `<p><%= title %></p>`;
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    expect(out).toContain('__e(title)');
  });
  it('<%- expr %> emits raw output', () => {
    const src = `<p><%- html %></p>`;
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    expect(out).toContain('String(html');
  });
  it('<% stmt %> emits plain statement', () => {
    const src = `<% for (const x of items) { %><li><%= x %></li><% } %>`;
    const out = compileTemplate(src, ASSET_DIR, TEMPLATES_DIR);
    expect(out).toContain('for (const x of items)');
  });
});
describe('Alpine.js passthrough', () => {
  it('passes x-data attribute through unchanged', () => {
    const out = compileTemplate('<div x-data="{ count: 0 }">hi</div>', '', tmpdir());
    expect(out).toContain('x-data="{ count: 0 }"');
  });
  it('passes x-bind attribute through unchanged', () => {
    const out = compileTemplate('<button x-bind:disabled="isLoading">Go</button>', '', tmpdir());
    expect(out).toContain('x-bind:disabled="isLoading"');
  });
  it('passes @click Alpine shorthand through unchanged', () => {
    const out = compileTemplate('<button @click="count++">+</button>', '', tmpdir());
    expect(out).toContain('@click="count++"');
  });
  it('passes x-show, x-if, x-for through unchanged', () => {
    const tpl =
      '<div x-show="open"><template x-if="user"><li x-for="item in items"></li></template></div>';
    const out = compileTemplate(tpl, '', tmpdir());
    expect(out).toContain('x-show="open"');
    expect(out).toContain('x-if="user"');
    expect(out).toContain('x-for="item in items"');
  });
  it('passes x-model, x-text, x-html through unchanged', () => {
    const tpl = '<input x-model="email"><span x-text="name"></span><div x-html="content"></div>';
    const out = compileTemplate(tpl, '', tmpdir());
    expect(out).toContain('x-model="email"');
    expect(out).toContain('x-text="name"');
    expect(out).toContain('x-html="content"');
  });
  it('passes x-transition, x-ref, x-cloak, x-init through unchanged', () => {
    const tpl = '<div x-transition x-ref="modal" x-cloak x-init="init()"></div>';
    const out = compileTemplate(tpl, '', tmpdir());
    expect(out).toContain('x-transition');
    expect(out).toContain('x-ref="modal"');
    expect(out).toContain('x-cloak');
    expect(out).toContain('x-init="init()"');
  });
});
describe('__t', () => {
  it('returns the key when locale map is empty', () => {
    expect(__t('greeting')).toBe('greeting');
  });
  it('returns translation when key exists in locale map', () => {
    expect(__t('greeting', { greeting: 'Hello!' })).toBe('Hello!');
  });
  it('falls back to key when translation is missing', () => {
    expect(__t('missing.key', { other: 'x' })).toBe('missing.key');
  });
});
describe('loadLocale', () => {
  let tmp;
  beforeEach(() => {
    tmp = resolve(tmpdir(), `lumis-locale-test-${Date.now()}`);
    mkdirSync(tmp, { recursive: true });
  });
  afterEach(() => rmSync(tmp, { recursive: true, force: true }));
  it('returns empty object when lang/ dir absent', () => {
    expect(loadLocale('en', tmp)).toEqual({});
  });
  it('reads and parses lang/en.json', () => {
    mkdirSync(resolve(tmp, 'lang'), { recursive: true });
    writeFileSync(resolve(tmp, 'lang', 'en.json'), JSON.stringify({ hello: 'Hello' }));
    expect(loadLocale('en', tmp)).toEqual({ hello: 'Hello' });
  });
  it('returns empty object on corrupt JSON', () => {
    mkdirSync(resolve(tmp, 'lang'), { recursive: true });
    writeFileSync(resolve(tmp, 'lang', 'en.json'), '{ bad json }');
    expect(loadLocale('en', tmp)).toEqual({});
  });
});
//# sourceMappingURL=compiler.test.js.map
