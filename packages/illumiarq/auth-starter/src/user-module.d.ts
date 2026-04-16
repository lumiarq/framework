import type { GeneratedFile } from '@illumiarq/support';
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
export declare function generateUserModule(): GeneratedFile[];
//# sourceMappingURL=user-module.d.ts.map
