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
  private uploadPreset: string

  constructor() {
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
    this.uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'assignments_unsigned'
    
    if (!this.cloudName) {
      console.error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable')
    }
    
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
      console.warn('Using default upload preset. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET for custom configuration.')
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

    return new Promise((resolve, reject) => {
      // Create FormData for the upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', this.uploadPreset)
      formData.append('folder', 'assignments')
      
      // Generate unique filename
      const timestamp = Date.now()
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      const customFilename = `${nameWithoutExt}_${timestamp}.${extension}`
      formData.append('public_id', `assignments/${customFilename.replace(/\.[^/.]+$/, '')}`)

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
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`)
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