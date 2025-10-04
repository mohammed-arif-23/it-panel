/**
 * API Middleware utilities for request validation and security
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Safely parse JSON with size limit and error handling
 */
export async function safeParseJSON<T = any>(
  request: NextRequest,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
  try {
    // Check content-length header
    const contentLength = request.headers.get('content-length')
    if (contentLength) {
      const size = parseInt(contentLength)
      if (size > maxSizeBytes) {
        return {
          success: false,
          error: `Request body too large. Maximum size is ${Math.round(maxSizeBytes / 1024)}KB`,
          status: 413
        }
      }
    }

    // Get request body text
    const text = await request.text()
    
    // Check actual size
    const actualSize = new Blob([text]).size
    if (actualSize > maxSizeBytes) {
      return {
        success: false,
        error: `Request body too large. Maximum size is ${Math.round(maxSizeBytes / 1024)}KB`,
        status: 413
      }
    }

    // Parse JSON with error handling
    if (!text || text.trim() === '') {
      return {
        success: false,
        error: 'Request body is empty',
        status: 400
      }
    }

    let data: T
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON format',
        status: 400
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error parsing request body:', error)
    return {
      success: false,
      error: 'Failed to process request body',
      status: 500
    }
  }
}

/**
 * Verify cron job authenticity using secret token
 */
export function verifyCronRequest(request: NextRequest): boolean {
  // Check Vercel Cron Secret header
  const cronSecret = request.headers.get('x-vercel-cron-secret')
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret) {
    console.warn('CRON_SECRET not configured. Cron jobs are not secured!')
    return false
  }

  return cronSecret === expectedSecret
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  const response: any = { error: message }
  
  if (process.env.NODE_ENV === 'development' && details) {
    response.details = details
  }

  return NextResponse.json(response, { status })
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: true } | { valid: false; missing: string[] } {
  const missing = requiredFields.filter(field => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })

  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] }
  }

  return { valid: true }
}

/**
 * Check if user is admin (basic implementation)
 */
export function isAdmin(userId: string): boolean {
  // TODO: Implement proper admin check from database
  const adminIds = process.env.ADMIN_USER_IDS?.split(',') || []
  return adminIds.includes(userId)
}
