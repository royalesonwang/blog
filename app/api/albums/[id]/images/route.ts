import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";
import { getUserInfo } from "@/services/user";

// 获取相册中的图片
export async function GET(request: NextRequest) {
  try {
    // 相册图片是公开的，无需验证权限
    
    // 从 URL 中提取参数
    const url = request.nextUrl;
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 2]; // albums/[id]/images
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: "无效的相册ID" },
        { status: 400 }
      );
    }
      // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 查询相册中的图片
    const { data: images, error } = await supabase
      .from("album_image")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching album images:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      images: images || []
    });  } catch (error) {
    console.error(`Error in GET /api/albums/images:`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: `服务器错误: ${error instanceof Error ? error.message : "未知错误"}` 
      },
      { status: 500 }
    );
  }
}

// 添加图片到相册
export async function POST(request: NextRequest) {
  try {
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
    const id = pathSegments[pathSegments.length - 2]; // albums/[id]/images
      if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: "无效的相册ID" },
        { status: 400 }
      );
    }
    
    // 获取请求数据
    const data = await request.json();
    
    // 检查必要字段
    if (!data.image_id) {
      return NextResponse.json(
        { success: false, message: "缺少图片ID" },
        { status: 400 }
      );
    }
      // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 首先检查图片是否已存在于album_image表中
    const { data: existingImage, error: checkError } = await supabase
      .from("album_image")
      .select("*")
      .eq("id", data.image_id)
      .single();
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116: not_found
      console.error("Error checking image:", checkError);
      return NextResponse.json(
        { success: false, message: checkError.message },
        { status: 500 }
      );
    }
    
    if (existingImage) {
      // 图片已存在于album_image表中，只需更新group_id
      const { data: updatedImage, error } = await supabase
        .from("album_image")
        .update({ group_id: id })
        .eq("id", data.image_id)
        .select()
        .single();
        if (error) {
        console.error("Error adding image to album:", error);
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        message: "图片添加到相册成功", 
        image: updatedImage 
      });
    } else {
      // 图片不存在于album_image表中，需要从image_uploads表中复制数据
      const { data: sourceImage, error: sourceError } = await supabase
        .from("image_uploads")
        .select("*")
        .eq("id", data.image_id)
        .single();
        if (sourceError) {
        console.error("Error fetching source image:", sourceError);
        return NextResponse.json(
          { success: false, message: sourceError.message },
          { status: 500 }
        );
      }
      
      if (!sourceImage) {
        return NextResponse.json(
          { success: false, message: "源图片不存在" },
          { status: 404 }
        );
      }        // 准备要插入album_image表的数据 - 移除旧的URL字段
      const albumImageData = {
        id: sourceImage.id, // 保持ID一致
        file_name: sourceImage.file_name,
        original_file_name: sourceImage.original_file_name,
        file_path: sourceImage.file_path,
        file_size: sourceImage.file_size,
        mime_type: sourceImage.mime_type,
        folder_name: sourceImage.folder_name,
        description: sourceImage.description,
        alt_text: sourceImage.alt_text,
        tags: sourceImage.tags,
        width: sourceImage.width,
        height: sourceImage.height,
        storage_provider: sourceImage.storage_provider,
        bucket_name: sourceImage.bucket_name,
        is_public: sourceImage.is_public,
        uploaded_by: sourceImage.uploaded_by,
        device: sourceImage.device,
        location: sourceImage.location,
        group_id: id  // 设置相册ID
      };
      
      // 插入记录到album_image表
      const { data: newAlbumImage, error: insertError } = await supabase
        .from("album_image")
        .insert(albumImageData)
        .select()
        .single();
        if (insertError) {
        console.error("Error inserting image to album_image:", insertError);
        return NextResponse.json(
          { success: false, message: insertError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        message: "图片添加到相册成功", 
        image: newAlbumImage 
      });
    }  } catch (error) {
    console.error(`Error in POST /api/albums/images:`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: `服务器错误: ${error instanceof Error ? error.message : "未知错误"}` 
      },
      { status: 500 }
    );
  }
}

// 更新相册中的图片
export async function PUT(request: NextRequest) {
  try {
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
    const albumId = pathSegments[pathSegments.length - 2]; // albums/[id]/images
    
    if (!albumId || isNaN(Number(albumId))) {
      return NextResponse.json(
        { success: false, message: "无效的相册ID" },
        { status: 400 }
      );
    }
    
    // 获取请求数据
    const data = await request.json();
    const { imageId, ...updateData } = data;
    
    // 检查必要字段
    if (!imageId) {
      return NextResponse.json(
        { success: false, message: "缺少图片ID" },
        { status: 400 }
      );
    }
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 更新album_image表中的图片
    const { data: updatedImage, error } = await supabase
      .from("album_image")
      .update(updateData)
      .eq("id", imageId)
      .eq("group_id", albumId) // 确保只更新当前相册中的图片
      .select()
      .single();
    
    if (error) {
      console.error("Error updating album image:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
    
    if (!updatedImage) {
      return NextResponse.json(
        { success: false, message: "图片不存在或不属于此相册" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "图片更新成功",
      image: updatedImage
    });
      } catch (error) {
    console.error(`Error in PUT /api/albums/[id]/images:`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: `服务器错误: ${error instanceof Error ? error.message : "未知错误"}` 
      },
      { status: 500 }
    );
  }
}
