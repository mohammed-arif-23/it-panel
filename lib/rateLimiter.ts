/**
 * Simple in-memory rate limiter for login attempts
 * Prevents brute force attacks by limiting failed login attempts per IP/user
 */

interface RateLimitEntry {
  attempts: number
  firstAttemptTime: number
  blockedUntil?: number
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map()
  private readonly maxAttempts = 5
  private readonly windowMs = 15 * 60 * 1000 // 15 minutes
  private readonly blockDurationMs = 30 * 60 * 1000 // 30 minutes

  /**
   * Check if a key (IP or user) is rate limited
   */
  isRateLimited(key: string): { limited: boolean; retryAfter?: number } {
    const entry = this.attempts.get(key)
    
    if (!entry) {
      return { limited: false }
    }

    // Check if currently blocked
    if (entry.blockedUntil && Date.now() < entry.blockedUntil) {
      const retryAfter = Math.ceil((entry.blockedUntil - Date.now()) / 1000)
      return { limited: true, retryAfter }
    }

    // Check if window has expired
    if (Date.now() - entry.firstAttemptTime > this.windowMs) {
      // Reset the entry
      this.attempts.delete(key)
      return { limited: false }
    }

    // Check if max attempts exceeded
    if (entry.attempts >= this.maxAttempts) {
      const blockedUntil = Date.now() + this.blockDurationMs
      this.attempts.set(key, { ...entry, blockedUntil })
      const retryAfter = Math.ceil(this.blockDurationMs / 1000)
      return { limited: true, retryAfter }
    }

    return { limited: false }
  }

  /**
   * Record a failed attempt
   */
  recordFailedAttempt(key: string): void {
    const entry = this.attempts.get(key)
    
    if (!entry) {
      this.attempts.set(key, {
        attempts: 1,
        firstAttemptTime: Date.now()
      })
    } else {
      // Check if window has expired
      if (Date.now() - entry.firstAttemptTime > this.windowMs) {
        // Start new window
        this.attempts.set(key, {
          attempts: 1,
          firstAttemptTime: Date.now()
        })
      } else {
        // Increment attempts
        this.attempts.set(key, {
          ...entry,
          attempts: entry.attempts + 1
        })
      }
    }
  }

  /**
   * Clear attempts for a key (call on successful login)
   */
  clearAttempts(key: string): void {
    this.attempts.delete(key)
  }

  /**
   * Cleanup old entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.attempts.entries()) {
      // Remove entries older than block duration
      if (now - entry.firstAttemptTime > this.blockDurationMs) {
        this.attempts.delete(key)
      }
    }
  }
}

export const loginRateLimiter = new RateLimiter()

// Cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => loginRateLimiter.cleanup(), 10 * 60 * 1000)
}
