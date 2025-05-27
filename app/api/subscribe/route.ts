import { NextRequest, NextResponse } from "next/server";
import { insertSubscribe, findSubscribeByEmail, updateSubscribeContent, getAllSubscribes } from "@/models/subscribe";
import { respData, respErr } from "@/lib/resp";
import { getUserInfo } from "@/services/user";
import { sendSubscriptionConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email";
import { verifyTurnstileToken, getClientIP } from "@/lib/turnstile";

// 生成UUID的辅助函数
function generateUUID(): string {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
    const r = Math.random() * 16 | 0;
    return r.toString(16);
  });
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, content, turnstileToken } = await request.json();

    // 验证 Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { success: false, message: "人机验证失败，请重试" },
        { status: 400 }
      );
    }

    const clientIP = getClientIP(request);
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIP);
    
    if (!turnstileResult.success) {
      console.error("Turnstile verification failed:", turnstileResult['error-codes']);
      return NextResponse.json(
        { success: false, message: "人机验证失败，请重试" },
        { status: 400 }
      );
    }

    // 验证必需字段
    if (!email || !content || !Array.isArray(content) || content.length === 0) {
      return NextResponse.json(
        { success: false, message: "邮箱和订阅内容不能为空" },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 验证订阅内容
    const validContent = ["Knowledge", "Life", "Academic", "Album"];
    const isValidContent = content.every(item => validContent.includes(item));
    if (!isValidContent) {
      return NextResponse.json(
        { success: false, message: "订阅内容选项无效" },
        { status: 400 }
      );
    }    // 检查邮箱是否已经订阅
    const existingSubscribe = await findSubscribeByEmail(email);
    if (existingSubscribe) {
      // 如果用户状态是 active，表示已经订阅，返回错误
      if (existingSubscribe.status === 'active') {
        return NextResponse.json(
          { success: false, message: "您已经用此邮箱订阅过了" },
          { status: 400 }
        );
      }
        // 如果用户状态是 inactive，当作新订阅处理，重新激活
      if (existingSubscribe.status === 'inactive') {
        const updated = await updateSubscribeContent(email, content);
        if (updated) {
          // 重新获取订阅信息，确保有最新的UUID
          const refreshedSubscribe = await findSubscribeByEmail(email);
          
          // 发送确认邮件
          try {            await sendSubscriptionConfirmationEmail({
              name: name || existingSubscribe.name || "匿名用户",
              email,
              content,
              uuid: refreshedSubscribe?.uuid || ''
            });
          } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
            // 邮件发送失败不影响订阅更新
          }

          // 发送管理员通知
          try {
            await sendAdminNotificationEmail({
              name: name || existingSubscribe.name || "匿名用户",
              email,
              content
            });
          } catch (emailError) {
            console.error("Failed to send admin notification:", emailError);
            // 管理员通知失败不影响订阅成功
          }

          return NextResponse.json({
            success: true,
            message: "订阅成功！一封邮件已发送到您的邮箱。",
            isUpdate: false // 当作新订阅处理
          });
        } else {
          return NextResponse.json(
            { success: false, message: "订阅失败" },
            { status: 500 }
          );
        }      }
    }// 创建新订阅
    const subscribeData = {
      name: name || "匿名用户",
      email,
      content,
      status: "active",
      plan: "free",
      uuid: generateUUID() // 生成UUID用于安全的取消订阅链接
    };

    const insertResult = await insertSubscribe(subscribeData);    // 发送确认邮件给用户
    try {
      await sendSubscriptionConfirmationEmail({
        name: subscribeData.name,
        email,
        content,
        uuid: subscribeData.uuid // 传递UUID用于生成安全的取消订阅链接
      });
      console.log("Subscription confirmation email sent successfully");
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // 邮件发送失败不影响订阅成功
    }

    // 发送通知邮件给管理员
    try {
      await sendAdminNotificationEmail({
        name: subscribeData.name,
        email,
        content
      });
      console.log("Admin notification email sent successfully");
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
      // 管理员通知失败不影响订阅成功
    }

    return NextResponse.json({
      success: true,
      message: "订阅成功！确认邮件已发送到您的邮箱。"
    });

  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { success: false, message: "订阅失败，请稍后再试" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 检查用户是否为管理员
    const userInfo = await getUserInfo();
    if (!userInfo || !userInfo.email) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }

    const isAdmin = process.env.ADMIN_EMAILS?.split(",").includes(userInfo.email) || false;
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "权限不足" },
        { status: 403 }
      );
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const subscribes = await getAllSubscribes(page, limit);

    return NextResponse.json({
      success: true,
      data: subscribes
    });

  } catch (error) {
    console.error("Get subscribes error:", error);
    return NextResponse.json(
      { success: false, message: "获取订阅列表失败" },
      { status: 500 }
    );
  }
}
