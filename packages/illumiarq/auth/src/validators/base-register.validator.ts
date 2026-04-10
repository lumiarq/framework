import { z } from 'zod';

/**
 * Base Zod validator for registration input.
 * Application code may extend this with additional fields.
 */
export const BaseRegisterValidator = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type BaseRegisterData = z.infer<typeof BaseRegisterValidator>;
