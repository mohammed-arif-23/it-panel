import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Capacitor } from '@capacitor/core';

export interface PickedFile {
  blob: Blob;
  name: string;
  mimeType: string;
  dataUrl?: string;
}

/**
 * Pick image from camera or gallery (native app only)
 */
export async function pickImage(): Promise<PickedFile | null> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not in native app, using web file picker');
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Shows camera/gallery choice
    });

    if (!image.webPath) return null;

    // Convert to blob
    const response = await fetch(image.webPath);
    const blob = await response.blob();

    return {
      blob,
      name: `photo_${Date.now()}.${image.format || 'jpg'}`,
      mimeType: `image/${image.format || 'jpeg'}`,
      dataUrl: image.webPath,
    };
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
}

/**
 * Pick document/PDF file (native app only)
 */
export async function pickDocument(): Promise<PickedFile | null> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not in native app, using web file picker');
    return null;
  }

  try {
    const result = await FilePicker.pickFiles({
      types: ['application/pdf', 'image/*'],
      readData: true, // Read file data
    });

    if (!result.files || result.files.length === 0) return null;

    const file = result.files[0];

    // Convert base64 to blob
    const base64Data = file.data;
    if (!base64Data) return null;

    const blob = base64ToBlob(base64Data, file.mimeType);

    return {
      blob,
      name: file.name,
      mimeType: file.mimeType,
    };
  } catch (error) {
    console.error('Error picking document:', error);
    return null;
  }
}

/**
 * Pick multiple images
 */
export async function pickMultipleImages(): Promise<PickedFile[]> {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }

  try {
    const result = await FilePicker.pickImages({
      readData: true,
    });

    if (!result.files) return [];

    const files: PickedFile[] = [];

    for (const file of result.files) {
      if (file.data) {
        const blob = base64ToBlob(file.data, file.mimeType);
        files.push({
          blob,
          name: file.name,
          mimeType: file.mimeType,
        });
      }
    }

    return files;
  } catch (error) {
    console.error('Error picking multiple images:', error);
    return [];
  }
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Check if native file picker is available
 */
export function isNativePickerAvailable(): boolean {
  return Capacitor.isNativePlatform();
}
