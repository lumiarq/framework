/**
 * @velo/auth — headless auth engine.
 * Exports: contracts, base actions, base tasks, base validators.
 */
// ─── Base Tasks ───────────────────────────────────────────────────────────────
export { HashPasswordTask } from './tasks/hash-password.task.js';
export { VerifyPasswordTask } from './tasks/verify-password.task.js';
export { IssueJwtTask } from './tasks/issue-jwt.task.js';
export { VerifyJwtTask } from './tasks/verify-jwt.task.js';
export { CreateSessionTask } from './tasks/create-session.task.js';
export { RevokeSessionTask } from './tasks/revoke-session.task.js';
// ─── Additional Base Tasks ────────────────────────────────────────────────────
export { SendVerificationEmailTask } from './tasks/send-verification-email.task.js';
export { VerifyEmailTokenTask } from './tasks/verify-email-token.task.js';
export { ConfirmPasswordTask } from './tasks/confirm-password.task.js';
// ─── Base Actions ─────────────────────────────────────────────────────────────
export { BaseLoginAction } from './actions/base-login.action.js';
export { BaseRegisterAction } from './actions/base-register.action.js';
export { BaseLogoutAction } from './actions/base-logout.action.js';
export { BaseForgotPasswordAction } from './actions/base-forgot-password.action.js';
export { BaseResetPasswordAction } from './actions/base-reset-password.action.js';
// ─── Additional Base Actions ──────────────────────────────────────────────────
export { BaseVerifyEmailAction } from './actions/base-verify-email.action.js';
export { BaseResendVerificationEmailAction } from './actions/base-resend-verification-email.action.js';
export { BaseConfirmPasswordAction } from './actions/base-confirm-password.action.js';
// ─── Base Validators ─────────────────────────────────────────────────────────
export { BaseLoginValidator } from './validators/base-login.validator.js';
export { BaseRegisterValidator } from './validators/base-register.validator.js';
// ─── Additional Base Validators ───────────────────────────────────────────────
export { BaseResetPasswordValidator } from './validators/base-reset-password.validator.js';
export { BaseVerifyEmailValidator } from './validators/base-verify-email.validator.js';
export { BaseConfirmPasswordValidator } from './validators/base-confirm-password.validator.js';
//# sourceMappingURL=index.js.map
