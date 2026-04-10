import { z } from 'zod';
/**
 * Common reusable Zod schemas for LumiARQ applications.
 * Import these from '@velo/core' to avoid duplicating validation logic.
 */
/** RFC 5321-compliant email — trimmed and lowercased before validation */
export const EmailSchema = z.string().trim().toLowerCase().email();
/** UUID v4 string */
export const UuidSchema = z.string().uuid();
/** URL-safe slug: lowercase letters, digits, hyphens only */
export const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');
/** Offset-based pagination query params with safe defaults */
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
/** Cursor-based pagination query params */
export const CursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
/** Sort direction enum */
export const SortDirectionSchema = z.enum(['asc', 'desc']).default('asc');
/** ISO 8601 datetime string */
export const DateTimeSchema = z.string().datetime();
/** Positive integer (e.g. auto-increment IDs) */
export const PositiveIntSchema = z.number().int().positive();
/** Non-empty trimmed string */
export const NonEmptyStringSchema = z.string().trim().min(1);
/** Password: min 8 chars — no complexity rules leaked to client */
export const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters');
/** Semver version string */
export const SemverSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/, 'Must be a valid semver string');
//# sourceMappingURL=schemas.js.map
