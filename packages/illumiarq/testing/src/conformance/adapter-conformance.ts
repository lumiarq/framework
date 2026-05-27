import { createHash } from 'node:crypto';

export interface AdapterConformanceTarget {
  framework: string;
  tier: 'ga' | 'beta';
  hydrateMode: 'none' | 'islands' | 'full';
  renderServer: (input: { component: string; props: Record<string, unknown> }) => Promise<string>;
  renderClientEntry: (input: { component: string; props: Record<string, unknown> }) => string;
  serializeProps: (props: Record<string, unknown>) => string;
}

export interface ConformanceResult {
  checksum: string;
  safeSerialization: boolean;
  hasClientEntryReference: boolean;
}

export async function runAdapterConformance(
  adapter: AdapterConformanceTarget,
  sample: { component: string; props: Record<string, unknown> },
): Promise<ConformanceResult> {
  const serialized = adapter.serializeProps(sample.props);
  const serverHtml = await adapter.renderServer(sample);
  const clientEntry = adapter.renderClientEntry(sample);
  const checksum = createHash('sha256').update(`${serverHtml}::${serialized}`).digest('hex');

  const safeSerialization = !serialized.includes('<script') && !serialized.includes('</script>');
  const hasClientEntryReference = clientEntry.includes(sample.component);

  return {
    checksum,
    safeSerialization,
    hasClientEntryReference,
  };
}
