import { gitkeep } from '@illumiarq/support';
import { loadIAMStub } from './stubs.js';
const BASE = 'src/modules/IAM';
/**
 * Generates all files for the IAM/ bounded context.
 * Called by `lumis auth:install --iam` — never imported by application code.
 *
 * IAM is a DDD-style self-contained bounded context that replaces the flat
 * Auth/ + User/ module structure. Identity management lives in one place;
 * imports use @/modules/IAM/... — never @/modules/Auth/... or @/modules/User/...
 *
 * Templates are loaded from .stub files (Laravel-style). Users can customise them
 * by running `lumis stub:publish --iam` to copy stubs to their project's stubs/ directory.
 */
export function generateIAMModule() {
    return [
        // ── Empty layer directories ─────────────────────────────────────────────
        gitkeep(BASE, 'events/listeners'),
        gitkeep(BASE, 'tests/unit'),
        gitkeep(BASE, 'tests/integration'),
        gitkeep(BASE, 'tests/features'),
        gitkeep(BASE, 'tests/fixtures'),
        // ── module + index ───────────────────────────────────────────────────────
        { path: `${BASE}/module.ts`, content: loadIAMStub('iam/module.stub') },
        { path: `${BASE}/index.ts`, content: loadIAMStub('iam/index.stub') },
        // ── Contracts ────────────────────────────────────────────────────────────
        {
            path: `${BASE}/contracts/models/identity.model.ts`,
            content: loadIAMStub('iam/identity.model.stub'),
        },
        {
            path: `${BASE}/contracts/models/session.model.ts`,
            content: loadIAMStub('iam/session.model.stub'),
        },
        {
            path: `${BASE}/contracts/types/auth-user.dto.ts`,
            content: loadIAMStub('iam/auth-user.dto.stub'),
        },
        {
            path: `${BASE}/contracts/types/jwt-payload.types.ts`,
            content: loadIAMStub('iam/jwt-payload.types.stub'),
        },
        {
            path: `${BASE}/contracts/validators/login.validator.ts`,
            content: loadIAMStub('iam/login.validator.stub'),
        },
        {
            path: `${BASE}/contracts/validators/register.validator.ts`,
            content: loadIAMStub('iam/register.validator.stub'),
        },
        {
            path: `${BASE}/contracts/validators/reset-password.validator.ts`,
            content: loadIAMStub('iam/reset-password.validator.stub'),
        },
        // ── Database ─────────────────────────────────────────────────────────────
        {
            path: `${BASE}/database/repositories/identity.repository.ts`,
            content: loadIAMStub('iam/identity.repository.stub'),
        },
        {
            path: `${BASE}/database/repositories/session.repository.ts`,
            content: loadIAMStub('iam/session.repository.stub'),
        },
        {
            path: `${BASE}/database/schemas/identity.schema.ts`,
            content: loadIAMStub('iam/identity.schema.stub'),
        },
        {
            path: `${BASE}/database/schemas/session.schema.ts`,
            content: loadIAMStub('iam/session.schema.stub'),
        },
        {
            path: `${BASE}/database/schemas/role.schema.ts`,
            content: loadIAMStub('iam/role.schema.stub'),
        },
        {
            path: `${BASE}/database/factories/identity.factory.ts`,
            content: loadIAMStub('iam/identity.factory.stub'),
        },
        // ── Logic ────────────────────────────────────────────────────────────────
        {
            path: `${BASE}/logic/actions/login.action.ts`,
            content: loadIAMStub('iam/login.action.stub'),
        },
        {
            path: `${BASE}/logic/actions/register.action.ts`,
            content: loadIAMStub('iam/register.action.stub'),
        },
        {
            path: `${BASE}/logic/actions/logout.action.ts`,
            content: loadIAMStub('iam/logout.action.stub'),
        },
        {
            path: `${BASE}/logic/actions/forgot-password.action.ts`,
            content: loadIAMStub('iam/forgot-password.action.stub'),
        },
        {
            path: `${BASE}/logic/actions/reset-password.action.ts`,
            content: loadIAMStub('iam/reset-password.action.stub'),
        },
        { path: `${BASE}/logic/policies/auth.policy.ts`, content: loadIAMStub('iam/auth.policy.stub') },
        // ── Events ───────────────────────────────────────────────────────────────
        {
            path: `${BASE}/events/definitions/user-registered.event.ts`,
            content: loadIAMStub('iam/user-registered.event.stub'),
        },
        {
            path: `${BASE}/events/definitions/user-logged-in.event.ts`,
            content: loadIAMStub('iam/user-logged-in.event.stub'),
        },
        {
            path: `${BASE}/events/definitions/password-reset.event.ts`,
            content: loadIAMStub('iam/password-reset.event.stub'),
        },
        // ── HTTP ─────────────────────────────────────────────────────────────────
        {
            path: `${BASE}/http/handlers/login.handler.ts`,
            content: loadIAMStub('iam/login.handler.stub'),
        },
        {
            path: `${BASE}/http/handlers/register.handler.ts`,
            content: loadIAMStub('iam/register.handler.stub'),
        },
        {
            path: `${BASE}/http/handlers/logout.handler.ts`,
            content: loadIAMStub('iam/logout.handler.stub'),
        },
        {
            path: `${BASE}/http/handlers/forgot-password.handler.ts`,
            content: loadIAMStub('iam/forgot-password.handler.stub'),
        },
        {
            path: `${BASE}/http/handlers/reset-password.handler.ts`,
            content: loadIAMStub('iam/reset-password.handler.stub'),
        },
        {
            path: `${BASE}/http/loaders/session.loader.ts`,
            content: loadIAMStub('iam/session.loader.stub'),
        },
        { path: `${BASE}/http/routes/iam.api.ts`, content: loadIAMStub('iam/api.route.stub') },
        { path: `${BASE}/http/routes/iam.web.ts`, content: loadIAMStub('iam/web.route.stub') },
    ];
}
//# sourceMappingURL=iam-module.js.map