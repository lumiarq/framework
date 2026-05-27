import type { FrameworkAdapter, HydrateMode } from './types.js';

function escapeUnsafeJson(text: string): string {
  return text
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function defaultSerializeProps(props: Record<string, unknown>): string {
  return escapeUnsafeJson(JSON.stringify(props));
}

export function createAdapter(
  framework: FrameworkAdapter['framework'],
  tier: FrameworkAdapter['tier'],
  hydrateMode: HydrateMode,
): FrameworkAdapter {
  return {
    framework,
    tier,
    hydrateMode,
    async renderServer({ component, props }) {
      const json = defaultSerializeProps(props);
      return `<div data-lumiarq-framework="${framework}" data-component="${component}"></div><script type="application/json" data-props="${component}">${json}</script>`;
    },
    renderClientEntry({ component, props }) {
      return `/* ${framework} client entry */\nmount("${component}", ${defaultSerializeProps(props)});`;
    },
    serializeProps: defaultSerializeProps,
  };
}

export function assertBetaEnabled(
  framework: 'svelte' | 'solid' | 'qwik',
  enabled: boolean | undefined,
): void {
  if (!enabled) {
    throw new Error(
      `${framework} adapter is beta-only. Enable via { enableBeta: true } after conformance gates pass.`,
    );
  }
}
