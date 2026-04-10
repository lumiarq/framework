export interface JobPayload {
  name: string;
  data: Record<string, unknown>;
}

export interface DispatchOptions {
  delay?: number;
  queue?: string;
  tries?: number;
  backoff?: number;
}

export interface QueueContract {
  dispatch(job: JobPayload, options?: DispatchOptions): Promise<void>;
  later(job: JobPayload, seconds: number, options?: Omit<DispatchOptions, 'delay'>): Promise<void>;
}
