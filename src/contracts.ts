// Contract interfaces for custom implementations.
// Explicit named re-exports so consumers resolve types through @lumiarq/framework
// without needing @illumiarq/contracts hoisted in their node_modules tree.
//
// @example
// import type { CacheContract } from '@lumiarq/framework/contracts'
export type { AuditContract } from '@illumiarq/contracts';
export type { CacheContract } from '@illumiarq/contracts';
export type { EventBusContract } from '@illumiarq/contracts';
export type { LoggerContract } from '@illumiarq/contracts';
export type { MailerContract } from '@illumiarq/contracts';
export type { NotificationContract } from '@illumiarq/contracts';
export type { QueueContract } from '@illumiarq/contracts';
export type { SchedulerContract } from '@illumiarq/contracts';
export type { StorageContract } from '@illumiarq/contracts';
