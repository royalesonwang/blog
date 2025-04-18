import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";
import { auth } from "@/auth";
 

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

    // Get folders from database
    const supabase = getSupabaseClient();
    
    // Check if user is admin
    const userInfo = session.user;
    const adminEmails = process.env.ADMIN_EMAILS?.split(",");
    const isAdmin = userInfo?.email && adminEmails?.includes(userInfo.email);
    
    let query = supabase
      .from('image_uploads')
      .select('folder_name')
      .neq('folder_name', 'default')
      .is('deleted_at', null);
    
    // If not admin, only show folders created by the user
    if (!isAdmin) {
      query = query.eq('uploaded_by', session.user.uuid);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch folders" },
        { status: 500 }
      );
    }
    
    // Extract unique folder names
    const uniqueFolders = [...new Set(data.map(item => item.folder_name))].filter(Boolean);
    
    return NextResponse.json({ 
      success: true,
      folders: uniqueFolders
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch folders" },
      { status: 500 }
    );
  }
} 