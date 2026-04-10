export function formatDuration(durationMs) {
  return durationMs >= 1000 ? `${(durationMs / 1000).toFixed(2)}s` : `${durationMs.toFixed(2)}ms`;
}
export function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
export function trace(label) {
  const startedAt = performance.now();
  return () => {
    const durationMs = performance.now() - startedAt;
    console.log(`${label}: ${formatDuration(durationMs)}`);
    return durationMs;
  };
}
//# sourceMappingURL=trace.js.map
