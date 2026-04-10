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
export function defineConfig(schema, values) {
  const parsed = schema.parse(values);
  return Object.freeze(parsed);
}
//# sourceMappingURL=define-config.js.map
