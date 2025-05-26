import { Resend } from 'resend';
import { render } from '@react-email/render';
import SubscriptionConfirmationEmail, { generateSubscriptionTextEmail } from '@/components/emails/subscription-confirmation';
import AdminNotificationEmail, { generateAdminNotificationTextEmail } from '@/components/emails/admin-notification';
import PostPublishedEmail, { generatePostPublishedTextEmail } from '@/components/emails/post-published-notification';
import PostUpdatedEmail, { generatePostUpdatedTextEmail } from '@/components/emails/post-updated-notification';
import { generateUnsubscribeUrl } from '@/lib/unsubscribe-helper';

// 初始化 Resend 客户端
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface SubscriptionEmailData {
  name: string;
  email: string;
  content: string[];
  uuid?: string; // 订阅的唯一标识，用于生成安全的取消订阅链接
  unsubscribeUrl?: string;
}

export interface PostNotificationEmailData {
  name: string;
  email: string;
  postTitle: string;
  postDescription: string;
  postType: string;
  postUrl: string;
  coverImageUrl?: string;
  uuid?: string; // 订阅的唯一标识，用于生成安全的取消订阅链接
}

/**
 * 发送邮件的通用函数
 */
export async function sendEmail(options: SendEmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const { data, error } = await resend.emails.send({
      from: options.from || 'Eson Wang <subscribe@eson.wang>',
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject, // 确保 text 始终有值
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

/**
 * 发送订阅确认邮件
 */
export async function sendSubscriptionConfirmationEmail(emailData: SubscriptionEmailData) {
  try {    // 生成安全的取消订阅链接
    const unsubscribeUrl = emailData.unsubscribeUrl || 
      generateUnsubscribeUrl(emailData.uuid || '');

    // 使用 React 组件渲染邮件 HTML
    const emailProps = {
      name: emailData.name,
      email: emailData.email,
      content: emailData.content,
      unsubscribeUrl,
    };

    const emailHtml = await render(SubscriptionConfirmationEmail(emailProps));

    // 使用组件中的函数生成纯文本版本
    const emailText = generateSubscriptionTextEmail(emailProps);

    // 发送邮件
    return await sendEmail({
      to: emailData.email,
      subject: '欢迎订阅 Eson Wang 的博客！',
      html: emailHtml,
      text: emailText,
    });
  } catch (error) {
    console.error('Failed to send subscription confirmation email:', error);
    throw error;
  }
}

/**
 * 发送通知邮件给管理员
 */
export async function sendAdminNotificationEmail(emailData: SubscriptionEmailData) {
  try {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    if (adminEmails.length === 0) {
      console.warn('No admin emails configured');
      return { success: true, message: 'No admin emails to notify' };
    }

    // 使用 React 组件渲染邮件 HTML
    const emailProps = {
      name: emailData.name,
      email: emailData.email,
      content: emailData.content,
    };

    const emailHtml = await render(AdminNotificationEmail(emailProps));

    // 使用组件中的函数生成纯文本版本
    const emailText = generateAdminNotificationTextEmail(emailProps);

    // 向所有管理员发送通知
    const promises = adminEmails.map(adminEmail => 
      sendEmail({
        to: adminEmail.trim(),
        subject: '新的博客订阅 - ' + emailData.name,
        html: emailHtml,
        text: emailText,
      })
    );

    await Promise.all(promises);
    
    return { success: true, message: 'Admin notifications sent' };
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    // 不抛出错误，因为用户订阅成功比管理员通知更重要
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * 发送文章发布通知邮件
 */
export async function sendPostPublishedEmail(emailData: PostNotificationEmailData) {
  try {
    // 如果有uuid则生成安全的取消订阅链接
    let unsubscribeUrl;
    if (emailData.uuid) {
      unsubscribeUrl = generateUnsubscribeUrl(emailData.uuid);
    }

    // 使用 React 组件渲染邮件 HTML
    const emailProps = {
      name: emailData.name,
      email: emailData.email,
      postTitle: emailData.postTitle,
      postDescription: emailData.postDescription,
      postType: emailData.postType,
      postUrl: emailData.postUrl,
      coverImageUrl: emailData.coverImageUrl,
      unsubscribeUrl,
    };

    const emailHtml = await render(PostPublishedEmail(emailProps));

    // 使用组件中的函数生成纯文本版本
    const emailText = generatePostPublishedTextEmail(emailProps);

    // 发送邮件
    return await sendEmail({
      to: emailData.email,
      subject: `新文章发布：${emailData.postTitle} - Eson Wang 的博客`,
      html: emailHtml,
      text: emailText,
    });
  } catch (error) {
    console.error('Failed to send post published notification email:', error);
    throw error;
  }
}

/**
 * 发送文章更新通知邮件
 */
export async function sendPostUpdatedEmail(emailData: PostNotificationEmailData) {
  try {
    // 如果有uuid则生成安全的取消订阅链接
    let unsubscribeUrl;
    if (emailData.uuid) {
      unsubscribeUrl = generateUnsubscribeUrl(emailData.uuid);
    }

    // 使用 React 组件渲染邮件 HTML
    const emailProps = {
      name: emailData.name,
      email: emailData.email,
      postTitle: emailData.postTitle,
      postDescription: emailData.postDescription,
      postType: emailData.postType,
      postUrl: emailData.postUrl,
      coverImageUrl: emailData.coverImageUrl,
      unsubscribeUrl,
    };

    const emailHtml = await render(PostUpdatedEmail(emailProps));

    // 使用组件中的函数生成纯文本版本
    const emailText = generatePostUpdatedTextEmail(emailProps);

    // 发送邮件
    return await sendEmail({
      to: emailData.email,
      subject: `文章已更新：${emailData.postTitle} - Eson Wang 的博客`,
      html: emailHtml,
      text: emailText,
    });
  } catch (error) {
    console.error('Failed to send post update notification email:', error);
    throw error;
  }
}

/**
 * 批量发送邮件通知，适用于大量收件人场景
 * @param emailDataList 收件人数据列表
 * @param isUpdate 是否是更新通知
 * @returns 发送结果统计
 */
export async function sendBulkPostNotifications(
  emailDataList: PostNotificationEmailData[],
  isUpdate: boolean = false
): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;
  const batchSize = 10; // 每批处理的邮件数量
  const totalBatches = Math.ceil(emailDataList.length / batchSize);
  
  console.log(`开始批量发送${isUpdate ? '更新' : '新文章'}通知，共 ${emailDataList.length} 封邮件，分 ${totalBatches} 批处理`);
  
  for (let i = 0; i < emailDataList.length; i += batchSize) {
    const currentBatch = Math.floor(i / batchSize) + 1;
    const batch = emailDataList.slice(i, i + batchSize);
    
    console.log(`处理第 ${currentBatch}/${totalBatches} 批，包含 ${batch.length} 封邮件`);
    
    const promises = batch.map(data => {
      return (isUpdate ? sendPostUpdatedEmail(data) : sendPostPublishedEmail(data))
        .then(() => { 
          sent++; 
          console.log(`✓ 成功发送邮件到 ${data.email}`);
        })
        .catch(error => {
          console.error(`✗ 发送邮件到 ${data.email} 失败:`, error);
          errors++;
        });
    });
    
    await Promise.allSettled(promises);
    
    // 每批处理后加入短暂延迟，避免API速率限制
    if (i + batchSize < emailDataList.length) {
      const delayMs = 1000; // 1秒延迟
      console.log(`批处理延迟 ${delayMs}ms，防止API速率限制...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return { sent, errors };
}

export default {
  sendEmail,
  sendSubscriptionConfirmationEmail,
  sendAdminNotificationEmail,
  sendPostPublishedEmail,
  sendPostUpdatedEmail,
  sendBulkPostNotifications,
};
