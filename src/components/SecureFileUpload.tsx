/**
 * HIPAA-Compliant Secure File Upload Component
 * 
 * Provides a user-friendly interface for uploading medical documents with:
 * - Drag-and-drop functionality
 * - Real-time progress indicators
 * - File preview capabilities
 * - Encryption status display
 * - Accessibility support (WCAG 2.1 AA)
 * 
 * @version 1.0.0
 * @security HIPAA Compliant
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  FileCategory, 
  FileMetadata, 
  UploadProgress,
  fileUploadService 
} from '../services/fileUploadService';
import { useFileUpload } from '../hooks/useFileUpload';

/**
 * Component props
 */
interface SecureFileUploadProps {
  category: FileCategory;
  userId: string;
  maxFiles?: number;
  onUploadComplete?: (metadata: FileMetadata) => void;
  onUploadError?: (error: Error) => void;
  allowMultiple?: boolean;
  autoUpload?: boolean;
  showPreview?: boolean;
  className?: string;
}

/**
 * File preview data
 */
interface FilePreview {
  file: File;
  preview: string | null;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: UploadProgress;
  metadata?: FileMetadata;
  error?: string;
}

/**
 * Secure File Upload Component
 */
export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  category,
  userId,
  maxFiles = 10,
  onUploadComplete,
  onUploadError,
  allowMultiple = true,
  autoUpload = false,
  showPreview = true,
  className = ''
}) => {
  // State management
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Custom hook for file upload logic
  const { 
    uploadFile, 
    cancelUpload, 
    isUploading,
    uploadProgress,
    quota 
  } = useFileUpload(userId);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: FilePreview[] = [];
    const fileArray = Array.from(selectedFiles);

    // Check file count limit
    if (files.length + fileArray.length > maxFiles) {
      setErrorMessage(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Process each file
    fileArray.forEach(file => {
      // Create preview for images
      let preview: string | null = null;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      newFiles.push({
        file,
        preview,
        status: 'pending'
      });
    });

    // Update state
    setFiles(prev => [...prev, ...newFiles]);
    setErrorMessage(null);

    // Auto upload if enabled
    if (autoUpload) {
      newFiles.forEach(filePreview => {
        handleUpload(filePreview);
      });
    }
  }, [files.length, maxFiles, autoUpload]);

  /**
   * Handle file upload
   */
  const handleUpload = useCallback(async (filePreview: FilePreview) => {
    try {
      setUploadingCount(prev => prev + 1);
      
      // Update file status
      updateFileStatus(filePreview.file.name, 'uploading');

      // Upload file
      const metadata = await uploadFile(filePreview.file, category);

      // Update file with metadata
      updateFileMetadata(filePreview.file.name, metadata);
      updateFileStatus(filePreview.file.name, 'completed');

      // Callback
      if (onUploadComplete) {
        onUploadComplete(metadata);
      }

      // Show success message
      setSuccessMessage(`${filePreview.file.name} uploaded successfully`);
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (error) {
      // Update file status
      updateFileStatus(filePreview.file.name, 'error');
      updateFileError(filePreview.file.name, error instanceof Error ? error.message : 'Upload failed');

      // Callback
      if (onUploadError) {
        onUploadError(error instanceof Error ? error : new Error('Upload failed'));
      }

      // Show error message
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingCount(prev => prev - 1);
    }
  }, [category, uploadFile, onUploadComplete, onUploadError]);

  /**
   * Update file status
   */
  const updateFileStatus = (fileName: string, status: FilePreview['status']) => {
    setFiles(prev => prev.map(f => 
      f.file.name === fileName ? { ...f, status } : f
    ));
  };

  /**
   * Update file metadata
   */
  const updateFileMetadata = (fileName: string, metadata: FileMetadata) => {
    setFiles(prev => prev.map(f => 
      f.file.name === fileName ? { ...f, metadata } : f
    ));
  };

  /**
   * Update file error
   */
  const updateFileError = (fileName: string, error: string) => {
    setFiles(prev => prev.map(f => 
      f.file.name === fileName ? { ...f, error } : f
    ));
  };

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  /**
   * Remove file from list
   */
  const removeFile = useCallback((fileName: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.file.name === fileName);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.file.name !== fileName);
    });
  }, []);

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  /**
   * Get category display name
   */
  const getCategoryDisplayName = (cat: FileCategory): string => {
    const names: Record<FileCategory, string> = {
      [FileCategory.MEDICAL_RECORD]: 'Medical Record',
      [FileCategory.THERAPY_NOTE]: 'Therapy Note',
      [FileCategory.PRESCRIPTION]: 'Prescription',
      [FileCategory.INSURANCE_CARD]: 'Insurance Card',
      [FileCategory.LAB_RESULT]: 'Lab Result',
      [FileCategory.IMAGING]: 'Medical Imaging',
      [FileCategory.CONSENT_FORM]: 'Consent Form',
      [FileCategory.ASSESSMENT]: 'Assessment',
      [FileCategory.TREATMENT_PLAN]: 'Treatment Plan',
      [FileCategory.DISCHARGE_SUMMARY]: 'Discharge Summary'
    };
    return names[cat] || cat;
  };

  /**
   * Get file icon based on type
   */
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  /**
   * Clean up previews on unmount
   */
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // Update progress for uploading files
  useEffect(() => {
    if (uploadProgress) {
      setFiles(prev => prev.map(f => {
        if (f.status === 'uploading' && uploadProgress.fileName === f.file.name) {
          return { ...f, progress: uploadProgress };
        }
        return f;
      }));
    }
  }, [uploadProgress]);

  return (
    <div className={`secure-file-upload ${className}`}>
      {/* Header */}
      <div className="upload-header">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upload {getCategoryDisplayName(category)}
        </h3>
        
        {/* Storage Quota Display */}
        {quota && (
          <div className="quota-display mt-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Storage Used:</span>
              <span>{formatFileSize(quota.used)} / {formatFileSize(quota.total)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(quota.used / quota.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        className={`
          drop-zone mt-4 p-8 border-2 border-dashed rounded-lg text-center
          transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="File upload drop zone"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
      >
        {/* Upload Icon */}
        <div className="upload-icon mb-4">
          <svg 
            className="w-12 h-12 mx-auto text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
        </div>

        {/* Instructions */}
        <p className="text-gray-600 dark:text-gray-400">
          {isDragging ? (
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              Drop files here to upload
            </span>
          ) : (
            <>
              Drag and drop files here, or{' '}
              <span className="text-blue-600 dark:text-blue-400 underline">
                browse
              </span>
            </>
          )}
        </p>

        {/* File type hint */}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Supported formats: PDF, JPG, PNG, DOC
        </p>

        {/* Security badge */}
        <div className="security-badge mt-4 inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs">
          <svg 
            className="w-3 h-3 mr-1" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
          Files are encrypted before upload
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={allowMultiple}
        onChange={handleFileInputChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
        aria-label="File input"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="file-list mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Files ({files.length}/{maxFiles})
          </h4>
          
          {files.map((filePreview) => (
            <div 
              key={filePreview.file.name}
              className="file-item p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                {/* File Preview */}
                {showPreview && filePreview.preview && (
                  <div className="file-preview flex-shrink-0">
                    <img 
                      src={filePreview.preview} 
                      alt={`Preview of ${filePreview.file.name}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                )}
                
                {/* File icon if no preview */}
                {(!showPreview || !filePreview.preview) && (
                  <div className="file-icon flex-shrink-0 text-2xl">
                    {getFileIcon(filePreview.file.type)}
                  </div>
                )}

                {/* File Info */}
                <div className="file-info flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {filePreview.file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(filePreview.file.size)}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {/* Upload button */}
                      {filePreview.status === 'pending' && !autoUpload && (
                        <button
                          onClick={() => handleUpload(filePreview)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          disabled={isUploading}
                        >
                          Upload
                        </button>
                      )}
                      
                      {/* Remove button */}
                      {filePreview.status !== 'uploading' && (
                        <button
                          onClick={() => removeFile(filePreview.file.name)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          aria-label={`Remove ${filePreview.file.name}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Display */}
                  <div className="mt-2">
                    {/* Uploading Progress */}
                    {filePreview.status === 'uploading' && filePreview.progress && (
                      <div className="upload-progress">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            {filePreview.progress.status === 'encrypting' && '🔐 Encrypting...'}
                            {filePreview.progress.status === 'uploading' && '📤 Uploading...'}
                            {filePreview.progress.status === 'scanning' && '🔍 Scanning for viruses...'}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {filePreview.progress.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${filePreview.progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Success Status */}
                    {filePreview.status === 'completed' && (
                      <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Uploaded successfully (Encrypted)
                      </div>
                    )}

                    {/* Error Status */}
                    {filePreview.status === 'error' && filePreview.error && (
                      <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {filePreview.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload All Button */}
      {!autoUpload && files.some(f => f.status === 'pending') && (
        <div className="mt-4">
          <button
            onClick={() => {
              files.filter(f => f.status === 'pending').forEach(handleUpload);
            }}
            disabled={isUploading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : `Upload All Files (${files.filter(f => f.status === 'pending').length})`}
          </button>
        </div>
      )}

      {/* Messages */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Style tag for component-specific styles */}
      <style jsx>{`
        .secure-file-upload {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        
        .drop-zone:focus {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }
        
        .file-item {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .file-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        @media (max-width: 640px) {
          .drop-zone {
            padding: 1.5rem;
          }
          
          .file-preview img {
            width: 3rem;
            height: 3rem;
          }
        }
      `}</style>
    </div>
  );
};

// Export component and types
export default SecureFileUpload;
export type { SecureFileUploadProps, FilePreview };