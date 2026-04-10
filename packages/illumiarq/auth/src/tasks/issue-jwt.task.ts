import { defineTask, sign } from '@illumiarq/core';
import type { JwtOptions } from '@illumiarq/core';

export interface IssueJwtInput {
  payload: Record<string, unknown>;
  privateKey: string;
  opts?: JwtOptions;
}

/**
 * Issues a JWT signed with RS256.
 */
export const IssueJwtTask = defineTask(
  async ({ payload, privateKey, opts }: IssueJwtInput): Promise<string> =>
    sign(payload, privateKey, opts),
);
