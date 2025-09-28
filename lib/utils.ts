import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

// optional ripple position helper (no React type to avoid import)
export function attachRipplePosition(e: any) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  target.style.setProperty('--x', `${x}%`)
  target.style.setProperty('--y', `${y}%`)
}
