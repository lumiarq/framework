import { describe, it, expect } from 'vitest';
import { RuleTester } from 'eslint';
import noInternalModuleExport from '../src/rules/no-internal-module-export.js';
import noEventbusListenOutsideBootstrap from '../src/rules/no-eventbus-listen-outside-bootstrap.js';
import noActionInLoader from '../src/rules/no-action-in-loader.js';
import requireRouteRenderField from '../src/rules/require-route-render-field.js';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('no-internal-module-export rule', () => {
  it('allows valid exports and flags internal directory re-exports from index.ts', () => {
    expect(() =>
      tester.run('no-internal-module-export', noInternalModuleExport, {
        valid: [
          // Non-index files are not checked
          {
            code: "export { createUserAction } from './actions/create-user.action.js';",
            filename: 'src/modules/User/actions/create-user.action.ts',
          },
          // Exporting from a non-internal path is fine
          {
            code: "export { UserModel } from './models/user.model.js';",
            filename: 'src/modules/User/index.ts',
          },
          // Exporting from types is allowed
          {
            code: "export type { IUser } from './types/user.types.js';",
            filename: 'src/modules/User/index.ts',
          },
        ],
        invalid: [
          // Re-exporting from actions/
          {
            code: "export { createUserAction } from './actions/create-user.action.js';",
            filename: 'src/modules/User/index.ts',
            errors: [{ messageId: 'noInternalExport' }],
          },
          // Re-exporting from tasks/
          {
            code: "export * from './tasks/hash-password.task.js';",
            filename: 'src/modules/User/index.ts',
            errors: [{ messageId: 'noInternalExport' }],
          },
          // Re-exporting from handlers/
          {
            code: "export { createUserHandler } from './handlers/create-user.handler.js';",
            filename: 'src/modules/User/index.ts',
            errors: [{ messageId: 'noInternalExport' }],
          },
          // Re-exporting from repositories/
          {
            code: "export { userRepository } from './repositories/user.repository.js';",
            filename: 'src/modules/User/index.ts',
            errors: [{ messageId: 'noInternalExport' }],
          },
          // Re-exporting from loaders/
          {
            code: "export { userLoader } from './loaders/user.loader.js';",
            filename: 'src/modules/User/index.ts',
            errors: [{ messageId: 'noInternalExport' }],
          },
          // Re-exporting from listeners/
          {
            code: "export { userCreatedListener } from './listeners/user-created.listener.js';",
            filename: 'src/modules/User/index.ts',
            errors: [{ messageId: 'noInternalExport' }],
          },
          // Re-exporting from policies/
          {
            code: "export { canEditUser } from './policies/can-edit-user.policy.js';",
            filename: 'src/modules/User/index.ts',
            errors: [{ messageId: 'noInternalExport' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('no-eventbus-listen-outside-bootstrap rule', () => {
  it('allows EventBus.listen in bootstrap/events.ts and flags it elsewhere', () => {
    expect(() =>
      tester.run('no-eventbus-listen-outside-bootstrap', noEventbusListenOutsideBootstrap, {
        valid: [
          // Allowed in bootstrap/events.ts
          {
            code: "EventBus.listen('user.created', handler);",
            filename: 'src/bootstrap/events.ts',
          },
          // EventBus.emit is not listen — should not be flagged
          {
            code: "EventBus.emit('user.created', payload);",
            filename: 'src/modules/User/actions/create-user.action.ts',
          },
          // Unrelated function calls are fine
          {
            code: 'someOtherObject.listen(handler);',
            filename: 'src/modules/User/actions/create-user.action.ts',
          },
        ],
        invalid: [
          // Flagged in an action file
          {
            code: "EventBus.listen('user.created', handler);",
            filename: 'src/modules/User/actions/create-user.action.ts',
            errors: [{ messageId: 'noEventbusListen' }],
          },
          // Flagged in a listener file
          {
            code: "EventBus.listen('user.deleted', handleDelete);",
            filename: 'src/modules/User/listeners/user-deleted.listener.ts',
            errors: [{ messageId: 'noEventbusListen' }],
          },
          // Flagged in a handler file
          {
            code: "EventBus.listen('order.placed', onOrderPlaced);",
            filename: 'src/modules/Order/handlers/place-order.handler.ts',
            errors: [{ messageId: 'noEventbusListen' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('no-action-in-loader rule', () => {
  it('flags action imports inside loader files', () => {
    expect(() =>
      tester.run('no-action-in-loader', noActionInLoader, {
        valid: [
          // Action importing from actions is fine (not a loader)
          {
            code: "import { createUserAction } from '../actions/create-user.action.js';",
            filename: 'src/modules/User/handlers/create-user.handler.ts',
          },
          // Loader importing from a repository is fine
          {
            code: "import { userRepository } from '../repositories/user.repository.js';",
            filename: 'src/modules/User/loaders/user.loader.ts',
          },
          // Loader importing from types is fine
          {
            code: "import type { IUser } from '../types/user.types.js';",
            filename: 'src/modules/User/loaders/user-profile.loader.ts',
          },
        ],
        invalid: [
          // Loader in /loaders/ importing from /actions/
          {
            code: "import { createUserAction } from '../actions/create-user.action.js';",
            filename: 'src/modules/User/loaders/user.loader.ts',
            errors: [{ messageId: 'noActionImport' }],
          },
          // File ending in .loader.ts importing an action
          {
            code: "import { loginAction } from '../actions/login.action.js';",
            filename: 'src/modules/Auth/auth.loader.ts',
            errors: [{ messageId: 'noActionImport' }],
          },
          // Loader importing from /actions/ with a nested path
          {
            code: "import { sendEmailAction } from '../../Notification/actions/send-email.action.js';",
            filename: 'src/modules/User/loaders/dashboard.loader.ts',
            errors: [{ messageId: 'noActionImport' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('require-route-render-field rule', () => {
  it('requires a render property in defineRoute() calls', () => {
    expect(() =>
      tester.run('require-route-render-field', requireRouteRenderField, {
        valid: [
          // defineRoute with render property is valid
          {
            code: "defineRoute({ path: '/home', render: HomePage });",
            filename: 'src/routes/home.route.ts',
          },
          // defineRoute with multiple properties including render
          {
            code: "defineRoute({ path: '/profile', name: 'profile', render: ProfilePage, middleware: [auth] });",
            filename: 'src/routes/profile.route.ts',
          },
          // Calls to other functions named differently are ignored
          {
            code: "defineOtherThing({ path: '/home' });",
            filename: 'src/routes/home.route.ts',
          },
        ],
        invalid: [
          // Missing render property
          {
            code: "defineRoute({ path: '/home' });",
            filename: 'src/routes/home.route.ts',
            errors: [{ messageId: 'missingRender' }],
          },
          // Empty object — no render property
          {
            code: 'defineRoute({});',
            filename: 'src/routes/home.route.ts',
            errors: [{ messageId: 'missingRender' }],
          },
          // Has other props but not render
          {
            code: "defineRoute({ path: '/admin', name: 'admin', middleware: [auth] });",
            filename: 'src/routes/admin.route.ts',
            errors: [{ messageId: 'missingRender' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});
