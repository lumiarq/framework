import { z, type ZodTypeAny } from 'zod';

/**
 * Creates a frozen, typed configuration object validated against a Zod schema.
 * The freeze ensures config is never mutated after initialisation.
 *
 * @param schema - Zod schema describing the configuration shape
 * @param values - Raw values to validate and freeze
 * @returns A deeply frozen, TypeScript-typed config object
 * @throws {ZodError} if values fail schema validation
 * @example
 * const appConfig = defineConfig(z.object({ port: z.number() }), { port: 3000 });
 */
export function defineConfig<S extends ZodTypeAny>(
  schema: S,
  values: z.infer<S>,
): Readonly<z.infer<S>> {
  const parsed = schema.parse(values) as z.infer<S>;
  return Object.freeze(parsed);
}
