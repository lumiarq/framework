import { z } from 'zod';
import { PasswordSchema } from '@illumiarq/core';

/**
 * Base Zod validator for password confirmation input.
 * Application code may extend this with additional fields.
 */
export const BaseConfirmPasswordValidator = z.object({
  password: PasswordSchema,
});

export type BaseConfirmPasswordData = z.infer<typeof BaseConfirmPasswordValidator>;
