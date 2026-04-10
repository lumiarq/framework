import { getContext } from '../async-local-storage.js';
export async function getUserId() {
  const user = await getContext().auth.getUser();
  return user?.id;
}
//# sourceMappingURL=get-user-id.js.map
