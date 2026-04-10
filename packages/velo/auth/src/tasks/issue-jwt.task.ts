import { defineTask, sign } from '@velo/core';
import type { JwtOptions } from '@velo/core';

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
