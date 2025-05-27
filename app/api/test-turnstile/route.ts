import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstileToken, getClientIP } from "@/lib/turnstile";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Missing token" },
        { status: 400 }
      );
    }

    const clientIP = getClientIP(request);
    const result = await verifyTurnstileToken(token, clientIP);
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? "Verification successful" : "Verification failed",
      details: result
    });
  } catch (error) {
    console.error("Turnstile test error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
