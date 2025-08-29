/**
 * Upload Video View - CoreV2 Mental Health Platform
 * Allows users to upload and share mental health resources, testimonials, and educational content
 * HIPAA-compliant with privacy controls and content moderation
 */

import React, { useState, useRef, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useNotifications } from '../contexts/NotificationContext';
import { logger } from '../utils/logger';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface VideoUploadData {
  title: string;
  description: string;
  category: 'educational' | 'testimonial' | 'coping-strategy' | 'meditation' | 'therapy' | 'peer-support';
  tags: string[];
  isPrivate: boolean;
  allowComments: boolean;
  triggerWarnings: string[];
}

export interface UploadVideoViewProps {
  onUploadComplete?: (videoId: string) => void;
  onCancel?: () => void;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  className?: string;
}

const defaultAcceptedFormats = ['video/mp4', 'video/webm', 'video/ogg'];
const defaultMaxFileSize = 100; // 100MB

export const UploadVideoView: React.FC<UploadVideoViewProps> = ({
  onUploadComplete,
  onCancel,
  maxFileSize = defaultMaxFileSize,
  acceptedFormats = defaultAcceptedFormats,
  className = ''
}) => {
  // State management
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<VideoUploadData>({
    title: '',
    description: '',
    category: 'educational',
    tags: [],
    isPrivate: false,
    allowComments: true,
    triggerWarnings: []
  });
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError, showWarning } = useNotifications();

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `File format not supported. Please use: ${acceptedFormats.join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size too large. Maximum size is ${maxFileSize}MB`;
    }
    
    return null;
  }, [acceptedFormats, maxFileSize]);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      showError(validationError);
      return;
    }

    setVideoFile(file);
    setError(null);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Auto-generate title from filename
    if (!uploadData.title) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
      setUploadData(prev => ({
        ...prev,
        title: nameWithoutExtension.replace(/[-_]/g, ' ')
      }));
    }
    
    logger.info('Video file selected:', { name: file.name, size: file.size, type: file.type });
  }, [validateFile, uploadData.title, showError]);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const syntheticEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Update upload data
  const updateUploadData = useCallback((updates: Partial<VideoUploadData>) => {
    setUploadData(prev => ({ ...prev, ...updates }));
  }, []);

  // Add tag
  const addTag = useCallback((tag: string) => {
    if (tag.trim() && !uploadData.tags.includes(tag.trim())) {
      updateUploadData({
        tags: [...uploadData.tags, tag.trim()]
      });
    }
  }, [uploadData.tags, updateUploadData]);

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    updateUploadData({
      tags: uploadData.tags.filter(tag => tag !== tagToRemove)
    });
  }, [uploadData.tags, updateUploadData]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!videoFile || !uploadData.title.trim()) {
      showError('Please select a video file and provide a title');
      return;
    }

    try {
      setStatus('uploading');
      setError(null);
      setUploadProgress(0);

      // Create form data
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', uploadData.title.trim());
      formData.append('description', uploadData.description.trim());
      formData.append('category', uploadData.category);
      formData.append('tags', JSON.stringify(uploadData.tags));
      formData.append('isPrivate', uploadData.isPrivate.toString());
      formData.append('allowComments', uploadData.allowComments.toString());
      formData.append('triggerWarnings', JSON.stringify(uploadData.triggerWarnings));

      // Upload with progress tracking
      const response = await apiService.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Note: Progress tracking would need to be implemented in apiService
        onUploadProgress: (progressEvent: ProgressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (response.success && response.data) {
        setStatus('processing');
        showSuccess('Video uploaded successfully! Processing in background...');
        
        // Wait a moment then mark as success
        setTimeout(() => {
          setStatus('success');
          onUploadComplete?.(response.data.id);
          logger.info('Video upload completed:', response.data);
        }, 1000);
      } else {
        throw new Error(response.message || 'Upload failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      setStatus('error');
      showError(`Upload failed: ${errorMessage}`);
      logger.error('Video upload failed:', error);
    }
  }, [videoFile, uploadData, showSuccess, showError, onUploadComplete]);

  // Reset form
  const handleReset = useCallback(() => {
    setVideoFile(null);
    setPreviewUrl(null);
    setUploadData({
      title: '',
      description: '',
      category: 'educational',
      tags: [],
      isPrivate: false,
      allowComments: true,
      triggerWarnings: []
    });
    setStatus('idle');
    setUploadProgress(0);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isUploading = status === 'uploading' || status === 'processing';
  const canUpload = videoFile && uploadData.title.trim() && status === 'idle';

  return (
    <div className={`upload-video-view ${className}`}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share Your Story
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload videos to help others on their mental health journey. Share educational content, 
            personal testimonials, or coping strategies in a safe, supportive environment.
          </p>
        </div>

        {/* Upload Status */}
        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-green-600 text-lg font-semibold mb-2">
              ✅ Upload Successful!
            </div>
            <p className="text-green-700">
              Your video has been uploaded and is being processed. It will be available shortly.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 font-semibold mb-1">Upload Error</div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* File Upload Area */}
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
          <div
            className="text-center cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="space-y-4">
                <video
                  src={previewUrl}
                  controls
                  className="max-w-md mx-auto rounded-lg shadow-md"
                  style={{ maxHeight: '300px' }}
                />
                <div className="text-sm text-gray-600">
                  {videoFile?.name} ({Math.round((videoFile?.size || 0) / 1024 / 1024)}MB)
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="text-red-600 hover:text-red-800 text-sm underline"
                  disabled={isUploading}
                >
                  Remove Video
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl text-gray-400">📹</div>
                <div>
                  <div className="text-lg font-semibold text-gray-700 mb-2">
                    Choose a video file or drag it here
                  </div>
                  <div className="text-sm text-gray-500">
                    Supported formats: {acceptedFormats.join(', ')}<br />
                    Maximum size: {maxFileSize}MB
                  </div>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-700 font-semibold">
                {status === 'uploading' ? 'Uploading...' : 'Processing...'}
              </span>
              <span className="text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Video Details Form */}
        {videoFile && status !== 'success' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Video Details
            </h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={uploadData.title}
                onChange={(e) => updateUploadData({ title: e.target.value })}
                placeholder="Give your video a descriptive title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUploading}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={uploadData.description}
                onChange={(e) => updateUploadData({ description: e.target.value })}
                placeholder="Describe what your video is about and how it might help others..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUploading}
                maxLength={500}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={uploadData.category}
                onChange={(e) => updateUploadData({ category: e.target.value as VideoUploadData['category'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUploading}
              >
                <option value="educational">Educational</option>
                <option value="testimonial">Personal Testimonial</option>
                <option value="coping-strategy">Coping Strategy</option>
                <option value="meditation">Meditation/Mindfulness</option>
                <option value="therapy">Therapy Techniques</option>
                <option value="peer-support">Peer Support</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {uploadData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                      disabled={isUploading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tags (press Enter)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUploading}
              />
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Privacy & Safety</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={uploadData.isPrivate}
                  onChange={(e) => updateUploadData({ isPrivate: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isUploading}
                />
                <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
                  Keep this video private (only visible to you)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowComments"
                  checked={uploadData.allowComments}
                  onChange={(e) => updateUploadData({ allowComments: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isUploading}
                />
                <label htmlFor="allowComments" className="ml-2 text-sm text-gray-700">
                  Allow comments on this video
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {videoFile && status !== 'success' && (
          <div className="flex justify-between items-center">
            <button
              onClick={onCancel || handleReset}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isUploading}
            >
              {onCancel ? 'Cancel' : 'Reset'}
            </button>
            
            <button
              onClick={handleUpload}
              disabled={!canUpload || isUploading}
              className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        )}

        {/* Success Actions */}
        {status === 'success' && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Upload Another
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadVideoView;
