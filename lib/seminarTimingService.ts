interface BookingWindowConfig {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  selectionHour: number;
  selectionMinute: number;
}

interface BookingWindowInfo {
  isOpen: boolean;
  timeUntilOpen?: number;
  timeUntilClose?: number;
  timeUntilSelection?: number;
  nextOpenTime?: Date;
  selectionTime?: Date;
}

class SeminarTimingService {
  private config: BookingWindowConfig;

  constructor() {
    this.config = {
      startHour: parseInt(process.env.NEXT_PUBLIC_BOOKING_WINDOW_START_HOUR || '10'),
      startMinute: parseInt(process.env.NEXT_PUBLIC_BOOKING_WINDOW_START_MINUTE || '30'),
      endHour: parseInt(process.env.NEXT_PUBLIC_BOOKING_WINDOW_END_HOUR || '13'),
      endMinute: parseInt(process.env.NEXT_PUBLIC_BOOKING_WINDOW_END_MINUTE || '30'),
      selectionHour: parseInt(process.env.NEXT_PUBLIC_SELECTION_HOUR || '13'),
      selectionMinute: parseInt(process.env.NEXT_PUBLIC_SELECTION_MINUTE || '30')
    };
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  getTodayBookingWindowStart(): Date {
    const today = new Date();
    today.setHours(this.config.startHour, this.config.startMinute, 0, 0);
    return today;
  }

  getTodayBookingWindowEnd(): Date {
    const today = new Date();
    today.setHours(this.config.endHour, this.config.endMinute, 0, 0);
    return today;
  }

  getTodaySelectionTime(): Date {
    const today = new Date();
    today.setHours(this.config.selectionHour, this.config.selectionMinute, 0, 0);
    return today;
  }

  getNextBookingWindowStart(): Date {
    const now = new Date();
    const todayStart = this.getTodayBookingWindowStart();
    
    if (now < todayStart) {
      return todayStart;
    } else {
      const tomorrow = new Date(todayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
  }

  isBookingWindowOpen(): boolean {
    const now = new Date();
    const start = this.getTodayBookingWindowStart();
    const end = this.getTodayBookingWindowEnd();
    
    return now >= start && now <= end;
  }

  isSelectionTime(): boolean {
    const now = new Date();
    const selectionTime = this.getTodaySelectionTime();
    
    // Selection happens at exactly the selection time or after
    return now >= selectionTime;
  }

  shouldTriggerAutoSelection(): boolean {
    const now = new Date();
    const selectionTime = this.getTodaySelectionTime();
    const timeDiff = now.getTime() - selectionTime.getTime();
    
    // Trigger if we're within 5 minutes after selection time
    return timeDiff >= 0 && timeDiff <= 5 * 60 * 1000;
  }

  getBookingWindowInfo(): BookingWindowInfo {
    const now = new Date();
    const start = this.getTodayBookingWindowStart();
    const end = this.getTodayBookingWindowEnd();
    const selectionTime = this.getTodaySelectionTime();
    const isOpen = this.isBookingWindowOpen();

    if (isOpen) {
      const timeUntilClose = end.getTime() - now.getTime();
      const timeUntilSelection = selectionTime.getTime() - now.getTime();
      
      return {
        isOpen: true,
        timeUntilClose,
        timeUntilSelection: timeUntilSelection > 0 ? timeUntilSelection : 0,
        selectionTime
      };
    } else if (now < start) {
      const timeUntilOpen = start.getTime() - now.getTime();
      return {
        isOpen: false,
        timeUntilOpen,
        nextOpenTime: start,
        selectionTime
      };
    } else {
      // After booking window ends
      const nextOpenTime = this.getNextBookingWindowStart();
      const timeUntilOpen = nextOpenTime.getTime() - now.getTime();
      const timeUntilSelection = selectionTime.getTime() - now.getTime();
      
      return {
        isOpen: false,
        timeUntilOpen,
        timeUntilSelection: timeUntilSelection > 0 ? timeUntilSelection : 0,
        nextOpenTime,
        selectionTime
      };
    }
  }

  formatTimeRemaining(milliseconds: number): string {
    if (milliseconds <= 0) return "Time's up!";
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  formatTime12Hour(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getBookingWindowConfig() {
    return {
      startTime: this.formatTime12Hour(this.getTodayBookingWindowStart()),
      endTime: this.formatTime12Hour(this.getTodayBookingWindowEnd()),
      selectionTime: this.formatTime12Hour(this.getTodaySelectionTime())
    };
  }

  async triggerAutoSelection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch('/api/seminar/auto-select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: result.message,
          data: result.selection
        };
      } else {
        return {
          success: false,
          message: result.error || 'Auto-selection failed'
        };
      }
    } catch (error) {
      console.error('Auto-selection trigger error:', error);
      return {
        success: false,
        message: 'Failed to trigger auto-selection'
      };
    }
  }
}

export const seminarTimingService = new SeminarTimingService();