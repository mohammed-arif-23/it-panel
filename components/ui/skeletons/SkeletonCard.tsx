'use client'

interface SkeletonCardProps {
  className?: string
  variant?: 'default' | 'compact' | 'wide'
}

export function SkeletonCard({ className = '', variant = 'default' }: SkeletonCardProps) {
  const getHeight = () => {
    switch (variant) {
      case 'compact':
        return 'h-24'
      case 'wide':
        return 'h-48'
      default:
        return 'h-32'
    }
  }

  return (
    <div className={`saas-card p-4 ${getHeight()} ${className} animate-pulse`}>
      <div className="flex items-start space-x-3 h-full">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex-shrink-0 skeleton" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-3/4 skeleton" />
          <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-full skeleton" />
          <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-5/6 skeleton" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonAssignmentCard() {
  return (
    <div className="saas-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex-shrink-0 skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-2/3 skeleton" />
            <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-full skeleton" />
            <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-4/5 skeleton" />
          </div>
        </div>
        <div className="w-20 h-6 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full skeleton" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-purple-100">
        <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-24 skeleton" />
        <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-32 skeleton" />
      </div>
    </div>
  )
}

export function SkeletonDashboardTile() {
  return (
    <div className="saas-card p-4 text-center h-[100px] animate-pulse">
      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl mx-auto mb-3 skeleton" />
      <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-16 mx-auto skeleton" />
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="saas-card p-4 text-center animate-pulse">
      <div className="h-8 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-12 mx-auto mb-2 skeleton" />
      <div className="h-2 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-16 mx-auto skeleton" />
    </div>
  )
}
