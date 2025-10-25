import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if student has an existing certificate (get the most recent one)
    const { data, error } = await supabase
      .from("unified_nodue_records")
      .select("id, pdf_url, generated_at, status")
      .eq("student_id", studentId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error checking existing certificate:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (data && data.pdf_url) {
      return NextResponse.json({
        exists: true,
        pdf_url: data.pdf_url,
        generated_at: data.generated_at,
        status: data.status,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("Error in check-existing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
