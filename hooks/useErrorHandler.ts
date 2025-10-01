import { useState, useCallback } from 'react'
import { errorHandler, ActionableError, ErrorContext } from '../lib/errorHandler'

export function useErrorHandler() {
  const [error, setError] = useState<ActionableError | null>(null)

  const handleError = useCallback((err: any, context?: ErrorContext) => {
    const actionableError = errorHandler.handle(err, context)
    setError(actionableError)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const retry = useCallback(async (retryFn: () => Promise<void>) => {
    clearError()
    try {
      await retryFn()
    } catch (err) {
      handleError(err)
    }
  }, [handleError, clearError])

  return {
    error,
    handleError,
    clearError,
    retry
  }
}
