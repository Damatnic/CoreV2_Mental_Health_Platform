/**
 * Custom Hook for HIPAA-Compliant File Upload
 * 
 * Provides a clean interface for components to interact with the file upload service
 * Handles state management, progress tracking, and error handling
 * 
 * @version 1.0.0
 * @security HIPAA Compliant
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fileUploadService,
  FileCategory,
  FileMetadata,
  UploadProgress,
  StorageQuota
} from '../services/fileUploadService';

/**
 * Hook configuration options
 */
interface UseFileUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (metadata: FileMetadata) => void;
  onError?: (error: Error) => void;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Hook return type
 */
interface UseFileUploadReturn {
  uploadFile: (file: File, category: FileCategory) => Promise<FileMetadata>;
  uploadMultiple: (files: File[], category: FileCategory) => Promise<FileMetadata[]>;
  downloadFile: (fileId: string, purpose?: string) => Promise<Blob>;
  deleteFile: (fileId: string) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  retryUpload: (fileId: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  uploadQueue: UploadProgress[];
  recentUploads: FileMetadata[];
  errors: Map<string, Error>;
  quota: StorageQuota | null;
  refreshQuota: () => Promise<void>;
  clearErrors: () => void;
  clearRecentUploads: () => void;
}

/**
 * Upload queue item
 */
interface QueueItem {
  file: File;
  category: FileCategory;
  fileId: string;
  retryCount: number;
}

/**
 * Custom hook for file upload functionality
 */
export function useFileUpload(
  userId: string,
  options: UseFileUploadOptions = {}
): UseFileUploadReturn {
  // Configuration
  const {
    onProgress,
    onComplete,
    onError,
    autoRetry = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  // State management
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [recentUploads, setRecentUploads] = useState<FileMetadata[]>([]);
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());
  const [quota, setQuota] = useState<StorageQuota | null>(null);

  // Refs for tracking
  const uploadQueueRef = useRef<Map<string, QueueItem>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize and fetch user quota
   */
  useEffect(() => {
    refreshQuota();
    
    // Set up progress monitoring
    progressIntervalRef.current = setInterval(() => {
      updateProgressFromService();
    }, 100);

    return () => {
      // Cleanup on unmount
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Cancel any ongoing uploads
      abortControllersRef.current.forEach(controller => controller.abort());
    };
  }, [userId]);

  /**
   * Refresh user storage quota
   */
  const refreshQuota = useCallback(async () => {
    try {
      const userQuota = fileUploadService.getUserQuota(userId);
      setQuota(userQuota);
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    }
  }, [userId]);

  /**
   * Update progress from service
   */
  const updateProgressFromService = useCallback(() => {
    const currentQueue: UploadProgress[] = [];
    
    uploadQueueRef.current.forEach((item) => {
      const progress = fileUploadService.getUploadProgress(item.fileId);
      if (progress) {
        currentQueue.push(progress);
        
        // Update main progress if this is the active upload
        if (isUploading && uploadProgress?.fileId === progress.fileId) {
          setUploadProgress(progress);
          
          // Call progress callback
          if (onProgress) {
            onProgress(progress);
          }
        }
      }
    });
    
    setUploadQueue(currentQueue);
  }, [isUploading, uploadProgress, onProgress]);

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(async (
    file: File,
    category: FileCategory
  ): Promise<FileMetadata> => {
    const fileId = generateFileId();
    
    try {
      setIsUploading(true);
      
      // Add to queue
      const queueItem: QueueItem = {
        file,
        category,
        fileId,
        retryCount: 0
      };
      uploadQueueRef.current.set(fileId, queueItem);
      
      // Create abort controller
      const abortController = new AbortController();
      abortControllersRef.current.set(fileId, abortController);
      
      // Start upload
      const metadata = await fileUploadService.uploadFile(
        file,
        category,
        userId,
        {
          id: fileId
        }
      );
      
      // Add to recent uploads
      setRecentUploads(prev => [metadata, ...prev].slice(0, 10));
      
      // Clear from queue
      uploadQueueRef.current.delete(fileId);
      abortControllersRef.current.delete(fileId);
      
      // Refresh quota
      await refreshQuota();
      
      // Call complete callback
      if (onComplete) {
        onComplete(metadata);
      }
      
      return metadata;
      
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      
      // Store error
      setErrors(prev => new Map(prev).set(fileId, uploadError));
      
      // Handle retry logic
      if (autoRetry && shouldRetry(fileId)) {
        await retryUpload(fileId);
      } else {
        // Remove from queue if max retries reached
        uploadQueueRef.current.delete(fileId);
        abortControllersRef.current.delete(fileId);
        
        // Call error callback
        if (onError) {
          onError(uploadError);
        }
      }
      
      throw uploadError;
      
    } finally {
      // Check if there are more files in queue
      if (uploadQueueRef.current.size === 0) {
        setIsUploading(false);
        setUploadProgress(null);
      }
    }
  }, [userId, autoRetry, maxRetries, onComplete, onError, refreshQuota]);

  /**
   * Upload multiple files
   */
  const uploadMultiple = useCallback(async (
    files: File[],
    category: FileCategory
  ): Promise<FileMetadata[]> => {
    const results: FileMetadata[] = [];
    const errors: Error[] = [];
    
    // Process files in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];
    
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      chunks.push(files.slice(i, i + concurrencyLimit));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(file => 
        uploadFile(file, category)
          .then(metadata => {
            results.push(metadata);
            return metadata;
          })
          .catch(error => {
            errors.push(error);
            return null;
          })
      );
      
      await Promise.all(promises);
    }
    
    if (errors.length > 0 && errors.length === files.length) {
      throw new Error(`All uploads failed: ${errors.map(e => e.message).join(', ')}`);
    }
    
    return results;
  }, [uploadFile]);

