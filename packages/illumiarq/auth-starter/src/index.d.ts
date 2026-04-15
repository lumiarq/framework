/**
 * @illumiarq/auth-starter — consumed by `lumis auth:install` only.
 * Never imported by application code.
 *
 * Exports functions that return GeneratedFile[] arrays — the CLI writes
 * those files to disk. No runnable logic lives in this package.
 */
export type { GeneratedFile } from '@illumiarq/support';
export { generateAuthModule } from './auth-module.js';
export { generateUserModule } from './user-module.js';
export { generateIAMModule } from './iam-module.js';
export { generateAuthUI } from './ui-module.js';
export { publishAuthStubs, publishIAMStubs } from './stubs.js';
export { generateLangFile } from './lang-file.js';
//# sourceMappingURL=index.d.ts.map