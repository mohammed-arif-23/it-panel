'use client'

import { SkeletonCard, SkeletonAssignmentCard, SkeletonDashboardTile, SkeletonStatCard } from './SkeletonCard'

interface SkeletonListProps {
  count?: number
  variant?: 'card' | 'assignment' | 'tile' | 'stat'
  className?: string
}

export function SkeletonList({ count = 3, variant = 'card', className = '' }: SkeletonListProps) {
  const getSkeletonComponent = () => {
    switch (variant) {
      case 'assignment':
        return SkeletonAssignmentCard
      case 'tile':
        return SkeletonDashboardTile
      case 'stat':
        return SkeletonStatCard
      default:
        return SkeletonCard
    }
  }

  const SkeletonComponent = getSkeletonComponent()

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </div>
  )
}
