'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Home, LogOut, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RedirectLoaderProps {
  message?: string
  context?: 'dashboard' | 'logout' | 'assignments' | 'profile' | 'default'
  className?: string
}

const contextConfig = {
  dashboard: {
    message: 'Taking you to your dashboard...',
    icon: Home,
    gradient: 'from-blue-500 to-purple-600'
  },
  logout: {
    message: 'Logging you out securely...',
    icon: LogOut,
    gradient: 'from-red-500 to-pink-600'
  },
  assignments: {
    message: 'Loading your assignments...',
    icon: FileText,
    gradient: 'from-green-500 to-teal-600'
  },
  profile: {
    message: 'Loading your profile...',
    icon: User,
    gradient: 'from-indigo-500 to-purple-600'
  },
  default: {
    message: 'Redirecting...',
    icon: ArrowRight,
    gradient: 'from-[var(--color-secondary)] to-[var(--color-dark)]'
  }
}

export default function RedirectLoader({ 
  message, 
  context = 'default',
  className 
}: RedirectLoaderProps) {
  const config = contextConfig[context]
  const Icon = config.icon
  const displayMessage = message || config.message

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-background)] to-[var(--color-accent)]",
      className
    )}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="text-center"
      >
        {/* Animated Icon */}
        <motion.div
          className={cn(
            "w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-2xl",
            config.gradient
          )}
        >
          <Icon className="w-12 h-12 text-white" />
        </motion.div>

        {/* Message with shimmer effect */}
        <motion.h2
          className="text-2xl font-bold text-[var(--color-primary)] mb-3 shimmer-text"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {displayMessage}
        </motion.h2>

        {/* Progress bar */}
        <motion.div
          className="mt-6 w-64 mx-auto h-1.5 bg-[var(--color-accent)] rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <motion.div
            className={cn("h-full bg-gradient-to-r rounded-full", config.gradient)}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
