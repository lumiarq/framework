import { describe, it, expect } from 'vitest';
import { generateHtaccess, generateNginxConf } from '../src/static/server-configs.js';

describe('generateHtaccess', () => {
  it('includes the MultiViews disable directive', () => {
    const txt = generateHtaccess();
    expect(txt).toContain('Options -MultiViews');
  });

  it('enables mod_rewrite', () => {
    const txt = generateHtaccess();
    expect(txt).toContain('RewriteEngine On');
  });

  it('includes RewriteCond to skip existing files', () => {
    const txt = generateHtaccess();
    expect(txt).toContain('RewriteCond %{REQUEST_FILENAME} !-f');
    expect(txt).toContain('RewriteCond %{REQUEST_FILENAME} !-d');
  });

  it('includes the SPA fallback rewrite rule', () => {
    const txt = generateHtaccess();
    expect(txt).toContain('RewriteRule');
    expect(txt).toContain('/index.html');
  });

  it('includes extra rules when provided', () => {
    const txt = generateHtaccess({ extraRules: ['RewriteRule ^api/ - [L]'] });
    expect(txt).toContain('RewriteRule ^api/ - [L]');
  });

  it('produces output with no extra blank lines when no extraRules given', () => {
    const txt = generateHtaccess();
    expect(txt).not.toMatch(/\n{3,}/);
  });
});

describe('generateNginxConf', () => {
  it('uses port 80 by default', () => {
    const conf = generateNginxConf();
    expect(conf).toContain('listen 80;');
  });

  it('uses a custom port when provided', () => {
    const conf = generateNginxConf({ port: 8080 });
    expect(conf).toContain('listen 8080;');
  });

  it('uses the default document root', () => {
    const conf = generateNginxConf();
    expect(conf).toContain('root /usr/share/nginx/html;');
  });

  it('uses a custom root when provided', () => {
    const conf = generateNginxConf({ root: '/var/www/html' });
    expect(conf).toContain('root /var/www/html;');
  });

  it('includes SPA try_files fallback directive', () => {
    const conf = generateNginxConf();
    expect(conf).toContain('try_files');
    expect(conf).toContain('/index.html');
  });

  it('enables gzip compression', () => {
    const conf = generateNginxConf();
    expect(conf).toContain('gzip on');
  });

  it('includes a server block', () => {
    const conf = generateNginxConf();
    expect(conf).toContain('server {');
    expect(conf).toContain('}');
  });
});
