/**
 * Cloudflare Turnstile 验证辅助函数
 */

export interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

/**
 * 在服务器端验证 Turnstile token
 * @param token Turnstile 验证token
 * @param remoteip 用户IP地址（可选）
 * @returns 验证结果
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<TurnstileResponse> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY 环境变量未配置');
    return {
      success: false,
      'error-codes': ['missing-secret-key']
    };
  }

  if (!token) {
    return {
      success: false,
      'error-codes': ['missing-input-response']
    };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TurnstileResponse = await response.json();
    
    console.log('Turnstile verification result:', {
      success: result.success,
      errorCodes: result['error-codes']
    });
    
    return result;
  } catch (error) {
    console.error('Turnstile 验证失败:', error);
    return {
      success: false,
      'error-codes': ['verification-failed']
    };
  }
}

/**
 * 获取客户端IP地址
 * @param request NextRequest对象
 * @returns IP地址
 */
export function getClientIP(request: Request): string | undefined {
  // 尝试从各种头部获取真实IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return undefined;
}
