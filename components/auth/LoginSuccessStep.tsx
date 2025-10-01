'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, User, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface Student {
  id: string
  name: string
  register_number: string
  class_year: string
}

interface LoginSuccessStepProps {
  student: Student | null
}

export function LoginSuccessStep({ student }: LoginSuccessStepProps) {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <motion.div 
      className="saas-card p-6 text-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        {/* Success Icon with celebration animation */}
        <motion.div 
          className="w-20 h-20 bg-[var(--color-success)] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [180, 10, -10, 0]
          }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CheckCircle className="w-10 h-10 text-[var(--color-success)]" />
          <motion.div
            className="absolute -top-2 -right-2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 1, delay: 0.4, repeat: 2 }}
          >
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </motion.div>
        </motion.div>
        
        <motion.h2 
          className="text-2xl font-bold text-[var(--color-primary)] mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          Login Successful!
        </motion.h2>
        
        {student && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="flex items-center justify-center space-x-3 p-4 bg-[var(--color-accent)] rounded-xl inline-flex">
              <div className="w-10 h-10 bg-[var(--color-secondary)] bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-[var(--color-secondary)]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--color-primary)]">
                  {student.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {student.register_number}
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        <motion.p 
          className="text-[var(--color-text-muted)] mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          Welcome back! Redirecting to your dashboard...
        </motion.p>
        
        {/* Loading indicator with animation */}
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1 }}
        >
          <motion.div 
            className="w-8 h-8 border-3 border-[var(--color-secondary)] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
