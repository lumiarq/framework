import { describe, it, expect } from 'vitest';
import { RuleTester } from 'eslint';
import noFrameworkSubpackageImport from '../src/rules/no-framework-subpackage-import.js';
import { FRAMEWORK, PKG } from './fixtures/packages.js';

// ─── Test setup ────────────────────────────────────────────────────────────

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const BOOTSTRAP_FILE = 'src/bootstrap/app.ts';
const ACTION_FILE = 'src/modules/User/actions/create-user.action.ts';
const REPOSITORY_FILE = 'src/modules/User/repositories/user.repository.ts';
const AUTH_ACTION_FILE = 'src/modules/Auth/actions/login.action.ts';

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('no-framework-subpackage-import rule', () => {
  it('allows @lumiarq/framework imports and flags direct @velo/* imports', () => {
    expect(() =>
      tester.run('no-framework-subpackage-import', noFrameworkSubpackageImport, {
        valid: [
          // Top-level meta-package is always allowed
          { code: `import { createApp } from '${FRAMEWORK}';`, filename: BOOTSTRAP_FILE },
          // Sub-paths of @lumiarq/framework are allowed
          {
            code: `import { BaseRepository } from '${FRAMEWORK}/database';`,
            filename: REPOSITORY_FILE,
          },
          {
            code: `import { createRouter } from '${FRAMEWORK}/runtime';`,
            filename: BOOTSTRAP_FILE,
          },
          // Third-party packages are always fine
          { code: "import { z } from 'zod';", filename: ACTION_FILE },
          // Relative imports are fine
          {
            code: "import { userRepo } from './repositories/user.repository.js';",
            filename: ACTION_FILE,
          },
        ],
        invalid: [
          {
            code: `import { retry } from '${PKG.core}';`,
            filename: ACTION_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { createRouter } from '${PKG.runtime}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { BaseRepository } from '${PKG.database}';`,
            filename: REPOSITORY_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { BaseLoginAction } from '${PKG.auth}';`,
            filename: AUTH_ACTION_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { runMigrations } from '${PKG.migrations}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { LibSQLAdapter } from '${PKG.adapters}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { defineConfig } from '${PKG.build}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { generateAuthUI } from '${PKG.authStarter}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { fillStub } from '${PKG.support}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { useQuery } from '${PKG.query}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { getContext } from '${PKG.context}';`,
            filename: ACTION_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { discoverModules } from '${PKG.modules}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { InMemoryCacheDriver } from '${PKG.cache}';`,
            filename: ACTION_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { withTestContext } from '${PKG.testing}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
          {
            code: `import { tinker } from '${PKG.tinker}';`,
            filename: BOOTSTRAP_FILE,
            errors: [{ messageId: 'noSubpackageImport' }],
          },
        ],
      }),
    ).not.toThrow();
  });
});
