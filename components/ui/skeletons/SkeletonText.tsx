'use client'

interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg skeleton ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

export function SkeletonHeading({ className = '' }: { className?: string }) {
  return (
    <div className={`h-6 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-48 skeleton ${className}`} />
  )
}

export function SkeletonParagraph({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-full skeleton" />
      <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-full skeleton" />
      <div className="h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-2/3 skeleton" />
    </div>
  )
}
