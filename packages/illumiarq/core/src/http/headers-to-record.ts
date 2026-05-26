type HeaderLike = Headers | Record<string, string | string[] | undefined>;

/**
 * Normalizes Web API Headers and Node.js IncomingMessage header objects.
 */
export function headersToRecord(headers: HeaderLike): Record<string, string> {
  const headersMap: Record<string, string> = {};

  if (typeof (headers as Headers).forEach === 'function') {
    (headers as Headers).forEach((value, key) => {
      headersMap[key] = value;
    });
    return headersMap;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      headersMap[key] = value.join(', ');
    } else if (typeof value === 'string') {
      headersMap[key] = value;
    }
  }

  return headersMap;
}
