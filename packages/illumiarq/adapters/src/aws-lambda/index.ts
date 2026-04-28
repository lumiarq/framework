import type { LumiARQApp } from '@illumiarq/runtime';

// Minimal typings for the Lambda event/context/response shapes so callers
// do not need `@types/aws-lambda` installed unless they want full type coverage.
export interface LambdaEvent {
  httpMethod?: string;
  path?: string;
  headers?: Record<string, string>;
  body?: string | null;
  isBase64Encoded?: boolean;
  requestContext?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LambdaContext {
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  awsRequestId: string;
  [key: string]: unknown;
}

export interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

type LambdaHandler = (event: LambdaEvent, context: LambdaContext) => Promise<LambdaResponse>;

/**
 * Creates an AWS Lambda handler from a LumiARQ application.
 *
 * Supports API Gateway v1, v2, and ALB events via `@hono/aws-lambda`.
 * Add `@hono/aws-lambda` to your project before using this adapter:
 * ```
 * pnpm add @hono/aws-lambda
 * ```
 *
 * For **Lambda function URLs** (Web-standard fetch), use `createFetchAdapter`
 * from `@illumiarq/adapters/fetch` instead — no extra dependency required.
 *
 * Initialization is lazy — both the app and the `@hono/aws-lambda` module are
 * resolved on the first invocation so Lambda container warm-up is fast.
 *
 * @example
 * // src/handler.ts
 * import appPromise from '@/bootstrap/entry'
 * import { createLambdaAdapter } from '@illumiarq/adapters/aws-lambda'
 * export const handler = createLambdaAdapter(appPromise)
 */
export function createLambdaAdapter(app: LumiARQApp | Promise<LumiARQApp>): LambdaHandler {
  let handler: LambdaHandler | undefined;

  return async (event: LambdaEvent, context: LambdaContext): Promise<LambdaResponse> => {
    if (!handler) {
      const resolved = await Promise.resolve(app);
      // @hono/aws-lambda is an optional peer dep — installed by the app when targeting Lambda.
      // Dynamic import keeps it out of the bundle for users who don't need it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { handle } = await import('@hono/aws-lambda' as any);
      handler = handle(resolved.router) as LambdaHandler;
    }
    return handler(event, context);
  };
}
