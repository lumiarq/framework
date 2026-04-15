function indent(depth, opts) {
  return opts.useTabs ? '\t'.repeat(depth) : ' '.repeat(depth * opts.tabWidth);
}

function formatDirectiveLine(name, args) {
  return args ? `@${name}(${args})` : `@${name}`;
}

function reindentHtml(raw, depth, opts) {
  const prefix = indent(depth, opts);
  const lines = raw.split('\n');

  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const leading = line.match(/^(\s*)/)?.[1]?.length ?? 0;
    if (leading < minIndent) minIndent = leading;
  }
  if (minIndent === Infinity) minIndent = 0;

  return lines
    .map((line) => {
      if (line.trim() === '') return '';
      const stripped = line.slice(minIndent);
      return `${prefix}${stripped}`;
    })
    .join('\n');
}

function printNode(node, depth, opts) {
  if (node.type === 'directive')
    return `${indent(depth, opts)}${formatDirectiveLine(node.name, node.args)}`;
  if (node.type === 'raw') {
    const trimmed = node.content.replace(/^\n+/, '').replace(/\n+$/, '');
    if (!trimmed) return '';
    return reindentHtml(trimmed, depth, opts);
  }

  const parts = [`${indent(depth, opts)}${formatDirectiveLine(node.name, node.args)}`];
  for (const child of node.children) {
    const rendered = printNode(child, depth + 1, opts);
    if (rendered) parts.push(rendered);
  }
  parts.push(`${indent(depth, opts)}@end${node.name}`);
  return parts.join('\n');
}

export function printVeil(nodes, options = {}) {
  const opts = {
    tabWidth: options.tabWidth ?? 2,
    useTabs: options.useTabs ?? false,
    printWidth: options.printWidth ?? 120,
  };

  const hoisted = [];
  const rest = [];

  for (const node of nodes) {
    if (node.type === 'directive' && (node.name === 'vars' || node.name === 'extends')) {
      hoisted.push(printNode(node, 0, opts));
    } else {
      const rendered = printNode(node, 0, opts);
      if (rendered) rest.push(rendered);
    }
  }

  const sections = [];
  if (hoisted.length) sections.push(hoisted.join('\n'));
  if (rest.length) sections.push(rest.join('\n'));
  return sections.join('\n\n').trimEnd() + '\n';
}
