/**
 * Direct Cloudinary Upload Service
 * Handles file uploads directly from the frontend to Cloudinary
 * Bypasses server file size limits
 */

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  original_filename: string
  bytes: number
  format: string
}

export interface CloudinaryUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export class DirectCloudinaryUpload {
  private cloudName: string

  constructor() {
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
    
    if (!this.cloudName) {
      console.error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable')
    }
  }

  /**
   * Upload file directly to Cloudinary
   * @param file - File to upload
   * @param onProgress - Progress callback (optional)
   * @returns Promise with upload result
   */
  async uploadFile(
    file: File, 
    onProgress?: (progress: CloudinaryUploadProgress) => void
  ): Promise<CloudinaryUploadResult> {
    // Validate configuration
    if (!this.cloudName) {
      throw new Error('Cloudinary not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable.')
    }

    // Get signed upload parameters from backend
    let signedParams: any
    try {
      const signResponse = await fetch('/api/cloudinary/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!signResponse.ok) {
        throw new Error('Failed to get upload signature')
      }
      
      signedParams = await signResponse.json()
    } catch (error) {
      throw new Error('Failed to authenticate upload: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }

    return new Promise((resolve, reject) => {
      // Create FormData for the upload
      // IMPORTANT: Include exactly the same parameters that were used to generate the signature
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', signedParams.apiKey)
      formData.append('timestamp', signedParams.timestamp)
      formData.append('signature', signedParams.signature)
      formData.append('folder', signedParams.folder)
      // These two are included in the server signature, so they MUST be sent here as well
      if (signedParams.use_filename) {
        formData.append('use_filename', signedParams.use_filename)
      }
      if (signedParams.unique_filename) {
        formData.append('unique_filename', signedParams.unique_filename)
      }

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: CloudinaryUploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            }
            onProgress(progress)
          }
        })
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText)
            resolve(result)
          } catch (error) {
            reject(new Error('Failed to parse upload response'))
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'))
      })

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out'))
      })

      // Configure and send request
      xhr.open('POST', signedParams.uploadUrl)
      xhr.timeout = 300000 // 5 minutes timeout
      xhr.send(formData)
    })
  }

  /**
   * Validate file before upload
   * @param file - File to validate
   * @returns Validation result
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return {
        isValid: false,
        error: 'Only PDF files are allowed'
      }
    }

    // Check file size (optional - Cloudinary has its own limits)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 100MB limit'
      }
    }

    return { isValid: true }
  }

  /**
   * Format file size for display
   * @param bytes - File size in bytes
   * @returns Formatted string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Export singleton instance
export const directCloudinaryUpload = new DirectCloudinaryUpload()