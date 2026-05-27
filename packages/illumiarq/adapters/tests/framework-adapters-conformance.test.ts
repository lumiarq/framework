import { describe, expect, it } from 'vitest';
import { runAdapterConformance } from '../../testing/src/conformance/adapter-conformance.js';

import { createQwikAdapter } from '../src/qwik/index.js';
import { createReactAdapter } from '../src/react/index.js';
import { createSolidAdapter } from '../src/solid/index.js';
import { createSvelteAdapter } from '../src/svelte/index.js';
import { createVueAdapter } from '../src/vue/index.js';

describe('framework adapters conformance', () => {
  it('passes conformance checks for GA adapters', async () => {
    const sample = {
      component: 'HomePage',
      props: { title: 'Hello', marker: '<script>alert(1)</script>' },
    };
    const adapters = [createReactAdapter(), createVueAdapter()];

    for (const adapter of adapters) {
      const result = await runAdapterConformance(adapter, sample);
      expect(adapter.tier).toBe('ga');
      expect(result.safeSerialization).toBe(true);
      expect(result.hasClientEntryReference).toBe(true);
      expect(result.checksum).toHaveLength(64);
    }
  });

  it('keeps beta adapters behind explicit gates', () => {
    expect(() => createSvelteAdapter()).toThrow(/beta-only/i);
    expect(() => createSolidAdapter()).toThrow(/beta-only/i);
    expect(() => createQwikAdapter()).toThrow(/beta-only/i);
  });

  it('allows beta adapters after gate enablement', async () => {
    const sample = { component: 'DashboardPage', props: { count: 3 } };
    const adapters = [
      createSvelteAdapter({ enableBeta: true }),
      createSolidAdapter({ enableBeta: true }),
      createQwikAdapter({ enableBeta: true }),
    ];

    for (const adapter of adapters) {
      const result = await runAdapterConformance(adapter, sample);
      expect(adapter.tier).toBe('beta');
      expect(result.safeSerialization).toBe(true);
      expect(result.checksum).toHaveLength(64);
    }
  });
});
