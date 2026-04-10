import { z } from 'zod';
import { PasswordSchema } from '@illumiarqcore';
/**
 * Base Zod validator for password confirmation input.
 * Application code may extend this with additional fields.
 */
export const BaseConfirmPasswordValidator = z.object({
  password: PasswordSchema,
});
//# sourceMappingURL=base-confirm-password.validator.js.map
