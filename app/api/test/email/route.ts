import { NextRequest, NextResponse } from "next/server";
import { emailService } from "../../../../lib/emailService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'test@example.com';
    
    console.log("Testing email service...");
    
    // Test SMTP connection first
    const connectionTest = await emailService.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: "SMTP connection failed",
          details: connectionTest.error,
        },
        { status: 500 }
      );
    }
    
    // Send test seminar selection email
    const emailResult = await emailService.sendSeminarSelectionEmail(
      testEmail,
      "Test Student",
      "TEST123",
      "2025-08-30",
      "II-IT"
    );
    
    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
        recipient: testEmail,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Email sending failed",
          details: emailResult.error,
          recipient: testEmail,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Email test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, registerNumber, seminarDate, classYear } = body;
    
    if (!email || !name || !registerNumber || !seminarDate || !classYear) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          required: ["email", "name", "registerNumber", "seminarDate", "classYear"],
        },
        { status: 400 }
      );
    }
    
    const emailResult = await emailService.sendSeminarSelectionEmail(
      email,
      name,
      registerNumber,
      seminarDate,
      classYear
    );
    
    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        recipient: email,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Email sending failed",
          details: emailResult.error,
          recipient: email,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Email sending failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}