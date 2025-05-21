import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";
import { getUserInfo } from "@/services/user";

// 从相册中移除图片
export async function DELETE(request: NextRequest) {  try {
    // 获取当前用户，验证权限
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }
    
    // 从 URL 中提取参数
    const url = request.nextUrl;
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 3]; // albums/[id]/images/[imageId]
    const imageId = pathSegments[pathSegments.length - 1]; // 最后一段是 imageId
      if (!id || isNaN(Number(id)) || !imageId || isNaN(Number(imageId))) {
      return NextResponse.json(
        { success: false, message: "无效的相册ID或图片ID" },
        { status: 400 }
      );
    }
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 更新图片，将其从相册中移除（将group_id设为null）
    const { data, error } = await supabase
      .from("album_image")
      .update({ group_id: null })
      .eq("id", imageId)
      .eq("group_id", id);
    
    if (error) {
      console.error("Error removing image from album:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }    
    return NextResponse.json({
      success: true,
      message: "图片从相册中移除成功"
    });  } catch (error) {
    console.error(`Error in DELETE /api/albums/images:`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: `服务器错误: ${error instanceof Error ? error.message : "未知错误"}` 
      },
      { status: 500 }
    );
  }
}
