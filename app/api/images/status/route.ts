import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";
import { auth } from "@/auth";
 

export async function GET() {
  try {
    // 获取用户会话
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", auth: false },
        { status: 401 }
      );
    }

    // 检查数据库连接
    const supabase = getSupabaseClient();
    
    // 简单查询检查数据库是否可访问
    const { data, error, count } = await supabase
      .from('image_uploads')
      .select('id', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error("Database connection error:", error);
      return NextResponse.json({
        success: false,
        message: "Database connection error",
        error: error.message,
        details: error,
        auth: true
      }, { status: 500 });
    }
    
    // 返回基本状态信息
    return NextResponse.json({
      success: true,
      database: "connected",
      auth: true,
      user: {
        id: session.user.uuid,
        email: session.user.email
      },
      timestamp: new Date().toISOString(),
      imageCount: count || 0
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown server error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 