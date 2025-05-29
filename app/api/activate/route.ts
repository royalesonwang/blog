import { NextRequest, NextResponse } from "next/server";
import { activateSubscription, findSubscribeByUUID } from "@/models/subscribe";
import { sendSubscriptionConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { uuid } = await request.json();

    if (!uuid) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid activation code" },
        { status: 400 }
      );
    }

    // 激活订阅
    const newUUID = await activateSubscription(uuid);
    
    if (!newUUID) {
      return NextResponse.json(
        { success: false, message: "Activation link has expired or is invalid" },
        { status: 400 }
      );
    }

    // 获取激活后的订阅信息
    const subscription = await findSubscribeByUUID(newUUID);
    
    if (subscription) {
      // 发送确认邮件
      try {
        await sendSubscriptionConfirmationEmail({
          name: subscription.name,
          email: subscription.email,
          content: subscription.content,
          uuid: newUUID
        });
        console.log("Confirmation email sent after activation");
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // 确认邮件发送失败不影响激活成功
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully! Confirmation email has been sent to your inbox."
    });

  } catch (error) {
    console.error("Activation error:", error);
    return NextResponse.json(
      { success: false, message: "Activation failed, please try again later" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uuid = searchParams.get("uuid");

    if (!uuid) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid activation code" },
        { status: 400 }
      );
    }

    // 激活订阅
    const newUUID = await activateSubscription(uuid);
    
    if (!newUUID) {
      return NextResponse.json(
        { success: false, message: "Activation link has expired or is invalid" },
        { status: 400 }
      );
    }

    // 获取激活后的订阅信息
    const subscription = await findSubscribeByUUID(newUUID);
    
    if (subscription) {
      // 发送确认邮件
      try {
        await sendSubscriptionConfirmationEmail({
          name: subscription.name,
          email: subscription.email,
          content: subscription.content,
          uuid: newUUID
        });
        console.log("Confirmation email sent after activation");
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // 确认邮件发送失败不影响激活成功
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully! Confirmation email has been sent to your inbox."
    });

  } catch (error) {
    console.error("Activation error:", error);
    return NextResponse.json(
      { success: false, message: "Activation failed, please try again later" },
      { status: 500 }
    );
  }
}
