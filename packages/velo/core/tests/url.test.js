import { describe, it, expect, beforeEach } from 'vitest';
import { url, setAppUrl } from '../src/utils/url.js';
import { ConfigurationError } from '../src/errors/index.js';
beforeEach(() => {
  setAppUrl('https://example.com');
});
describe('url helper', () => {
  it('returns base appUrl + path when no params', () => {
    expect(url('/blog')).toBe('https://example.com/blog');
  });
  it('replaces :slug token in path with params.slug', () => {
    expect(url('/blog/:slug', { slug: 'hello' })).toBe('https://example.com/blog/hello');
  });
  it('appends queryParams as query string', () => {
    expect(url('/search', {}, { q: 'lumiarq' })).toBe('https://example.com/search?q=lumiarq');
  });
  it('replaces multiple path tokens correctly', () => {
    expect(url('/user/:id/post/:postId', { id: '1', postId: '2' })).toBe(
      'https://example.com/user/1/post/2',
    );
  });
  it('throws ConfigurationError when appUrl is not set (empty)', () => {
    // Simulate an unconfigured state by setting an empty string
    setAppUrl('');
    expect(() => url('/blog')).toThrow(ConfigurationError);
    expect(() => url('/blog')).toThrow(
      'appConfig.appUrl is not set. Call setAppUrl() at bootstrap.',
    );
  });
  it('appends number and boolean queryParams correctly', () => {
    const result = url('/items', {}, { page: 2, active: true });
    expect(result).toContain('page=2');
    expect(result).toContain('active=true');
  });
});
//# sourceMappingURL=url.test.js.map
