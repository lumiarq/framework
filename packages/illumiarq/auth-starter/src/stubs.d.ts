export declare function loadAuthStub(name: string): string;
/**
 * Loads an IAM stub by name (e.g. 'iam/module.stub').
 * Resolution order (Laravel-style):
 *   1. {project}/stubs/iam/{file}  ← user-published override
 *   2. {packageDir}/stubs/iam/{file}  ← package default
 */
export declare function loadIAMStub(name: string): string;
/** Returns the package stubs root (used by lumis stub:publish --auth). */
export declare function getAuthStarterStubsDir(): string;
/** Copies all auth-starter stubs to {project}/stubs/{auth|user}/ for user customisation. */
export declare function publishAuthStubs(projectRoot: string): void;
/** Copies all IAM stubs to {project}/stubs/iam/ for user customisation. */
export declare function publishIAMStubs(projectRoot: string): void;
/**
 * Loads a UI stub for the given framework and stub name.
 * Resolution order:
 *   1. {project}/stubs/ui/{framework}/{name}  ← user-published
 *   2. {packageDir}/stubs/ui/{framework}/{name} ← package default
 *   3. Placeholder comment if no stub exists for this framework yet
 */
export declare function loadUiStub(framework: string, name: string): string;
//# sourceMappingURL=stubs.d.ts.map