/**
 * Tests for the three enforcement presets exported by the LumiARQ ESLint plugin.
 *
 * Verifies that each preset's rule severities match the documented contract:
 *   guided      — all 15 rules as 'warn'
 *   team        — 9 boundary rules as 'error', 6 pattern rules as 'warn'
 *   strict      — all 15 rules as 'error'
 *   recommended — same as strict (backwards compat alias)
 */
import { describe, it, expect } from 'vitest';
import plugin from '../src/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const BOUNDARY_RULES = [
  '@lumiarq/no-cross-module-bypass',
  '@lumiarq/no-action-db-import',
  '@lumiarq/no-handler-task-import',
  '@lumiarq/no-task-task-import',
  '@lumiarq/no-process-env',
  '@lumiarq/no-framework-subpackage-import',
  '@lumiarq/no-mailer-outside-logic',
  '@lumiarq/no-queue-outside-logic',
  '@lumiarq/no-storage-outside-logic',
] as const;

const PATTERN_RULES = [
  '@lumiarq/no-internal-module-export',
  '@lumiarq/no-eventbus-listen-outside-bootstrap',
  '@lumiarq/no-action-in-loader',
  '@lumiarq/require-route-render-field',
  '@lumiarq/no-static-repository-methods',
  '@lumiarq/require-test-context',
] as const;

const ALL_RULES = [...BOUNDARY_RULES, ...PATTERN_RULES] as const;

// ── Plugin structure ──────────────────────────────────────────────────────────

describe('plugin structure', () => {
  it('exports all four config presets', () => {
    expect(plugin.configs).toHaveProperty('guided');
    expect(plugin.configs).toHaveProperty('team');
    expect(plugin.configs).toHaveProperty('strict');
    expect(plugin.configs).toHaveProperty('recommended');
  });

  it('registers all 15 rules', () => {
    expect(Object.keys(plugin.rules)).toHaveLength(15);
  });

  it('uses the correct plugin name in all presets', () => {
    for (const [preset, config] of Object.entries(plugin.configs)) {
      expect(config.plugins, `preset "${preset}"`).toContain('@lumiarq');
      expect(
        config.plugins,
        `preset "${preset}" should not contain old typo '@lumiarc'`,
      ).not.toContain('@lumiarc');
    }
  });
});

// ── Guided mode ───────────────────────────────────────────────────────────────

describe('configs.guided', () => {
  it('sets all 15 rules to warn', () => {
    const { rules } = plugin.configs.guided;

    for (const rule of ALL_RULES) {
      expect(rules[rule], `${rule} should be 'warn' in guided mode`).toBe('warn');
    }
  });

  it('contains exactly 15 rule entries', () => {
    expect(Object.keys(plugin.configs.guided.rules)).toHaveLength(15);
  });
});

// ── Team mode ─────────────────────────────────────────────────────────────────

describe('configs.team', () => {
  it('sets all 9 boundary rules to error', () => {
    const { rules } = plugin.configs.team;

    for (const rule of BOUNDARY_RULES) {
      expect(rules[rule], `${rule} should be 'error' in team mode`).toBe('error');
    }
  });

  it('sets all 6 pattern rules to warn', () => {
    const { rules } = plugin.configs.team;

    for (const rule of PATTERN_RULES) {
      expect(rules[rule], `${rule} should be 'warn' in team mode`).toBe('warn');
    }
  });

  it('contains exactly 15 rule entries', () => {
    expect(Object.keys(plugin.configs.team.rules)).toHaveLength(15);
  });
});

// ── Strict mode ───────────────────────────────────────────────────────────────

describe('configs.strict', () => {
  it('sets all 15 rules to error', () => {
    const { rules } = plugin.configs.strict;

    for (const rule of ALL_RULES) {
      expect(rules[rule], `${rule} should be 'error' in strict mode`).toBe('error');
    }
  });

  it('contains exactly 15 rule entries', () => {
    expect(Object.keys(plugin.configs.strict.rules)).toHaveLength(15);
  });
});

// ── Recommended (strict alias) ────────────────────────────────────────────────

describe('configs.recommended', () => {
  it('is identical to strict (backwards compat alias)', () => {
    expect(plugin.configs.recommended.rules).toEqual(plugin.configs.strict.rules);
  });
});
