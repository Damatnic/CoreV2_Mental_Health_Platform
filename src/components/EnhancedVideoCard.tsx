import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, MoreVertical, Heart, Share, Bookmark, Download } from 'lucide-react';

interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  duration: number;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  instructor?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  viewCount?: number;
  rating?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

interface EnhancedVideoCardProps {
  video: VideoMetadata;
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  showMetadata?: boolean;
  showActions?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onLike?: (videoId: string) => void;
  onBookmark?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  onDownload?: (videoId: string) => void;
  className?: string;
}

export const EnhancedVideoCard: React.FC<EnhancedVideoCardProps> = ({
  video,
  src,
  autoPlay = false,
  loop = false,
  muted = true,
  controls = true,
  showMetadata = true,
  showActions = true,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onLike,
  onBookmark,
  onShare,
  onDownload,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setHasStarted(true);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          await videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.warn('Fullscreen not supported:', error);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newTime = (clickX / rect.width) * video.duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Video event handlers
  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || video.duration;
    
    setCurrentTime(current);
    setProgress((current / duration) * 100);
    onTimeUpdate?.(current);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    onEnded?.();
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && !isHovering) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      controlsTimeoutRef.current = timeout;
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isHovering]);

  // Handle actions
  const handleLike = () => {
    onLike?.(video.id);
  };

  const handleBookmark = () => {
    onBookmark?.(video.id);
  };

  const handleShare = () => {
    onShare?.(video.id);
  };

  const handleDownload = () => {
    onDownload?.(video.id);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`enhanced-video-card relative bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Video Player */}
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <video
          ref={videoRef}
          src={src}
          poster={video.thumbnail}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="w-full aspect-video object-cover bg-gray-900"
        />

        {/* Play/Pause Overlay */}
        {!hasStarted && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
            onClick={togglePlayPause}
          >
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all">
              <Play className="w-6 h-6 text-gray-800 ml-1" />
            </div>
          </div>
        )}

        {/* Video Controls */}
        {controls && hasStarted && (
          <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* Main Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar */}
              <div 
                className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayPause}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <span className="text-white text-sm font-medium">
                    {formatDuration(currentTime)} / {formatDuration(video.duration)}
                  </span>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <Maximize className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Button */}
        {showActions && (
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-white" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50">
                  <button
                    onClick={handleLike}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${video.isLiked ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
                    <span className="text-sm">
                      {video.isLiked ? 'Unlike' : 'Like'}
                    </span>
                  </button>

                  <button
                    onClick={handleBookmark}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Bookmark className={`w-4 h-4 ${video.isBookmarked ? 'text-blue-500 fill-current' : 'text-gray-500'}`} />
                    <span className="text-sm">
                      {video.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    </span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Share className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Share</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t"
                  >
                    <Download className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Download</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Metadata */}
      {showMetadata && (
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
              {video.title}
            </h3>
            {video.difficulty && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(video.difficulty)}`}>
                {video.difficulty}
              </span>
            )}
          </div>

          {video.instructor && (
            <p className="text-sm text-gray-600 mb-2">
              with {video.instructor}
            </p>
          )}

          {video.description && (
            <p className="text-sm text-gray-700 line-clamp-3 mb-3">
              {video.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {video.viewCount !== undefined && (
                <span>{video.viewCount.toLocaleString()} views</span>
              )}
              {video.rating !== undefined && (
                <span className="flex items-center gap-1">
                  ⭐ {video.rating.toFixed(1)}
                </span>
              )}
            </div>
            <span>{formatDuration(video.duration)}</span>
          </div>

          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {video.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {video.tags.length > 3 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{video.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoCard;
