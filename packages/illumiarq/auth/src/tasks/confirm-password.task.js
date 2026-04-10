import { defineTask } from '@illumiarqcore';
/**
 * Records that the user has confirmed their password.
 * Returns the confirmation timestamp; the caller is responsible for persisting it.
 */
export const ConfirmPasswordTask = defineTask(async (_input) => ({
  confirmedAt: new Date(),
}));
//# sourceMappingURL=confirm-password.task.js.map
