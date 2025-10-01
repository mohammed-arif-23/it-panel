'use client'

import { GraduationCap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeScreenProps {
  onNext: () => void
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="text-center space-y-8">
      {/* App Logo/Icon */}
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 bg-[var(--color-accent)] rounded-3xl flex items-center justify-center">
          <GraduationCap className="w-12 h-12 text-[var(--color-secondary)]" />
        </div>
      </div>

      {/* Welcome Content */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">
          My School Staff App
        </h1>
        <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
          Welcome to your student portal. Access assignments, grades, and stay connected with your academic journey.
        </p>
      </div>

      {/* Features List */}
      <div className="space-y-3 text-left">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-[var(--color-secondary)] rounded-full"></div>
          <span className="text-[var(--color-text-secondary)] text-sm">Track assignments and submissions</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-[var(--color-secondary)] rounded-full"></div>
          <span className="text-[var(--color-text-secondary)] text-sm">View grades and progress</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-[var(--color-secondary)] rounded-full"></div>
          <span className="text-[var(--color-text-secondary)] text-sm">Access learning resources</span>
        </div>
      </div>

      {/* CTA Button */}
      <div className="pt-8">
        <Button
          onClick={onNext}
          className="saas-button-primary w-full flex items-center justify-center space-x-2 ripple"
          size="lg"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Footer */}
      <div className="pt-6">
        <p className="text-xs text-[var(--color-text-muted)]">
          Department of Information Technology
        </p>
      </div>
    </div>
  )
}
