'use client'

import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Loader = ({ className, size = 'md' }: LoaderProps) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={cn('flex justify-center items-center w-full h-full', className)}>
      <svg className={cn('loader-svg', sizeClasses[size])} viewBox="0 0 240 240">
        <circle 
          className="loader-ring loader-ring-a" 
          cx={120} 
          cy={120} 
          r={105} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={20} 
          strokeLinecap="round" 
        />
        <circle 
          className="loader-ring loader-ring-b" 
          cx={120} 
          cy={120} 
          r={35} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={20} 
          strokeLinecap="round" 
        />
        <circle 
          className="loader-ring loader-ring-c" 
          cx={85} 
          cy={120} 
          r={70} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={20} 
          strokeLinecap="round" 
        />
        <circle 
          className="loader-ring loader-ring-d" 
          cx={155} 
          cy={120} 
          r={70} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={20} 
          strokeLinecap="round" 
        />
      </svg>
    </div>
  );
}

export default Loader;