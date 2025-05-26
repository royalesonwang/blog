import * as React from 'react';

interface SubscriptionConfirmationEmailProps {
  name: string;
  email: string;
  content: string[];
  unsubscribeUrl?: string;
}

// 生成纯文本版本的函数
export const generateSubscriptionTextEmail = (props: SubscriptionConfirmationEmailProps): string => {
  const { name, email, content, unsubscribeUrl } = props;
  
  const contentLabels: { [key: string]: string } = {
    'Knowledge': '• 知识分享',
    'Life': '• 生活感悟', 
    'Academic': '• 学术研究',
    'Album': '• 摄影作品'
  };

  return `
感谢您订阅 Eson Wang 的博客！

您好，${name}！

您将通过 ${email} 接收以下内容更新：
${content.map(item => contentLabels[item] || `• ${item}`).join('\n')}

我们会定期向您发送精选内容。

取消订阅：${unsubscribeUrl}

© 2025 Eson Wang
  `.trim();
};

export const SubscriptionConfirmationEmail: React.FC<SubscriptionConfirmationEmailProps> = ({
  name,
  email,
  content,
  unsubscribeUrl
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2563eb', margin: '0 0 10px 0' }}>邮箱订阅确认</h1>
          <p style={{ color: '#666', margin: '0' }}>感谢您订阅 Eson Wang 的博客！</p>
        </div>

        {/* Main Content */}
        <div style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '8px', marginBottom: '25px' }}>
          <h2 style={{ color: '#1e293b', marginTop: '0' }}>您好，{name}！</h2>
          
          <p style={{ marginBottom: '20px' }}>
            我们已成功收到您的订阅申请。您将通过 <strong>{email}</strong> 接收以下类型的内容更新：
          </p>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#475569', marginBottom: '10px' }}>订阅内容：</h3>
            <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
              {content.map((item, index) => {
                const contentLabels: { [key: string]: string } = {
                  'Knowledge': '🔧 知识分享',
                  'Life': '🌟 生活感悟',
                  'Academic': '📚 学术研究',
                  'Album': '📸 相册分享'
                };
                
                return (
                  <li key={index} style={{ 
                    padding: '8px 15px', 
                    margin: '5px 0', 
                    backgroundColor: '#e2e8f0', 
                    borderRadius: '5px',
                    display: 'inline-block',
                    marginRight: '10px'
                  }}>
                    {contentLabels[item] || item}
                  </li>
                );
              })}
            </ul>
          </div>

          <p style={{ color: '#64748b' }}>
            我们会定期向您发送精选内容，请持续关注。
          </p>
          <p>主页链接：<a href={unsubscribeUrl} style={{ color: '#dc2626', textDecoration: 'none', fontSize: '14px'}}>https://eson.wang</a></p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 10px 0' }}>
            如果您不想再收到这些邮件，您可以随时取消订阅。
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

export default SubscriptionConfirmationEmail;
