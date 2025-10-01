'use client'

import { ActionableError } from '../../lib/errorHandler'
import { AlertCircle, AlertTriangle, Info, RefreshCw, X } from 'lucide-react'
import { Button } from './button'

interface ErrorDisplayProps {
  error: ActionableError
  onRetry?: () => void
  onDismiss?: () => void
}

export default function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  const getIcon = () => {
    switch (error.icon) {
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-red-600" />
    }
  }

  const getBgColor = () => {
    switch (error.icon) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-red-50 border-red-200'
    }
  }

  const getTextColor = () => {
    switch (error.icon) {
      case 'error':
        return 'text-red-900'
      case 'warning':
        return 'text-yellow-900'
      case 'info':
        return 'text-blue-900'
      default:
        return 'text-red-900'
    }
  }

  const getAccentColor = () => {
    switch (error.icon) {
      case 'error':
        return 'text-red-700'
      case 'warning':
        return 'text-yellow-700'
      case 'info':
        return 'text-blue-700'
      default:
        return 'text-red-700'
    }
  }

  return (
    <div className={`saas-card p-5 border-2 ${getBgColor()} slide-in-left`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-bold ${getTextColor()} mb-2`}>
            {error.title}
          </h3>
          <p className={`text-sm ${getAccentColor()} mb-4`}>
            {error.message}
          </p>
          
          {error.suggestions.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className={`text-xs font-semibold ${getTextColor()}`}>
                What you can do:
              </p>
              <ul className="space-y-1.5">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className={`text-xs ${getAccentColor()} flex items-start space-x-2`}>
                    <span className="text-lg leading-none">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex space-x-2">
            {error.canRetry && onRetry && (
              <Button
                onClick={onRetry}
                className="flex-1 bg-[var(--color-secondary)] hover:bg-[var(--color-dark)] text-white text-sm py-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
            )}
            {error.supportLink && (
              <Button
                onClick={() => window.location.href = error.supportLink!}
                className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-secondary)] text-[var(--color-secondary)] hover:text-white text-sm py-2"
              >
                Go to Login
              </Button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        )}
      </div>
    </div>
  )
}
