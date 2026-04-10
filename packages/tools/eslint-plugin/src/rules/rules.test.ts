import { describe, it, expect } from 'vitest';
import { RuleTester } from 'eslint';
import noProcessEnv from './no-process-env.js';
import noHandlerTaskImport from './no-handler-task-import.js';
import noActionDbImport from './no-action-db-import.js';
import noTaskTaskImport from './no-task-task-import.js';
import noCrossModuleBypass from './no-cross-module-bypass.js';
import noFrameworkSubpackageImport from './no-framework-subpackage-import.js';
import noMailerOutsideLogic from './no-mailer-outside-logic.js';
import noQueueOutsideLogic from './no-queue-outside-logic.js';
import noStorageOutsideLogic from './no-storage-outside-logic.js';
import { FRAMEWORK, PKG } from '../../tests/fixtures/packages.js';

// ─── Test setup ────────────────────────────────────────────────────────────

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('no-process-env rule', () => {
  it('passes valid code and flags process.env outside env.ts', () => {
    expect(() =>
      tester.run('no-process-env', noProcessEnv, {
        valid: [
          { code: 'const x = 1;', filename: 'src/app.ts' },
          { code: 'const url = process.env.DATABASE_URL;', filename: 'src/env.ts' },
        ],
        invalid: [
          {
            code: 'const url = process.env.DATABASE_URL;',
            filename: 'src/services/db.ts',
            errors: [{ messageId: 'noProcessEnv' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('no-handler-task-import rule', () => {
  it('flags task imports inside handler files', () => {
    expect(() =>
      tester.run('no-handler-task-import', noHandlerTaskImport, {
        valid: [
          {
            code: "import { createUserAction } from '../actions/create-user.action.js';",
            filename: 'src/modules/User/handlers/create-user.handler.ts',
          },
        ],
        invalid: [
          {
            code: "import { hashPasswordTask } from '../tasks/hash-password.task.js';",
            filename: 'src/modules/User/handlers/create-user.handler.ts',
            errors: [{ messageId: 'noDirectTaskImport' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('no-action-db-import rule', () => {
  it('flags drizzle-orm imports inside action files', () => {
    expect(() =>
      tester.run('no-action-db-import', noActionDbImport, {
        valid: [
          {
            code: "import { hashPasswordTask } from '../tasks/hash-password.task.js';",
            filename: 'src/modules/User/actions/create-user.action.ts',
          },
        ],
        invalid: [
          {
            code: "import { db } from 'drizzle-orm';",
            filename: 'src/modules/User/actions/create-user.action.ts',
            errors: [{ messageId: 'noDbImport' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('no-task-task-import rule', () => {
  it('flags task imports inside task files', () => {
    expect(() =>
      tester.run('no-task-task-import', noTaskTaskImport, {
        valid: [
          {
            code: "import type { IUserRepository } from '../repositories/user.repository.js';",
            filename: 'src/modules/User/tasks/create-user-in-db.task.ts',
          },
        ],
        invalid: [
          {
            code: "import { hashPasswordTask } from './hash-password.task.js';",
            filename: 'src/modules/User/tasks/create-user-in-db.task.ts',
            errors: [{ messageId: 'noTaskImport' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('no-cross-module-bypass rule', () => {
  it('flags direct cross-module imports bypassing index.ts', () => {
    expect(() =>
      tester.run('no-cross-module-bypass', noCrossModuleBypass, {
        valid: [
          {
            code: "import { User } from '../User/index.js';",
            filename: 'src/modules/Auth/actions/login.action.ts',
          },
        ],
        invalid: [
          {
            code: "import { createUserInDbTask } from '../User/tasks/create-user-in-db.task.js';",
            filename: 'src/modules/Auth/actions/login.action.ts',
            errors: [{ messageId: 'crossModuleBypass' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('no-framework-subpackage-import rule', () => {
  it('allows imports from @lumiarq/framework and its sub-paths', () => {
    expect(() =>
      tester.run('no-framework-subpackage-import', noFrameworkSubpackageImport, {
        valid: [
          { code: `import { defineAction } from '${FRAMEWORK}';` },
          { code: `import { BaseRepository } from '${FRAMEWORK}/database';` },
          { code: `import { runWithContext } from '${FRAMEWORK}/runtime';` },
          { code: `import { t } from '${FRAMEWORK}';` },
        ],
        invalid: [],
      }),
    ).not.toThrow();
  });

  it(`flags direct import from ${PKG.core}`, () => {
    expect(() =>
      tester.run('no-framework-subpackage-import', noFrameworkSubpackageImport, {
        valid: [],
        invalid: [
          {
            code: `import { defineAction } from '${PKG.core}';`,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
        ],
      }),
    ).not.toThrow();
  });

  it(`flags direct import from ${PKG.runtime}`, () => {
    expect(() =>
      tester.run('no-framework-subpackage-import', noFrameworkSubpackageImport, {
        valid: [],
        invalid: [
          {
            code: `import { runWithContext } from '${PKG.runtime}';`,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
        ],
      }),
    ).not.toThrow();
  });

  it(`flags direct import from ${PKG.database}`, () => {
    expect(() =>
      tester.run('no-framework-subpackage-import', noFrameworkSubpackageImport, {
        valid: [],
        invalid: [
          {
            code: `import { BaseRepository } from '${PKG.database}';`,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
        ],
      }),
    ).not.toThrow();
  });

  it(`flags direct import from ${PKG.auth}`, () => {
    expect(() =>
      tester.run('no-framework-subpackage-import', noFrameworkSubpackageImport, {
        valid: [],
        invalid: [
          {
            code: `import { BaseLoginAction } from '${PKG.auth}';`,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

// ─── Dispatch boundary rules ──────────────────────────────────────────────────

describe('no-mailer-outside-logic rule', () => {
  it('allows mailer.send() inside logic/actions/', () => {
    expect(() =>
      tester.run('no-mailer-outside-logic', noMailerOutsideLogic, {
        valid: [
          {
            code: 'mailer.send({ to: "a@b.com", subject: "Hi", template: "t", payload: {} });',
            filename: 'src/modules/User/logic/actions/register.action.ts',
          },
          {
            code: 'mailer.send({ to: "a@b.com", subject: "Hi", template: "t", payload: {} });',
            filename: 'src/modules/Auth/logic/tasks/send-welcome-email.task.ts',
          },
        ],
        invalid: [],
      }),
    ).not.toThrow();
  });

  it('flags mailer.send() in a handler', () => {
    expect(() =>
      tester.run('no-mailer-outside-logic', noMailerOutsideLogic, {
        valid: [],
        invalid: [
          {
            code: 'mailer.send({ to: "a@b.com", subject: "Hi", template: "t", payload: {} });',
            filename: 'src/modules/User/http/handlers/register.handler.ts',
            errors: [{ messageId: 'noMailerCall' }],
          },
        ],
      }),
    ).not.toThrow();
  });

  it('flags mailer.queue() in a loader', () => {
    expect(() =>
      tester.run('no-mailer-outside-logic', noMailerOutsideLogic, {
        valid: [],
        invalid: [
          {
            code: 'mailer.queue({ to: "a@b.com", subject: "Hi", template: "t", payload: {} });',
            filename: 'src/modules/User/http/loaders/get-user.loader.ts',
            errors: [{ messageId: 'noMailerCall' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('no-queue-outside-logic rule', () => {
  it('allows queue.dispatch() inside logic/actions/', () => {
    expect(() =>
      tester.run('no-queue-outside-logic', noQueueOutsideLogic, {
        valid: [
          {
            code: 'queue.dispatch({ name: "SendEmailJob", data: {} });',
            filename: 'src/modules/Auth/logic/actions/register.action.ts',
          },
          {
            code: 'queue.later({ name: "SendEmailJob", data: {} }, 300);',
            filename: 'src/modules/Auth/logic/tasks/send-verification-email.task.ts',
          },
        ],
        invalid: [],
      }),
    ).not.toThrow();
  });

  it('flags queue.dispatch() in a handler', () => {
    expect(() =>
      tester.run('no-queue-outside-logic', noQueueOutsideLogic, {
        valid: [],
        invalid: [
          {
            code: 'queue.dispatch({ name: "SendEmailJob", data: {} });',
            filename: 'src/modules/Auth/http/handlers/register.handler.ts',
            errors: [{ messageId: 'noQueueCall' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe('no-storage-outside-logic rule', () => {
  it('allows storage.put() inside logic/tasks/', () => {
    expect(() =>
      tester.run('no-storage-outside-logic', noStorageOutsideLogic, {
        valid: [
          {
            code: 'await storage.put("uploads/avatar.png", buffer);',
            filename: 'src/modules/User/logic/tasks/upload-avatar.task.ts',
          },
          {
            code: 'await storage.get("uploads/avatar.png");',
            filename: 'src/modules/User/logic/actions/update-profile.action.ts',
          },
        ],
        invalid: [],
      }),
    ).not.toThrow();
  });

  it('flags storage.put() in a handler', () => {
    expect(() =>
      tester.run('no-storage-outside-logic', noStorageOutsideLogic, {
        valid: [],
        invalid: [
          {
            code: 'await storage.put("uploads/avatar.png", buffer);',
            filename: 'src/modules/User/http/handlers/update-profile.handler.ts',
            errors: [{ messageId: 'noStorageCall' }],
          },
        ],
      }),
    ).not.toThrow();
  });

  it('flags storage.delete() in a repository', () => {
    expect(() =>
      tester.run('no-storage-outside-logic', noStorageOutsideLogic, {
        valid: [],
        invalid: [
          {
            code: 'await storage.delete("uploads/old.png");',
            filename: 'src/modules/User/database/repositories/user.repository.ts',
            errors: [{ messageId: 'noStorageCall' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});
