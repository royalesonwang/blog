import * as React from 'react';

interface ActivationEmailProps {
  name: string;
  email: string;
  content: string[];
  activationUrl: string;
}

// 生成纯文本版本的函数
export const generateActivationTextEmail = (props: ActivationEmailProps): string => {
  const { name, email, content, activationUrl } = props;
  const contentLabels: { [key: string]: string } = {
    'Knowledge': '• 知识分享',
    'Life': '• 生活感悟', 
    'Academic': '• 学术研究',
    'Album': '• 摄影作品'
  };
  
  return `
激活您的订阅 - Eson Wang 的博客

您好，${name}！

感谢您订阅 Eson Wang 的博客！为了完成订阅流程，请点击下面的链接激活您的订阅：

${activationUrl}

您选择订阅的内容类型：
${content.map(item => contentLabels[item] || `• ${item}`).join('\n')}

激活后，您将开始通过 ${email} 接收我们的精选内容。

如果您没有进行此订阅操作，请忽略此邮件。

博客主页：${(() => {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
})()}

© 2025 Eson Wang
  `.trim();
};

export const ActivationEmail: React.FC<ActivationEmailProps> = ({
  name,
  email,
  content,
  activationUrl
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
          <h1 style={{ color: '#2563eb', margin: '0 0 10px 0' }}>激活您的订阅</h1>
          <p style={{ color: '#666', margin: '0' }}>感谢您订阅 Eson Wang 的博客！</p>
        </div>

        {/* Main Content */}
        <div style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '8px', marginBottom: '25px' }}>
          <h2 style={{ color: '#1e293b', marginTop: '0' }}>您好，{name}！</h2>
          
          <p style={{ marginBottom: '20px' }}>
            我们已收到您的订阅申请。为了完成订阅流程并开始接收内容，请点击下面的按钮激活您的订阅：
          </p>

          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <a 
              href={activationUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 30px',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              激活订阅
            </a>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#475569', marginBottom: '10px' }}>您选择的订阅内容：</h3>
            <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
              {content.map((item, index) => {
                const contentLabels: { [key: string]: string } = {
                  'Knowledge': '📚 知识分享',
                  'Life': '🌟 生活感悟',
                  'Academic': '🧪 学术研究',
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

          <p style={{ color: '#64748b', fontSize: '14px' }}>
            激活后，您将通过 <strong>{email}</strong> 接收我们的精选内容。
          </p>
          
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            如果按钮无法点击，请复制以下链接到浏览器地址栏：<br />
            <a href={activationUrl} style={{ color: '#3b82f6', fontSize: '12px', wordBreak: 'break-all' }}>
              {activationUrl}
            </a>
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 10px 0' }}>
            如果您没有进行此订阅操作，请忽略此邮件。
          </p>
          
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

export default ActivationEmail;
