'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cardHover, cardTap } from '../../lib/animations'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  whileHover?: boolean
  whileTap?: boolean
  initial?: any
  animate?: any
  exit?: any
  transition?: any
}

export default function AnimatedCard({
  children,
  className = '',
  onClick,
  whileHover = true,
  whileTap = true,
  initial,
  animate,
  exit,
  transition
}: AnimatedCardProps) {
  return (
    <motion.div
      className={`saas-card ${className}`}
      onClick={onClick}
      whileHover={whileHover ? cardHover : undefined}
      whileTap={whileTap ? cardTap : undefined}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      layout
    >
      {children}
    </motion.div>
  )
}
