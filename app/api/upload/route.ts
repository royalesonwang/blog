import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSupabaseClient } from "@/models/db";
import { auth } from "@/auth";
import sharp from "sharp";

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
    }    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string || "";
    const altText = formData.get("altText") as string || "";
    const tags = formData.get("tags") as string || "";
    const folderName = formData.get("folderName") as string || "default";
    const targetTable = formData.get("targetTable") as string || "image_uploads"; // 默认上传到image_uploads表
    const albumId = formData.get("albumId") as string || null; // 如果上传到相册，指定相册ID
    
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
    const thumbnailName = `thumbnail/${folderName}/${timestamp}-${uniqueId}.${fileExt}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      // 获取图片信息
      const imageInfo = await sharp(buffer).metadata();
      
      // 准备要上传的文件内容 - 默认为原始buffer
      let originalBuffer = buffer;
      let thumbnailBuffer = buffer;
      
      // 如果图片尺寸大于1440px，对原图进行压缩
      if (imageInfo.width && imageInfo.height && (imageInfo.width > 1440 || imageInfo.height > 1440)) {
        originalBuffer = await sharp(buffer)
          .resize({
            width: 1440,
            height: 1440,
            fit: 'inside', // 保持原始纵横比
            withoutEnlargement: true // 不放大小图片
          })
          .toBuffer();
        
        console.log("Resized original image:", { 
          originalSize: buffer.length, 
          resizedSize: originalBuffer.length,
          originalDimensions: `${imageInfo.width}x${imageInfo.height}` 
        });
      } else {
        console.log("Original image is within size limits, keeping as is");
      }
      
      // 上传原图(已压缩或原始图)到Cloudflare R2
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: originalBuffer,
        ContentType: file.type,
      };
      
      console.log("Uploading original to R2:", { fileName, size: originalBuffer.length, type: file.type });
      
      const command = new PutObjectCommand(uploadParams);
      await S3.send(command);
      
      // 如果图片尺寸大于960，则生成缩略图，否则使用处理后的原图作为缩略图
      if (imageInfo.width && imageInfo.height && (imageInfo.width > 960 || imageInfo.height > 960)) {
        thumbnailBuffer = await sharp(buffer)
          .resize({
            width: 960,
            height: 960,
            fit: 'inside', // 保持原始纵横比
            withoutEnlargement: true // 不放大小图片
          })
          .toBuffer();
        
        console.log("Generated thumbnail:", { 
          originalSize: buffer.length, 
          thumbnailSize: thumbnailBuffer.length,
          originalDimensions: `${imageInfo.width}x${imageInfo.height}` 
        });
      } else {
        thumbnailBuffer = originalBuffer;
        console.log("Image is small enough, using as thumbnail");
      }
      
      // 上传缩略图到Cloudflare R2
      const thumbnailParams = {
        Bucket: BUCKET_NAME,
        Key: thumbnailName,
        Body: thumbnailBuffer,
        ContentType: file.type,
      };
      
      const thumbnailCommand = new PutObjectCommand(thumbnailParams);
      await S3.send(thumbnailCommand);
      console.log("Thumbnail upload successful");
      
      // 处理URL生成
      let publicUrl = '';
      let thumbnailUrl = '';
      if (process.env.R2_PUBLIC_DOMAIN) {
        // 确保域名前有https://前缀
        const domain = process.env.R2_PUBLIC_DOMAIN.startsWith('https://') 
          ? process.env.R2_PUBLIC_DOMAIN 
          : `https://${process.env.R2_PUBLIC_DOMAIN}`;
        publicUrl = `${domain}/${fileName}`;
        thumbnailUrl = `${domain}/${thumbnailName}`;
      }
      
      // 如果使用Cloudflare存储域名
      let storageUrl = '';
      let storageThumbnailUrl = '';
      if (process.env.STORAGE_DOMAIN) {
        // 确保域名前有https://前缀
        const domain = process.env.STORAGE_DOMAIN.startsWith('https://') 
          ? process.env.STORAGE_DOMAIN 
          : `https://${process.env.STORAGE_DOMAIN}`;
        storageUrl = `${domain}/${fileName}`;
        storageThumbnailUrl = `${domain}/${thumbnailName}`;
      }
      
      // 选择使用哪个URL
      const url = process.env.STORAGE_DOMAIN ? storageUrl : publicUrl;
      const thumbnail = process.env.STORAGE_DOMAIN ? storageThumbnailUrl : thumbnailUrl;
      
      console.log("Generated URLs:", { original: url, thumbnail });
      
      // Save record to database
      const supabase = getSupabaseClient();
      
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
      
      // 获取最终图像的实际宽高
      let finalWidth = imageInfo.width;
      let finalHeight = imageInfo.height;
      
      // 如果原图被压缩了，更新宽高信息
      if (imageInfo.width && imageInfo.height && (imageInfo.width > 1440 || imageInfo.height > 1440)) {
        // 计算压缩后的尺寸，保持原始比例
        const aspectRatio = imageInfo.width / imageInfo.height;
        if (imageInfo.width > imageInfo.height) {
          finalWidth = 1440;
          finalHeight = Math.round(1440 / aspectRatio);
        } else {
          finalHeight = 1440;
          finalWidth = Math.round(1440 * aspectRatio);
        }
      }
        // 准备插入数据
      const insertData = {
        file_name: fileName,
        original_file_name: file.name,
        file_path: fileName,
        public_url: url,
        thumbnail_url: thumbnail,
        file_size: originalBuffer.length, // 使用处理后的文件大小
        mime_type: file.type,
        folder_name: folderName,
        description: description,
        alt_text: altText,
        tags: tagsArray,
        width: finalWidth,
        height: finalHeight,
        storage_provider: 'cloudflare_r2',
        bucket_name: BUCKET_NAME,
        is_public: true,
        uploaded_by: userUuid,
        ...(targetTable === "album_image" && albumId ? { group_id: albumId } : {}) // 如果上传到相册，添加group_id字段
      };
      
      console.log(`Inserting to ${targetTable} table:`, insertData);
      
      // 根据targetTable参数决定存入哪个表
      const { data, error } = await supabase
        .from(targetTable)
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
        thumbnailUrl: thumbnail,
        fileName: fileName,
        id: data?.id,
        original_name: file.name,
        size: originalBuffer.length, // 返回处理后的文件大小
        type: file.type,
        width: finalWidth,
        height: finalHeight
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