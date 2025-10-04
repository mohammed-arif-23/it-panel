import { BackgroundTask } from '@capawesome/capacitor-background-task';
import { Capacitor } from '@capacitor/core';
import { offlineStorage } from './offlineStorage';

/**
 * Background sync service for syncing data when app is in background
 */
class BackgroundSyncService {
  private taskId = 'sync-data-task';

  /**
   * Initialize background sync
   */
  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Background sync not available on web');
      return;
    }

    try {
      // Schedule periodic background task
      await BackgroundTask.beforeExit(async () => {
        console.log('🔄 Running background sync...');
        
        // Sync pending submissions
        await this.syncPendingSubmissions();
        
        // Refresh cached data
        await this.refreshCachedData();
        
        // Finish the background task
        BackgroundTask.finish({ taskId: this.taskId });
      });

      console.log('✅ Background sync initialized');
    } catch (error) {
      console.error('❌ Error initializing background sync:', error);
    }
  }

  /**
   * Sync pending submissions to server
   */
  private async syncPendingSubmissions() {
    try {
      const pending = await offlineStorage.getPendingSubmissions();
      
      if (pending.length === 0) {
        console.log('No pending submissions to sync');
        return;
      }

      console.log(`Syncing ${pending.length} pending submissions...`);

      for (const submission of pending) {
        try {
          // Upload submission to server
          const response = await fetch('/api/assignments/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission),
          });

          if (response.ok) {
            console.log('✅ Submission synced:', submission.id);
          }
        } catch (error) {
          console.error('Failed to sync submission:', error);
        }
      }

      // Clear pending submissions after sync
      await offlineStorage.clearPendingSubmissions();
    } catch (error) {
      console.error('Error syncing pending submissions:', error);
    }
  }

  /**
   * Refresh cached data in background
   */
  private async refreshCachedData() {
    try {
      // Check if online
      if (!navigator.onLine) {
        console.log('Offline - skipping data refresh');
        return;
      }

      // Fetch fresh assignments
      const assignmentsRes = await fetch('/api/assignments');
      if (assignmentsRes.ok) {
        const assignments = await assignmentsRes.json();
        await offlineStorage.cacheAssignments(assignments);
        console.log('✅ Assignments cached');
      }

      // Fetch fresh notices
      const noticesRes = await fetch('/api/notices');
      if (noticesRes.ok) {
        const notices = await noticesRes.json();
        await offlineStorage.cacheNotices(notices);
        console.log('✅ Notices cached');
      }
    } catch (error) {
      console.error('Error refreshing cached data:', error);
    }
  }

  /**
   * Manually trigger sync
   */
  async manualSync() {
    console.log('🔄 Manual sync triggered');
    await this.syncPendingSubmissions();
    await this.refreshCachedData();
  }
}

export const backgroundSync = new BackgroundSyncService();
