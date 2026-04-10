// Re-exports all contract interfaces from @illumiarq/contracts.
// Application code that needs a contract type for a custom implementation
// imports from this sub-path, never directly from @illumiarq/contracts.
//
// @example
// import type { MailerContract } from '@lumiarq/framework/contracts'
export * from '@illumiarq/contracts';
