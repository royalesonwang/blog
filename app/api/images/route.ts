import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";
import { auth } from "@/auth";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "edge";

// 初始化S3客户端连接到Cloudflare R2
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

// Bucket名称
const BUCKET_NAME = process.env.R2_BUCKET_NAME || "my-bucket";

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const folder = searchParams.get('folder') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Get images from database
    const supabase = getSupabaseClient();
    
    // Check if user is admin
    const userInfo = session.user;
    const adminEmails = process.env.ADMIN_EMAILS?.split(",");
    const isAdmin = userInfo?.email && adminEmails?.includes(userInfo.email);

    console.log("Fetching images with params:", { search, folder, page, limit, isAdmin });
    
    // Build query - 使用left join而不是inner join
    let query = supabase
      .from('image_uploads')
      .select(`
        id,
        file_name,
        original_file_name,
        public_url,
        file_size,
        mime_type,
        description,
        alt_text,
        tags,
        folder_name,
        created_at,
        updated_at,
        uploaded_by,
        users (
          nickname,
          avatar_url
        )
      `, { count: 'exact' });
    
    // If not admin, only show images uploaded by the user
    if (!isAdmin) {
      query = query.eq('uploaded_by', session.user.uuid);
    }
    
    // Add folder filter if provided
    if (folder) {
      query = query.eq('folder_name', folder);
    }
    
    // Add search if provided
    if (search) {
      query = query.or(`
        original_file_name.ilike.%${search}%,
        description.ilike.%${search}%,
        alt_text.ilike.%${search}%
      `);
    }
    
    // 尝试处理tags字段，避免使用复杂的array操作符
    try {
      // Get paginated results
      const { data: images, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { success: false, message: `Failed to fetch images: ${error.message}` },
          { status: 500 }
        );
      }
      
      console.log(`Found ${images?.length || 0} images, total count: ${count || 0}`);
      
      // Transform the images data to handle the nested user data
      const transformedImages = images?.map(image => ({
        ...image,
        user: image.users || { nickname: "Unknown", avatar_url: null },
        users: undefined
      }));
      
      // Get unique folders for filtering
      const { data: folderData, error: folderError } = await supabase
        .from('image_uploads')
        .select('folder_name')
        .order('folder_name', { ascending: true });
      
      if (folderError) {
        console.error("Error fetching folders:", folderError);
      }
      
      // Extract unique folder names
      const folders = folderData ? 
        [...new Set(folderData.map(item => item.folder_name))].filter(Boolean) : 
        [];
      
      return NextResponse.json({
        success: true,
        images: transformedImages,
        count,
        folders,
        currentPage: page,
        totalPages: count ? Math.ceil(count / limit) : 0,
        limit
      });
    } catch (queryError) {
      console.error("Query execution error:", queryError);
      return NextResponse.json(
        { 
          success: false, 
          message: `Query error: ${queryError instanceof Error ? queryError.message : "Unknown query error"}` 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to fetch images: ${error instanceof Error ? error.message : "Unknown error"}` 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 获取用户会话
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 解析请求参数
    const { imageId } = await request.json();
    
    if (!imageId) {
      return NextResponse.json(
        { success: false, message: "Image ID is required" },
        { status: 400 }
      );
    }

    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 检查用户是否为管理员
    const userInfo = session.user;
    const adminEmails = process.env.ADMIN_EMAILS?.split(",");
    const isAdmin = userInfo?.email && adminEmails?.includes(userInfo.email);

    console.log("Deleting image with ID:", imageId);
    
    // 首先获取图片信息以便之后从存储中删除
    let query = supabase
      .from('image_uploads')
      .select('file_name, uploaded_by')
      .eq('id', imageId)
      .single();
    
    const { data: imageData, error: fetchError } = await query;
    
    if (fetchError) {
      console.error("Error fetching image:", fetchError);
      return NextResponse.json(
        { success: false, message: `Failed to find image: ${fetchError.message}` },
        { status: 500 }
      );
    }
    
    // 检查权限 - 只有管理员或图片上传者可以删除
    if (!isAdmin && imageData.uploaded_by !== session.user.uuid) {
      return NextResponse.json(
        { success: false, message: "Permission denied" },
        { status: 403 }
      );
    }
    
    // 1. 从数据库删除记录
    const { error: deleteError } = await supabase
      .from('image_uploads')
      .delete()
      .eq('id', imageId);
    
    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json(
        { success: false, message: `Database error: ${deleteError.message}` },
        { status: 500 }
      );
    }
    
    // 2. 从存储中删除文件
    try {
      // 准备从R2删除
      const deleteParams = {
        Bucket: BUCKET_NAME,
        Key: imageData.file_name,
      };
      
      const command = new DeleteObjectCommand(deleteParams);
      await S3.send(command);
      
      console.log("R2 delete successful for:", imageData.file_name);
    } catch (r2Error) {
      console.error("R2 delete error:", r2Error);
      // 即使R2删除失败也继续，因为数据库记录已经删除
      // 将错误记录到日志中，但对用户返回成功
    }
    
    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
      imageId
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}` 
      },
      { status: 500 }
    );
  }
} 