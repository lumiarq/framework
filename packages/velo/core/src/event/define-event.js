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
export function defineEvent(definition) {
  return {
    name: definition.name,
    schema: definition.schema,
    validate: (payload) => definition.schema.parse(payload),
  };
}
//# sourceMappingURL=define-event.js.map
