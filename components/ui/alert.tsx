import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
  className?: string
}

const Alert: React.FC<AlertProps> = ({ 
  variant = 'info', 
  title, 
  message, 
  onClose, 
  className = '' 
}) => {
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 shadow-lg shadow-green-100/50',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700',
      closeColor: 'text-green-600 hover:text-green-800'
    },
    error: {
      container: 'bg-red-50 border-red-200 shadow-lg shadow-red-100/50',
      icon: XCircle,
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
      closeColor: 'text-red-600 hover:text-red-800'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 shadow-lg shadow-yellow-100/50',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
      closeColor: 'text-yellow-600 hover:text-yellow-800'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 shadow-lg shadow-blue-100/50',
      icon: Info,
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
      closeColor: 'text-blue-600 hover:text-blue-800'
    }
  }

  const config = variants[variant]
  const IconComponent = config.icon

  return (
    <div className={`relative backdrop-blur-sm rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-xl ${config.container} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`text-sm font-semibold ${config.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          <p className={`text-sm ${config.messageColor}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 transition-colors duration-200 ${config.closeColor}`}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default Alert