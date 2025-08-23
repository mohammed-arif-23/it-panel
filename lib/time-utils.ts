export const timeUtils = {
  // ===========================
  // DATE FORMATTING
  // ===========================
  formatDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  },

  formatTime12Hour: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  },

  formatTimeRemaining: (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  },

  // ===========================
  // DATE CALCULATIONS
  // ===========================
  getTodayDate: (): string => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  },

  getTomorrowDate: (): string => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // If tomorrow is Sunday (0), skip to Monday (add 1 more day)
    if (tomorrow.getDay() === 0) {
      tomorrow.setDate(tomorrow.getDate() + 1)
    }
    
    return tomorrow.toISOString().split('T')[0]
  },

  getNextMonday: (fromDate?: Date): Date => {
    const date = fromDate || new Date()
    const nextMonday = new Date(date)
    const currentDay = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days to add to get to next Monday
    let daysToAdd
    if (currentDay === 0) { // Sunday
      daysToAdd = 1 // Next Monday is tomorrow
    } else if (currentDay === 1) { // Monday
      daysToAdd = 7 // Next Monday is in 7 days
    } else { // Tuesday (2) through Saturday (6)
      daysToAdd = 8 - currentDay // Days until next Monday
    }
    
    nextMonday.setDate(date.getDate() + daysToAdd)
    nextMonday.setHours(0, 0, 0, 0)
    return nextMonday
  },

  // ===========================
  // SEMINAR BOOKING WINDOW
  // ===========================
  getBookingWindowConfig: () => ({
    startTime: '06:00 PM',
    endTime: '11:59 PM',
    selectionTime: '12:00 AM'
  }),

  getBookingWindowInfo: () => {
    const now = new Date()
    const config = timeUtils.getBookingWindowConfig()
    
    // Today's booking window (6 PM to 11:59 PM)
    const todayStart = new Date(now)
    todayStart.setHours(18, 0, 0, 0) // 6 PM
    
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999) // 11:59 PM
    
    // Tomorrow's booking window
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)

    if (now >= todayStart && now <= todayEnd) {
      // Currently in booking window
      return {
        isOpen: true,
        timeUntilClose: todayEnd.getTime() - now.getTime(),
        nextOpenTime: tomorrowStart
      }
    } else if (now < todayStart) {
      // Before today's window
      return {
        isOpen: false,
        timeUntilOpen: todayStart.getTime() - now.getTime(),
        nextOpenTime: todayStart
      }
    } else {
      // After today's window
      return {
        isOpen: false,
        timeUntilOpen: tomorrowStart.getTime() - now.getTime(),
        nextOpenTime: tomorrowStart
      }
    }
  },

  // ===========================
  // NPTEL WEEK MANAGEMENT
  // ===========================
  getCurrentWeek: (): number => {
    // Simple implementation - you can make this more sophisticated
    // For now, return week based on current date of month
    const now = new Date()
    const dayOfMonth = now.getDate()
    return Math.min(Math.ceil(dayOfMonth / 7), 12)
  },

  isWeekUnlocked: (weekNumber: number, previousWeekUpdateTime?: string): boolean => {
    if (weekNumber === 1) return true
    
    if (!previousWeekUpdateTime) return false
    
    const lastUpdate = new Date(previousWeekUpdateTime)
    const nextMonday = timeUtils.getNextMonday(lastUpdate)
    const now = new Date()
    
    return now >= nextMonday
  },

  getWeekUnlockTime: (weekNumber: number, previousWeekUpdateTime?: string): Date | null => {
    if (weekNumber === 1) return null
    
    if (!previousWeekUpdateTime) return null
    
    const lastUpdate = new Date(previousWeekUpdateTime)
    return timeUtils.getNextMonday(lastUpdate)
  },

  getTimeUntilWeekUnlock: (weekNumber: number, previousWeekUpdateTime?: string): number | null => {
    const unlockTime = timeUtils.getWeekUnlockTime(weekNumber, previousWeekUpdateTime)
    if (!unlockTime) return null
    
    const now = new Date()
    return Math.max(0, unlockTime.getTime() - now.getTime())
  }
}