/**
 * Form request helpers — typed body and query validation using Zod.
 *
 * `parseBody<T>()` parses the request body as JSON and validates it against a Zod schema.
 * `parseQuery<T>()` parses URL query parameters and validates against a Zod schema.
 *
 * Both throw a `422 Unprocessable Entity` response with a structured `{ errors }` body
 * on validation failure — no try/catch needed in handlers.
 *
 * @example
 * import { parseBody, parseQuery } from '@lumiarq/framework';
 * import { z } from 'zod';
 *
 * const CreateInvoiceSchema = z.object({
 *   amount: z.number().positive(),
 *   currency: z.enum(['USD', 'EUR', 'GBP']),
 * });
 *
 * export async function createInvoiceHandler(req: Request): Promise<Response> {
 *   const body = await parseBody(req, CreateInvoiceSchema);
 *   // body is typed as { amount: number; currency: 'USD' | 'EUR' | 'GBP' }
 *   ...
 * }
 */
import { z } from 'zod';
import type { ZodTypeAny, ZodError } from 'zod';

export type ValidationErrors = Record<string, string[]>;

/**
 * Formats a ZodError into a flat `{ field: string[] }` errors map.
 * Nested fields are dot-joined (e.g. `"address.city": ["Required"]`).
 */
function formatZodError(err: ZodError): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const issue of err.issues) {
    const path = issue.path.join('.') || '_root';
    (errors[path] ??= []).push(issue.message);
  }
  return errors;
}

/** Produces a 422 Response with `{ message, errors }` JSON body. */
function validationResponse(errors: ValidationErrors): Response {
  return new Response(JSON.stringify({ message: 'Validation failed.', errors }), {
    status: 422,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Parse and validate the request body as JSON.
 *
 * @throws {Response} 422 Unprocessable Entity if validation fails.
 * @throws {Response} 400 Bad Request if body is not valid JSON.
 */
export async function parseBody<T extends ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new Response(JSON.stringify({ message: 'Request body must be valid JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw validationResponse(formatZodError(result.error));
  }

  return result.data as z.infer<T>;
}

/**
 * Parse and validate URL query parameters.
 * All query values arrive as strings — use Zod's `.coerce` for numbers/booleans.
 *
 * @throws {Response} 422 Unprocessable Entity if validation fails.
 *
 * @example
 * const ListSchema = z.object({
 *   page: z.coerce.number().int().positive().default(1),
 *   limit: z.coerce.number().int().max(100).default(20),
 * });
 * const query = await parseQuery(req, ListSchema);
 */
export async function parseQuery<T extends ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<z.infer<T>> {
  const url = new URL(req.url);
  const raw: Record<string, string | string[]> = {};

  for (const [key, value] of url.searchParams.entries()) {
    const existing = raw[key];
    if (existing === undefined) {
      raw[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      raw[key] = [existing, value];
    }
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw validationResponse(formatZodError(result.error));
  }

  return result.data as z.infer<T>;
}
