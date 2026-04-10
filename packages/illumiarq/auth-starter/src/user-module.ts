import type { GeneratedFile } from '@illumiarq/support';
import { gitkeep } from '@illumiarq/support';
import { loadAuthStub } from './stubs.js';

const BASE = 'src/modules/User';

/**
 * Generates all files for the User/ module.
 * Called by `lumis auth:install` — never imported by application code.
 *
 * Templates are loaded from .stub files (Laravel-style). Users can customise them
 * by running `lumis stub:publish --auth` to copy stubs to their project's stubs/ directory.
 *
 * The User module handles user profiles — it is NOT the auth module.
 * Auth (login/register) lives in Auth/. User manages profile data.
 * User listens to UserRegistered from Auth/ to create profiles.
 */
export function generateUserModule(): GeneratedFile[] {
  return [
    // ── Empty layer directories ─────────────────────────────────────────────
    gitkeep(BASE, 'tests/unit'),
    gitkeep(BASE, 'tests/integration'),
    gitkeep(BASE, 'tests/features'),
    gitkeep(BASE, 'tests/fixtures'),

    // ── module + index ───────────────────────────────────────────────────────
    { path: `${BASE}/module.ts`, content: loadAuthStub('user/module.stub') },
    { path: `${BASE}/index.ts`, content: loadAuthStub('user/index.stub') },

    // ── Contracts ────────────────────────────────────────────────────────────
    {
      path: `${BASE}/contracts/models/user.model.ts`,
      content: loadAuthStub('user/user.model.stub'),
    },
    { path: `${BASE}/contracts/types/user.dto.ts`, content: loadAuthStub('user/user.dto.stub') },
    {
      path: `${BASE}/contracts/validators/update-profile.validator.ts`,
      content: loadAuthStub('user/update-profile.validator.stub'),
    },
    {
      path: `${BASE}/contracts/validators/delete-account.validator.ts`,
      content: loadAuthStub('user/delete-account.validator.stub'),
    },

    // ── Database ─────────────────────────────────────────────────────────────
    {
      path: `${BASE}/database/repositories/user.repository.ts`,
      content: loadAuthStub('user/user.repository.stub'),
    },
    {
      path: `${BASE}/database/schemas/user.schema.ts`,
      content: loadAuthStub('user/user.schema.stub'),
    },
    {
      path: `${BASE}/database/factories/user.factory.ts`,
      content: loadAuthStub('user/user.factory.stub'),
    },

    // ── Logic / Actions ───────────────────────────────────────────────────────
    {
      path: `${BASE}/logic/actions/create-user-profile.action.ts`,
      content: loadAuthStub('user/create-user-profile.action.stub'),
    },
    {
      path: `${BASE}/logic/actions/update-user-profile.action.ts`,
      content: loadAuthStub('user/update-user-profile.action.stub'),
    },
    {
      path: `${BASE}/logic/actions/delete-user-account.action.ts`,
      content: loadAuthStub('user/delete-user-account.action.stub'),
    },

    // ── Logic / Tasks ─────────────────────────────────────────────────────────
    {
      path: `${BASE}/logic/tasks/create-user.task.ts`,
      content: loadAuthStub('user/create-user.task.stub'),
    },
    {
      path: `${BASE}/logic/tasks/update-user.task.ts`,
      content: loadAuthStub('user/update-user.task.stub'),
    },
    {
      path: `${BASE}/logic/tasks/find-user.task.ts`,
      content: loadAuthStub('user/find-user.task.stub'),
    },
    {
      path: `${BASE}/logic/policies/user.policy.ts`,
      content: loadAuthStub('user/user.policy.stub'),
    },

    // ── Logic / Queries ───────────────────────────────────────────────────────
    {
      path: `${BASE}/logic/queries/get-profile.query.ts`,
      content: loadAuthStub('user/get-profile.query.stub'),
    },

    // ── Events ───────────────────────────────────────────────────────────────
    {
      path: `${BASE}/events/definitions/user-profile-created.event.ts`,
      content: loadAuthStub('user/user-profile-created.event.stub'),
    },
    {
      path: `${BASE}/events/definitions/user-account-deleted.event.ts`,
      content: loadAuthStub('user/user-account-deleted.event.stub'),
    },
    {
      path: `${BASE}/events/listeners/user-registered.listener.ts`,
      content: loadAuthStub('user/user-registered.listener.stub'),
    },

    // ── HTTP ─────────────────────────────────────────────────────────────────
    {
      path: `${BASE}/http/handlers/get-profile.handler.ts`,
      content: loadAuthStub('user/get-profile.handler.stub'),
    },
    {
      path: `${BASE}/http/handlers/update-profile.handler.ts`,
      content: loadAuthStub('user/update-profile.handler.stub'),
    },
    {
      path: `${BASE}/http/handlers/delete-account.handler.ts`,
      content: loadAuthStub('user/delete-account.handler.stub'),
    },
    {
      path: `${BASE}/http/loaders/get-profile.loader.ts`,
      content: loadAuthStub('user/get-profile.loader.stub'),
    },
    { path: `${BASE}/http/routes/user.api.ts`, content: loadAuthStub('user/api.route.stub') },
    { path: `${BASE}/http/routes/user.web.ts`, content: loadAuthStub('user/web.route.stub') },
  ];
}
