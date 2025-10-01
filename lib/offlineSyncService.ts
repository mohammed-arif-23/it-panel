// Offline Data Sync Queue Service
// Queues operations when offline and syncs when connection is restored

interface QueuedOperation {
  id: string
  type: 'assignment_submit' | 'seminar_booking' | 'fine_payment' | 'profile_update' | 'cod_submission'
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  data: any
  timestamp: number
  retryCount: number
  maxRetries: number
  priority: number // Higher number = higher priority
}

interface SyncResult {
  success: boolean
  operationId: string
  error?: string
}

const DB_NAME = 'it_panel_offline_db'
const DB_VERSION = 1
const STORE_NAME = 'sync_queue'

class OfflineSyncService {
  private static instance: OfflineSyncService
  private db: IDBDatabase | null = null
  private syncInProgress = false
  private listeners: Set<(status: string) => void> = new Set()

  private constructor() {
    this.initializeDB()
    this.setupOnlineListener()
  }

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService()
    }
    return OfflineSyncService.instance
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
          objectStore.createIndex('priority', 'priority', { unique: false })
          objectStore.createIndex('type', 'type', { unique: false })
        }
      }
    })
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    await this.ensureDBReady()

    const queuedOp: QueuedOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(queuedOp)

      request.onsuccess = () => {
        this.notifyListeners(`Operation queued: ${operation.type}`)
        resolve(queuedOp.id)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all queued operations
   */
  async getAllOperations(): Promise<QueuedOperation[]> {
    await this.ensureDBReady()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get queue count
   */
  async getQueueCount(): Promise<number> {
    await this.ensureDBReady()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove operation from queue
   */
  private async removeOperation(id: string): Promise<void> {
    await this.ensureDBReady()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Update operation (for retry count)
   */
  private async updateOperation(operation: QueuedOperation): Promise<void> {
    await this.ensureDBReady()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(operation)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Sync all queued operations
   */
  async syncAll(): Promise<SyncResult[]> {
    if (this.syncInProgress) {
      return []
    }

    if (!navigator.onLine) {
      return []
    }

    this.syncInProgress = true
    this.notifyListeners('Sync started')

    try {
      const operations = await this.getAllOperations()
      
      // Sort by priority (higher first) then by timestamp (older first)
      const sortedOps = operations.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return a.timestamp - b.timestamp
      })

      const results: SyncResult[] = []

      for (const op of sortedOps) {
        const result = await this.syncOperation(op)
        results.push(result)
      }

      this.notifyListeners(`Sync completed: ${results.filter(r => r.success).length}/${results.length} successful`)
      
      return results
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: QueuedOperation): Promise<SyncResult> {
    try {
      const response = await fetch(operation.endpoint, {
        method: operation.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operation.data)
      })

      if (response.ok) {
        await this.removeOperation(operation.id)
        return { success: true, operationId: operation.id }
      } else {
        // Retry logic
        if (operation.retryCount < operation.maxRetries) {
          operation.retryCount++
          await this.updateOperation(operation)
          return { 
            success: false, 
            operationId: operation.id, 
            error: `Failed, will retry (${operation.retryCount}/${operation.maxRetries})` 
          }
        } else {
          await this.removeOperation(operation.id)
          return { 
            success: false, 
            operationId: operation.id, 
            error: 'Max retries reached, operation discarded' 
          }
        }
      }
    } catch (error) {
      // Network error, keep in queue
      if (operation.retryCount < operation.maxRetries) {
        operation.retryCount++
        await this.updateOperation(operation)
      }
      return { 
        success: false, 
        operationId: operation.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.notifyListeners('Connection restored')
      setTimeout(() => this.syncAll(), 1000)
    })

    window.addEventListener('offline', () => {
      this.notifyListeners('Connection lost - operations will be queued')
    })
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine
  }

  /**
   * Subscribe to sync status updates
   */
  subscribe(listener: (status: string) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(status: string): void {
    this.listeners.forEach(listener => listener(status))
  }

  /**
   * Ensure DB is ready
   */
  private async ensureDBReady(): Promise<void> {
    if (!this.db) {
      await this.initializeDB()
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Convenience methods for common operations
   */
  async queueAssignmentSubmission(assignmentId: string, studentId: string, fileUrl: string, fileName: string): Promise<string> {
    return this.queueOperation({
      type: 'assignment_submit',
      endpoint: '/api/assignments/submit-direct',
      method: 'POST',
      data: { assignment_id: assignmentId, student_id: studentId, file_url: fileUrl, file_name: fileName },
      maxRetries: 3,
      priority: 10 // High priority
    })
  }

  async queueSeminarBooking(studentId: string, bookingDate: string, seminarTopic: string): Promise<string> {
    return this.queueOperation({
      type: 'seminar_booking',
      endpoint: '/api/seminar/book',
      method: 'POST',
      data: { student_id: studentId, booking_date: bookingDate, seminar_topic: seminarTopic },
      maxRetries: 3,
      priority: 8
    })
  }

  async queueProfileUpdate(userId: string, updates: any): Promise<string> {
    return this.queueOperation({
      type: 'profile_update',
      endpoint: '/api/students/update',
      method: 'PUT',
      data: { user_id: userId, ...updates },
      maxRetries: 2,
      priority: 5
    })
  }

  /**
   * Clear all queued operations (use with caution)
   */
  async clearQueue(): Promise<void> {
    await this.ensureDBReady()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        this.notifyListeners('Queue cleared')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineSyncService = OfflineSyncService.getInstance()
