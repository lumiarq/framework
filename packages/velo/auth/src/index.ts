/**
 * @velo/auth — headless auth engine.
 * Exports: contracts, base actions, base tasks, base validators.
 */

// ─── Contracts ───────────────────────────────────────────────────────────────
export type {
  Identity,
  CreateIdentityData,
  IIdentityRepository,
} from './contracts/identity-repository.js';

export type {
  Session,
  CreateSessionData,
  ISessionRepository,
} from './contracts/session-repository.js';

// ─── Response Contracts ───────────────────────────────────────────────────────
export type {
  LoginResponse,
  LogoutResponse,
  VerifyEmailResponse,
  ConfirmPasswordResponse,
} from './contracts/responses.js';

// ─── Base Tasks ───────────────────────────────────────────────────────────────
export { HashPasswordTask } from './tasks/hash-password.task.js';
export { VerifyPasswordTask } from './tasks/verify-password.task.js';
export type { VerifyPasswordInput } from './tasks/verify-password.task.js';
export { IssueJwtTask } from './tasks/issue-jwt.task.js';
export type { IssueJwtInput } from './tasks/issue-jwt.task.js';
export { VerifyJwtTask } from './tasks/verify-jwt.task.js';
export type { VerifyJwtInput } from './tasks/verify-jwt.task.js';
export { CreateSessionTask } from './tasks/create-session.task.js';
export { RevokeSessionTask } from './tasks/revoke-session.task.js';

// ─── Additional Base Tasks ────────────────────────────────────────────────────
export { SendVerificationEmailTask } from './tasks/send-verification-email.task.js';
export type {
  SendVerificationEmailInput,
  SendVerificationEmailResult,
} from './tasks/send-verification-email.task.js';
export { VerifyEmailTokenTask } from './tasks/verify-email-token.task.js';
export type { VerifyEmailTokenInput } from './tasks/verify-email-token.task.js';
export { ConfirmPasswordTask } from './tasks/confirm-password.task.js';
export type { ConfirmPasswordInput, ConfirmPasswordResult } from './tasks/confirm-password.task.js';

// ─── Base Actions ─────────────────────────────────────────────────────────────
export { BaseLoginAction } from './actions/base-login.action.js';
export type {
  BaseLoginInput,
  BaseLoginDeps,
  BaseLoginResult,
} from './actions/base-login.action.js';

export { BaseRegisterAction } from './actions/base-register.action.js';
export type { BaseRegisterInput, BaseRegisterDeps } from './actions/base-register.action.js';

export { BaseLogoutAction } from './actions/base-logout.action.js';
export type { BaseLogoutInput, BaseLogoutDeps } from './actions/base-logout.action.js';

export { BaseForgotPasswordAction } from './actions/base-forgot-password.action.js';
export type {
  BaseForgotPasswordInput,
  BaseForgotPasswordDeps,
  BaseForgotPasswordResult,
} from './actions/base-forgot-password.action.js';

export { BaseResetPasswordAction } from './actions/base-reset-password.action.js';
export type {
  BaseResetPasswordInput,
  BaseResetPasswordDeps,
} from './actions/base-reset-password.action.js';

// ─── Additional Base Actions ──────────────────────────────────────────────────
export { BaseVerifyEmailAction } from './actions/base-verify-email.action.js';
export type {
  BaseVerifyEmailInput,
  BaseVerifyEmailDeps,
} from './actions/base-verify-email.action.js';

export { BaseResendVerificationEmailAction } from './actions/base-resend-verification-email.action.js';
export type {
  BaseResendVerificationEmailInput,
  BaseResendVerificationEmailDeps,
} from './actions/base-resend-verification-email.action.js';

export { BaseConfirmPasswordAction } from './actions/base-confirm-password.action.js';
export type {
  BaseConfirmPasswordInput,
  BaseConfirmPasswordDeps,
} from './actions/base-confirm-password.action.js';

// ─── Base Validators ─────────────────────────────────────────────────────────
export { BaseLoginValidator } from './validators/base-login.validator.js';
export type { BaseLoginData } from './validators/base-login.validator.js';
export { BaseRegisterValidator } from './validators/base-register.validator.js';
export type { BaseRegisterData } from './validators/base-register.validator.js';

// ─── Additional Base Validators ───────────────────────────────────────────────
export { BaseResetPasswordValidator } from './validators/base-reset-password.validator.js';
export type { BaseResetPasswordData } from './validators/base-reset-password.validator.js';
export { BaseVerifyEmailValidator } from './validators/base-verify-email.validator.js';
export type { BaseVerifyEmailData } from './validators/base-verify-email.validator.js';
export { BaseConfirmPasswordValidator } from './validators/base-confirm-password.validator.js';
export type { BaseConfirmPasswordData } from './validators/base-confirm-password.validator.js';
