import { z } from 'zod';

/**
 * Base Zod validator for password reset input.
 * Application code may extend this with additional fields.
 */
export const BaseResetPasswordValidator = z
  .object({
    token: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export type BaseResetPasswordData = z.infer<typeof BaseResetPasswordValidator>;
