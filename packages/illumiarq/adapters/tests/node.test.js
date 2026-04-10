/**
 * Tests the startNodeServer() adapter that wraps a Hono app in Node's
 * built-in http module via @hono/node-server.
 *
 * The adapter is tested via the vi.hoisted + vi.mock pattern to intercept
 * the dynamic `await import('@hono/node-server')` call inside the function.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Hono } from 'hono';
// ─── Hoist mock BEFORE the vi.mock call (required for dynamic imports) ───────
const { mockServe } = vi.hoisted(() => ({ mockServe: vi.fn() }));
vi.mock('@hono/node-server', () => ({
  serve: mockServe,
}));
// Import AFTER the mock is registered
const { startNodeServer } = await import('../src/node/index.js');
// ─── Helpers ─────────────────────────────────────────────────────────────────
function silenceConsole() {
  return vi.spyOn(console, 'info').mockImplementation(() => {});
}
afterEach(() => {
  mockServe.mockClear();
  vi.restoreAllMocks();
});
// ─── startNodeServer ─────────────────────────────────────────────────────────
describe('startNodeServer', () => {
  it('calls serve with the Hono app fetch handler', async () => {
    silenceConsole();
    const app = new Hono();
    await startNodeServer(app);
    expect(mockServe).toHaveBeenCalledOnce();
    expect(mockServe).toHaveBeenCalledWith(expect.objectContaining({ fetch: app.fetch }));
  });
  it('uses default port 4000 when no options provided', async () => {
    silenceConsole();
    await startNodeServer(new Hono());
    expect(mockServe).toHaveBeenCalledWith(expect.objectContaining({ port: 4000 }));
  });
  it('uses default hostname 0.0.0.0 when no options provided', async () => {
    silenceConsole();
    await startNodeServer(new Hono());
    expect(mockServe).toHaveBeenCalledWith(expect.objectContaining({ hostname: '0.0.0.0' }));
  });
  it('passes a custom port through to serve', async () => {
    silenceConsole();
    await startNodeServer(new Hono(), { port: 8080 });
    expect(mockServe).toHaveBeenCalledWith(expect.objectContaining({ port: 8080 }));
  });
  it('passes a custom hostname through to serve', async () => {
    silenceConsole();
    await startNodeServer(new Hono(), { hostname: '127.0.0.1' });
    expect(mockServe).toHaveBeenCalledWith(expect.objectContaining({ hostname: '127.0.0.1' }));
  });
  it('passes both custom port and hostname simultaneously', async () => {
    silenceConsole();
    await startNodeServer(new Hono(), { port: 9000, hostname: 'localhost' });
    expect(mockServe).toHaveBeenCalledWith(
      expect.objectContaining({ port: 9000, hostname: 'localhost' }),
    );
  });
  it('logs the bound address on startup', async () => {
    const spy = silenceConsole();
    await startNodeServer(new Hono(), { port: 4321, hostname: 'my-host' });
    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0];
    expect(msg).toContain('4321');
    expect(msg).toContain('my-host');
  });
  it('log message contains the lumiarq prefix', async () => {
    const spy = silenceConsole();
    await startNodeServer(new Hono());
    const msg = spy.mock.calls[0][0];
    expect(msg).toContain('lumiarq');
  });
  it('distinct Hono app instances each bind their own fetch function', async () => {
    silenceConsole();
    const app1 = new Hono();
    const app2 = new Hono();
    await startNodeServer(app1);
    await startNodeServer(app2);
    const calls = mockServe.mock.calls;
    expect(calls[0][0]).toMatchObject({ fetch: app1.fetch });
    expect(calls[1][0]).toMatchObject({ fetch: app2.fetch });
  });
});
//# sourceMappingURL=node.test.js.map
