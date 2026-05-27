export interface RankedPath {
  score: number;
  staticSegments: number;
  dynamicSegments: number;
  catchAllSegments: number;
  segmentCount: number;
}

function normalizeSegment(segment: string): string {
  if (!segment) return segment;
  if (segment.startsWith(':')) return ':param';
  return segment;
}

export function toCollisionSignature(path: string): string {
  const cleaned = path === '/' ? '/' : path.replace(/\/+$/, '');
  const parts = cleaned.split('/').filter(Boolean).map(normalizeSegment);
  return `/${parts.join('/')}`;
}

export function rankPath(path: string): RankedPath {
  const segments = path.split('/').filter(Boolean);
  let staticSegments = 0;
  let dynamicSegments = 0;
  let catchAllSegments = 0;

  for (const segment of segments) {
    if (segment.endsWith('*')) {
      catchAllSegments += 1;
    } else if (segment.startsWith(':')) {
      dynamicSegments += 1;
    } else {
      staticSegments += 1;
    }
  }

  const score =
    staticSegments * 100 - dynamicSegments * 20 - catchAllSegments * 40 + segments.length;
  return {
    score,
    staticSegments,
    dynamicSegments,
    catchAllSegments,
    segmentCount: segments.length,
  };
}
