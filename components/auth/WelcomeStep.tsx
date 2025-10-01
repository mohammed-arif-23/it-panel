'use client'

import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface WelcomeStepProps {
  onContinue: () => void
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div className="min-h-[90dvh] overflow-hidden flex flex-col">
      {/* Navigation Header with Logo */}
      <nav className="sticky top-0 z-50 bg-[var(--color-background)] border-b border-[var(--color-border-light)] backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-4 py-4 flex justify-center">
          <div className="w-auto h-auto">
            <Image 
              src="/logo.png" 
              alt="IT Department Logo" 
              width={400} 
              height={400}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--color-primary)] mb-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              DynamIT 
            </motion.h1>
            <motion.p 
              className="text-sm sm:text-base text-[var(--color-text-muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Student Management System
            </motion.p>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button 
              onClick={onContinue}
              className="saas-button-primary w-full ripple scale-on-tap flex items-center justify-center text-base sm:text-lg py-6"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
