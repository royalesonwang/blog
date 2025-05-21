import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";
import { getUserInfo } from "@/services/user";

// 获取相册列表
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户，验证权限
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json({ message: "未授权访问" }, { status: 401 });
    }
    
    // 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    
    const offset = (page - 1) * limit;
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
      // 构建基础查询
    let query = supabase
      .from("album_groups")
      .select(`
        *,
        image_count:album_image(count)
      `, { count: "exact" });
    
    // 如果有搜索条件，添加过滤
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    
    // 查询分页数据
    const { data: albums, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error("Error fetching albums:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    
    // 处理图片计数
    const processedAlbums = albums.map(album => {
      let imageCount = 0;
      
      if (album.image_count && album.image_count.length > 0) {
        imageCount = album.image_count[0].count;
      }
      
      return {
        ...album,
        image_count: imageCount
      };
    });
    
    return NextResponse.json({ 
      albums: processedAlbums, 
      total: count 
    });
  } catch (error) {
    console.error("Error in GET /api/albums:", error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}

// 创建新相册
export async function POST(request: NextRequest) {
  try {
    // 获取当前用户，验证权限
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json({ message: "未授权访问" }, { status: 401 });
    }
    
    // 获取请求数据
    const data = await request.json();
    // 检查必要字段
    if (!data.title || data.title.trim() === "") {
      return NextResponse.json({ message: "相册标题不能为空" }, { status: 400 });
    }
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 创建新相册
    const { data: album, error } = await supabase
      .from("album_groups")
      .insert({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        author_name: data.author_name?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating album:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: "相册创建成功", 
      album 
    });
  } catch (error) {
    console.error("Error in POST /api/albums:", error);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }
}
