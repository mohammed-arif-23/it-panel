import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Document, Page, Text, View, StyleSheet, Image, pdf, Svg, Path, Font } from "@react-pdf/renderer"

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

// Normalize/sanitize text for PDF (remove smart quotes and odd symbols)
const sanitizeText = (input: any): string => {
  const s = String(input ?? "")
  // Replace common smart punctuation with ASCII equivalents
  return s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // double quotes
    .replace(/[\u2013\u2014\u2212]/g, "-") // dashes
    .replace(/[\u2026]/g, "...") // ellipsis
    .replace(/[\u00AA\u00BA]/g, "") // ordinals
    .replace(/[\u02DA\u00B0]/g, "°") // degree unify
    .replace(/[\u00C2\u00A0]/g, " ") // non-breaking space variants
    .replace(/[<>]/g, "") // remove angle brackets
    .replace(/[^\x00-\x7F°]/g, "") // strip other non-ascii except degree symbol
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

    // Helper: best-effort fetch of timetable SUBJECT_DETAILS to build abbrev map
    const getAbbrevMap = async (): Promise<Record<string,string>> => {
      try {
        const classYear = String(student.class_year || '').trim()
        if (!classYear) return {}
        const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const url = `${base.replace(/\/$/, '')}/api/timetable?` + new URLSearchParams({ class_year: classYear }).toString()
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return {}
        const json = await res.json()
        const details = json?.data?.json?.SUBJECT_DETAILS || {}
        const map: Record<string,string> = {}
        for (const code of Object.keys(details)) {
          const full = String(details[code]?.Subject || '').toLowerCase().trim()
          if (full) map[full] = String(code)
        }
        return map
      } catch {
        return {}
      }
    }

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

    // Abbreviation map from timetable (full name -> abbrev)
    const abbrevMap = await getAbbrevMap()

    const toInitials = (name: string) =>
      name
        .split(/\s+/)
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()

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

      const fullName = sanitizeText(s.name)
      const fullLower = fullName.toLowerCase().trim()
      const abbrev = sanitizeText(abbrevMap[fullLower] || s.code || toInitials(fullName))

      return {
        subject: fullName,
        subjectAbbrev: abbrev,
        iat: mark?.iat ?? null,
        model: mark?.model ?? null,
        assignment: assignmentStatus,
        fees: feesPaid ? "Paid" : "Not Paid",
        signature: signatureAllowed ? "●" : "",
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
        notes: "Generated via API and uploaded to Supabase Storage",
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
    position: "relative",
    display: "flex",
    flexDirection: "column",
    padding: 18,
    fontSize: 8,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  // Thin grayscale frame for print
  frameOuter: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderColor: "#6B7280",
    borderWidth: 1,
    borderRadius: 6,
  },
  container: { width: "100%", zIndex: 1 },
  header: { alignItems: "center", marginBottom: 6, paddingTop: 0 },
  logo: { width: 400, height: 160, objectFit: "contain", marginBottom: 2 },
  dept: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // Student card (compact)
  studentCard: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  infoGrid: { flexDirection: "row", alignItems: "stretch", width: "100%" },
  infoCol: { flex: 1 },
  dividerV: { width: 1, backgroundColor: "#E5E7EB", marginHorizontal: 8 },
  field: { marginBottom: 6, flexDirection: "row", alignItems: "center" },
  label: { fontSize: 9, fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: 0.5, marginRight: 6 },
  value: { fontSize: 10, fontWeight: 600, color: "#111827" },

  // Table (professional, elegant)
  tableWrap: {
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#374151",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  table: { 
    display: "flex", 
    width: "100%",
    flexDirection: "column"
  },
  thead: { 
    flexDirection: "row", 
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 2,
    borderBottomColor: "#E2E8F0",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5
  },
  th: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRightWidth: 1.5,
    borderRightColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  thText: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1F2937",
    textTransform: "uppercase",
    textAlign: "center",
  },
  thSubject: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRightWidth: 1.5,
    borderRightColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  thLast: {
    borderRightWidth: 0,
  },
  tbody: {
    flexDirection: "column"
  },
  tr: { 
    flexDirection: "row", 
    minHeight: 40,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E5E7EB"
  },
  trEven: { 
    flexDirection: "row", 
    minHeight: 40,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FAFBFC" 
  },
  trLast: {
    flexDirection: "row", 
    minHeight: 40,
    borderBottomWidth: 0,
    borderBottomColor: "#F1F5F9"
  },
  td: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1.5,
    borderRightColor: "#E5E7EB",
  },
  tdSubject: {
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1.5,
    borderRightColor: "#E5E7EB",
  },
  tdLast: {
    borderRightWidth: 0,
  },
  subjectCell: {
    fontSize: 10,
    fontWeight: 500,
    color: "#1F2937",
    textAlign: "left",
  },
  cellText: {
    fontSize: 10,
    fontWeight: 400,
    color: "#374151",
    textAlign: "center",
  },
  markAB: {
    color: "#EF4444",
    fontWeight: 600,
  },
  signCell: {
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Column widths
  colSubject: { flex: 3 },
  colIat: { flex: 1.2 },
  colModel: { flex: 1.2 },
  colAssignment: { flex: 1.8 },
  colFines: { flex: 1.2 },
  colSignature: { flex: 1.8 },

  // Badges (grayscale)
  badge: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: 700,
    alignSelf: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#9CA3AF",
    backgroundColor: "#FFFFFF",
  },

  // Special rows (grayscale accent)
  specialTr: { flexDirection: "row", backgroundColor: "#F9FAFB", minHeight: 28, borderLeftWidth: 3, borderLeftColor: "#9CA3AF" },

  // Footer
  footer: { display: "flex", width: "100%", flexDirection: "row", justifyContent: "space-between", marginTop: 28, paddingTop: 8, alignItems: "flex-end" },
  sigBlock: { alignItems: "center", width: 180 },
  sigLine: { borderTopWidth: 1, borderColor: "#6B7280", borderStyle: "dashed", width: 140 },
  sigLabel: { marginTop: 4, fontWeight: 600, textAlign: "center", color: "#111827", fontSize: 10 },
  sigDate: { marginTop: 2, fontSize: 8, color: "#6B7280" },
})

