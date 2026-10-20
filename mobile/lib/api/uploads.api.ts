import { apiClient } from './client';
import * as FileSystem from 'expo-file-system';

export interface PresignedUploadResponse {
  uploadId: string;
  uploadUrl: string;
  fileId: string;
  publicUrl: string;
}

export const uploadsApi = {
  getPresignedUrl: async (fileName: string, mimeType: string): Promise<PresignedUploadResponse> => {
    const { data } = await apiClient.post<PresignedUploadResponse>('/uploads/presign', {
      fileName,
      mimeType,
    });
    return data;
  },

  uploadFile: async (
    uri: string,
    presignedUrl: string,
    mimeType: string,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    const callback = (uploadProgress: FileSystem.UploadProgressData) => {
      if (onProgress && uploadProgress.totalBytesExpectedToSend > 0) {
        const progress = uploadProgress.totalBytesSent / uploadProgress.totalBytesExpectedToSend;
        onProgress(progress);
      }
    };

    const uploadResumable = FileSystem.createUploadTask(
      presignedUrl,
      uri,
      {
        httpMethod: 'PUT',
        headers: { 'Content-Type': mimeType },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      },
      callback
    );

    await uploadResumable.uploadAsync();
  },

  uploadImage: async (
    uri: string,
    fileName: string,
    mimeType = 'image/jpeg',
    onProgress?: (progress: number) => void
  ): Promise<{ fileId: string; publicUrl: string }> => {
    const presigned = await uploadsApi.getPresignedUrl(fileName, mimeType);
    await uploadsApi.uploadFile(uri, presigned.uploadUrl, mimeType, onProgress);
    return { fileId: presigned.fileId, publicUrl: presigned.publicUrl };
  },
};
