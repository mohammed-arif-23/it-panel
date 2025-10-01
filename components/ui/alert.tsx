import React from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info'
  message: string
  className?: string
  onClose?: () => void
}

export default function Alert({ variant, message, className = '', onClose }: AlertProps) {
  const variantClasses = {
    success: {
      container: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
      icon: 'bg-white text-green-600',
      text: 'text-green-900'
    },
    error: {
      container: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
      icon: 'bg-white text-red-600 ',
      text: 'text-red-900'
    },
    warning: {
      container: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200',
      icon: 'bg-white text-orange-600',
      text: 'text-orange-900'
    },
    info: {
      container: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
      icon: 'bg-white text-blue-600',
      text: 'text-blue-900'
    }
  }


  const styles = variantClasses[variant]

  return (
    <motion.div 
      className={`flex items-start space-x-3 p-4 rounded-xl border shadow-sm ${styles.container} ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
    
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-relaxed ${styles.text}`}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1.5 rounded-lg hover:bg-white/50 transition-colors ${styles.text}`}
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  )
}