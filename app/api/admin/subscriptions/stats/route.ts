import { NextResponse } from 'next/server';
import { getSubscriptionStats } from '@/models/subscribe';

export async function GET() {
  try {
    const stats = await getSubscriptionStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return NextResponse.json(
      { success: false, message: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
