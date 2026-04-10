import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetForTesting,
  __setAlpineLoaderForTesting,
  getAlpine,
  isStarted,
  registerComponents,
  start,
} from '../src/render/hydrate.js';
function createAlpineMock() {
  return {
    data: vi.fn(),
    start: vi.fn(),
  };
}
describe('hydrate', () => {
  beforeEach(() => {
    __resetForTesting();
  });
  it('registers components before start', async () => {
    const alpine = createAlpineMock();
    registerComponents({
      counter: { count: 0 },
      modal: () => ({ open: false }),
    });
    __setAlpineLoaderForTesting(async () => ({
      default: alpine,
    }));
    await start();
    expect(alpine.data).toHaveBeenCalledTimes(2);
    expect(alpine.start).toHaveBeenCalledTimes(1);
    expect(isStarted()).toBe(true);
  });
  it('accumulates registrations across multiple calls', async () => {
    const alpine = createAlpineMock();
    registerComponents({ one: { id: 1 } });
    registerComponents({ two: { id: 2 } });
    __setAlpineLoaderForTesting(async () => ({ default: alpine }));
    await start();
    expect(alpine.data).toHaveBeenCalledTimes(2);
    expect(alpine.data).toHaveBeenNthCalledWith(1, 'one', expect.any(Function));
    expect(alpine.data).toHaveBeenNthCalledWith(2, 'two', expect.any(Function));
  });
  it('overrides duplicate component registrations with latest value', async () => {
    const alpine = createAlpineMock();
    registerComponents({ profile: { version: 1 } });
    registerComponents({ profile: { version: 2 } });
    __setAlpineLoaderForTesting(async () => ({ default: alpine }));
    await start();
    expect(alpine.data).toHaveBeenCalledTimes(1);
    const factory = alpine.data.mock.calls[0]?.[1];
    expect(factory?.().version).toBe(2);
  });
  it('wraps object components into callable factories', async () => {
    const alpine = createAlpineMock();
    registerComponents({ card: { title: 'A' } });
    __setAlpineLoaderForTesting(async () => ({ default: alpine }));
    await start();
    const factory = alpine.data.mock.calls[0]?.[1];
    expect(typeof factory).toBe('function');
    expect(factory?.()).toEqual({ title: 'A' });
  });
  it('passes through function components unchanged', async () => {
    const alpine = createAlpineMock();
    const factory = vi.fn(() => ({ open: true }));
    registerComponents({ modal: factory });
    __setAlpineLoaderForTesting(async () => ({ default: alpine }));
    await start();
    const registered = alpine.data.mock.calls[0]?.[1];
    expect(registered).toBe(factory);
  });
  it('returns loaded alpine instance', async () => {
    const alpine = createAlpineMock();
    __setAlpineLoaderForTesting(async () => ({ default: alpine }));
    const loaded = await start();
    expect(loaded).toBe(alpine);
    expect(getAlpine()).toBe(alpine);
  });
  it('returns null alpine before start', () => {
    expect(getAlpine()).toBeNull();
    expect(isStarted()).toBe(false);
  });
  it('prevents double start', async () => {
    const alpine = createAlpineMock();
    __setAlpineLoaderForTesting(async () => ({ default: alpine }));
    const first = await start();
    const second = await start();
    expect(first).toBe(second);
    expect(alpine.start).toHaveBeenCalledTimes(1);
  });
  it('loads alpine only once across repeated start calls', async () => {
    const alpine = createAlpineMock();
    const loader = vi.fn(async () => ({ default: alpine }));
    __setAlpineLoaderForTesting(loader);
    await start();
    await start();
    expect(loader).toHaveBeenCalledTimes(1);
  });
  it('starts even when no components are preregistered', async () => {
    const alpine = createAlpineMock();
    __setAlpineLoaderForTesting(async () => ({ default: alpine }));
    await start();
    expect(alpine.data).not.toHaveBeenCalled();
    expect(alpine.start).toHaveBeenCalledTimes(1);
  });
  it('warns on register after start', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    __setAlpineLoaderForTesting(async () => ({
      default: createAlpineMock(),
    }));
    await start();
    registerComponents({ late: { value: 1 } });
    expect(warn).toHaveBeenCalledWith(
      'Alpine.js has already started. Register components before calling start().',
    );
    warn.mockRestore();
  });
  it('handles missing alpine gracefully on module not found error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    __setAlpineLoaderForTesting(async () => {
      throw new Error('Cannot find module alpinejs');
    });
    const result = await start();
    expect(result).toBeNull();
    expect(isStarted()).toBe(true);
    expect(getAlpine()).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      '[Veil] Alpine.js is not installed. Install it with: pnpm add alpinejs',
    );
    warn.mockRestore();
  });
  it('handles missing alpine gracefully on cannot resolve error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    __setAlpineLoaderForTesting(async () => {
      throw new Error('Cannot resolve alpinejs');
    });
    const result = await start();
    expect(result).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      '[Veil] Alpine.js is not installed. Install it with: pnpm add alpinejs',
    );
    warn.mockRestore();
  });
  it('handles missing alpine gracefully on non-error string mentioning alpinejs', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    __setAlpineLoaderForTesting(async () => {
      throw 'alpinejs failed to load';
    });
    const result = await start();
    expect(result).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      '[Veil] Alpine.js is not installed. Install it with: pnpm add alpinejs',
    );
    warn.mockRestore();
  });
  it('logs a descriptive error when loader fails for a different reason', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    __setAlpineLoaderForTesting(async () => {
      throw new Error('network timeout');
    });
    const result = await start();
    expect(result).toBeNull();
    expect(error).toHaveBeenCalledWith('[Veil] Failed to initialize Alpine.js:', 'network timeout');
    error.mockRestore();
  });
  it('logs stringified non-error failures', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    __setAlpineLoaderForTesting(async () => {
      throw { reason: 'boom' };
    });
    await start();
    expect(error).toHaveBeenCalledWith('[Veil] Failed to initialize Alpine.js:', '[object Object]');
    error.mockRestore();
  });
  it('marks hydrate state as started after loader failure', async () => {
    __setAlpineLoaderForTesting(async () => {
      throw new Error('Cannot find module alpinejs');
    });
    await start();
    expect(isStarted()).toBe(true);
    expect(getAlpine()).toBeNull();
  });
  it('resets started and alpine state for tests', async () => {
    const alpine = createAlpineMock();
    __setAlpineLoaderForTesting(async () => ({ default: alpine }));
    await start();
    expect(isStarted()).toBe(true);
    expect(getAlpine()).toBe(alpine);
    __resetForTesting();
    expect(isStarted()).toBe(false);
    expect(getAlpine()).toBeNull();
  });
  it('clears preregistered components after reset', async () => {
    const alpine = createAlpineMock();
    registerComponents({ once: { value: 1 } });
    __resetForTesting();
    __setAlpineLoaderForTesting(async () => ({ default: alpine }));
    await start();
    expect(alpine.data).not.toHaveBeenCalled();
  });
  it('returns null when loader resolves without a default export', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    __setAlpineLoaderForTesting(async () => ({}));
    const result = await start();
    expect(result).toBeNull();
    expect(error).toHaveBeenCalledTimes(1);
    const message = String(error.mock.calls[0]?.[1]);
    expect(message.length).toBeGreaterThan(0);
    error.mockRestore();
  });
});
//# sourceMappingURL=hydration.test.js.map
