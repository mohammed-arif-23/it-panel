'use client'

import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: 'primary' | 'secondary' | 'white' | 'success' | 'error'
}

const sizeClasses = {
  xs: 'w-3 h-3 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
  xl: 'w-16 h-16 border-4'
}

const colorClasses = {
  primary: 'border-[var(--color-primary)] border-t-transparent',
  secondary: 'border-[var(--color-secondary)] border-t-transparent',
  white: 'border-white border-t-transparent',
  success: 'border-[var(--color-success)] border-t-transparent',
  error: 'border-[var(--color-error)] border-t-transparent'
}

export default function Spinner({ 
  size = 'md', 
  className,
  color = 'secondary' 
}: SpinnerProps) {
  return (
    <div
      className={cn(
        'inline-block rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
