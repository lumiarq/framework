export interface EventBusContract {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: unknown, payload: unknown): void;
  dispatch(event: unknown, payload: unknown): void;
  listen(event: unknown, handler: unknown, options?: { idempotent?: boolean }): void;
  clearListeners(): void;
}
