import { Post } from "@/types/post";
import { findActiveSubscribersByContentType } from "@/models/subscribe";
import { 
  sendPostPublishedEmail, 
  sendPostUpdatedEmail, 
  sendBulkPostNotifications,
  PostNotificationEmailData 
} from "@/lib/email";
import { generateUnsubscribeUrl } from "@/lib/unsubscribe-helper";

/**
 * 发送文章发布通知给订阅了相应类型的用户
 * @param post 已发布的文章信息
 * @param isUpdate 是否是更新通知（而不是新文章通知）
 */
export async function sendPostNotifications(post: Post, isUpdate: boolean = false): Promise<{
  success: boolean;
  sent: number;
  errors: number;
  message: string;
}> {  try {
    // 记录开始处理通知
    console.log(`开始处理${isUpdate ? '更新' : '新文章'}通知：${post.title || '无标题'} (${post.type || '无类型'})`);
    
    // 文章必须有类型才能发送通知
    if (!post.type) {
      console.error("无法发送通知：文章没有指定类型");
      return {
        success: false,
        sent: 0,
        errors: 0,
        message: "文章没有指定类型，无法发送通知"
      };
    }
    
    // 检查必要的环境变量和文章信息
    if (!process.env.NEXT_PUBLIC_WEB_URL) {
      console.error("缺少必要的环境变量 NEXT_PUBLIC_WEB_URL，使用默认域名");
    }
      // 如果没有slugs和uuid，文章还没保存，无法生成有效链接
    if (!post.slug && !post.uuid) {
      return {
        success: false,
        sent: 0,
        errors: 0,
        message: "文章缺少slug和uuid，无法生成有效链接"
      };
    }    // 生成文章URL，使用配置的域名或默认本地开发域名
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    // 使用正确的文章路径 /posts/
    const postUrl = `${baseUrl}/posts/${post.slug || post.uuid}`;
    
    // 处理封面图片URL，确保它是完整的URL
    let fullCoverUrl = post.cover_url;
    if (fullCoverUrl && !fullCoverUrl.startsWith('http')) {
      // 如果封面URL不是以http开头，添加baseUrl前缀
      fullCoverUrl = `${baseUrl}${fullCoverUrl.startsWith('/') ? '' : '/'}${fullCoverUrl}`;
    }
    
    // 获取订阅了该类型内容的活跃用户
    const subscribers = await findActiveSubscribersByContentType(post.type);
    
    if (subscribers.length === 0) {
      return {
        success: true,
        sent: 0,
        errors: 0,
        message: `没有用户订阅了 ${post.type} 类型的内容`
      };
    }
    
    console.log(`准备向 ${subscribers.length} 位订阅了 ${post.type} 类型的用户发送${isUpdate ? '更新' : '新文章'}通知`);
    
    // 统计发送成功和失败的数量
    let sent = 0;
    let errors = 0;    // 筛选有效的订阅者，确保他们订阅了指定的内容类型并具有有效的UUID
    const validSubscribers = subscribers.filter(subscriber => {
      try {
        // 检查订阅者是否有效
        if (!subscriber || !subscriber.email) {
          console.error("发现无效的订阅者记录，跳过处理");
          return false;
        }
        
        // 检查订阅者信息是否包含指定类型
        const subscriberContent = subscriber.content;
        
        console.log(`检查订阅者 ${subscriber.email} 的内容类型:`, subscriberContent);
        
        if (!Array.isArray(subscriberContent) || subscriberContent.length === 0) {
          console.log(`用户 ${subscriber.email} 没有订阅任何内容类型，跳过发送通知`);
          return false;
        }
        
        if (!subscriberContent.includes(post.type!)) {
          console.log(`用户 ${subscriber.email} 没有订阅 ${post.type} 类型的内容，跳过发送通知`);
          return false;
        }
          // 确保订阅者有有效的UUID
        if (!subscriber.uuid) {
          console.error(`用户 ${subscriber.email} 没有有效的UUID，无法生成取消订阅链接，跳过发送通知`);
          errors++;
          return false;
        }
        
        return true;
      } catch (filterError) {
        console.error(`过滤订阅者时出错: ${filterError instanceof Error ? filterError.message : String(filterError)}`);
        errors++;
        return false;
      }
      
      return true;
    });
    
    console.log(`筛选后有 ${validSubscribers.length} 位有效订阅者将收到通知`);
    
    // 没有有效订阅者，直接返回
    if (validSubscribers.length === 0) {
      return {
        success: true,
        sent: 0,
        errors,
        message: `没有有效的订阅者接收 ${post.type} 类型的内容`
      };
    }
    
    // 确保post.type不为undefined (我们已经在函数开始时检查了)
    const postType = post.type!;
      // 准备批量发送的邮件数据
    const emailDataList: PostNotificationEmailData[] = validSubscribers.map(subscriber => ({
      name: subscriber.name,
      email: subscriber.email,
      postTitle: post.title || "无标题",
      postDescription: post.description || "",
      postType: postType,
      postUrl,
      coverImageUrl: fullCoverUrl || '', // 使用处理后的完整封面URL
      uuid: subscriber.uuid
    }));
    
    // 使用批量发送功能
    console.log(`开始批量发送${isUpdate ? '更新' : '新文章'}通知给 ${emailDataList.length} 位订阅者...`);
    const bulkResult = await sendBulkPostNotifications(emailDataList, isUpdate);
    
    sent = bulkResult.sent;
    errors += bulkResult.errors;
    
    const completionMessage = `成功发送 ${sent} 封通知邮件${errors > 0 ? `，失败 ${errors} 封` : ''}`;
    console.log(`通知发送完成: ${completionMessage}`);
    
    return {
      success: true,
      sent,
      errors,
      message: completionMessage
    };  } catch (error) {
    console.error('Error in sendPostNotifications:', error);
    
    // 详细记录错误信息
    if (error instanceof Error) {
      console.error(`错误类型: ${error.name}`);
      console.error(`错误消息: ${error.message}`);
      console.error(`错误堆栈: ${error.stack}`);
    }
    
    return {
      success: false,
      sent: 0,
      errors: 1,
      message: `发送通知失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
