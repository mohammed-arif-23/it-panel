import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import React from "react"
import { Document, Page, Text, View, StyleSheet, Image, pdf, Font } from "@react-pdf/renderer"

export const runtime = "nodejs"

// Global hyphenation: ensure long words/IDs wrap instead of overflowing
Font.registerHyphenationCallback((word: string) => {
  return word.length > 10 ? word.split("") : [word]
})

export async function POST(request: NextRequest) {
  try {
    console.log("[PDF Generation] Starting PDF generation...")
    const { studentId, fileName } = await request.json()
    console.log("[PDF Generation] Student ID:", studentId)

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    console.log("[PDF Generation] Creating Supabase client...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[PDF Generation] Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Use service role key for admin operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch student data
    console.log("[PDF Generation] Fetching student data...")
    const { data: student, error: studentError } = await supabase
      .from("unified_students")
      .select("*")
      .eq("id", studentId)
      .single()

    if (studentError) {
      console.error("[PDF Generation] Student fetch error:", studentError)
      return NextResponse.json(
        { error: "Student not found", details: studentError.message },
        { status: 404 }
      )
    }

    if (!student) {
      console.error("[PDF Generation] No student data returned")
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    console.log("[PDF Generation] Student found:", student.name)

    // Fetch marks data
    console.log("[PDF Generation] Fetching marks data...")
    const { data: marks, error: marksError } = await supabase
      .from("unified_marks")
      .select("*")
      .eq("student_id", studentId)

    if (marksError) {
      console.error("[PDF Generation] Marks fetch error:", marksError)
      return NextResponse.json(
        { error: "Error fetching marks", details: marksError.message },
        { status: 500 }
      )
    }

    console.log("[PDF Generation] Marks fetched:", marks?.length || 0, "records")

    // Fetch subjects relevant to the student
    const { data: subjects, error: subjectsError } = await supabase
      .from("subjects")
      .select("code, name, department, semester, course_type")
      .eq("semester", student.semester)
      .eq("department", "IT")
      .in("course_type", ["THEORY", "ELECTIVE"])

    if (subjectsError) {
      return NextResponse.json({ error: "Error fetching subjects" }, { status: 500 })
    }

    const normalize = (s: string | null) => String(s ?? "").trim().toUpperCase()
    const subjectCodes = new Set((subjects || []).map((s) => normalize(s.code as any)))

    // Count all assignments by sub_code for the student's class_year and relevant subjects
    const { data: allAssignments, error: assignmentsError } = await supabase
      .from("assignments")
      .select("id, sub_code, class_year")

    if (assignmentsError) {
      return NextResponse.json({ error: "Error fetching assignments" }, { status: 500 })
    }

    const totalByCode = new Map<string, number>()
    for (const a of allAssignments || []) {
      if (student.class_year && a.class_year !== student.class_year) continue
      const code = normalize(a.sub_code as any)
      if (!code || !subjectCodes.has(code)) continue
      totalByCode.set(code, (totalByCode.get(code) || 0) + 1)
    }

    // Count submitted per code for this student
    const { data: submissions, error: submissionsError } = await supabase
      .from("assignment_submissions")
      .select(
        "id, assignment_id, student_id, status, assignments:assignments!assignment_submissions_assignment_id_fkey(sub_code)"
      )
      .eq("student_id", studentId)

    if (submissionsError) {
      return NextResponse.json({ error: "Error fetching submissions" }, { status: 500 })
    }

    const submittedStatuses = new Set(["submitted", "graded", "approved", "accepted"])
    const submittedByCode = new Map<string, number>()
    for (const sub of submissions || []) {
      const code = normalize((sub as any).assignments?.sub_code)
      if (!code || !subjectCodes.has(code)) continue
      const isSubmitted = submittedStatuses.has(String((sub as any).status || "").toLowerCase())
      if (!isSubmitted) continue
      submittedByCode.set(code, (submittedByCode.get(code) || 0) + 1)
    }

    // Evaluate per subject code: cleared if total = 0 or submittedCount = total
    const allCleared = Array.from(subjectCodes).every((code) => {
      const total = totalByCode.get(code) || 0
      const submitted = submittedByCode.get(code) || 0
      return total === 0 || submitted >= total
    })

    const feesPaid = Number(student.total_fine_amount || 0) === 0

    if (!feesPaid || !allCleared) {
      return NextResponse.json(
        { error: "Student is not eligible for no due certificate" },
        { status: 400 }
      )
    }

    // Check if student already has a generated certificate (get the most recent one)
    const { data: existingRecord, error: existingErr } = await supabase
      .from("unified_nodue_records")
      .select("id, pdf_url, generated_at")
      .eq("student_id", studentId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingErr) {
      console.error("Error checking existing no due record:", existingErr)
    }

    // If certificate already exists, return the existing URL
    if (existingRecord?.pdf_url) {
      console.log("[PDF Generation] Certificate already exists, returning existing URL")
      return NextResponse.json({
        success: true,
        pdf_url: existingRecord.pdf_url,
        generated_at: existingRecord.generated_at,
        message: "Certificate already generated",
      })
    }

    // Build rows for PDF rendering
    const pdfRows = (subjects || []).map((s: any) => {
      const code = normalize(s.code as any)
      const total = totalByCode.get(code) || 0
      const submitted = submittedByCode.get(code) || 0
      const assignmentStatus =
        total === 0 ? "No Assignments" : submitted >= total ? "Submitted" : "Not Submitted"

      const mark = (marks || []).find((m) => m.subject === s.name) as any
      const pass = (v: number | null) => v !== null && v >= 50
      const marksCleared = pass(mark?.iat ?? null) && pass(mark?.model ?? null)
      const feesPaid = Number(student.total_fine_amount || 0) === 0
      const signatureAllowed =
        feesPaid &&
        (assignmentStatus === "Submitted" || assignmentStatus === "No Assignments") &&
        marksCleared

      return {
        subject: s.name,
        iat: mark?.iat ?? null,
        model: mark?.model ?? null,
        assignment: assignmentStatus,
        fees: feesPaid ? "Paid" : "Not Paid",
        signature: signatureAllowed ? "✓" : "",
      }
    })

    // Render PDF
    console.log("[PDF Generation] Rendering PDF with", pdfRows.length, "rows...")
    const filename = `NoDue_${student.register_number}_${Date.now()}.pdf`

    try {
      const ab = await buildPdf(student, pdfRows)
      console.log("[PDF Generation] PDF generated successfully, size:", ab.byteLength, "bytes")

      // Upload to Supabase Storage
      console.log("[PDF Generation] Uploading to Supabase Storage...")
      
      // Convert ArrayBuffer to Uint8Array for Supabase
      const uint8Array = new Uint8Array(ab)
      
      // Upload to Supabase Storage bucket 'nodues'
      const storagePath = `nodue_${student.register_number}_${Date.now()}.pdf`
      
      console.log("[PDF Generation] Uploading to path:", storagePath)
      console.log("[PDF Generation] File size:", uint8Array.length, "bytes")
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("nodues")
        .upload(storagePath, uint8Array, {
          contentType: "application/pdf",
          upsert: true, // Allow overwriting if exists
        })

      if (uploadError) {
        console.error("[PDF Generation] Supabase Storage upload failed:", uploadError)
        console.error("[PDF Generation] Upload error details:", JSON.stringify(uploadError))
        
        // Save to database without PDF URL
        const nowIso = new Date().toISOString()
        await supabase.from("unified_nodue_records").insert({
          student_id: studentId,
          register_number: student.register_number,
          name: student.name,
          status: "cleared",
          generated_at: nowIso,
          notes: `Generated via API (Storage upload failed: ${uploadError.message})`,
        })
        
        // Return error
        return NextResponse.json(
          {
            error: "Failed to upload certificate to storage. Please try again.",
            details: uploadError.message,
          },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("nodues").getPublicUrl(storagePath)
      const pdfUrl = urlData.publicUrl
      console.log("[PDF Generation] Uploaded to Supabase Storage:", pdfUrl)

      // Save to database with PDF URL
      const nowIso = new Date().toISOString()
      const { error: insertError } = await supabase.from("unified_nodue_records").insert({
        student_id: studentId,
        register_number: student.register_number,
        name: student.name,
        status: "cleared",
        generated_at: nowIso,
        pdf_url: pdfUrl,
        notes: "Generated via API and uploaded to Cloudinary",
      })

      if (insertError) {
        console.error("[PDF Generation] Error saving to database:", insertError)
      }

      // Return JSON with PDF URL for mobile/PWA handling
      return NextResponse.json({
        success: true,
        pdf_url: pdfUrl,
        generated_at: nowIso,
        message: "Certificate generated successfully",
      })
    } catch (pdfError) {
      console.error("[PDF Generation] PDF rendering error:", pdfError)
      return NextResponse.json(
        {
          error: "PDF rendering failed",
          details: pdfError instanceof Error ? pdfError.message : String(pdfError),
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[PDF Generation] General error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

const styles = StyleSheet.create({
  page: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
    fontSize: 9,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  container: { padding: 18, backgroundColor: "#FFFFFF", borderRadius: 12 },
  header: { alignItems: "center", marginBottom: 10 },
  logo: { width: 360, height: 120, objectFit: "contain", marginVertical: 2 },
  dept: {
    fontSize: 12,
    marginVertical: 2,
    marginBottom: 10,
    fontWeight: 600,
    color: "#111827",
  },
  title: { fontSize: 14, fontWeight: 700, textDecoration: "underline", marginTop: 2 },
  grid: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    marginHorizontal: 12,
    paddingHorizontal: 12,
  },
  gridItem: { marginBottom: 4, paddingRight: 10, fontSize: 12 },
  label: { fontWeight: 700 },
  value: {},
  tableWrap: { borderWidth: 2, borderColor: "#374151", borderRadius: 12, overflow: "hidden" },
  table: { display: "flex", width: "100%", borderRadius: 12, overflow: "hidden" },
  thead: { flexDirection: "row", backgroundColor: "#F3F4F6" },
  th: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#374151",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 700,
    textAlign: "center",
  },
  tbody: {},
  tr: { flexDirection: "row" },
  trEven: { backgroundColor: "#F9FAFB" },
  td: {
    flex: 1,
    minWidth: 0,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: "#374151",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tdCenter: { textAlign: "center" },
  subjectCell: { fontWeight: 600 },
  thSubject: {
    flex: 2,
    textAlign: "left",
    borderRightWidth: 1,
    borderColor: "#374151",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 700,
  },
  tdSubject: { flex: 2 },
  cellText: { fontSize: 10, lineHeight: 1.4, wordBreak: "break-word" },
  badge: {
    borderRadius: 9999,
    paddingVertical: 2,
    paddingHorizontal: 5,
    fontSize: 8.5,
    fontWeight: 700,
    alignSelf: "center",
  },
  badgeGreen: {
    backgroundColor: "#ECFDF5",
    color: "#065F46",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 3,
  },
  badgeRed: {
    backgroundColor: "#FEF2F2",
    color: "#991B1B",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 3,
  },
  badgeGray: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 3,
  },
  green: { color: "#16A34A" },
  red: { color: "#DC2626" },
  muted: { color: "#6B7280" },
  footer: {
    fontSize: 14,
    display: "flex",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    paddingTop: 16,
    alignItems: "flex-end",
  },
  sigBlock: { alignItems: "center", width: 160 },
  sigLineBar: { borderTopWidth: 2, borderColor: "#111827", width: 160 },
  sigLabel: { marginTop: 6, fontWeight: 600, textAlign: "center" },
})

function CertificatePDF({
  student,
  rows,
}: {
  student: any
  rows: Array<{
    subject: string
    iat: number | null
    model: number | null
    assignment: string
    fees: string
    signature: string
  }>
}) {
  const headerLogo = "https://avsec-it.vercel.app/logo.png"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={headerLogo} style={styles.logo} />
          <Text style={styles.dept}>Department of Information Technology</Text>
          <Text style={styles.title}>NO DUE CERTIFICATE</Text>
        </View>

        <View style={styles.container}>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text>
                <Text style={styles.label}>Name: </Text>
                <Text style={styles.value}>{String(student.name)}</Text>
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text>
                <Text style={styles.label}>Register Number: </Text>
                <Text style={styles.value}>{String(student.register_number)}</Text>
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text>
                <Text style={styles.label}>Year/Sem: </Text>
                <Text style={styles.value}>
                  {String(student.year)}rd / {String(student.semester)}th
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.tableWrap}>
            <View style={styles.table}>
              <View style={styles.thead}>
                <Text style={styles.thSubject}>Subject</Text>
                <Text style={styles.th}>IAT</Text>
                <Text style={styles.th}>Model</Text>
                <Text style={styles.th}>Assignment</Text>
                <Text style={styles.th}>Department Fees</Text>
                <Text style={styles.th}>Signature</Text>
              </View>

              <View style={styles.tbody}>
                {rows.map((r, idx) => {
                  const signatureAllowed = Boolean(r.signature)
                  const rowStyle = idx % 2 === 1 ? [styles.tr, styles.trEven] : [styles.tr]
                  return (
                    <View style={rowStyle} key={idx}>
                      <Text style={[styles.td, styles.tdSubject, styles.subjectCell, styles.cellText]}>
                        {r.subject}
                      </Text>
                      <Text style={[styles.td, styles.tdCenter, styles.cellText]}>
                        {r.iat ?? "-"}
                      </Text>
                      <Text style={[styles.td, styles.tdCenter, styles.cellText]}>
                        {r.model ?? "-"}
                      </Text>
                      <View style={[styles.td, { alignItems: "center" }]}>
                        {r.assignment === "No Assignments" ? (
                          <Text style={[styles.badge, styles.badgeGray]}>No Assignments</Text>
                        ) : r.assignment === "Submitted" ? (
                          <Text style={[styles.badge, styles.badgeGreen]}>Submitted</Text>
                        ) : (
                          <Text style={[styles.badge, styles.badgeRed]}>Not Submitted</Text>
                        )}
                      </View>
                      <View style={[styles.td, { alignItems: "center" }]}>
                        {r.fees === "Paid" ? (
                          <Text style={[styles.badge, styles.badgeGreen]}>Paid</Text>
                        ) : (
                          <Text style={[styles.badge, styles.badgeRed]}>Not Paid</Text>
                        )}
                      </View>
                      <Text style={[styles.td, styles.tdCenter, styles.cellText]}>
                        {signatureAllowed ? "" : "X"}
                      </Text>
                    </View>
                  )
                })}

                {/* Office */}
                <View style={styles.tr}>
                  <Text style={[styles.td, styles.tdSubject, styles.subjectCell, styles.cellText]}>
                    Office
                  </Text>
                  <Text style={[styles.td, styles.tdCenter, styles.cellText]}>-</Text>
                  <Text style={[styles.td, styles.tdCenter, styles.cellText]}>-</Text>
                  <Text style={[styles.td, styles.tdCenter, styles.cellText]}>-</Text>
                  <View style={[styles.td, { alignItems: "center" }]}>
                    {Number(student.total_fine_amount || 0) === 0 ? (
                      <Text style={[styles.badge, styles.badgeGreen]}>Paid</Text>
                    ) : (
                      <Text style={[styles.badge, styles.badgeRed]}>Not Paid</Text>
                    )}
                  </View>
                  <Text style={[styles.td, styles.tdCenter, styles.cellText]}>
                    {Number(student.total_fine_amount || 0) === 0 ? "" : "X"}
                  </Text>
                </View>

                {/* Library */}
                <View style={styles.tr}>
                  <Text style={[styles.td, styles.tdSubject, styles.subjectCell, styles.cellText]}>
                    Library
                  </Text>
                  <Text style={[styles.td, styles.tdCenter, styles.cellText]}>-</Text>
                  <Text style={[styles.td, styles.tdCenter, styles.cellText]}>-</Text>
                  <Text style={[styles.td, styles.tdCenter, styles.cellText]}>-</Text>
                  <View style={[styles.td, { alignItems: "center" }]}>
                    {Number(student.total_fine_amount || 0) === 0 ? (
                      <Text style={[styles.badge, styles.badgeGreen]}>Paid</Text>
                    ) : (
                      <Text style={[styles.badge, styles.badgeRed]}>Not Paid</Text>
                    )}
                  </View>
                  <Text style={[styles.td, styles.tdCenter, styles.cellText]}>
                    {Number(student.total_fine_amount || 0) === 0 ? "" : "X"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>CC</Text>
          </View>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>Head of Department</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

async function buildPdf(
  student: any,
  rows: Array<{
    subject: string
    iat: number | null
    model: number | null
    assignment: string
    fees: string
    signature: string
  }>
): Promise<ArrayBuffer> {
  const doc = <CertificatePDF student={student} rows={rows} />
  const instance = pdf(doc)
  const blob = await instance.toBlob()
  const ab = await blob.arrayBuffer()
  return ab
}
