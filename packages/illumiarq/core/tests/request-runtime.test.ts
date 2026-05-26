import { describe, expect, it } from 'vitest';
import { headersToRecord } from '../src/http/headers-to-record.js';
import { parseRequestUrl } from '../src/http/request-url.js';

describe('parseRequestUrl', () => {
  it('parses relative request URLs on serverless runtimes', () => {
    const req = new Request('http://localhost/docs/getting-started');
    expect(parseRequestUrl(req).pathname).toBe('/docs/getting-started');
  });

  it('accepts a relative url string via Request', () => {
    const req = { url: '/api/health' } as Request;
    expect(parseRequestUrl(req).pathname).toBe('/api/health');
  });
});

describe('headersToRecord', () => {
  it('reads Web API Headers', () => {
    const headers = new Headers({ 'x-test': '1', accept: 'application/json' });
    expect(headersToRecord(headers)).toEqual({
      'x-test': '1',
      accept: 'application/json',
    });
  });

  it('reads Node.js IncomingMessage-style header objects', () => {
    expect(
      headersToRecord({
        'x-test': '1',
        'set-cookie': ['a=1', 'b=2'],
      }),
    ).toEqual({
      'x-test': '1',
      'set-cookie': 'a=1, b=2',
    });
  });
});
