import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET() {
  try {
    console.log("Testing Supabase connection...");
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Simple test query
    const { data, error } = await supabaseAdmin
      .from("unified_students")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Supabase connection error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Supabase connection failed",
          details: error.message,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      data: data,
    });
  } catch (error) {
    console.error("Connection test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      { status: 500 }
    );
  }
}