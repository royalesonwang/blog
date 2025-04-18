import { respData, respErr, respJson } from "@/lib/resp";
import { getUserInfo } from "@/services/user";

export async function POST(req: Request) {
  try {
    const userInfo = await getUserInfo();
    if (!userInfo || !userInfo.email) {
      return respJson(-2, "no auth");
    }

    // Check if user is admin based on ADMIN_EMAILS
    const isAdmin = process.env.ADMIN_EMAILS?.split(",").includes(userInfo.email) || false;
    
    // Add is_admin flag to user info response
    return respData({ is_admin: isAdmin });
  } catch (e) {
    console.log("check admin failed: ", e);
    return respErr("check admin failed");
  }
} 