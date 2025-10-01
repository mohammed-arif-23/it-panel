'use client'

import { useState } from 'react'
import { Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AssignmentData {
  dueDate?: string
  dueTime?: string
}

interface AssignmentScheduleStepProps {
  data: Partial<AssignmentData>
  onNext: (data: Partial<AssignmentData>) => void
  onBack: () => void
}

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

export function AssignmentScheduleStep({ data, onNext, onBack }: AssignmentScheduleStepProps) {
  const [dueDate, setDueDate] = useState(data.dueDate || '')
  const [dueTime, setDueTime] = useState(data.dueTime || '23:59')

  const handleNext = () => {
    if (!dueDate) return
    
    onNext({
      dueDate,
      dueTime
    })
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getQuickDateOption = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const isFormValid = dueDate.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">Set Deadline</h2>
        <p className="text-[var(--color-text-muted)]">When should students submit this assignment?</p>
      </div>

      {/* Form */}
      <div className="saas-card p-6 space-y-6">
        {/* Quick Date Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Quick Options
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDueDate(getQuickDateOption(1))}
              className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                dueDate === getQuickDateOption(1)
                  ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-secondary)]'
              }`}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setDueDate(getQuickDateOption(3))}
              className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                dueDate === getQuickDateOption(3)
                  ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-secondary)]'
              }`}
            >
              3 Days
            </button>
            <button
              type="button"
              onClick={() => setDueDate(getQuickDateOption(7))}
              className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                dueDate === getQuickDateOption(7)
                  ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-secondary)]'
              }`}
            >
              1 Week
            </button>
            <button
              type="button"
              onClick={() => setDueDate(getQuickDateOption(14))}
              className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                dueDate === getQuickDateOption(14)
                  ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-secondary)]'
              }`}
            >
              2 Weeks
            </button>
          </div>
        </div>

        {/* Custom Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Due Date *
          </label>
          <div className="relative">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={getMinDate()}
              className="saas-input pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          </div>
          {dueDate && (
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">
              📅 {formatDateDisplay(dueDate)}
            </p>
          )}
        </div>

        {/* Time Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Due Time
          </label>
          <div className="grid grid-cols-5 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setDueTime(time)}
                className={`p-2 rounded-lg border transition-all text-sm font-medium ${
                  dueTime === time
                    ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                    : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-secondary)]'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="text-sm text-[var(--color-text-secondary)] bg-transparent border-none focus:outline-none"
            />
          </div>
        </div>

        {/* Summary */}
        {dueDate && (
          <div className="p-4 bg-[var(--color-accent)] rounded-xl">
            <h4 className="font-medium text-[var(--color-text-secondary)] mb-2">📋 Deadline Summary:</h4>
            <div className="space-y-1 text-sm">
              <p className="text-[var(--color-text-primary)]">
                <strong>Due:</strong> {formatDateDisplay(dueDate)} at {dueTime}
              </p>
              <p className="text-[var(--color-text-muted)]">
                Students will be notified about this deadline
              </p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="p-4 bg-[var(--color-accent)] rounded-xl">
          <h4 className="font-medium text-[var(--color-text-secondary)] mb-2">💡 Scheduling Tips:</h4>
          <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
            <li>• Give students adequate time to complete the work</li>
            <li>• Consider weekends and holidays</li>
            <li>• Set deadlines during school hours when possible</li>
            <li>• Allow buffer time for technical issues</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onBack}
          className="saas-button-secondary flex-1 flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
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
