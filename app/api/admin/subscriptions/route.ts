import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscribesForAdmin } from '@/models/subscribe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    const result = await getAllSubscribesForAdmin(page, limit);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { success: false, message: '获取订阅数据失败' },
      { status: 500 }
    );
  }
}
