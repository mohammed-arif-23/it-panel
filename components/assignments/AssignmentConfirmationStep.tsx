'use client'

import { Button } from '../ui/button'
import { CheckCircle, Calendar, FileText, Tag } from 'lucide-react'

interface AssignmentConfirmationStepProps {
  data: any
  onNext: (data: any) => void
  onBack: () => void
}

export function AssignmentConfirmationStep({ data, onNext, onBack }: AssignmentConfirmationStepProps) {
  const handleConfirm = () => {
    onNext(data)
  }

  const priorityColors = {
    low: 'text-[var(--color-success)]',
    medium: 'text-[var(--color-warning)]',
    high: 'text-[var(--color-error)]'
  }

  return (
    <div className="saas-card p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[var(--color-success)] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-primary)] mb-2">Review Assignment</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Please review your assignment details before submitting
        </p>
      </div>

      <div className="space-y-4">
        {/* Details Section */}
        <div className="p-4 bg-[var(--color-accent)] rounded-lg">
          <div className="flex items-start space-x-3 mb-3">
            <FileText className="w-5 h-5 text-[var(--color-secondary)] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Title</p>
              <p className="text-sm font-medium text-[var(--color-primary)]">{data.title}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Tag className="w-5 h-5 text-[var(--color-secondary)] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Subject</p>
              <p className="text-sm font-medium text-[var(--color-primary)]">{data.subject}</p>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {data.description && (
          <div className="p-4 bg-[var(--color-accent)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Description</p>
            <p className="text-sm text-[var(--color-primary)]">{data.description}</p>
          </div>
        )}

        {/* Schedule Section */}
        <div className="p-4 bg-[var(--color-accent)] rounded-lg">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-[var(--color-secondary)] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Due Date & Time</p>
              <p className="text-sm font-medium text-[var(--color-primary)]">
                {data.dueDate} at {data.dueTime}
              </p>
            </div>
          </div>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-accent)] rounded-lg">
          <span className="text-xs text-[var(--color-text-muted)]">Priority</span>
          <span className={`text-sm font-medium capitalize ${priorityColors[data.priority as keyof typeof priorityColors]}`}>
            {data.priority}
          </span>
        </div>

        {/* Files Section */}
        {data.files && data.files.length > 0 && (
          <div className="p-4 bg-[var(--color-accent)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">
              Files Attached ({data.files.length})
            </p>
            <div className="space-y-1">
              {data.files.map((file: File, index: number) => (
                <p key={index} className="text-sm text-[var(--color-primary)]">
                  • {file.name}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onBack}
            className="saas-button-secondary flex-1 ripple"
          >
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            className="saas-button-primary flex-1 ripple"
          >
            Submit Assignment
          </Button>
        </div>
      </div>
    </div>
  )
}
