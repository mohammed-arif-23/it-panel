import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { seminarTimingService } from "../../../../lib/seminarTimingService";
import { holidayService } from "../../../../lib/holidayService";
import { fineService } from "../../../../lib/fineService";
import { emailService } from "../../../../lib/emailService";

interface BookingWithStudent {
  id: string;
  student_id: string;
  booking_date: string;
  created_at: string;
  unified_students: {
    id: string;
    register_number: string;
    name: string;
    email: string;
    class_year: string;
  };
}

// Helper function to create fines for non-booked students
async function createFinesForNonBookedStudents(seminarDate: string) {
  console.log(
    "Creating ₹10 fines for non-booked students for date:",
    seminarDate
  );

  let fineResult = null;
  try {
    // First try the fineService
    fineResult = await fineService.createFinesForNonBookedStudents(seminarDate);
    console.log(
      "CRON Fine creation result:",
      JSON.stringify(fineResult, null, 2)
    );

    if (!fineResult.success) {
      console.error(
        "CRON Fine creation failed:",
        fineResult.message,
        fineResult.errors
      );

      // If fineService fails, try direct creation
      console.log("CRON Attempting direct fine creation...");

      // Get all II-IT and III-IT students
      const { data: allStudents } = await supabaseAdmin
        .from("unified_students")
        .select("id, register_number, name, class_year")
        .in("class_year", ["II-IT", "III-IT"]);

      // Get students who booked for this date
      const { data: bookedStudents } = await supabaseAdmin
        .from("unified_seminar_bookings")
        .select("student_id")
        .eq("booking_date", seminarDate);

      // Get students who are selected for seminars
      const { data: selectedStudents } = await supabaseAdmin
        .from("unified_seminar_selections")
        .select("student_id");

      const bookedIds = new Set(
        (bookedStudents || []).map((b: any) => b.student_id)
      );
      const selectedIds = new Set(
        (selectedStudents || []).map((s: any) => s.student_id)
      );

      // Find students eligible for fines
      const eligibleStudents = (allStudents || []).filter((student: any) => {
        return !bookedIds.has(student.id) && !selectedIds.has(student.id);
      });

      console.log(
        `CRON Direct: Found ${eligibleStudents.length} students eligible for fines`
      );

      // Create fines directly
      let directFinesCreated = 0;
      for (const student of eligibleStudents) {
        try {
          const { error } = await (supabaseAdmin as any)
            .from("unified_student_fines")
            .insert({
              student_id: (student as any).id,
              fine_type: "seminar_no_booking",
              reference_date: seminarDate,
              base_amount: 10.0,
              daily_increment: 0.0,
              days_overdue: 1,
              payment_status: "pending",
            });

          if (!error) {
            directFinesCreated++;
            console.log(
              `CRON Direct: Created fine for ${
                (student as any).register_number
              }`
            );
          } else {
            console.error(
              `CRON Direct: Failed to create fine for ${
                (student as any).register_number
              }:`,
              error
            );
          }
        } catch (err) {
          console.error(
            `CRON Direct: Error creating fine for ${
              (student as any).register_number
            }:`,
            err
          );
        }
      }

      fineResult = {
        success: directFinesCreated > 0,
        message: `Direct creation: ${directFinesCreated} fines created`,
        finesCreated: directFinesCreated,
        errors: [],
      };
    } else {
      console.log(
        `CRON Successfully created ${fineResult.finesCreated} fines for ${seminarDate}`
      );
    }
  } catch (fineError) {
    console.error(
      "CRON Error creating fines for non-booked students:",
      fineError
    );
    fineResult = {
      success: false,
      message: "Error creating fines",
      finesCreated: 0,
      errors: [
        fineError instanceof Error ? fineError.message : "Unknown error",
      ],
    };
  }

  return fineResult;
}