function CertificatePDF({
  student,
  rows,
}: {
  student: any
  rows: Array<{
    subject: string
    subjectAbbrev?: string
    iat: number | null
    model: number | null
    assignment: string
    fees: string
    signature: string
  }>
}) {
  const headerLogo = "https://avsec-it.vercel.app/logo.png"
  const now = new Date()
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const dateText = `${String(now.getDate()).padStart(2, "0")} ${months[now.getMonth()]} ${now.getFullYear()}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Frame */}
        <View style={styles.frameOuter} />

        {/* Header */}
        <View style={styles.header}>
          <Image src={headerLogo} style={styles.logo} />
          <Text style={styles.dept}>Department of Information Technology</Text>
          <Text style={styles.title}>No Due Certificate</Text>
        </View>

        <View style={styles.container}>
          {/* Student Info Card */}
          <View style={styles.studentCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <View style={styles.field}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{String(student.name)}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Register Number:</Text>
                  <Text style={styles.value}>{String(student.register_number)}</Text>
                </View>
              </View>
              <View style={styles.dividerV} />
              <View style={styles.infoCol}>
                <View style={styles.field}>
                  <Text style={styles.label}>Year / Semester:</Text>
                  <Text style={styles.value}>
                    {String(student.year)} / {String(student.semester)}
                  </Text>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Date of Issue:</Text>
                  <Text style={styles.value}>{dateText}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Table */}
          <View style={styles.tableWrap}>
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.thead}>
                <View style={[styles.th, styles.thSubject, styles.colSubject]}>
                  <Text style={styles.thText}>SUBJECT</Text>
                </View>
                <View style={[styles.th, styles.colIat]}>
                  <Text style={styles.thText}>IAT</Text>
                </View>
                <View style={[styles.th, styles.colModel]}>
                  <Text style={styles.thText}>MODEL</Text>
                </View>
                <View style={[styles.th, styles.colAssignment]}>
                  <Text style={styles.thText}>ASSIGNMENT</Text>
                </View>
                <View style={[styles.th, styles.colFines]}>
                  <Text style={styles.thText}>FINES</Text>
                </View>
                <View style={[styles.th, styles.thLast, styles.colSignature]}>
                  <Text style={styles.thText}>SIGNATURE</Text>
                </View>
              </View>

              <View style={styles.tbody}>
                {rows.map((r, idx) => {
                  const isLast = idx === rows.length - 1
                  const rowStyle = [styles.tr]
                  if (idx % 2 === 1) rowStyle.push(styles.trEven)
                  if (isLast) rowStyle.push(styles.trLast)
                  
                  return (
                    <View style={rowStyle} key={idx}>
                      <View style={[styles.td, styles.tdSubject, styles.colSubject]}>
                        <Text style={styles.subjectCell}>
                          {r.subjectAbbrev ? String(r.subjectAbbrev) : r.subject}
                        </Text>
                      </View>
                      <View style={[styles.td, styles.colIat]}>
                        {r.iat === 0 ? (
                          <Text style={[styles.cellText, styles.markAB]}>AB</Text>
                        ) : (
                          <Text style={styles.cellText}>
                            {r.iat == null ? "-" : String(r.iat)}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.td, styles.colModel]}>
                        {r.model === 0 ? (
                          <Text style={[styles.cellText, styles.markAB]}>AB</Text>
                        ) : (
                          <Text style={styles.cellText}>
                            {r.model == null ? "-" : String(r.model)}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.td, styles.colAssignment]}>
                        {r.assignment === "Submitted" || r.assignment === "No Assignments" ? (
                          <Svg width="14" height="14" viewBox="0 0 24 24">
                            <Path
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                              fill="#10B981"
                            />
                          </Svg>
                        ) : null}
                      </View>
                      <View style={[styles.td, styles.colFines]}>
                        {r.fees === "Paid" ? (
                          <Svg width="14" height="14" viewBox="0 0 24 24">
                            <Path
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                              fill="#10B981"
                            />
                          </Svg>
                        ) : null}
                      </View>
                      <View style={[styles.td, styles.signCell, styles.tdLast, styles.colSignature]}>
                        <Text>{" "}</Text>
                      </View>
                    </View>
                  )
                })}

                {/* Office */}
                <View style={[styles.tr, styles.trEven]}>
                  <View style={[styles.td, styles.tdSubject, styles.colSubject]}>
                    <Text style={styles.subjectCell}>Office</Text>
                  </View>
                  <View style={[styles.td, styles.colIat]}>
                    <Text style={styles.cellText}>-</Text>
                  </View>
                  <View style={[styles.td, styles.colModel]}>
                    <Text style={styles.cellText}>-</Text>
                  </View>
                  <View style={[styles.td, styles.colAssignment]}>
                    <Text style={styles.cellText}>-</Text>
                  </View>
                  <View style={[styles.td, styles.colFines]}>
                    {Number(student.total_fine_amount || 0) === 0 ? (
                      <Svg width="14" height="14" viewBox="0 0 24 24">
                        <Path
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                          fill="#10B981"
                        />
                      </Svg>
                    ) : null}
                  </View>
                  <View style={[styles.td, styles.signCell, styles.tdLast, styles.colSignature]}>
                    <Text>{" "}</Text>
                  </View>
                </View>

                {/* Library */}
                <View style={[styles.tr, styles.trLast]}>
                  <View style={[styles.td, styles.tdSubject, styles.colSubject]}>
                    <Text style={styles.subjectCell}>Library</Text>
                  </View>
                  <View style={[styles.td, styles.colIat]}>
                    <Text style={styles.cellText}>-</Text>
                  </View>
                  <View style={[styles.td, styles.colModel]}>
                    <Text style={styles.cellText}>-</Text>
                  </View>
                  <View style={[styles.td, styles.colAssignment]}>
                    <Text style={styles.cellText}>-</Text>
                  </View>
                  <View style={[styles.td, styles.colFines]}>
                    {Number(student.total_fine_amount || 0) === 0 ? (
                      <Svg width="14" height="14" viewBox="0 0 24 24">
                        <Path
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                          fill="#10B981"
                        />
                      </Svg>
                    ) : null}
                  </View>
                  <View style={[styles.td, styles.signCell, styles.tdLast, styles.colSignature]}>
                    <Text>{" "}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer signatures */}
        <View style={styles.footer}>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Class Coordinator</Text>
          </View>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
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
    subjectAbbrev?: string
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
