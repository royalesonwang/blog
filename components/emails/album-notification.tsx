import { Html, Head, Body, Container, Section, Text, Link, Hr, Img } from '@react-email/components';

interface AlbumNotificationEmailProps {
  name: string;
  email: string;
  albumTitle: string;
  albumDescription?: string;
  albumUrl: string;
  recentImages: {
    file_path: string;
    file_name?: string;
    original_file_name?: string;
    description?: string;
    created_at: string;
  }[];
  totalCount: number; // 24小时内新增的图片总数
  unsubscribeUrl?: string;
}

export default function AlbumNotificationEmail({
  name,
  email,
  albumTitle,
  albumDescription,
  albumUrl,
  recentImages,
  totalCount,
  unsubscribeUrl,
}: AlbumNotificationEmailProps) {
  const imageBaseUrl = process.env.NEXT_PUBLIC_R2_DOMAIN || 'https://storage.eson.wang';
  
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', maxWidth: '580px' }}>
          {/* Header */}
          <Section style={{ padding: '0 40px' }}>
            <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: '20px' }}>
              相册更新通知
            </Text>
            <Text style={{ color: '#666', margin: '0', textAlign: 'center' }}>
              {name}，您订阅的相册有新图片啦！
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={{ backgroundColor: '#f8fafc', padding: '25px 40px', margin: '25px 40px', borderRadius: '8px' }}>
            <Text style={{ color: '#1e293b', fontSize: '20px', fontWeight: 'bold', marginTop: '0', marginBottom: '15px' }}>
              相册《{albumTitle}》已更新
            </Text>
            
            {albumDescription && (
              <Text style={{ color: '#64748b', marginBottom: '20px', lineHeight: '1.6' }}>
                {albumDescription}
              </Text>
            )}            <Text style={{ color: '#374151', marginBottom: '15px' }}>
              最近24小时内，Eson Wang上传了<strong>{totalCount}</strong>张新图片：
            </Text>

            {/* Recent Image - Single Image Display */}
            <Section style={{ margin: '20px 0', textAlign: 'center' }}>
              {recentImages.length > 0 && (
                <div style={{ display: 'inline-block', maxWidth: '400px' }}>
                  <Img
                    src={`${imageBaseUrl}/${recentImages[0].file_path}`}
                    alt={recentImages[0].description || recentImages[0].original_file_name || '相册图片'}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      height: 'auto',
                      maxHeight: '300px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  />                  {/* 显示描述 */}
                  {recentImages[0].description && (
                    <Text style={{ 
                      fontSize: '11px', 
                      color: '#64748b', 
                      margin: '0 0 10px 0',
                      textAlign: 'center',
                      lineHeight: '1.4'
                    }}>
                      {recentImages[0].description.length > 100 
                        ? recentImages[0].description.substring(0, 100) + '...' 
                        : recentImages[0].description}
                    </Text>
                  )}
                </div>
              )}
            </Section>

            {/* View Album Button */}
            <Section style={{ textAlign: 'center', margin: '30px 0 20px 0' }}>
              <Link
                href={albumUrl}
                style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'inline-block',
                  padding: '14px 28px',
                }}
              >
                查看完整相册
              </Link>
            </Section>
          </Section>

          <Hr style={{ borderColor: '#e2e8f0', margin: '26px 40px' }} />

          {/* Footer */}
          <Section style={{ padding: '0 40px' }}>
            <Text style={{ color: '#64748b', fontSize: '14px', margin: '0 0 10px 0', textAlign: 'center' }}>
              您收到此邮件是因为您订阅了 Eson Wang 博客的相册更新通知。
            </Text>
            
            {unsubscribeUrl && (
              <Text style={{ margin: '0', textAlign: 'center' }}>
                <Link 
                  href={unsubscribeUrl} 
                  style={{ 
                    color: '#dc2626', 
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  取消订阅
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/**
 * 生成相册通知邮件的纯文本版本
 */
export function generateAlbumNotificationTextEmail(props: AlbumNotificationEmailProps): string {
  const { name, albumTitle, albumDescription, albumUrl, recentImages, totalCount, unsubscribeUrl } = props;
  
  return `
相册更新通知 - Eson Wang 的博客

您好，${name}！

相册《${albumTitle}》已更新

${albumDescription ? albumDescription + '\n' : ''}

最近24小时内，我们为您精选了 ${totalCount} 张新图片。

查看完整相册：${albumUrl}

---

您收到此邮件是因为您订阅了 Eson Wang 博客的相册更新通知。

${unsubscribeUrl ? `如需取消订阅，请访问：${unsubscribeUrl}` : ''}

感谢您的关注！

Eson Wang 的博客
${(() => {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://eson.wang';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
})()}
`;
}
