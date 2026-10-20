import { useState, useCallback } from 'react';
import { uploadsApi } from '@/lib/api/uploads.api';
import * as ImageManipulator from 'expo-image-manipulator';

export interface UploadedPhoto {
  localUri: string;
  fileId: string;
  publicUrl: string;
  thumbnailUri?: string;
}

export function useUploads() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(async (uri: string): Promise<UploadedPhoto> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    try {
      // Resize to max 1920px
      const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fileName = `garment_${Date.now()}.jpg`;
      const result = await uploadsApi.uploadImage(resized.uri, fileName, 'image/jpeg', setProgress);

      return { localUri: resized.uri, fileId: result.fileId, publicUrl: result.publicUrl };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadPhoto, isUploading, progress, error };
}
