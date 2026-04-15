import { gitkeep } from '@illumiarq/support';
import { loadAuthStub } from './stubs.js';
const BASE = 'src/modules/Auth';
/**
 * Generates all files for the Auth/ module.
 * Called by `lumis auth:install` — never imported by application code.
 *
 * Templates are loaded from .stub files (Laravel-style). Users can customise them
 * by running `lumis stub:publish --auth` to copy stubs to their project's stubs/ directory.
 */
export function generateAuthModule() {
    return [
        // ── Empty layer directories ─────────────────────────────────────────────
        gitkeep(BASE, 'events/listeners'),
        gitkeep(BASE, 'tests/unit'),
        gitkeep(BASE, 'tests/integration'),
        gitkeep(BASE, 'tests/features'),
        gitkeep(BASE, 'tests/fixtures'),
        // ── module + index ───────────────────────────────────────────────────────
        { path: `${BASE}/module.ts`, content: loadAuthStub('auth/module.stub') },
        { path: `${BASE}/index.ts`, content: loadAuthStub('auth/index.stub') },
        // ── Contracts ────────────────────────────────────────────────────────────
        {
            path: `${BASE}/contracts/models/identity.model.ts`,
            content: loadAuthStub('auth/identity.model.stub'),
        },
        {
            path: `${BASE}/contracts/models/session.model.ts`,
            content: loadAuthStub('auth/session.model.stub'),
        },
        {
            path: `${BASE}/contracts/types/auth-user.dto.ts`,
            content: loadAuthStub('auth/auth-user.dto.stub'),
        },
        {
            path: `${BASE}/contracts/types/jwt-payload.types.ts`,
            content: loadAuthStub('auth/jwt-payload.types.stub'),
        },
        {
            path: `${BASE}/contracts/validators/login.validator.ts`,
            content: loadAuthStub('auth/login.validator.stub'),
        },
        {
            path: `${BASE}/contracts/validators/register.validator.ts`,
            content: loadAuthStub('auth/register.validator.stub'),
        },
        {
            path: `${BASE}/contracts/validators/reset-password.validator.ts`,
            content: loadAuthStub('auth/reset-password.validator.stub'),
        },
        // ── Database ─────────────────────────────────────────────────────────────
        {
            path: `${BASE}/database/repositories/identity.repository.ts`,
            content: loadAuthStub('auth/identity.repository.stub'),
        },
        {
            path: `${BASE}/database/repositories/session.repository.ts`,
            content: loadAuthStub('auth/session.repository.stub'),
        },
        {
            path: `${BASE}/database/schemas/identity.schema.ts`,
            content: loadAuthStub('auth/identity.schema.stub'),
        },
        {
            path: `${BASE}/database/schemas/session.schema.ts`,
            content: loadAuthStub('auth/session.schema.stub'),
        },
        {
            path: `${BASE}/database/schemas/role.schema.ts`,
            content: loadAuthStub('auth/role.schema.stub'),
        },
        {
            path: `${BASE}/database/schemas/identity-role.schema.ts`,
            content: loadAuthStub('auth/identity-role.schema.stub'),
        },
        {
            path: `${BASE}/database/schemas/password-reset.schema.ts`,
            content: loadAuthStub('auth/password-reset.schema.stub'),
        },
        {
            path: `${BASE}/database/factories/identity.factory.ts`,
            content: loadAuthStub('auth/identity.factory.stub'),
        },
        // ── Logic ────────────────────────────────────────────────────────────────
        {
            path: `${BASE}/logic/actions/login.action.ts`,
            content: loadAuthStub('auth/login.action.stub'),
        },
        {
            path: `${BASE}/logic/actions/register.action.ts`,
            content: loadAuthStub('auth/register.action.stub'),
        },
        {
            path: `${BASE}/logic/actions/logout.action.ts`,
            content: loadAuthStub('auth/logout.action.stub'),
        },
        {
            path: `${BASE}/logic/actions/forgot-password.action.ts`,
            content: loadAuthStub('auth/forgot-password.action.stub'),
        },
        {
            path: `${BASE}/logic/actions/reset-password.action.ts`,
            content: loadAuthStub('auth/reset-password.action.stub'),
        },
        {
            path: `${BASE}/logic/policies/auth.policy.ts`,
            content: loadAuthStub('auth/auth.policy.stub'),
        },
        // ── Events ───────────────────────────────────────────────────────────────
        {
            path: `${BASE}/events/definitions/user-registered.event.ts`,
            content: loadAuthStub('auth/user-registered.event.stub'),
        },
        {
            path: `${BASE}/events/definitions/user-logged-in.event.ts`,
            content: loadAuthStub('auth/user-logged-in.event.stub'),
        },
        {
            path: `${BASE}/events/definitions/password-reset.event.ts`,
            content: loadAuthStub('auth/password-reset.event.stub'),
        },
        // ── HTTP ─────────────────────────────────────────────────────────────────
        {
            path: `${BASE}/http/handlers/login.handler.ts`,
            content: loadAuthStub('auth/login.handler.stub'),
        },
        {
            path: `${BASE}/http/handlers/register.handler.ts`,
            content: loadAuthStub('auth/register.handler.stub'),
        },
        {
            path: `${BASE}/http/handlers/logout.handler.ts`,
            content: loadAuthStub('auth/logout.handler.stub'),
        },
        {
            path: `${BASE}/http/handlers/forgot-password.handler.ts`,
            content: loadAuthStub('auth/forgot-password.handler.stub'),
        },
        {
            path: `${BASE}/http/handlers/reset-password.handler.ts`,
            content: loadAuthStub('auth/reset-password.handler.stub'),
        },
        {
            path: `${BASE}/http/loaders/session.loader.ts`,
            content: loadAuthStub('auth/session.loader.stub'),
        },
        { path: `${BASE}/http/routes/auth.api.ts`, content: loadAuthStub('auth/api.route.stub') },
        { path: `${BASE}/http/routes/auth.web.ts`, content: loadAuthStub('auth/web.route.stub') },
        // ── Email Verification ───────────────────────────────────────────────────────
        {
            path: `${BASE}/database/schemas/email-verification.schema.ts`,
            content: loadAuthStub('auth/email-verification.schema.stub'),
        },
        {
            path: `${BASE}/events/definitions/email-verification-sent.event.ts`,
            content: loadAuthStub('auth/email-verification-sent.event.stub'),
        },
        {
            path: `${BASE}/events/definitions/email-verified.event.ts`,
            content: loadAuthStub('auth/email-verified.event.stub'),
        },
        {
            path: `${BASE}/logic/actions/verify-email.action.ts`,
            content: loadAuthStub('auth/verify-email.action.stub'),
        },
        {
            path: `${BASE}/logic/actions/resend-verification-email.action.ts`,
            content: loadAuthStub('auth/resend-verification-email.action.stub'),
        },
        {
            path: `${BASE}/http/handlers/verify-email.handler.ts`,
            content: loadAuthStub('auth/verify-email.handler.stub'),
        },
        {
            path: `${BASE}/http/handlers/resend-verification.handler.ts`,
            content: loadAuthStub('auth/resend-verification.handler.stub'),
        },
        {
            path: `${BASE}/contracts/validators/verify-email.validator.ts`,
            content: loadAuthStub('auth/verify-email.validator.stub'),
        },
        // ── Password Confirmation ─────────────────────────────────────────────────────
        {
            path: `${BASE}/logic/actions/confirm-password.action.ts`,
            content: loadAuthStub('auth/confirm-password.action.stub'),
        },
        {
            path: `${BASE}/http/handlers/confirm-password.handler.ts`,
            content: loadAuthStub('auth/confirm-password.handler.stub'),
        },
        {
            path: `${BASE}/contracts/validators/confirm-password.validator.ts`,
            content: loadAuthStub('auth/confirm-password.validator.stub'),
        },
    ];
}
//# sourceMappingURL=auth-module.js.map