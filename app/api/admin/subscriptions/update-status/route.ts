import { getSupabaseClient } from "@/models/db";
import { SubscribeStatus } from "@/models/subscribe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 验证状态值
    const validStatuses = Object.values(SubscribeStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "无效的状态值" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from("subscribe")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating subscription status:", error);
      return NextResponse.json(
        { success: false, message: "更新订阅状态失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "状态更新成功"
    });

  } catch (error) {
    console.error("Error in update-status API:", error);
    return NextResponse.json(
      { success: false, message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
