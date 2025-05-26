import * as React from 'react';

interface PostUpdatedEmailProps {
  name: string;
  email: string;
  postTitle: string;
  postDescription: string;
  postType: string;
  postUrl: string;
  coverImageUrl?: string;
  unsubscribeUrl?: string;
}

// 生成纯文本版本的函数
export const generatePostUpdatedTextEmail = (props: PostUpdatedEmailProps): string => {
  const { name, postTitle, postDescription, postType, postUrl, unsubscribeUrl } = props;
  
  return `
文章更新通知

亲爱的 ${name || '读者'},

Eson Wang 的博客刚刚更新了一篇${getTypeDisplay(postType)}文章，我们认为您可能会感兴趣查看最新内容：

${postTitle}

${postDescription}

查看更新: ${postUrl}

----------

您收到此邮件是因为您订阅了 Eson Wang 博客的${getTypeDisplay(postType)}类型通知。
${unsubscribeUrl ? `取消订阅: ${unsubscribeUrl}` : ''}
  `.trim();
};

function getTypeDisplay(type: string): string {
  const typeMap: Record<string, string> = {
    'Knowledge': '知识',
    'Life': '生活',
    'Academic': '学术',
    'Album': '相册'
  };
  
  return typeMap[type] || type;
}

export const PostUpdatedEmail: React.FC<PostUpdatedEmailProps> = ({
  name,
  email,
  postTitle,
  postDescription,
  postType,
  postUrl,
  coverImageUrl,
  unsubscribeUrl
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>文章更新: {postTitle}</title>
    </head>
    <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#333', backgroundColor: '#f6f9fc', margin: 0, padding: 0 }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px', backgroundColor: '#ffffff', padding: '30px 20px', borderRadius: '8px 8px 0 0' }}>
          <h1 style={{ color: '#2563eb', margin: '0 0 10px 0', fontSize: '24px' }}>文章更新通知</h1>
        </div>

        {/* Main Content */}
        <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '0 0 8px 8px', marginBottom: '25px' }}>
          <h2 style={{ color: '#1e293b', marginTop: '0', fontSize: '18px' }}>亲爱的 {name || '读者'}，</h2>
          
          <p style={{ marginBottom: '20px' }}>
            Eson Wang 的博客刚刚更新了一篇{getTypeDisplay(postType)}文章，我们认为您可能会感兴趣查看最新内容：
          </p>

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
            <h3 style={{ color: '#475569', marginBottom: '10px', fontSize: '20px' }}>{postTitle}</h3>
            <p style={{ color: '#64748b', margin: '0', fontSize: '15px' }}>{postDescription}</p>
          </div>

          {coverImageUrl && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <img 
                src={coverImageUrl}
                alt={postTitle}
                style={{ maxWidth: '100%', borderRadius: '5px' }}
              />
            </div>
          )}

          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a 
              href={postUrl}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '5px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block'
              }}
            >
              查看更新
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center', backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px' }}>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 10px 0' }}>
            您收到此邮件是因为您订阅了 Eson Wang 博客的{getTypeDisplay(postType)}类型通知。
          </p>
          
          {unsubscribeUrl && (
            <p style={{ margin: '0' }}>
              <a 
                href={unsubscribeUrl} 
                style={{ 
                  color: '#dc2626', 
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                取消订阅
              </a>
            </p>
          )}
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '5px' }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#475569' }}>
              此邮件由 <strong>Eson Wang's Blog</strong> 发送<br />
              © 2025 Eson Wang. 版权所有。
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
);

export default PostUpdatedEmail;
