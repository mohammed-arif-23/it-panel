import React from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info'
  message: string
  className?: string
  onClose?: () => void
}

export default function Alert({ variant, message, className = '', onClose }: AlertProps) {
  const baseClasses = 'flex items-center space-x-2 p-4 rounded-lg border'
  const variantClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const getIcon = () => {
    switch (variant) {
      case 'success': return CheckCircle
      case 'error': return AlertCircle
      case 'warning': return AlertTriangle
      case 'info': return Info
      default: return AlertCircle
    }
  }

  const Icon = getIcon()

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}