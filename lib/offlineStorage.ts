import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

interface CacheData<T> {
  data: T;
  timestamp: number;
  expiresIn?: number; // milliseconds
}

/**
 * Offline storage service using Capacitor Preferences
 */
class OfflineStorageService {
  private readonly prefix = 'dynamit_';

  /**
   * Save data to offline storage
   */
  async set<T>(key: string, value: T, expiresIn?: number): Promise<void> {
    const cacheData: CacheData<T> = {
      data: value,
      timestamp: Date.now(),
      expiresIn,
    };

    await Preferences.set({
      key: this.prefix + key,
      value: JSON.stringify(cacheData),
    });
  }

  /**
   * Get data from offline storage
   */
  async get<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key: this.prefix + key });
    
    if (!value) return null;

    try {
      const cacheData: CacheData<T> = JSON.parse(value);
      
      // Check if data has expired
      if (cacheData.expiresIn) {
        const isExpired = Date.now() - cacheData.timestamp > cacheData.expiresIn;
        if (isExpired) {
          await this.remove(key);
          return null;
        }
      }

      return cacheData.data;
    } catch (error) {
      console.error('Error parsing cached data:', error);
      return null;
    }
  }

  /**
   * Remove data from offline storage
   */
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key: this.prefix + key });
  }

  /**
   * Clear all offline data
   */
  async clear(): Promise<void> {
    await Preferences.clear();
  }

  /**
   * Cache assignments for offline access
   */
  async cacheAssignments(assignments: any[]): Promise<void> {
    await this.set('assignments', assignments, 1000 * 60 * 60 * 24); // 24 hours
  }

  /**
   * Get cached assignments
   */
  async getCachedAssignments(): Promise<any[] | null> {
    return await this.get<any[]>('assignments');
  }

  /**
   * Cache notices for offline access
   */
  async cacheNotices(notices: any[]): Promise<void> {
    await this.set('notices', notices, 1000 * 60 * 60 * 24); // 24 hours
  }

  /**
   * Get cached notices
   */
  async getCachedNotices(): Promise<any[] | null> {
    return await this.get<any[]>('notices');
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(profile: any): Promise<void> {
    await this.set('user_profile', profile);
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile(): Promise<any | null> {
    return await this.get('user_profile');
  }

  /**
   * Save pending submission for later sync
   */
  async savePendingSubmission(submission: any): Promise<void> {
    const pending = await this.get<any[]>('pending_submissions') || [];
    pending.push({
      ...submission,
      savedAt: Date.now(),
    });
    await this.set('pending_submissions', pending);
  }

  /**
   * Get pending submissions
   */
  async getPendingSubmissions(): Promise<any[]> {
    return await this.get<any[]>('pending_submissions') || [];
  }

  /**
   * Clear pending submissions after successful sync
   */
  async clearPendingSubmissions(): Promise<void> {
    await this.remove('pending_submissions');
  }

  /**
   * Check if app is offline
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }
}

export const offlineStorage = new OfflineStorageService();
