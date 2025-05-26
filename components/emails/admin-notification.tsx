import * as React from 'react';

interface AdminNotificationEmailProps {
  name: string;
  email: string;
  content: string[];
}

// 生成管理员通知纯文本版本的函数
export const generateAdminNotificationTextEmail = (props: AdminNotificationEmailProps): string => {
  const { name, email, content } = props;
  
  return `
新订阅通知

姓名：${name}
邮箱：${email}
订阅内容：${content.join(', ')}
订阅时间：${new Date().toLocaleString('zh-CN')}
  `.trim();
};

export const AdminNotificationEmail: React.FC<AdminNotificationEmailProps> = ({
  name,
  email,
  content
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
          <h1 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>新订阅通知</h1>
          <p style={{ color: '#666', margin: '0' }}>有新用户订阅了您的博客</p>
        </div>

        {/* Main Content */}
        <div style={{ backgroundColor: '#fef2f2', padding: '25px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #fecaca' }}>
          <h2 style={{ color: '#991b1b', marginTop: '0' }}>订阅详情</h2>
          
          <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#374151' }}>姓名：</strong>
              <span style={{ marginLeft: '10px' }}>{name}</span>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#374151' }}>邮箱：</strong>
              <span style={{ marginLeft: '10px' }}>{email}</span>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#374151' }}>订阅内容：</strong>
              <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                {content.map((item, index) => {
                  const contentLabels: { [key: string]: string } = {
                    'Knowledge': '知识分享',
                    'Life': '生活感悟',
                    'Academic': '学术研究',
                    'Album': '相册分享'
                  };
                  
                  return (
                    <li key={index} style={{ marginBottom: '5px' }}>
                      {contentLabels[item] || item}
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div>
              <strong style={{ color: '#374151' }}>订阅时间：</strong>
              <span style={{ marginLeft: '10px' }}>{new Date().toLocaleString('zh-CN')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', textAlign: 'center' }}>
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
              此邮件由 <strong>Eson Wang's Blog</strong> 系统自动发送<br />
              © 2025 Eson Wang. 版权所有。
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
);

export default AdminNotificationEmail;
