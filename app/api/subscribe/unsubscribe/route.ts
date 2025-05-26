import { NextRequest, NextResponse } from "next/server";
import { findSubscribeByUUID, generateUUID } from "@/models/subscribe";
import { getSupabaseClient } from "@/models/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uuid = searchParams.get("uuid");

    if (!uuid) {
      return NextResponse.json(
        { success: false, message: "缺少唯一标识参数" },
        { status: 400 }
      );
    }    // 根据UUID查找订阅
    const existingSubscribe = await findSubscribeByUUID(uuid);
    if (!existingSubscribe) {
      return NextResponse.json(
        { success: false, message: "未找到相关订阅或链接已失效" },
        { status: 404 }
      );
    }
      // 生成新的UUID
    const newUUID = generateUUID();
    
    // 更新订阅状态为 inactive 并更新UUID
    // 注意：更换UUID是一个安全措施，确保已使用的取消订阅链接无法再次使用
    const supabase = getSupabaseClient();    
    const { error } = await supabase
      .from("subscribe")
      .update({ 
        status: "inactive",
        updated_at: new Date().toISOString(),
        uuid: newUUID // 更换UUID，使之前的链接失效
      })
      .eq("uuid", uuid);

    if (error) {
      console.error("Unsubscribe error:", error);
      return NextResponse.json(
        { success: false, message: "取消订阅失败" },
        { status: 500 }
      );
    }    // 返回成功响应（JSON）
    return NextResponse.json({
      success: true,
      message: "取消订阅成功",
      email: existingSubscribe.email
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    
    return NextResponse.json(
      { success: false, message: "取消订阅失败，请稍后再试" },
      { status: 500 }
    );
  }
}
