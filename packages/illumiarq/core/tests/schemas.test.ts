import { describe, it, expect } from 'vitest';
import {
  EmailSchema,
  UuidSchema,
  SlugSchema,
  PaginationSchema,
  CursorSchema,
  SortDirectionSchema,
  DateTimeSchema,
  PositiveIntSchema,
  NonEmptyStringSchema,
  PasswordSchema,
  SemverSchema,
} from '../src/schemas.js';

describe('EmailSchema', () => {
  it('accepts valid emails and lowercases them', () => {
    expect(EmailSchema.parse('USER@Example.COM')).toBe('user@example.com');
  });
  it('trims whitespace before validating', () => {
    expect(EmailSchema.parse('  hello@test.io  ')).toBe('hello@test.io');
  });
  it('rejects invalid emails', () => {
    expect(() => EmailSchema.parse('not-an-email')).toThrow();
  });
});

describe('UuidSchema', () => {
  it('accepts valid UUID v4', () => {
    expect(() => UuidSchema.parse('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
  });
  it('rejects non-UUID strings', () => {
    expect(() => UuidSchema.parse('not-a-uuid')).toThrow();
  });
});

describe('SlugSchema', () => {
  it('accepts valid slugs', () => {
    expect(() => SlugSchema.parse('my-great-post')).not.toThrow();
    expect(() => SlugSchema.parse('post123')).not.toThrow();
  });
  it('rejects slugs with uppercase or spaces', () => {
    expect(() => SlugSchema.parse('My Post')).toThrow();
    expect(() => SlugSchema.parse('My-Post')).toThrow();
  });
});

describe('PaginationSchema', () => {
  it('applies defaults when no params given', () => {
    const result = PaginationSchema.parse({});
    expect(result).toEqual({ limit: 20, offset: 0 });
  });
  it('coerces string numbers from query params', () => {
    const result = PaginationSchema.parse({ limit: '50', offset: '100' });
    expect(result).toEqual({ limit: 50, offset: 100 });
  });
  it('rejects limit > 100', () => {
    expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
  });
  it('rejects negative offset', () => {
    expect(() => PaginationSchema.parse({ offset: -1 })).toThrow();
  });
});

describe('CursorSchema', () => {
  it('applies default limit and makes cursor optional', () => {
    const result = CursorSchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.cursor).toBeUndefined();
  });
  it('accepts a cursor string', () => {
    const result = CursorSchema.parse({ cursor: 'abc123', limit: 10 });
    expect(result.cursor).toBe('abc123');
  });
});

describe('SortDirectionSchema', () => {
  it('defaults to asc', () => {
    expect(SortDirectionSchema.parse(undefined)).toBe('asc');
  });
  it('accepts desc', () => {
    expect(SortDirectionSchema.parse('desc')).toBe('desc');
  });
  it('rejects invalid values', () => {
    expect(() => SortDirectionSchema.parse('random')).toThrow();
  });
});

describe('DateTimeSchema', () => {
  it('accepts ISO 8601 datetime strings', () => {
    expect(() => DateTimeSchema.parse('2024-01-01T00:00:00Z')).not.toThrow();
  });
  it('rejects plain date strings', () => {
    expect(() => DateTimeSchema.parse('2024-01-01')).toThrow();
  });
});

describe('PositiveIntSchema', () => {
  it('accepts positive integers', () => {
    expect(PositiveIntSchema.parse(42)).toBe(42);
  });
  it('rejects zero and negatives', () => {
    expect(() => PositiveIntSchema.parse(0)).toThrow();
    expect(() => PositiveIntSchema.parse(-1)).toThrow();
  });
  it('rejects floats', () => {
    expect(() => PositiveIntSchema.parse(1.5)).toThrow();
  });
});

describe('NonEmptyStringSchema', () => {
  it('accepts non-empty strings', () => {
    expect(NonEmptyStringSchema.parse('hello')).toBe('hello');
  });
  it('trims and rejects whitespace-only strings', () => {
    expect(() => NonEmptyStringSchema.parse('   ')).toThrow();
  });
});

describe('PasswordSchema', () => {
  it('accepts passwords of 8+ characters', () => {
    expect(() => PasswordSchema.parse('password1')).not.toThrow();
  });
  it('rejects passwords shorter than 8 characters', () => {
    expect(() => PasswordSchema.parse('short')).toThrow();
  });
});

describe('SemverSchema', () => {
  it('accepts valid semver strings', () => {
    expect(() => SemverSchema.parse('1.2.3')).not.toThrow();
    expect(() => SemverSchema.parse('1.0.0-alpha.1')).not.toThrow();
    expect(() => SemverSchema.parse('2.0.0+build.1')).not.toThrow();
  });
  it('rejects invalid semver', () => {
    expect(() => SemverSchema.parse('v1.2.3')).toThrow();
    expect(() => SemverSchema.parse('1.2')).toThrow();
  });
});
