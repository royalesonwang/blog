import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";
import { getUserInfo } from "@/services/user";

// 获取单个相册详情
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户，验证权限
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "未授权访问" 
      }, { status: 401 });
    }
    
    // 从URL中获取相册ID
    const url = request.nextUrl;
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ 
        success: false, 
        message: "无效的相册ID" 
      }, { status: 400 });
    }
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 查询相册
    const { data: album, error } = await supabase
      .from("album_groups")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching album:", error);
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 500 });
    }
    
    if (!album) {
      return NextResponse.json({ 
        success: false, 
        message: "相册不存在" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      album 
    });
  } catch (error) {
    console.error(`Error in GET /api/albums/:id:`, error);
    return NextResponse.json({ 
      success: false, 
      message: `服务器错误: ${error instanceof Error ? error.message : "未知错误"}` 
    }, { status: 500 });
  }
}

// 更新相册
export async function PUT(request: NextRequest) {
  try {
    // 获取当前用户，验证权限
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "未授权访问" 
      }, { status: 401 });
    }
    
    // 从URL中获取相册ID
    const url = request.nextUrl;
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ 
        success: false, 
        message: "无效的相册ID" 
      }, { status: 400 });
    }
    
    // 获取请求数据
    const data = await request.json();
    
    // 检查必要字段
    if (!data.title || data.title.trim() === "") {
      return NextResponse.json({ 
        success: false, 
        message: "相册标题不能为空" 
      }, { status: 400 });
    }
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 更新相册
    const { data: album, error } = await supabase
      .from("album_groups")
      .update({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        author_name: data.author_name?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating album:", error);
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: "相册更新成功", 
      album 
    });
  } catch (error) {
    console.error(`Error in PUT /api/albums/:id:`, error);
    return NextResponse.json({ 
      success: false, 
      message: `服务器错误: ${error instanceof Error ? error.message : "未知错误"}` 
    }, { status: 500 });
  }
}

// 删除相册
export async function DELETE(request: NextRequest) {
  try {
    // 获取当前用户，验证权限
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "未授权访问" 
      }, { status: 401 });
    }
    
    // 从URL中获取相册ID
    const url = request.nextUrl;
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ 
        success: false, 
        message: "无效的相册ID" 
      }, { status: 400 });
    }
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 先删除相册与图片的关联关系（将所有相关图片的group_id设为null）
    const { error: updateError } = await supabase
      .from("album_image")
      .update({ group_id: null })
      .eq("group_id", id);
    
    if (updateError) {
      console.error("Error updating album images:", updateError);
      return NextResponse.json({ 
        success: false, 
        message: updateError.message 
      }, { status: 500 });
    }
    
    // 再删除相册
    const { error } = await supabase
      .from("album_groups")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting album:", error);
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: "相册删除成功" 
    });
  } catch (error) {
    console.error(`Error in DELETE /api/albums/:id:`, error);
    return NextResponse.json({ 
      success: false, 
      message: `服务器错误: ${error instanceof Error ? error.message : "未知错误"}` 
    }, { status: 500 });
  }
}
