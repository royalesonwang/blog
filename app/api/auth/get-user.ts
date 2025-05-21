import { auth } from "@/auth";
import { findUserByUuid } from "@/models/user";

export async function getCurrentUser() {
  try {
    const session = await auth();
    if (!session?.user || !session.user.uuid) {
      return null;
    }

    const user = await findUserByUuid(session.user.uuid);
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
