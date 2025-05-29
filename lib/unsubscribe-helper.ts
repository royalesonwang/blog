/**
 * 生成安全的取消订阅URL
 * 使用UUID而不是邮箱作为参数，确保只有收到邮件的人才能取消订阅
 * 
 * @param uuid 订阅的唯一标识
 * @param baseUrl 网站基础URL
 * @returns 取消订阅URL
 */
export function generateUnsubscribeUrl(uuid: string, baseUrl?: string): string {  if (!uuid) {
    console.warn('generateUnsubscribeUrl called with empty UUID');
    return ''; // 返回空字符串，防止生成无效链接
  }
  
  const base = baseUrl || process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}/unsubscribe?uuid=${encodeURIComponent(uuid)}`;
}
