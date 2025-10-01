// Enhanced Error Handling System
// Provides actionable error messages and recovery suggestions

export interface ErrorContext {
  code?: string
  statusCode?: number
  endpoint?: string
  method?: string
  userAction?: string
}

export interface ActionableError {
  title: string
  message: string
  suggestions: string[]
  canRetry: boolean
  retryAction?: () => Promise<void>
  supportLink?: string
  icon?: 'error' | 'warning' | 'info'
}

class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: Array<{ timestamp: number; error: any; context: ErrorContext }> = []
  private maxLogSize = 50

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle and transform error into actionable format
   */
  handle(error: any, context?: ErrorContext): ActionableError {
    // Log error for debugging
    this.logError(error, context)

    // Network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return this.getNetworkError()
    }

    // Authentication errors
    if (error.statusCode === 401 || error.code === 'UNAUTHORIZED') {
      return this.getAuthError()
    }

    // Permission errors
    if (error.statusCode === 403 || error.code === 'FORBIDDEN') {
      return this.getPermissionError()
    }

    // Not found errors
    if (error.statusCode === 404) {
      return this.getNotFoundError(context)
    }

    // Validation errors
    if (error.statusCode === 400 || error.code === 'VALIDATION_ERROR') {
      return this.getValidationError(error)
    }

    // Server errors
    if (error.statusCode >= 500) {
      return this.getServerError()
    }

    // Assignment specific errors
    if (context?.endpoint?.includes('/assignments')) {
      return this.getAssignmentError(error, context)
    }

    // Seminar booking errors
    if (context?.endpoint?.includes('/seminar')) {
      return this.getSeminarError(error, context)
    }

    // File upload errors
    if (context?.userAction === 'file_upload') {
      return this.getFileUploadError(error)
    }

    // Database errors
    if (error.code?.startsWith('PGRST')) {
      return this.getDatabaseError(error)
    }

    // Generic error
    return this.getGenericError(error)
  }

  private getNetworkError(): ActionableError {
    return {
      title: '🌐 Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection.',
      suggestions: [
        'Check if you are connected to Wi-Fi or mobile data',
        'Try turning airplane mode off and on',
        'Your changes will be saved and synced automatically when connection is restored',
        'If problem persists, contact your network administrator'
      ],
      canRetry: true,
      icon: 'error'
    }
  }

  private getAuthError(): ActionableError {
    return {
      title: '🔒 Authentication Required',
      message: 'Your session has expired. Please log in again to continue.',
      suggestions: [
        'Click the button below to log in again',
        'Make sure you are using the correct registration number',
        'If you forgot your password, use the "Forgot Password" option'
      ],
      canRetry: false,
      supportLink: '/',
      icon: 'warning'
    }
  }

  private getPermissionError(): ActionableError {
    return {
      title: '⛔ Access Denied',
      message: 'You do not have permission to perform this action.',
      suggestions: [
        'This feature may be restricted to certain users',
        'Contact your HOD or system administrator if you believe this is an error',
        'Verify that you are logged in with the correct account'
      ],
      canRetry: false,
      icon: 'error'
    }
  }

  private getNotFoundError(context?: ErrorContext): ActionableError {
    return {
      title: '🔍 Not Found',
      message: 'The requested resource could not be found.',
      suggestions: [
        'The item may have been deleted or moved',
        'Check if you are using the correct link',
        'Try refreshing the page',
        'Go back to the dashboard and try again'
      ],
      canRetry: false,
      icon: 'error'
    }
  }

  private getValidationError(error: any): ActionableError {
    const message = error.message || 'The information you provided is invalid.'
    return {
      title: '⚠️ Invalid Input',
      message,
      suggestions: [
        'Check that all required fields are filled',
        'Ensure dates are in the correct format',
        'File sizes should not exceed the maximum limit',
        'Remove any special characters if not allowed'
      ],
      canRetry: true,
      icon: 'warning'
    }
  }

  private getServerError(): ActionableError {
    return {
      title: '🔧 Server Error',
      message: 'Something went wrong on our end. We are working to fix it.',
      suggestions: [
        'Please try again in a few minutes',
        'Your data has been saved locally if possible',
        'If this continues, contact support with error details',
        'Check our status page for ongoing issues'
      ],
      canRetry: true,
      icon: 'error'
    }
  }

  private getAssignmentError(error: any, context?: ErrorContext): ActionableError {
    if (error.message?.includes('deadline')) {
      return {
        title: '⏰ Deadline Passed',
        message: 'This assignment deadline has already passed.',
        suggestions: [
          'Contact your faculty to request an extension',
          'Check if late submissions are accepted with penalty',
          'Review upcoming assignment deadlines to avoid this in future'
        ],
        canRetry: false,
        icon: 'warning'
      }
    }

    if (error.message?.includes('already submitted')) {
      return {
        title: '✓ Already Submitted',
        message: 'You have already submitted this assignment.',
        suggestions: [
          'Check your submission history to verify',
          'Contact faculty if you need to resubmit',
          'View your marks in the assignments section'
        ],
        canRetry: false,
        icon: 'info'
      }
    }

    if (error.message?.includes('file')) {
      return this.getFileUploadError(error)
    }

    return {
      title: '📝 Assignment Submission Failed',
      message: 'Unable to submit your assignment at this time.',
      suggestions: [
        'Ensure your file is a PDF and under 10MB',
        'Check your internet connection',
        'Try again in a few moments',
        'Contact support if the problem persists'
      ],
      canRetry: true,
      icon: 'error'
    }
  }

  private getSeminarError(error: any, context?: ErrorContext): ActionableError {
    if (error.message?.includes('window closed')) {
      return {
        title: '🕐 Booking Window Closed',
        message: 'The seminar booking window is currently closed.',
        suggestions: [
          'Booking opens daily at the scheduled time',
          'Check the dashboard for the next booking window',
          'Set a reminder so you don\'t miss the next window'
        ],
        canRetry: false,
        icon: 'warning'
      }
    }

    if (error.message?.includes('already booked')) {
      return {
        title: '✓ Already Booked',
        message: 'You have already booked for this seminar date.',
        suggestions: [
          'View your booking details in the seminar section',
          'You can only book once per seminar date',
          'Wait for the selection results'
        ],
        canRetry: false,
        icon: 'info'
      }
    }

    if (error.message?.includes('topic')) {
      return {
        title: '📋 Topic Required',
        message: 'Please enter a seminar topic to proceed with booking.',
        suggestions: [
          'Enter a clear and descriptive topic for your seminar',
          'Topic should be relevant to your course',
          'Avoid using special characters'
        ],
        canRetry: true,
        icon: 'warning'
      }
    }

    return {
      title: '📅 Seminar Booking Failed',
      message: 'Unable to book seminar at this time.',
      suggestions: [
        'Check if the booking window is open',
        'Ensure you have entered a valid topic',
        'Try again in a few moments',
        'Contact support if the issue continues'
      ],
      canRetry: true,
      icon: 'error'
    }
  }

  private getFileUploadError(error: any): ActionableError {
    if (error.message?.includes('size') || error.message?.includes('10MB')) {
      return {
        title: '📦 File Too Large',
        message: 'Your file exceeds the maximum size limit of 10MB.',
        suggestions: [
          'Compress your PDF using online tools',
          'Reduce image quality in the document',
          'Split into multiple smaller files if allowed',
          'Remove unnecessary pages or images'
        ],
        canRetry: false,
        icon: 'warning'
      }
    }

    if (error.message?.includes('PDF') || error.message?.includes('format')) {
      return {
        title: '📄 Invalid File Format',
        message: 'Only PDF files are accepted for submission.',
        suggestions: [
          'Convert your document to PDF format',
          'Use "Print to PDF" option in Word/Google Docs',
          'Ensure file extension is .pdf',
          'Check that the file is not corrupted'
        ],
        canRetry: false,
        icon: 'warning'
      }
    }

    return {
      title: '📤 Upload Failed',
      message: 'Unable to upload your file. Please try again.',
      suggestions: [
        'Check your internet connection',
        'Ensure file is under 10MB and in PDF format',
        'Try uploading again',
        'Contact support if problem continues'
      ],
      canRetry: true,
      icon: 'error'
    }
  }

  private getDatabaseError(error: any): ActionableError {
    return {
      title: '🗄️ Database Error',
      message: 'Unable to access data at this time.',
      suggestions: [
        'Try refreshing the page',
        'Your data is safe and will be available shortly',
        'If this persists, contact system administrator',
        'Error code: ' + (error.code || 'Unknown')
      ],
      canRetry: true,
      icon: 'error'
    }
  }

  private getGenericError(error: any): ActionableError {
    return {
      title: '❌ Something Went Wrong',
      message: error.message || 'An unexpected error occurred.',
      suggestions: [
        'Try refreshing the page',
        'Clear your browser cache if the problem persists',
        'Contact support with the following details',
        'Error: ' + (error.message || 'Unknown error')
      ],
      canRetry: true,
      icon: 'error'
    }
  }

  /**
   * Log error for debugging
   */
  private logError(error: any, context?: ErrorContext): void {
    this.errorLog.push({
      timestamp: Date.now(),
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      },
      context: context || {}
    })

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error, 'Context:', context)
    }
  }

  /**
   * Get error log for debugging
   */
  getErrorLog() {
    return this.errorLog
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * Export error log for support
   */
  exportErrorLog(): string {
    return JSON.stringify(this.errorLog, null, 2)
  }
}

export const errorHandler = ErrorHandler.getInstance()
