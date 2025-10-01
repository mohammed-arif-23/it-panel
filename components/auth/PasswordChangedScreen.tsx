'use client'

import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PasswordChangedScreenProps {
  onComplete?: () => void
  userData?: any
}

export function PasswordChangedScreen({ onComplete, userData }: PasswordChangedScreenProps) {
  return (
    <div className="text-center space-y-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-[var(--color-success)] bg-opacity-10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-[var(--color-success)]" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">Password Changed!</h2>
        <p className="text-[var(--color-text-muted)] leading-relaxed">
          Your password has been successfully updated. You can now access your account with your new credentials.
        </p>
      </div>

      {/* User Info Card */}
      {userData && (
        <div className="saas-card p-4 text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
              <span className="text-[var(--color-secondary)] font-semibold text-sm">
                {userData.name?.charAt(0) || 'S'}
              </span>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">{userData.name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {userData.register_number} • {userData.class_year}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className="saas-card p-4 space-y-3">
        <h3 className="font-semibold text-[var(--color-text-secondary)] text-left">Security Tips:</h3>
        <div className="space-y-2 text-left">
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-[var(--color-secondary)] rounded-full mt-2"></div>
            <p className="text-sm text-[var(--color-text-muted)]">Keep your password secure and don't share it</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-[var(--color-secondary)] rounded-full mt-2"></div>
            <p className="text-sm text-[var(--color-text-muted)]">Sign out when using shared devices</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-[var(--color-secondary)] rounded-full mt-2"></div>
            <p className="text-sm text-[var(--color-text-muted)]">Update your password regularly</p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          onClick={onComplete}
          className="saas-button-primary w-full flex items-center justify-center space-x-2 ripple"
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
