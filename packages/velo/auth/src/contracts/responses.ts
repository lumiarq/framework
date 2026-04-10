/**
 * Response contracts for @velo/auth base actions.
 * Application code may extend these interfaces with additional fields.
 */

export interface LoginResponse {
  readonly token?: string;
  readonly redirectTo?: string;
  readonly user: { id: string; email: string; role: string };
}

export interface LogoutResponse {
  readonly redirectTo?: string;
  readonly message?: string;
}

export interface VerifyEmailResponse {
  readonly verified: boolean;
  readonly redirectTo?: string;
}

export interface ConfirmPasswordResponse {
  readonly confirmed: boolean;
  readonly redirectTo?: string;
}
