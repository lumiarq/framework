import { describe, it, expect } from 'vitest';
import { toPascalCase, toKebabCase, gitkeep, fillStub } from '../src/index.js';
import type { GeneratedFile } from '../src/index.js';

describe('toPascalCase', () => {
  it('converts kebab-case', () => expect(toPascalCase('publish-post')).toBe('PublishPost'));
  it('converts snake_case', () => expect(toPascalCase('create_user')).toBe('CreateUser'));
  it('is a no-op for already-pascal', () => expect(toPascalCase('Blog')).toBe('Blog'));
  it('handles multi-word kebab', () =>
    expect(toPascalCase('forgot-password')).toBe('ForgotPassword'));
});

describe('toKebabCase', () => {
  it('converts PascalCase', () => expect(toKebabCase('PublishPost')).toBe('publish-post'));
  it('converts camelCase', () => expect(toKebabCase('createUser')).toBe('create-user'));
  it('is a no-op for already-kebab', () =>
    expect(toKebabCase('publish-post')).toBe('publish-post'));
  it('handles consecutive capitals (acronym before word)', () =>
    expect(toKebabCase('DTOResult')).toBe('dto-result'));
});

describe('gitkeep', () => {
  it('returns a GeneratedFile with .gitkeep path', () => {
    const file: GeneratedFile = gitkeep('src/modules/Blog', 'tests/unit');
    expect(file.path).toBe('src/modules/Blog/tests/unit/.gitkeep');
    expect(file.content).toBe('');
  });
});

describe('fillStub', () => {
  it('replaces a single token', () =>
    expect(fillStub('export class {{ ClassName }} {}', { ClassName: 'Post' })).toBe(
      'export class Post {}',
    ));

  it('replaces multiple tokens', () =>
    expect(
      fillStub("import type { {{ DtoName }} } from './{{ ActionKebab }}.dto.js';", {
        DtoName: 'PublishPostData',
        ActionKebab: 'publish-post',
      }),
    ).toBe("import type { PublishPostData } from './publish-post.dto.js';"));

  it('replaces the same token multiple times', () =>
    expect(fillStub('{{ Name }} {{ Name }}', { Name: 'Blog' })).toBe('Blog Blog'));

  it('leaves unknown tokens untouched', () =>
    expect(fillStub('{{ Unknown }}', { Other: 'x' })).toBe('{{ Unknown }}'));

  it('returns the template unchanged when tokens is empty', () =>
    expect(fillStub('hello world', {})).toBe('hello world'));
});
