'use client'

import { useState } from 'react'
import { FileText, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AssignmentData {
  title?: string
  subject?: string
  priority?: 'low' | 'medium' | 'high'
}

interface AssignmentDetailsStepProps {
  data: Partial<AssignmentData>
  onNext: (data: Partial<AssignmentData>) => void
  onCancel?: () => void
}

const subjects = [
  'Mathematics',
  'Computer Science',
  'Physics',
  'Chemistry',
  'English',
  'Biology',
  'History',
  'Geography'
]

const priorities = [
  { value: 'low', label: 'Low Priority', color: 'bg-[var(--color-accent)]' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-[var(--color-secondary)]' },
  { value: 'high', label: 'High Priority', color: 'bg-[var(--color-error)]' }
] as const

export function AssignmentDetailsStep({ data, onNext, onCancel }: AssignmentDetailsStepProps) {
  const [title, setTitle] = useState(data.title || '')
  const [subject, setSubject] = useState(data.subject || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(data.priority || 'medium')

  const handleNext = () => {
    if (!title.trim() || !subject) return
    
    onNext({
      title: title.trim(),
      subject,
      priority
    })
  }

  const isFormValid = title.trim().length > 0 && subject.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[var(--color-accent)] rounded-2xl flex items-center justify-center">
            <FileText className="w-8 h-8 text-[var(--color-secondary)]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">Create Assignment</h2>
        <p className="text-[var(--color-text-muted)]">Let's start with the basic details</p>
      </div>

      {/* Form */}
      <div className="saas-card p-6 space-y-6">
        {/* Assignment Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Assignment Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter assignment title"
            className="saas-input"
            maxLength={100}
          />
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>Be specific and clear</span>
            <span>{title.length}/100</span>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Subject *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((subjectOption) => (
              <button
                key={subjectOption}
                type="button"
                onClick={() => setSubject(subjectOption)}
                className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                  subject === subjectOption
                    ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                    : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-secondary)]'
                }`}
              >
                {subjectOption}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Priority Level
          </label>
          <div className="space-y-2">
            {priorities.map((priorityOption) => (
              <button
                key={priorityOption.value}
                type="button"
                onClick={() => setPriority(priorityOption.value)}
                className={`w-full p-3 rounded-xl border transition-all text-left flex items-center space-x-3 ${
                  priority === priorityOption.value
                    ? 'bg-[var(--color-accent)] border-[var(--color-secondary)] text-[var(--color-secondary)]'
                    : 'bg-[var(--color-background)] border-[var(--color-border-light)] text-[var(--color-text-muted)] hover:border-[var(--color-secondary)]'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${priorityOption.color}`}></div>
                <span className="font-medium">{priorityOption.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 bg-[var(--color-accent)] rounded-xl">
          <h4 className="font-medium text-[var(--color-text-secondary)] mb-2">💡 Tips for a good assignment:</h4>
          <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
            <li>• Use clear, descriptive titles</li>
            <li>• Choose the appropriate subject category</li>
            <li>• Set priority based on deadline urgency</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="saas-button-secondary flex-1 flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}
        <Button
          onClick={handleNext}
          disabled={!isFormValid}
          className="saas-button-primary flex-1 flex items-center justify-center space-x-2 ripple"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
