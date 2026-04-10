import noProcessEnv from './rules/no-process-env.js';
import noHandlerTaskImport from './rules/no-handler-task-import.js';
import noActionDbImport from './rules/no-action-db-import.js';
import noTaskTaskImport from './rules/no-task-task-import.js';
import noCrossModuleBypass from './rules/no-cross-module-bypass.js';
import noInternalModuleExport from './rules/no-internal-module-export.js';
import noEventbusListenOutsideBootstrap from './rules/no-eventbus-listen-outside-bootstrap.js';
import noActionInLoader from './rules/no-action-in-loader.js';
import requireRouteRenderField from './rules/require-route-render-field.js';
import noFrameworkSubpackageImport from './rules/no-framework-subpackage-import.js';
import noMailerOutsideLogic from './rules/no-mailer-outside-logic.js';
import noQueueOutsideLogic from './rules/no-queue-outside-logic.js';
import noStorageOutsideLogic from './rules/no-storage-outside-logic.js';
import noStaticRepositoryMethods from './rules/no-static-repository-methods.js';
import requireTestContext from './rules/require-test-context.js';

/**
 * LumiARQ ESLint plugin — enforces layer boundary invariants.
 *
 * Three enforcement presets, chosen based on team maturity:
 *
 *   configs.guided      — all rules as 'warn'  (day-one / onboarding)
 *   configs.team        — boundary rules 'error', pattern rules 'warn' (CI-safe)
 *   configs.strict      — all rules as 'error' (mature codebases)
 *   configs.recommended — alias for strict (backwards-compatible)
 *
 * Boundary rules (module isolation and layer invariants):
 *   no-cross-module-bypass, no-action-db-import, no-handler-task-import,
 *   no-task-task-import, no-process-env, no-framework-subpackage-import,
 *   no-mailer-outside-logic, no-queue-outside-logic, no-storage-outside-logic
 *
 * Pattern rules (conventions and test hygiene):
 *   no-internal-module-export, no-eventbus-listen-outside-bootstrap,
 *   no-action-in-loader, require-route-render-field,
 *   no-static-repository-methods, require-test-context
 */

// ── Rule name constants ───────────────────────────────────────────────────────

/** Violations indicate structural problems — error in team + strict modes. */
const BOUNDARY_RULES = [
  'no-cross-module-bypass',
  'no-action-db-import',
  'no-handler-task-import',
  'no-task-task-import',
  'no-process-env',
  'no-framework-subpackage-import',
  'no-mailer-outside-logic',
  'no-queue-outside-logic',
  'no-storage-outside-logic',
] as const;

/** Violations indicate code smell — warn in team mode, error only in strict. */
const PATTERN_RULES = [
  'no-internal-module-export',
  'no-eventbus-listen-outside-bootstrap',
  'no-action-in-loader',
  'require-route-render-field',
  'no-static-repository-methods',
  'require-test-context',
] as const;

// ── Preset builder ────────────────────────────────────────────────────────────

function buildRules(
  boundaryLevel: 'error' | 'warn',
  patternLevel: 'error' | 'warn',
): Record<string, 'error' | 'warn'> {
  const rules: Record<string, 'error' | 'warn'> = {};
  for (const name of BOUNDARY_RULES) rules[`@lumiarq/${name}`] = boundaryLevel;
  for (const name of PATTERN_RULES) rules[`@lumiarq/${name}`] = patternLevel;
  return rules;
}

// ── Plugin ────────────────────────────────────────────────────────────────────

const plugin = {
  meta: {
    name: '@lumiarq/eslint-plugin',
    version: '1.0.0',
  },

  rules: {
    'no-process-env': noProcessEnv,
    'no-handler-task-import': noHandlerTaskImport,
    'no-action-db-import': noActionDbImport,
    'no-task-task-import': noTaskTaskImport,
    'no-cross-module-bypass': noCrossModuleBypass,
    'no-internal-module-export': noInternalModuleExport,
    'no-eventbus-listen-outside-bootstrap': noEventbusListenOutsideBootstrap,
    'no-action-in-loader': noActionInLoader,
    'require-route-render-field': requireRouteRenderField,
    'no-framework-subpackage-import': noFrameworkSubpackageImport,
    'no-mailer-outside-logic': noMailerOutsideLogic,
    'no-queue-outside-logic': noQueueOutsideLogic,
    'no-storage-outside-logic': noStorageOutsideLogic,
    'no-static-repository-methods': noStaticRepositoryMethods,
    'require-test-context': requireTestContext,
  },

  configs: {
    /**
     * Guided mode — all rules as warnings.
     * Recommended for day-one projects and during onboarding.
     * Developers see suggestions without being blocked.
     */
    guided: {
      plugins: ['@lumiarq'],
      rules: buildRules('warn', 'warn'),
    },

    /**
     * Team mode — boundary rules fail CI; pattern rules warn.
     * Recommended once the team understands core architectural principles.
     * Safe for CI without blocking exploratory work.
     */
    team: {
      plugins: ['@lumiarq'],
      rules: buildRules('error', 'warn'),
    },

    /**
     * Strict mode — every rule is an error.
     * Recommended for mature codebases with stable module boundaries.
     */
    strict: {
      plugins: ['@lumiarq'],
      rules: buildRules('error', 'error'),
    },

    /**
     * Recommended — alias for strict (kept for backwards compatibility).
     */
    recommended: {
      plugins: ['@lumiarq'],
      rules: buildRules('error', 'error'),
    },
  },
};

export default plugin;
