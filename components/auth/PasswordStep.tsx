'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import Alert from '../ui/alert'
import { Lock, ArrowLeft, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface Student {
  id: string
  name: string
  register_number: string
  class_year: string
  password?: string | null
}

interface PasswordStepProps {
  student: Student | null
  onSubmit: (password: string) => Promise<void>
  onBack: () => void
  error?: string
}

export function PasswordStep({ student, onSubmit, onBack, error }: PasswordStepProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogging, setIsLogging] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLogging(true)
    
    try {
      await onSubmit(password)
    } catch (error) {
      // Error is handled by parent
    } finally {
      setIsLogging(false)
    }
  }

  if (!student) return null

  return (
    <motion.div 
      className="saas-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-[var(--color-text-muted)] hover:text-[var(--color-secondary)] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <h2 className="text-xl font-bold text-[var(--color-primary)] mb-4">Enter Password</h2>

      {/* Student Info */}
      <div className="p-3 bg-[var(--color-accent)] rounded-xl mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[var(--color-secondary)] bg-opacity-20 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-[var(--color-secondary)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-primary)]">
              {student.name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {student.register_number} • {student.class_year}
            </p>
          </div>
        </div>
      </div>

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`saas-input pl-10 pr-20 glow-on-focus ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
              aria-invalid={!!error}
              aria-describedby={error ? 'password-error' : undefined}
              required
              autoFocus
            />
            <Lock className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-secondary)] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            id="password-error"
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 animate-pulse flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <Button 
          type="submit"
          disabled={isLogging || !password}
          className="saas-button-primary w-full ripple scale-on-tap"
        >
          {isLogging ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing In...</span>
            </div>
          ) : (
            'Sign In'
          )}
        </Button>

      </form>
    </motion.div>
  )
}
