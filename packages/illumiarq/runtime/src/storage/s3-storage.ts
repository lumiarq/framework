/**
 * S3Storage — Amazon S3 (and S3-compatible) storage driver.
 *
 * Requires `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`:
 *   pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *
 * Configure via config/storage.ts:
 *   driver: 's3'
 *   s3: { bucket, region, credentials: { accessKeyId, secretAccessKey }, endpoint? }
 *
 * @example
 * // bootstrap/providers.ts
 * import { S3Storage } from '@lumiarq/framework/runtime';
 * export const storage = new S3Storage({
 *   bucket: env.AWS_BUCKET,
 *   region: env.AWS_REGION,
 *   credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
 * });
 */
import type { StorageContract, StoredFile, PutOptions } from '@illumiarq/contracts';

export interface S3StorageOptions {
  bucket: string;
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  /** Custom endpoint for S3-compatible services (e.g. Cloudflare R2, MinIO). */
  endpoint?: string;
  /** Base URL for public CDN access. Falls back to S3 path-style URL. */
  publicBaseUrl?: string;
}

// Narrow type wrappers so we don't import aws-sdk at module level
type S3Client = {
  send(cmd: unknown): Promise<unknown>;
};
type S3ClientCtor = new (opts: Record<string, unknown>) => S3Client;

interface AwsSdkS3 {
  S3Client: S3ClientCtor;
  PutObjectCommand: new (opts: Record<string, unknown>) => unknown;
  GetObjectCommand: new (opts: Record<string, unknown>) => unknown;
  DeleteObjectCommand: new (opts: Record<string, unknown>) => unknown;
  HeadObjectCommand: new (opts: Record<string, unknown>) => unknown;
}

interface AwsPresigner {
  getSignedUrl(client: S3Client, command: unknown, options: { expiresIn: number }): Promise<string>;
}

async function loadS3(): Promise<AwsSdkS3> {
  try {
    return (await import('@aws-sdk/client-s3')) as unknown as AwsSdkS3;
  } catch {
    throw new Error(
      '[S3Storage] @aws-sdk/client-s3 is not installed. Run: pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner',
    );
  }
}

async function loadPresigner(): Promise<AwsPresigner> {
  try {
    return (await import('@aws-sdk/s3-request-presigner')) as unknown as AwsPresigner;
  } catch {
    throw new Error(
      '[S3Storage] @aws-sdk/s3-request-presigner is not installed. Run: pnpm add @aws-sdk/s3-request-presigner',
    );
  }
}

export class S3Storage implements StorageContract {
  private readonly opts: S3StorageOptions;
  private client: S3Client | null = null;
  private sdk: AwsSdkS3 | null = null;

  constructor(opts: S3StorageOptions) {
    this.opts = opts;
  }

  private async getClient(): Promise<{ client: S3Client; sdk: AwsSdkS3 }> {
    if (!this.client || !this.sdk) {
      this.sdk = await loadS3();
      this.client = new this.sdk.S3Client({
        region: this.opts.region,
        credentials: this.opts.credentials,
        ...(this.opts.endpoint ? { endpoint: this.opts.endpoint, forcePathStyle: true } : {}),
      });
    }
    return { client: this.client, sdk: this.sdk };
  }

  async put(
    path: string,
    file: Buffer | ReadableStream,
    options?: PutOptions,
  ): Promise<StoredFile> {
    const { client, sdk } = await this.getClient();
    const body = file instanceof Buffer ? file : await streamToBuffer(file as ReadableStream);
    await client.send(
      new sdk.PutObjectCommand({
        Bucket: this.opts.bucket,
        Key: path,
        Body: body,
        ContentType: options?.contentType ?? 'application/octet-stream',
        ACL: options?.visibility === 'public' ? 'public-read' : 'private',
        Metadata: options?.metadata,
      }),
    );
    return {
      path,
      url: this.url(path),
      size: body.length,
      mimeType: options?.contentType ?? 'application/octet-stream',
      ...(options?.metadata ? { metadata: options.metadata } : {}),
    };
  }

  async get(path: string): Promise<Buffer | null> {
    const { client, sdk } = await this.getClient();
    try {
      const result = (await client.send(
        new sdk.GetObjectCommand({ Bucket: this.opts.bucket, Key: path }),
      )) as { Body?: { transformToByteArray(): Promise<Uint8Array> } };
      if (!result.Body) return null;
      const bytes = await result.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }

  async delete(path: string): Promise<void> {
    const { client, sdk } = await this.getClient();
    await client.send(new sdk.DeleteObjectCommand({ Bucket: this.opts.bucket, Key: path }));
  }

  async exists(path: string): Promise<boolean> {
    const { client, sdk } = await this.getClient();
    try {
      await client.send(new sdk.HeadObjectCommand({ Bucket: this.opts.bucket, Key: path }));
      return true;
    } catch {
      return false;
    }
  }

  url(path: string): string {
    if (this.opts.publicBaseUrl) {
      return `${this.opts.publicBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    }
    return `https://${this.opts.bucket}.s3.${this.opts.region}.amazonaws.com/${path}`;
  }

  async temporaryUrl(path: string, expiry: Date): Promise<string> {
    const { client, sdk } = await this.getClient();
    const presigner = await loadPresigner();
    const expiresIn = Math.max(1, Math.floor((expiry.getTime() - Date.now()) / 1000));
    return presigner.getSignedUrl(
      client,
      new sdk.GetObjectCommand({ Bucket: this.opts.bucket, Key: path }),
      { expiresIn },
    );
  }
}

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}
