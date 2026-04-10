import { z, type ZodTypeAny } from 'zod';

/** A validated event definition produced by defineEvent. */
export interface EventDefinition<S extends ZodTypeAny> {
  /** Unique event name used as the dispatch key (e.g. 'auth.user_created') */
  name: string;
  /** Zod schema for validating the domain payload before dispatch */
  schema: S;
  /**
   * Validates the given payload against the schema.
   * @throws {ZodError} if the payload is invalid
   */
  validate: (payload: unknown) => z.infer<S>;
}

/**
 * Defines a schema-validated event.
 *
 * Event schemas contain ONLY domain fields — no `idempotencyKey`.
 * The EventBus derives the key automatically:
 *   SHA-256(eventName + stableStringify(payload))
 *
 * The key is exposed to listeners via `envelope.idempotencyKey` and is
 * stable for the same logical payload — safe to use as a deduplication store key.
 *
 * All payloads are validated by Zod before dispatch — invalid payloads throw synchronously.
 *
 * @param definition.name   - Unique event name (convention: 'domain.entity_past_tense')
 * @param definition.schema - Zod schema with domain fields only
 * @returns An EventDefinition used with EventBus.emit / EventBus.listen
 *
 * @example
 * export const UserRegistered = defineEvent({
 *   name:   'auth.user-registered',
 *   schema: z.object({
 *     identityId: z.string().uuid(),
 *     email:      z.string().email(),
 *   }),
 * });
 */
export function defineEvent<S extends ZodTypeAny>(definition: {
  name: string;
  schema: S;
}): EventDefinition<S> {
  return {
    name: definition.name,
    schema: definition.schema,
    validate: (payload: unknown) => definition.schema.parse(payload) as z.infer<S>,
  };
}
