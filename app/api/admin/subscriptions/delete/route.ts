import { getSupabaseClient } from "@/models/db";
import { SubscribeStatus } from "@/models/subscribe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "缺少订阅ID" },
        { status: 400 }
      );
    }    const supabase = getSupabaseClient();
    
    // 软删除：设置状态为inactive而不是真正删除记录
    const { error } = await supabase
      .from("subscribe")
      .update({
        status: SubscribeStatus.Inactive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error deleting subscription:", error);
      return NextResponse.json(
        { success: false, message: "删除订阅失败" },
        { status: 500 }
      );
    }    return NextResponse.json({
      success: true,
      message: "订阅已设为不活跃状态"
    });

  } catch (error) {
    console.error("Error in delete subscription API:", error);
    return NextResponse.json(
      { success: false, message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
