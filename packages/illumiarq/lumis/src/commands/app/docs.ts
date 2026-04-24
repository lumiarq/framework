import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  if (!raw.startsWith('---\n')) {
    return { data: {}, body: raw };
  }

  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) {
    return { data: {}, body: raw };
  }

  const header = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const data: Record<string, unknown> = {};

  for (const line of header.split(/\r?\n/g)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (rawValue === 'true') {
      data[key] = true;
    } else if (rawValue === 'false') {
      data[key] = false;
    } else if (/^\d+$/.test(rawValue)) {
      data[key] = Number(rawValue);
    } else {
      data[key] = rawValue.replace(/^"|"$/g, '');
    }
  }

  return { data, body };
}

export function walkMarkdownFiles(dir: string, bucket: string[] = []): string[] {
  if (!existsSync(dir)) {
    return bucket;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(fullPath, bucket);
      continue;
    }

    if (entry.name.endsWith('.md')) {
      bucket.push(fullPath);
    }
  }

  return bucket;
}

export function findDocsRoots(cwd: string): string[] {
  return [
    join(cwd, 'content', 'docs'),
    join(cwd, 'src', 'content', 'docs'),
    join(cwd, 'src', 'shared', 'database', 'content', 'docs'),
    join(cwd, 'storage', 'docs-cache'),
  ].filter((candidate, index, all) => existsSync(candidate) && all.indexOf(candidate) === index);
}
