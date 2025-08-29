import { NextResponse } from "next/server";
import { emailService } from "../../../../lib/emailService";

export async function GET() {
  try {
    console.log("Testing email configuration...");
    
    // Check environment variables
    const emailConfig = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      FROM_EMAIL: process.env.FROM_EMAIL,
      FROM_NAME: process.env.FROM_NAME,
      hasPassword: !!process.env.SMTP_PASS,
    };
    
    console.log("Email configuration:", emailConfig);
    
    // Test SMTP connection
    const connectionTest = await emailService.testConnection();
    
    return NextResponse.json({
      success: connectionTest.success,
      message: connectionTest.success ? "Email configuration is valid" : "Email configuration failed",
      config: emailConfig,
      connectionError: connectionTest.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email config test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Email configuration test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}