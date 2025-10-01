'use client'

import { useState } from 'react'
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ForgotPasswordScreenProps {
  onNext: () => void
  onBack: () => void
}

export function ForgotPasswordScreen({ onNext, onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSendReset = async () => {
    if (!email) return

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    setIsEmailSent(true)
    
    // Auto proceed after showing confirmation
    setTimeout(() => {
      onNext()
    }, 2000)
  }

  const isValidEmail = email.includes('@') && email.includes('.')

  if (isEmailSent) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[var(--color-success)] bg-opacity-10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-[var(--color-success)]" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[var(--color-primary)]">Check Your Email</h2>
          <p className="text-[var(--color-text-muted)]">
            We've sent a password reset link to <br />
            <span className="font-medium text-[var(--color-text-secondary)]">{email}</span>
          </p>
        </div>

        <div className="saas-card p-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">Forgot Password</h2>
        <p className="text-[var(--color-text-muted)]">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      {/* Reset Form */}
      <div className="saas-card p-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="saas-input pl-10"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          </div>
        </div>

        <div className="p-3 bg-[var(--color-accent)] rounded-lg">
          <p className="text-sm text-[var(--color-text-secondary)]">
            💡 Use the email address associated with your student account
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleSendReset}
          disabled={!isValidEmail || isLoading}
          className="saas-button-primary w-full flex items-center justify-center space-x-2 ripple"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending Reset Link...</span>
            </div>
          ) : (
            <>
              <span>Send Reset Link</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Sign In</span>
        </button>
      </div>
    </div>
  )
}
