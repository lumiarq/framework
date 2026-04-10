const defaultTransport = async (input, init) => fetch(input, init);
export function createHttpChannel(options, transport = defaultTransport) {
  return {
    async handle(entry) {
      if (!options.endpoint) {
        throw new Error('createHttpChannel requires an endpoint option.');
      }
      await transport(options.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(options.headers ?? {}),
        },
        body: JSON.stringify(entry),
      });
    },
  };
}
//# sourceMappingURL=http-channel.js.map
