'use client'

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`saas-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-[var(--color-accent)] p-4 border-b border-[var(--color-border-light)]">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg skeleton" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-[var(--color-border-light)]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 animate-pulse">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className={`h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg skeleton ${
                    colIndex === 0 ? 'w-3/4' : 'w-full'
                  }`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
