'use client'

import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar,
  Lock,
  Award,
  ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Assignment {
  id: string
  title: string
  description: string
  class_year: string
  due_date: string
  created_at: string
}

interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string
  file_name: string
  marks: number | null
  submitted_at: string
  status: 'submitted' | 'graded'
}

interface AssignmentWithSubmission extends Assignment {
  submission?: AssignmentSubmission
}

interface AssignmentCardProps {
  assignment: AssignmentWithSubmission
  onClick?: () => void
  formatDate: (dateString: string) => string
  isOverdue: (dueDate: string) => boolean
}

export function AssignmentCard({
  assignment,
  onClick,
  formatDate,
  isOverdue
}: AssignmentCardProps) {
  const hasSubmission = !!assignment.submission
  const isAssignmentOverdue = isOverdue(assignment.due_date)
  const isClickable = !hasSubmission && !isAssignmentOverdue

  const getStatusColor = () => {
    if (hasSubmission) return 'var(--color-success)'
    if (isAssignmentOverdue) return 'var(--color-error)'
    return 'var(--color-warning)'
  }

  const getStatusText = () => {
    if (hasSubmission) return 'Submitted'
    if (isAssignmentOverdue) return 'Overdue'
    return 'Pending'
  }

  return (
    <motion.div 
      className={`saas-card overflow-hidden ${
        isClickable ? 'card-press cursor-pointer' : 'opacity-90'
      }`}
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { scale: 1.02, y: -2 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <FileText className="w-6 h-6" style={{ color: 'var(--color-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[var(--color-primary)] text-base leading-tight mb-2">
                {assignment.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div 
                  className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                  style={{ 
                    backgroundColor: getStatusColor() + '20',
                    color: getStatusColor()
                  }}
                >
                  {hasSubmission && <CheckCircle className="w-3.5 h-3.5" />}
                  {isAssignmentOverdue && !hasSubmission && <Lock className="w-3.5 h-3.5" />}
                  {!hasSubmission && !isAssignmentOverdue && <Clock className="w-3.5 h-3.5" />}
                  {getStatusText()}
                </div>
              </div>
              <div className="flex items-center space-x-1 text-xs text-[var(--color-text-muted)]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due: {new Date(assignment.due_date).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</span>
              </div>
              
              {/* Show submission details for submitted assignments */}
              {hasSubmission && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border-light)]">
                  <div className="space-y-1.5 text-xs">
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium">File:</span> {assignment.submission!.file_name}
                    </p>
                    {assignment.submission!.marks !== null && (
                      <div className="flex items-center space-x-1.5 text-[var(--color-success)]">
                        <Award className="w-3.5 h-3.5" />
                        <span className="font-bold">
                          Marks: {assignment.submission!.marks}/10
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Arrow icon for clickable assignments */}
          {isClickable && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
