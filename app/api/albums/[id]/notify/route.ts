import { NextRequest, NextResponse } from 'next/server';
import { findActiveSubscribersByContentType } from '@/models/subscribe';
import { sendBulkAlbumNotifications, AlbumNotificationEmailData } from '@/lib/email';

// 获取最近24小时内上传的图片
async function getRecentAlbumImages(albumId: string): Promise<{
  totalCount: number;
  recentImages: {
    file_path: string;
    file_name?: string;
    original_file_name?: string;
    description?: string;
    created_at: string;
  }[];
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/api/albums/${albumId}/images`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch album images');
    }
    
    const data = await response.json();
    const images = data.images || [];
    
    // 过滤最近24小时内的图片
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const allRecentImages = images.filter((image: any) => {
      const createdAt = new Date(image.created_at);
      return createdAt > twentyFourHoursAgo;
    });
    
    // 按时间排序，获取最新的18张
    const sortedImages = allRecentImages.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const recentImages = sortedImages.slice(0, 18).map((image: any) => ({
      file_path: image.file_path,
      file_name: image.file_name,
      original_file_name: image.original_file_name,
      description: image.description,
      created_at: image.created_at,
    }));
    
    return {
      totalCount: allRecentImages.length,
      recentImages
    };
  } catch (error) {
    console.error('Error fetching recent album images:', error);
    return {
      totalCount: 0,
      recentImages: []
    };
  }
}

// 获取相册信息
async function getAlbumInfo(albumId: string) {  try {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/api/albums/${albumId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch album info');
    }
    
    const data = await response.json();
    return data.album;
  } catch (error) {
    console.error('Error fetching album info:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const albumId = params.id;
    
    if (!albumId) {
      return NextResponse.json(
        { success: false, message: '相册ID不能为空' },
        { status: 400 }
      );
    }

    // 从请求体中获取选择的图片
    const body = await request.json();
    const selectedImagePath = body.selectedImagePath;

    // 获取相册信息
    const albumInfo = await getAlbumInfo(albumId);
    if (!albumInfo) {
      return NextResponse.json(
        { success: false, message: '相册不存在' },
        { status: 404 }
      );
    }

    // 获取最近24小时内的图片
    const imageResult = await getRecentAlbumImages(albumId);
    
    if (imageResult.totalCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '最近24小时内没有新上传的图片',
          recentImages: imageResult
        },
        { status: 400 }
      );
    }

    // 找到选择的图片，如果没有选择则使用最新的
    let selectedImage = null;
    if (selectedImagePath) {
      selectedImage = imageResult.recentImages.find(img => img.file_path === selectedImagePath);
    }
    if (!selectedImage && imageResult.recentImages.length > 0) {
      selectedImage = imageResult.recentImages[0]; // 默认选择最新的
    }

    if (!selectedImage) {
      return NextResponse.json(
        { 
          success: false, 
          message: '没有找到可用的图片',
          recentImages: imageResult
        },
        { status: 400 }
      );
    }// 获取订阅相册更新的用户
    const subscribers = await findActiveSubscribersByContentType('Album');
    
    if (subscribers.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '没有用户订阅相册更新通知',
          recentImages: imageResult 
        },
        { status: 400 }
      );
    }

    // 构建相册URL，使用 NEXT_PUBLIC_WEB_URL
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    const albumUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/albums`;    // 准备批量发送的邮件数据
    const emailDataList: AlbumNotificationEmailData[] = subscribers.map(subscriber => ({
      name: subscriber.name,
      email: subscriber.email,
      albumTitle: albumInfo.title || "相册",
      albumDescription: albumInfo.description,
      albumUrl,
      recentImages: [selectedImage], // 使用选择的图片
      totalCount: imageResult.totalCount,
      uuid: subscriber.uuid,
    }));

    // 发送邮件通知
    const bulkResult = await sendBulkAlbumNotifications(emailDataList);    return NextResponse.json({
      success: true,
      message: `相册通知发送完成`,
      sent: bulkResult.sent,
      errors: bulkResult.errors,
      total: emailDataList.length,
      recentImages: imageResult,
      albumTitle: albumInfo.title,
    });

  } catch (error) {
    console.error('Error sending album notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '发送相册通知失败' 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const albumId = params.id;
    
    if (!albumId) {
      return NextResponse.json(
        { success: false, message: '相册ID不能为空' },
        { status: 400 }
      );
    }

    // 获取相册信息
    const albumInfo = await getAlbumInfo(albumId);
    if (!albumInfo) {
      return NextResponse.json(
        { success: false, message: '相册不存在' },
        { status: 404 }
      );
    }    // 获取最近24小时内的图片
    const imageResult = await getRecentAlbumImages(albumId);
    
    // 获取订阅相册更新的用户数量
    const subscribers = await findActiveSubscribersByContentType('Album');

    return NextResponse.json({
      success: true,
      albumInfo,
      recentImages: imageResult,
      subscriberCount: subscribers.length,
      canSendNotification: imageResult.totalCount > 0 && subscribers.length > 0,
    });

  } catch (error) {
    console.error('Error getting album notification info:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '获取相册通知信息失败' 
      },
      { status: 500 }
    );
  }
}