export async function GET() {
  try {
    console.log("Direct cron selection started at:", new Date().toISOString());

    // Get next seminar date with holiday awareness
    let seminarDate = seminarTimingService.getNextSeminarDate();

    // Check if the calculated seminar date is a holiday and reschedule if needed
    const rescheduleCheck = await holidayService.checkAndRescheduleSeminar(
      seminarDate
    );

    if (rescheduleCheck.needsReschedule) {
      console.log(
        `Direct cron - Holiday detected: ${rescheduleCheck.holidayName}`
      );
      console.log(
        `Direct cron - Seminar rescheduled from ${seminarDate} to ${rescheduleCheck.newDate}`
      );

      seminarDate = rescheduleCheck.newDate!;

      // If there were existing selections that got rescheduled, return the reschedule info
      if (rescheduleCheck.result) {
        return NextResponse.json(
          {
            success: true,
            message:
              "Direct cron: Seminar automatically rescheduled due to holiday",
            reschedule: rescheduleCheck.result,
            holidayReschedule: true,
            originalDate: rescheduleCheck.result.originalDate,
            newDate: rescheduleCheck.result.newDate,
            holidayName: rescheduleCheck.result.holidayName,
            affectedStudents: rescheduleCheck.result.affectedStudentsCount,
            source: "direct-cron-holiday-reschedule",
          },
          { status: 200 }
        );
      }
    }

    const dayName = new Date(seminarDate + "T12:00:00").toLocaleDateString(
      "en-US",
      { weekday: "long" }
    );

    console.log(
      "Processing selection for date:",
      seminarDate,
      "(" + dayName + ")"
    );

    // Sundays are automatically skipped - no seminars on Sunday
    const seminarDay = new Date(seminarDate + "T12:00:00").getDay();
    if (seminarDay === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No seminar scheduled on Sunday - skipped automatically",
          date: seminarDate,
          next_seminar_date: seminarTimingService.getNextSeminarDate(),
          source: "direct-cron-sunday-skip",
        },
        { status: 200 }
      );
    }

    // Check if selections already exist for tomorrow (should be exactly 2 selections max, one per class)
    const { data: existingSelections, error: selectionCheckError } =
      await supabaseAdmin
        .from("unified_seminar_selections")
        .select(
          `
        *,
        unified_students(class_year)
      `
        )
        .eq("seminar_date", seminarDate);

    if (selectionCheckError) {
      console.error("Error checking existing selections:", selectionCheckError);
      return NextResponse.json(
        {
          error: "Failed to check existing selections",
          details: selectionCheckError.message,
        },
        { status: 500 }
      );
    }

    // Check if we already have one selection from each class (maximum 2 total, one per class)
    const existingClasses = new Set();
    if (existingSelections && existingSelections.length > 0) {
      existingSelections.forEach((selection: any) => {
        if (selection.unified_students?.class_year) {
          existingClasses.add(selection.unified_students.class_year);
        }
      });
    }

    const hasIIIT = existingClasses.has("II-IT");
    const hasIIIIT = existingClasses.has("III-IT");

    // If we already have one selection from each class, still create fines but skip selection
    if (hasIIIT && hasIIIIT) {
      console.log("Direct cron: Already have one selection from each class");

      // Create fines for students who didn't book for this seminar
      const fineResult = await createFinesForNonBookedStudents(seminarDate);

      return NextResponse.json(
        {
          message:
            "Selections already complete - one student from each class already selected",
          selections: existingSelections,
          fines: fineResult
            ? {
                success: fineResult.success,
                message: fineResult.message,
                finesCreated: fineResult.finesCreated,
                errors: fineResult.errors,
              }
            : null,
          source: "direct-cron-validation",
        },
        { status: 200 }
      );
    }

    // Get all bookings for tomorrow with student details
    const { data: bookings, error: bookingsError } = (await supabaseAdmin
      .from("unified_seminar_bookings")
      .select(
        `
        *,
        unified_students(*)
      `
      )
      .eq("booking_date", seminarDate)) as {
      data: BookingWithStudent[] | null;
      error: any;
    };

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch bookings", details: bookingsError.message },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for date:", seminarDate);
      return NextResponse.json(
        { message: "No bookings found for selection", date: seminarDate },
        { status: 200 }
      );
    }

    console.log(`Found ${bookings.length} bookings for selection`);

    // Get today's previous selections to avoid duplicate selections on the same day
    // Only consider selections made today for today's seminar date
    const today = new Date().toISOString().split("T")[0];

    const { data: previousSelections } = await supabaseAdmin
      .from("unified_seminar_selections")
      .select("student_id")
      .eq("seminar_date", seminarDate); // Only get selections for the same seminar date

    const previouslySelectedStudentIds = new Set(
      (previousSelections as any[])?.map((selection) => selection.student_id) ||
        []
    );

    console.log(
      `Found ${previouslySelectedStudentIds.size} students already selected for ${seminarDate} to exclude`
    );

    // Filter out previously selected students
    const eligibleBookings = bookings.filter(
      (booking) => !previouslySelectedStudentIds.has(booking.student_id)
    );

    if (eligibleBookings.length === 0) {
      return NextResponse.json(
        {
          message:
            "No eligible students available (all have been selected for this date)",
          date: seminarDate,
          total_bookings: bookings.length,
          already_selected_count: previouslySelectedStudentIds.size,
          selection_basis: "same-day bookings only",
        },
        { status: 200 }
      );
    }

    // Separate eligible bookings by class
    const iiItBookings = eligibleBookings.filter(
      (booking) => booking.unified_students.class_year === "II-IT"
    );
    const iiiItBookings = eligibleBookings.filter(
      (booking) => booking.unified_students.class_year === "III-IT"
    );

    console.log(
      `Direct cron - Eligible II-IT bookings: ${iiItBookings.length}, Eligible III-IT bookings: ${iiiItBookings.length}`
    );

    const selectedStudents: Array<{
      booking: BookingWithStudent;
      student: BookingWithStudent["unified_students"];
    }> = [];

    // Select one student from II-IT class if available AND not already selected
    if (iiItBookings.length > 0 && !hasIIIT) {
      const randomIndex = Math.floor(Math.random() * iiItBookings.length);
      const selectedBooking = iiItBookings[randomIndex];
      selectedStudents.push({
        booking: selectedBooking,
        student: selectedBooking.unified_students,
      });
      console.log(
        "Direct cron - Selected II-IT student:",
        selectedBooking.unified_students.register_number
      );
    } else if (hasIIIT) {
      console.log(
        "Direct cron - II-IT class already has a selection, skipping"
      );
    } else {
      console.log("Direct cron - No eligible II-IT students available");
    }

    // Select one student from III-IT class if available AND not already selected
    if (iiiItBookings.length > 0 && !hasIIIIT) {
      const randomIndex = Math.floor(Math.random() * iiiItBookings.length);
      const selectedBooking = iiiItBookings[randomIndex];
      selectedStudents.push({
        booking: selectedBooking,
        student: selectedBooking.unified_students,
      });
      console.log(
        "Direct cron - Selected III-IT student:",
        selectedBooking.unified_students.register_number
      );
    } else if (hasIIIIT) {
      console.log(
        "Direct cron - III-IT class already has a selection, skipping"
      );
    } else {
      console.log("Direct cron - No eligible III-IT students available");
    }

    if (selectedStudents.length === 0) {
      return NextResponse.json(
        {
          message: "No students available for selection from either class",
          date: seminarDate,
        },
        { status: 200 }
      );
    }

    // Final check before creating selections to prevent race conditions
    const { data: finalCheck } = await supabaseAdmin
      .from("unified_seminar_selections")
      .select("id, unified_students(class_year)")
      .eq("seminar_date", seminarDate);

    if (finalCheck && finalCheck.length >= 2) {
      console.log(
        "Direct cron - Race condition detected: selections were created by another process"
      );
      return NextResponse.json(
        {
          message: "Selections were already created by another process",
          date: seminarDate,
          source: "direct-cron-race-condition-check",
        },
        { status: 200 }
      );
    }

    // Check for class conflicts in final check
    const finalExistingClasses = new Set(
      (finalCheck || [])
        .map((selection: any) => selection.unified_students?.class_year)
        .filter(Boolean)
    );

    // Filter out students from classes that now have selections
    const finalSelectedStudents = selectedStudents.filter(
      (item) => !finalExistingClasses.has(item.student.class_year)
    );

    if (finalSelectedStudents.length === 0) {
      console.log(
        "Direct cron - All selected classes already have selections after final check"
      );
      return NextResponse.json(
        {
          message: "All selected classes already have selections",
          date: seminarDate,
          source: "direct-cron-final-check",
        },
        { status: 200 }
      );
    }

    // Create selection records
    const selectionResults: any[] = [];
    for (const { booking: selectedBooking } of finalSelectedStudents) {
      const { data: selection, error: selectionError } = await (
        supabaseAdmin as any
      )
        .from("unified_seminar_selections")
        .insert([
          {
            student_id: selectedBooking.student_id,
            seminar_date: seminarDate,
            selected_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (selectionError) {
        console.error("Error creating selection:", selectionError);
        return NextResponse.json(
          {
            error: "Failed to create selection",
            details: selectionError.message,
          },
          { status: 500 }
        );
      }

      selectionResults.push(selection);
    }

    // Log successful selections
    for (const { student: selectedStudent } of finalSelectedStudents) {
      console.log(
        "Successfully selected student:",
        selectedStudent.register_number,
        "for seminar date:",
        seminarDate
      );
    }

    // Format the seminar date for logging
    const formattedDate = new Date(
      seminarDate + "T12:00:00"
    ).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Log successful selections with formatted date and send emails
    const emailResults: Array<{
      student: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const { student: selectedStudent } of finalSelectedStudents) {
      console.log(
        "Successfully selected student:",
        selectedStudent.register_number,
        "for",
        formattedDate
      );

      // Send email notification to selected student
      if (selectedStudent.email) {
        try {
          console.log(`Sending selection email to ${selectedStudent.email}...`);
          const emailResult = await emailService.sendSeminarSelectionEmail(
            selectedStudent.email,
            selectedStudent.name || selectedStudent.register_number,
            selectedStudent.register_number,
            seminarDate,
            selectedStudent.class_year
          );

          emailResults.push({
            student: selectedStudent.register_number,
            success: emailResult.success,
            error: emailResult.error,
          });

          if (emailResult.success) {
            console.log(
              `✅ Email sent successfully to ${selectedStudent.register_number}`
            );
          } else {
            console.error(
              `❌ Email failed for ${selectedStudent.register_number}:`,
              emailResult.error
            );
          }
        } catch (emailError) {
          console.error(
            `❌ Email error for ${selectedStudent.register_number}:`,
            emailError
          );
          emailResults.push({
            student: selectedStudent.register_number,
            success: false,
            error:
              emailError instanceof Error
                ? emailError.message
                : "Unknown email error",
          });
        }
      } else {
        console.warn(
          `⚠️ No email address for student ${selectedStudent.register_number}`
        );
        emailResults.push({
          student: selectedStudent.register_number,
          success: false,
          error: "No email address available",
        });
      }
    }

    // Create fines for students who didn't book for this seminar (₹10 per student)
    const fineResult = await createFinesForNonBookedStudents(seminarDate);

    console.log("Direct cron selection completed successfully");

    return NextResponse.json(
      {
        success: true,
        message: `Direct cron selection: ${finalSelectedStudents.length} student(s) selected successfully`,
        selections: finalSelectedStudents.map((item, index) => ({
          id: (selectionResults[index] as any)?.id,
          student: {
            register_number: item.student.register_number,
            name: item.student.name,
            email: item.student.email,
            class_year: item.student.class_year,
          },
          seminar_date: seminarDate,
          selected_at: (selectionResults[index] as any)?.selected_at,
        })),
        emails: {
          sent: emailResults.filter((r) => r.success).length,
          failed: emailResults.filter((r) => !r.success).length,
          results: emailResults,
        },
        fines: fineResult
          ? {
              success: fineResult.success,
              message: fineResult.message,
              finesCreated: fineResult.finesCreated,
              errors: fineResult.errors,
            }
          : null,
        summary: {
          total_bookings: bookings.length,
          eligible_bookings: eligibleBookings.length,
          already_selected_excluded: previouslySelectedStudentIds.size,
          selection_basis: "same-day bookings only",
          booking_date: today,
          seminar_date: seminarDate,
          ii_it_bookings: iiItBookings.length,
          iii_it_bookings: iiiItBookings.length,
          selected_count: finalSelectedStudents.length,
          emails_sent: emailResults.filter((r) => r.success).length,
          emails_failed: emailResults.filter((r) => !r.success).length,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Direct cron selection error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST method
export async function POST() {
  return GET();
}
