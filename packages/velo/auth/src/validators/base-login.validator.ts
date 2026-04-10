import { z } from 'zod';

/**
 * Base Zod validator for login input.
 * Application code may extend this with additional fields.
 */
export const BaseLoginValidator = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type BaseLoginData = z.infer<typeof BaseLoginValidator>;
