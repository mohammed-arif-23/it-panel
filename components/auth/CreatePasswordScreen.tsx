'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreatePasswordScreenProps {
  onNext: () => void
  onBack: () => void
}

interface PasswordRequirement {
  text: string
  met: boolean
}

export function CreatePasswordScreen({ onNext, onBack }: CreatePasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const passwordRequirements: PasswordRequirement[] = [
    { text: 'At least 8 characters long', met: password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Contains a number', met: /\d/.test(password) },
    { text: 'Passwords match', met: password === confirmPassword && password.length > 0 }
  ]

  const allRequirementsMet = passwordRequirements.every(req => req.met)

  const handleCreatePassword = async () => {
    if (!allRequirementsMet) return

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">Create New Password</h2>
        <p className="text-[var(--color-text-muted)]">
          Choose a strong password to secure your account
        </p>
      </div>

      {/* Password Form */}
      <div className="saas-card p-6 space-y-4">
        {/* New Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="saas-input pl-10 pr-10"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="saas-input pl-10 pr-10"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">Password Requirements:</p>
          <div className="space-y-2">
            {passwordRequirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  requirement.met 
                    ? 'bg-[var(--color-success)] text-white' 
                    : 'bg-[var(--color-accent)] text-[var(--color-text-muted)]'
                }`}>
                  {requirement.met ? (
                    <Check className="w-2.5 h-2.5" />
                  ) : (
                    <X className="w-2.5 h-2.5" />
                  )}
                </div>
                <span className={`text-sm ${
                  requirement.met 
                    ? 'text-[var(--color-success)]' 
                    : 'text-[var(--color-text-muted)]'
                }`}>
                  {requirement.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleCreatePassword}
          disabled={!allRequirementsMet || isLoading}
          className="saas-button-primary w-full ripple"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Password...</span>
            </div>
          ) : (
            'Create Password'
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
          <span className="text-sm">Back</span>
        </button>
      </div>
    </div>
  )
}
