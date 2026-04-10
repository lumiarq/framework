import { z } from 'zod';

/**
 * Base Zod validator for email verification input.
 * Application code may extend this with additional fields.
 */
export const BaseVerifyEmailValidator = z.object({
  token: z.string().min(1),
});

export type BaseVerifyEmailData = z.infer<typeof BaseVerifyEmailValidator>;
