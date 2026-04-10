export { runWithContext, getContext, setApplicationContext } from './async-local-storage.js';

export { enableAudit } from './audit/enable.js';
export { getAuditTrail } from './audit/get-trail.js';
export { logAuditEntry } from './audit/log-entry.js';

export { withContext } from './helpers/with-context.js';
export { getRequestId } from './helpers/get-request-id.js';
export { getUserId } from './helpers/get-user-id.js';

export {
  createRequestContext,
  createJobContext,
  createCommandContext,
  createTestContext,
} from './context-factory.js';

export type {
  ExecutionContext,
  AuthContext,
  AuthUser,
  RequestLogger,
  AuditEntry,
  AuditMetadata,
} from './types.js';

export type {
  CreateRequestContextOptions,
  CreateJobContextOptions,
  CreateCommandContextOptions,
  CreateTestContextOptions,
} from './context-factory.js';
