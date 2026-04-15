export const BLOCK_OPEN_DIRECTIVES = new Set([
  'section',
  'if',
  'elseif',
  'else',
  'foreach',
  'while',
  'slot',
  'component',
  'push',
  'prepend',
]);

export const BLOCK_CLOSE_DIRECTIVES = new Set([
  'endsection',
  'endif',
  'endforeach',
  'endwhile',
  'endslot',
  'endcomponent',
  'endpush',
  'endprepend',
]);

function tokenize(source) {
  const tokens = [];
  const directiveRe = /(@[a-zA-Z][a-zA-Z0-9]*(?:\([^)]*\))?(?:\(\{[^}]*\}\))?)/g;
  let lastIndex = 0;
  let match;

  while ((match = directiveRe.exec(source)) !== null) {
    const before = source.slice(lastIndex, match.index);
    if (before) tokens.push({ type: 'raw', raw: before });

    const full = match[1];
    const nameMatch = /^@([a-zA-Z][a-zA-Z0-9]*)(.*)$/s.exec(full);
    if (nameMatch) {
      const name = nameMatch[1].toLowerCase();
      const rest = (nameMatch[2] ?? '').trim();
      const args = rest.startsWith('(') && rest.endsWith(')') ? rest.slice(1, -1).trim() : rest;
      tokens.push({ type: 'directive', raw: full, name, args });
    } else {
      tokens.push({ type: 'raw', raw: full });
    }

    lastIndex = match.index + full.length;
  }

  const tail = source.slice(lastIndex);
  if (tail) tokens.push({ type: 'raw', raw: tail });

  return tokens;
}

function parseNodes(ctx, until) {
  const nodes = [];

  while (ctx.pos < ctx.tokens.length) {
    const token = ctx.tokens[ctx.pos];
    if (!token) break;

    if (token.type === 'raw') {
      ctx.pos++;
      if (token.raw.trim() || token.raw.includes('\n'))
        nodes.push({ type: 'raw', content: token.raw });
      continue;
    }

    const name = token.name;
    if (until && BLOCK_CLOSE_DIRECTIVES.has(name)) break;
    if (until?.has(name)) break;

    ctx.pos++;

    if (BLOCK_CLOSE_DIRECTIVES.has(name)) {
      nodes.push({ type: 'raw', content: token.raw });
      continue;
    }

    if (BLOCK_OPEN_DIRECTIVES.has(name)) {
      const closeTag = name === 'else' || name === 'elseif' ? undefined : `end${name}`;
      const waitFor = new Set(closeTag ? [closeTag] : ['endif', 'elseif', 'else']);
      const children = parseNodes(ctx, waitFor);
      const next = ctx.tokens[ctx.pos];
      if (next?.type === 'directive' && next.name && BLOCK_CLOSE_DIRECTIVES.has(next.name)) {
        ctx.pos++;
      }
      nodes.push({ type: 'block', name, args: token.args ?? '', children, raw: token.raw });
      continue;
    }

    nodes.push({ type: 'directive', name, args: token.args ?? '', raw: token.raw });
  }

  return nodes;
}

export function parseVeil(source) {
  const tokens = tokenize(source);
  return parseNodes({ tokens, pos: 0 });
}
