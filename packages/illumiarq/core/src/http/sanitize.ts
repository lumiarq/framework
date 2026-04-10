/**
 * Strips HTML tags and null bytes from a string to prevent XSS and injection attacks.
 * This is a first-pass sanitizer — Zod validation runs after this on every Handler input.
 *
 * sanitizeInput → Validator (Zod) pipeline on every Handler.
 *
 * @param value - Raw value from the request (string | unknown)
 * @returns Sanitized string, or the original value if it is not a string
 */
export function sanitizeInput(value: string): string {
  return value
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '') // strip block tags + content
    .replace(/<[^>]*>/g, '') // strip remaining HTML tags
    .replace(/\0/g, '') // strip null bytes
    .trim();
}

/**
 * Recursively sanitizes all string values in a plain object.
 *
 * @param obj - Object from the request body or query params
 * @returns A new object with all string values sanitized
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      result[k] = sanitizeInput(v);
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = sanitizeObject(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result as T;
}