  /**
   * Download a file
   */
  const downloadFile = useCallback(async (
    fileId: string,
    purpose?: string
  ): Promise<Blob> => {
    try {
      const { file } = await fileUploadService.downloadFile(fileId, userId, purpose);
      return file;
    } catch (error) {
      const downloadError = error instanceof Error ? error : new Error('Download failed');
      
      if (onError) {
        onError(downloadError);
      }
      
      throw downloadError;
    }
  }, [userId, onError]);

  /**
   * Delete a file
   */
  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    try {
      await fileUploadService.deleteFile(fileId, userId);
      
      // Remove from recent uploads
      setRecentUploads(prev => prev.filter(f => f.id !== fileId));
      
      // Refresh quota
      await refreshQuota();
      
    } catch (error) {
      const deleteError = error instanceof Error ? error : new Error('Delete failed');
      
      if (onError) {
        onError(deleteError);
      }
      
      throw deleteError;
    }
  }, [userId, onError, refreshQuota]);

  /**
   * Cancel an upload
   */
  const cancelUpload = useCallback((fileId: string) => {
    // Abort the upload
    const controller = abortControllersRef.current.get(fileId);
    if (controller) {
      controller.abort();
    }
    
    // Remove from queue
    uploadQueueRef.current.delete(fileId);
    abortControllersRef.current.delete(fileId);
    
    // Update state
    setUploadQueue(prev => prev.filter(p => p.fileId !== fileId));
    
    if (uploadProgress?.fileId === fileId) {
      setUploadProgress(null);
    }
    
    // Check if any uploads remaining
    if (uploadQueueRef.current.size === 0) {
      setIsUploading(false);
    }
  }, [uploadProgress]);

  /**
   * Retry a failed upload
   */
  const retryUpload = useCallback(async (fileId: string): Promise<void> => {
    const queueItem = uploadQueueRef.current.get(fileId);
    if (!queueItem) {
      throw new Error('Upload not found in queue');
    }
    
    // Increment retry count
    queueItem.retryCount++;
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, retryDelay * queueItem.retryCount));
    
    // Clear error
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(fileId);
      return newErrors;
    });
    
    // Retry upload
    try {
      await uploadFile(queueItem.file, queueItem.category);
    } catch (error) {
      // Error handling is done in uploadFile
      throw error;
    }
  }, [uploadFile, retryDelay]);

  /**
   * Check if should retry upload
   */
  const shouldRetry = useCallback((fileId: string): boolean => {
    const queueItem = uploadQueueRef.current.get(fileId);
    return queueItem ? queueItem.retryCount < maxRetries : false;
  }, [maxRetries]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors(new Map());
  }, []);

  /**
   * Clear recent uploads
   */
  const clearRecentUploads = useCallback(() => {
    setRecentUploads([]);
  }, []);

  /**
   * Generate unique file ID
   */
  const generateFileId = (): string => {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  return {
    uploadFile,
    uploadMultiple,
    downloadFile,
    deleteFile,
    cancelUpload,
    retryUpload,
    isUploading,
    uploadProgress,
    uploadQueue,
    recentUploads,
    errors,
    quota,
    refreshQuota,
    clearErrors,
    clearRecentUploads
  };
}

// Export types for external use
export type { UseFileUploadOptions, UseFileUploadReturn };