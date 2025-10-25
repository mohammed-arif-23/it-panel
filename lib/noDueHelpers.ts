/**
 * No Due Certificate Business Logic Helpers
 * Contains functions for clearance calculation and validation
 */

interface MarksRecord {
  subject: string
  iat: number | null
  model: number | null
  assignmentsubmitted: boolean
  signed: boolean
  department_fine: number
}

interface AssignmentData {
  [subCode: string]: {
    total: number
    submitted: number
  }
}

interface ClearanceStatus {
  subject: string
  marks_cleared: boolean
  assignment_cleared: boolean
  fee_cleared: boolean
  overall_cleared: boolean
}

/**
 * Check if marks are cleared for a subject
 * Requirements: IAT >= 50 AND Model >= 50
 */
export function isMarksCleared(iat: number | null, model: number | null): boolean {
  if (iat === null || model === null) {
    return false
  }
  return iat >= 50 && model >= 50
}

/**
 * Check if assignments are cleared for a subject
 * Requirements: All assignments must be submitted
 */
export function isAssignmentsCleared(
  subjectCode: string,
  assignmentData: AssignmentData
): boolean {
  const assignments = assignmentData[subjectCode]
  
  // If no assignments exist for this subject, consider it cleared
  if (!assignments || assignments.total === 0) {
    return true
  }
  
  // All assignments must be submitted
  return assignments.submitted === assignments.total
}

/**
 * Check if fees are cleared
 * Requirements: total_fine_amount must equal 0
 */
export function isFeeCleared(totalFineAmount: number | null): boolean {
  return totalFineAmount === 0
}

/**
 * Check if a student can generate their No Due certificate
 * Requirements: All marks cleared, all assignments submitted, and fees paid
 */
export function canGenerateCertificate(
  marks: MarksRecord[],
  subjects: Array<{ code: string; name: string }>,
  assignmentData: AssignmentData,
  totalFineAmount: number | null
): boolean {
  // Check if fees are cleared
  if (!isFeeCleared(totalFineAmount)) {
    return false
  }
  
  // Check if all subjects have cleared marks and assignments
  for (const subject of subjects) {
    // Find mark for this subject by name
    const mark = marks.find(m => normalizeCode(m.subject) === normalizeCode(subject.name))
    
    // Check if marks are cleared
    const marksClear = mark ? isMarksCleared(mark.iat, mark.model) : false
    if (!marksClear) {
      return false
    }
    
    // Check if assignments are cleared (using subject code for assignment lookup)
    const assignmentsClear = isAssignmentsCleared(subject.code, assignmentData)
    if (!assignmentsClear) {
      return false
    }
  }
  
  return true
}

/**
 * Calculate clearance status for a subject
 */
export function calculateClearanceStatus(
  subject: string,
  mark: MarksRecord | undefined,
  assignmentData: AssignmentData,
  totalFineAmount: number | null
): ClearanceStatus {
  const marks_cleared = mark ? isMarksCleared(mark.iat, mark.model) : false
  const assignment_cleared = isAssignmentsCleared(subject, assignmentData)
  const fee_cleared = isFeeCleared(totalFineAmount)
  
  return {
    subject,
    marks_cleared,
    assignment_cleared,
    fee_cleared,
    overall_cleared: marks_cleared && assignment_cleared && fee_cleared
  }
}

/**
 * Normalize subject code for comparison
 * Removes spaces and converts to uppercase for consistent matching
 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Get assignment status label
 */
export function getAssignmentStatusLabel(
  subjectCode: string,
  assignmentData: AssignmentData
): 'Submitted' | 'Not Submitted' | 'No Assignments' {
  const assignments = assignmentData[subjectCode]
  
  if (!assignments || assignments.total === 0) {
    return 'No Assignments'
  }
  
  if (assignments.submitted === assignments.total) {
    return 'Submitted'
  }
  
  return 'Not Submitted'
}

/**
 * Get fee status label
 */
export function getFeeStatusLabel(totalFineAmount: number | null): 'Paid' | 'Not Paid' {
  return isFeeCleared(totalFineAmount) ? 'Paid' : 'Not Paid'
}

/**
 * Convert year to Roman numerals
 */
export function toRomanNumeral(num: number): string {
  const romanNumerals: { [key: number]: string } = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV'
  }
  return romanNumerals[num] || num.toString()
}

/**
 * Create marks snapshot for history
 */
export function createMarksSnapshot(
  marks: MarksRecord[],
  subjects: Array<{ code: string; name: string }>,
  assignmentData: AssignmentData,
  totalFineAmount: number | null
) {
  const subjectsSnapshot = subjects.map(subject => {
    const mark = marks.find(m => normalizeCode(m.subject) === normalizeCode(subject.name))
    const assignmentCleared = isAssignmentsCleared(subject.code, assignmentData)
    const marksCleared = mark ? isMarksCleared(mark.iat, mark.model) : false
    
    return {
      code: subject.code,
      name: subject.name,
      iat: mark?.iat ?? null,
      model: mark?.model ?? null,
      assignment_cleared: assignmentCleared,
      marks_cleared: marksCleared
    }
  })
  
  return {
    subjects: subjectsSnapshot,
    fee_status: getFeeStatusLabel(totalFineAmount),
    total_fine_amount: totalFineAmount ?? 0,
    all_requirements_met: canGenerateCertificate(marks, subjects, assignmentData, totalFineAmount)
  }
}
