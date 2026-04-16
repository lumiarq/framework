import type { GeneratedFile } from '@illumiarq/support';
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
export declare function generateIAMModule(): GeneratedFile[];
//# sourceMappingURL=iam-module.d.ts.map
