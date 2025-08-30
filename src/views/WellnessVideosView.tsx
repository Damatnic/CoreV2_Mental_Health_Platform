/**
 * Wellness Videos View
 * Video library for mental health and wellness content
 */

import * as React from 'react';
import { useState, useCallback } from 'react';

// Core interfaces
export interface WellnessVideo {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  videoUrl: string;
  category: 'meditation' | 'breathing' | 'yoga' | 'mindfulness' | 'sleep';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructor: string;
  views: number;
  likes: number;
  isBookmarked: boolean;
  isFree: boolean;
}

export interface WellnessVideosViewProps {
  selectedCategory?: WellnessVideo['category'];
  onVideoSelect?: (video: WellnessVideo) => void;
  onBookmark?: (videoId: string) => void;
  className?: string;
}

// Mock data
export const MOCK_WELLNESS_VIDEOS: WellnessVideo[] = [
  {
    id: 'video-1',
    title: '10-Minute Morning Meditation',
    description: 'Start your day with mindfulness and clarity',
    duration: 600,
    thumbnailUrl: '/thumbnails/morning-meditation.jpg',
    videoUrl: '/videos/morning-meditation.mp4',
    category: 'meditation',
    difficulty: 'beginner',
    instructor: 'Dr. Sarah Johnson',
    views: 1250,
    likes: 95,
    isBookmarked: false,
    isFree: true
  },
  {
    id: 'video-2',
    title: 'Breathing Exercises for Anxiety',
    description: 'Learn calming breathing techniques',
    duration: 480,
    thumbnailUrl: '/thumbnails/breathing-anxiety.jpg',
    videoUrl: '/videos/breathing-anxiety.mp4',
    category: 'breathing',
    difficulty: 'beginner',
    instructor: 'Michael Chen',
    views: 890,
    likes: 78,
    isBookmarked: true,
    isFree: true
  }
];

// Utility functions
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const getCategoryIcon = (category: WellnessVideo['category']): string => {
  const icons = {
    meditation: '🧘',
    breathing: '💨',
    yoga: '🧘‍♀️',
    mindfulness: '🌸',
    sleep: '😴'
  };
  return icons[category] || '📹';
};

export const filterVideosByCategory = (videos: WellnessVideo[], category?: WellnessVideo['category']): WellnessVideo[] => {
  if (!category) return videos;
  return videos.filter(video => video.category === category);
};

export const searchVideos = (videos: WellnessVideo[], query: string): WellnessVideo[] => {
  const lowercaseQuery = query.toLowerCase();
  return videos.filter(video => 
    video.title.toLowerCase().includes(lowercaseQuery) ||
    video.description.toLowerCase().includes(lowercaseQuery) ||
    video.instructor.toLowerCase().includes(lowercaseQuery)
  );
};

export const sortVideosByPopularity = (videos: WellnessVideo[]): WellnessVideo[] => {
  return [...videos].sort((a, b) => (b.views + b.likes) - (a.views + a.likes));
};

// Mock component
export const WellnessVideosView = {
  displayName: 'WellnessVideosView',
  defaultProps: {}
};

export default WellnessVideosView;











