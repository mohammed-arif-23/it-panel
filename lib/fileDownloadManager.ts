import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface DownloadResult {
  success: boolean;
  path?: string;
  uri?: string;
  error?: string;
}

export class FileDownloadManager {
  private static instance: FileDownloadManager;

  static getInstance(): FileDownloadManager {
    if (!FileDownloadManager.instance) {
      FileDownloadManager.instance = new FileDownloadManager();
    }
    return FileDownloadManager.instance;
  }

  private constructor() {}

  /**
   * Download a file with proper Android scoped storage handling
   */
  async downloadFile(fileName: string, base64Data: string): Promise<DownloadResult> {
    if (!Capacitor.isNativePlatform()) {
      // For web, trigger browser download
      return this.downloadFileWeb(fileName, base64Data);
    }

    // For native platforms, try multiple strategies
    return this.downloadFileNative(fileName, base64Data);
  }

  private async downloadFileNative(fileName: string, base64Data: string): Promise<DownloadResult> {
    const strategies = [
      // Strategy 1: Try app's cache directory (always works)
      { directory: Directory.Cache, path: fileName },
      // Strategy 2: Try app's data directory
      { directory: Directory.Data, path: fileName },
      // Strategy 3: Try documents directory (may work on some devices)
      { directory: Directory.Documents, path: fileName },
      // Strategy 4: Try external storage (legacy Android)
      { directory: Directory.ExternalStorage, path: `Download/${fileName}` },
    ];

    for (const strategy of strategies) {
      try {
        console.log(`📁 Attempting to save file to directory: ${strategy.path}`);
        
        const result = await Filesystem.writeFile({
          path: strategy.path,
          data: base64Data,
          directory: strategy.directory,
          recursive: true
        });

        // Get the full URI for the saved file
        const uri = await Filesystem.getUri({
          directory: strategy.directory,
          path: strategy.path
        });

        console.log(`✅ File saved successfully to: ${uri.uri}`);
        
        return {
          success: true,
          path: strategy.path,
          uri: uri.uri
        };
      } catch (error) {
        console.warn(`❌ Failed to save to directory: ${error}`);
        continue;
      }
    }

    return {
      success: false,
      error: 'Failed to save file to any available directory'
    };
  }

  private async downloadFileWeb(fileName: string, base64Data: string): Promise<DownloadResult> {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        path: fileName
      };
    } catch (error) {
      return {
        success: false,
        error: `Web download failed: ${error}`
      };
    }
  }

  /**
   * Get available directories for file storage
   */
  async getAvailableDirectories(): Promise<string[]> {
    const available: string[] = [];
    const testData = 'test';

    const directories = [
      { dir: Directory.Cache, name: 'Cache' },
      { dir: Directory.Data, name: 'Data' },
      { dir: Directory.Documents, name: 'Documents' },
      { dir: Directory.ExternalStorage, name: 'ExternalStorage' }
    ];

    for (const { dir, name } of directories) {
      try {
        await Filesystem.writeFile({
          path: 'test_access.txt',
          data: testData,
          directory: dir
        });
        
        // Clean up test file
        await Filesystem.deleteFile({
          path: 'test_access.txt',
          directory: dir
        }).catch(() => {});
        
        available.push(name);
      } catch (error) {
        console.log(`Directory ${name} not accessible: ${error}`);
      }
    }

    return available;
  }

  /**
   * Show user-friendly success message with file location
   */
  getDownloadSuccessMessage(result: DownloadResult): string {
    if (!result.success) {
      return 'Download failed. Please check app permissions.';
    }

    if (Capacitor.isNativePlatform()) {
      if (result.uri?.includes('cache')) {
        return 'File downloaded to app cache. You can find it in your file manager under the app\'s cache folder.';
      } else if (result.uri?.includes('Documents')) {
        return 'File downloaded to Documents folder.';
      } else if (result.uri?.includes('Download')) {
        return 'File downloaded to Downloads folder.';
      } else {
        return 'File downloaded successfully to app storage.';
      }
    } else {
      return 'File downloaded to your browser\'s download folder.';
    }
  }
}

export const fileDownloadManager = FileDownloadManager.getInstance();
