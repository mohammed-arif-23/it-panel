'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, User, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import Loader from '../ui/loader'
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface Student {
  id: string
  name: string | null
  register_number: string
  class_year: string | null
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
      className="min-h-[95dvh] overflow-hidden bg-[var(--color-background)] flex flex-col  border-none shadow-none items-center justify-center"
    >
    

    <DotLottieReact
      src="https://lottie.host/acd3a94d-2ea7-4bf1-87bc-89821591a5f3/BMsuU4zxCn.lottie"
      autoplay
      className='w-auto h-auto'
    />

    </motion.div>
  )
}
