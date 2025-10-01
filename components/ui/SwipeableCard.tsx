'use client'

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { ReactNode, useState } from 'react'
import { CheckCircle, Trash2, Archive, Star } from 'lucide-react'

interface SwipeAction {
  icon: ReactNode
  label: string
  color: string
  action: () => void
}

interface SwipeableCardProps {
  children: ReactNode
  className?: string
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: SwipeAction
  rightAction?: SwipeAction
  threshold?: number
}

export default function SwipeableCard({
  children,
  className = '',
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 100
}: SwipeableCardProps) {
  const x = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)

  const leftBgOpacity = useTransform(x, [-threshold, 0], [1, 0])
  const rightBgOpacity = useTransform(x, [0, threshold], [0, 1])

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false)
    
    if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft()
    } else if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight()
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      {leftAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-start px-6"
          style={{ 
            backgroundColor: leftAction.color,
            opacity: leftBgOpacity
          }}
        >
          <div className="flex items-center space-x-2 text-white">
            {leftAction.icon}
            <span className="font-semibold">{leftAction.label}</span>
          </div>
        </motion.div>
      )}
      
      {rightAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-end px-6"
          style={{ 
            backgroundColor: rightAction.color,
            opacity: rightBgOpacity
          }}
        >
          <div className="flex items-center space-x-2 text-white">
            <span className="font-semibold">{rightAction.label}</span>
            {rightAction.icon}
          </div>
        </motion.div>
      )}

      {/* Card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`${className} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {children}
      </motion.div>
    </div>
  )
}

// Pre-configured swipe actions
export const swipeActions = {
  complete: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Complete',
    color: '#10b981'
  },
  delete: {
    icon: <Trash2 className="w-5 h-5" />,
    label: 'Delete',
    color: '#ef4444'
  },
  archive: {
    icon: <Archive className="w-5 h-5" />,
    label: 'Archive',
    color: '#6b7280'
  },
  favorite: {
    icon: <Star className="w-5 h-5" />,
    label: 'Favorite',
    color: '#f59e0b'
  }
}
