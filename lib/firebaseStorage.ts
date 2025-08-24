import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export class FirebaseStorageService {
  private static instance: FirebaseStorageService
  private bucketName = 'assignments' // Virtual bucket name for organization

  static getInstance(): FirebaseStorageService {
    if (!FirebaseStorageService.instance) {
      FirebaseStorageService.instance = new FirebaseStorageService()
    }
    return FirebaseStorageService.instance
  }

  /**
   * Upload file to Firebase Storage
   * @param file - File to upload
   * @param fileName - Name for the file in storage
   * @returns Promise with download URL
   */
  async uploadFile(file: File, fileName: string): Promise<{ publicUrl: string; path: string }> {
    try {
      // Create a reference to the file location
      const filePath = `${this.bucketName}/${fileName}`
      const storageRef = ref(storage, filePath)

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file)
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)

      return {
        publicUrl: downloadURL,
        path: filePath
      }
    } catch (error) {
      console.error('Error uploading file to Firebase:', error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete file from Firebase Storage
   * @param filePath - Path of the file to delete
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, filePath)
      await deleteObject(storageRef)
    } catch (error) {
      console.error('Error deleting file from Firebase:', error)
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get download URL for an existing file
   * @param filePath - Path of the file
   * @returns Download URL
   */
  async getFileUrl(filePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, filePath)
      return await getDownloadURL(storageRef)
    } catch (error) {
      console.error('Error getting file URL from Firebase:', error)
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Export singleton instance
export const firebaseStorage = FirebaseStorageService.getInstance()