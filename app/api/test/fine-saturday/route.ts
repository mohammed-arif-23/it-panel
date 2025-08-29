import { NextResponse } from "next/server";
import { fineService } from "../../../../lib/fineService";

export async function GET() {
  try {
    console.log("Testing fine creation for Saturday...");

    // Test with a Saturday date (2025-08-30 is a Saturday)
    const saturdayDate = "2025-08-30";

    const result = await fineService.createFinesForNonBookedStudents(
      saturdayDate
    );

    return NextResponse.json({
      success: true,
      message: "Saturday fine test completed",
      testDate: saturdayDate,
      dayOfWeek: new Date(saturdayDate + "T12:00:00").toLocaleDateString(
        "en-US",
        { weekday: "long" }
      ),
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Saturday fine test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Saturday fine test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const testDates = [
      "2025-08-30", // Saturday
      "2025-08-31", // Sunday
      "2025-09-01", // Monday
    ];

    const results = [];

    for (const date of testDates) {
      const dayOfWeek = new Date(date + "T12:00:00").toLocaleDateString(
        "en-US",
        { weekday: "long" }
      );
      console.log(`Testing fine creation for ${dayOfWeek} (${date})...`);

      const result = await fineService.createFinesForNonBookedStudents(date);

      results.push({
        date,
        dayOfWeek,
        result,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Multi-day fine test completed",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Multi-day fine test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Multi-day fine test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
