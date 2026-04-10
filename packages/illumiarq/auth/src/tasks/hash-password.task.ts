import { defineTask } from '@illumiarq/core';
import { hashPassword } from '@illumiarq/core';

/**
 * Hashes a plain-text password using argon2id.
 */
export const HashPasswordTask = defineTask(
  async (plain: string): Promise<string> => hashPassword(plain),
);
