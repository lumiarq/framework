import { getContext } from '../async-local-storage.js';

export async function getUserId(): Promise<string | undefined> {
  const user = await getContext().auth.getUser();
  return user?.id;
}
