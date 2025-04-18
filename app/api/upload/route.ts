import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSupabaseClient } from "@/models/db";
import { auth } from "@/auth";
 

// Initialize S3 client for Cloudflare R2
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  // Fix for AWS SDK v3 checksum issue with R2
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

// Bucket name
const BUCKET_NAME = process.env.R2_BUCKET_NAME || "my-bucket";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth();
    const userUuid = session?.user?.uuid;

    // 检查用户是否已登录
    if (!userUuid) {
      console.error("User not authenticated");
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string || "";
    const altText = formData.get("altText") as string || "";
    const tags = formData.get("tags") as string || "";
    const folderName = formData.get("folderName") as string || "default";
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type" },
        { status: 400 }
      );
    }
    
    // Get file extension
    const fileExt = file.name.split(".").pop() || "";
    
    // 生成更安全的唯一文件名，包含时间戳和UUID
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const fileName = `uploads/${folderName}/${timestamp}-${uniqueId}.${fileExt}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      // Upload to Cloudflare R2
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      };
      
      console.log("Uploading to R2:", { fileName, size: buffer.length, type: file.type });
      
      const command = new PutObjectCommand(uploadParams);
      await S3.send(command);
      
      console.log("R2 upload successful");
      
      // 处理URL生成，避免https://前缀重复
      let publicUrl = '';
      if (process.env.R2_PUBLIC_DOMAIN) {
        // 确保域名前有https://前缀
        const domain = process.env.R2_PUBLIC_DOMAIN.startsWith('https://') 
          ? process.env.R2_PUBLIC_DOMAIN 
          : `https://${process.env.R2_PUBLIC_DOMAIN}`;
        publicUrl = `${domain}/${fileName}`;
      }
      
      // 如果使用Cloudflare存储域名
      let storageUrl = '';
      if (process.env.STORAGE_DOMAIN) {
        // 确保域名前有https://前缀
        const domain = process.env.STORAGE_DOMAIN.startsWith('https://') 
          ? process.env.STORAGE_DOMAIN 
          : `https://${process.env.STORAGE_DOMAIN}`;
        storageUrl = `${domain}/${fileName}`;
      }
      
      // 选择使用哪个URL
      const url = process.env.STORAGE_DOMAIN ? storageUrl : publicUrl;
      
      console.log("Generated URL:", url);
      
      // Save record to database
      const supabase = getSupabaseClient();
      
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
      
      // 准备插入数据
      const insertData = {
        file_name: fileName,
        original_file_name: file.name,
        file_path: fileName,
        public_url: url,
        file_size: file.size,
        mime_type: file.type,
        folder_name: folderName,
        description: description,
        alt_text: altText,
        tags: tagsArray,
        storage_provider: 'cloudflare_r2',
        bucket_name: BUCKET_NAME,
        is_public: true,
        uploaded_by: userUuid
      };
      
      console.log("Inserting to database:", insertData);
      
      const { data, error } = await supabase
        .from('image_uploads')
        .insert(insertData)
        .select('id')
        .single();
      
      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { success: false, message: `Database error: ${error.message}`, details: error },
          { status: 500 }
        );
      }
      
      console.log("Database insert successful:", data);
      
      return NextResponse.json({ 
        success: true, 
        message: "File uploaded successfully",
        url: url,
        fileName: fileName,
        id: data?.id,
        original_name: file.name,
        size: file.size,
        type: file.type
      });
    } catch (error) {
      console.error("R2 upload error:", error);
      return NextResponse.json(
        { success: false, message: `Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 