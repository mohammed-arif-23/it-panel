import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// File size utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function validateFileSize(file: File, maxSizeMB: number): { isValid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum limit of ${maxSizeMB}MB`
    }
  }
  
  return { isValid: true }
}

export function validateFileType(file: File, allowedTypes: string[]): { isValid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type '${file.type}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }
  
  return { isValid: true }
}