import React, { useState, useEffect } from 'react';
import { User, Heart, Shield, Star, Crown, Zap, Camera, Edit3 } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded' | 'square';
  fallback?: React.ReactNode;
  initials?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showBadge?: boolean;
  badge?: 'verified' | 'helper' | 'moderator' | 'premium' | 'crisis_responder' | 'therapist';
  showBorder?: boolean;
  borderColor?: string;
  interactive?: boolean;
  onClick?: () => void;
  onUpload?: (file: File) => void;
  editable?: boolean;
  loading?: boolean;
  className?: string;
  
  // Mental health specific props
  mood?: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';
  supportLevel?: 'seeking' | 'offering' | 'both';
  anonymousMode?: boolean;
  crisisMode?: boolean;
  
  // Accessibility props
  ariaLabel?: string;
  role?: string;
  tabIndex?: number;
}

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  size: 'xs' | 'sm' | 'md' | 'lg';
}

interface BadgeProps {
  type: 'verified' | 'helper' | 'moderator' | 'premium' | 'crisis_responder' | 'therapist';
  size: 'xs' | 'sm' | 'md' | 'lg';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size }) => {
  const sizeMap = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  return (
    <div
      className={`
        absolute bottom-0 right-0 
        ${sizeMap[size]} 
        ${statusColors[status]} 
        rounded-full border-2 border-white
      `}
      role="status"
      aria-label={`Status: ${status}`}
    />
  );
};

const Badge: React.FC<BadgeProps> = ({ type, size }) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const badgeConfig = {
    verified: {
      icon: Shield,
      color: 'bg-blue-500',
      label: 'Verified User'
    },
    helper: {
      icon: Heart,
      color: 'bg-pink-500',
      label: 'Peer Helper'
    },
    moderator: {
      icon: Star,
      color: 'bg-purple-500',
      label: 'Community Moderator'
    },
    premium: {
      icon: Crown,
      color: 'bg-yellow-500',
      label: 'Premium Member'
    },
    crisis_responder: {
      icon: Zap,
      color: 'bg-red-500',
      label: 'Crisis Responder'
    },
    therapist: {
      icon: User,
      color: 'bg-green-600',
      label: 'Licensed Therapist'
    }
  };

  const config = badgeConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      className={`
        absolute -top-1 -right-1 
        ${sizeMap[size]} 
        ${config.color} 
        rounded-full flex items-center justify-center border-2 border-white
      `}
      title={config.label}
      role="img"
      aria-label={config.label}
    >
      <IconComponent className="w-2/3 h-2/3 text-white" />
    </div>
  );
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  shape = 'circle',
  fallback,
  initials,
  showStatus = false,
  status = 'offline',
  showBadge = false,
  badge,
  showBorder = false,
  borderColor = 'border-gray-300',
  interactive = false,
  onClick,
  onUpload,
  editable = false,
  loading = false,
  className = '',
  mood,
  supportLevel,
  anonymousMode = false,
  crisisMode = false,
  ariaLabel,
  role = 'img',
  tabIndex,
  ...rest
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!src);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [src]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-32 h-32 text-3xl'
  };

  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none'
  };

  const getMoodColor = () => {
    if (!mood) return '';
    
    const moodColors = {
      very_sad: 'ring-red-500',
      sad: 'ring-orange-500',
      neutral: 'ring-gray-400',
      happy: 'ring-green-500',
      very_happy: 'ring-emerald-500'
    };
    
    return `ring-2 ${moodColors[mood]}`;
  };

  const getSupportLevelIndicator = () => {
    if (!supportLevel) return null;
    
    const indicators = {
      seeking: '🤲',
      offering: '🤗',
      both: '💝'
    };
    
    return (
      <div className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 shadow-sm">
        {indicators[supportLevel]}
      </div>
    );
  };

  const generateInitials = (name?: string) => {
    if (initials) return initials;
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleClick = () => {
    if (editable && onUpload) {
      fileInputRef.current?.click();
    } else if (interactive && onClick) {
      onClick();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  const getAnonymousAvatar = () => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return (
      <div className={`${randomColor} text-white flex items-center justify-center`}>
        <User className="w-1/2 h-1/2" />
      </div>
    );
  };

  const getCrisisAvatar = () => {
    return (
      <div className="bg-red-100 text-red-600 flex items-center justify-center relative">
        <User className="w-1/2 h-1/2" />
        <div className="absolute inset-0 bg-red-500 opacity-20 animate-pulse rounded-full" />
      </div>
    );
  };

  const renderFallback = () => {
    if (crisisMode) {
      return getCrisisAvatar();
    }
    
    if (anonymousMode) {
      return getAnonymousAvatar();
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    const displayInitials = generateInitials(alt);
    
    return (
      <div className="bg-gray-200 text-gray-600 flex items-center justify-center">
        {displayInitials}
      </div>
    );
  };

  const containerClasses = [
    'relative inline-flex items-center justify-center overflow-hidden font-semibold',
    sizeClasses[size],
    shapeClasses[shape],
    showBorder ? `border-2 ${borderColor}` : '',
    getMoodColor(),
    interactive || (editable && onUpload) ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
    crisisMode ? 'ring-2 ring-red-500 ring-offset-2' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="relative inline-block">
      <div
        className={containerClasses}
        onClick={handleClick}
        role={role}
        aria-label={ariaLabel || alt}
        tabIndex={tabIndex}
        {...rest}
      >
        {/* Loading State */}
        {(loading || imageLoading) && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-xs">{uploadProgress}%</div>
          </div>
        )}

        {/* Main Avatar Content */}
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          renderFallback()
        )}

        {/* Edit Overlay */}
        {editable && onUpload && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center transition-all duration-200 group">
            <Camera className="w-1/3 h-1/3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Crisis Mode Pulse */}
        {crisisMode && (
          <div className="absolute inset-0 bg-red-500 opacity-10 animate-ping rounded-full" />
        )}
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <StatusIndicator status={status} size={size} />
      )}

      {/* Badge */}
      {showBadge && badge && (
        <Badge type={badge} size={size} />
      )}

      {/* Support Level Indicator */}
      {supportLevel && getSupportLevelIndicator()}

      {/* Interactive Button Overlay */}
      {interactive && onClick && (
        <button
          className="absolute inset-0 w-full h-full rounded-full opacity-0 hover:opacity-10 bg-gray-900 transition-opacity"
          aria-label="View profile"
        />
      )}

      {/* File Input for Uploads */}
      {editable && onUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload avatar image"
        />
      )}

      {/* Edit Button */}
      {editable && onUpload && (
        <button
          className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Edit avatar"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      )}

      {/* Crisis Support Note */}
      {crisisMode && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium whitespace-nowrap">
          Crisis Support Active
        </div>
      )}
    </div>
  );
};

// Avatar Group Component for displaying multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt?: string;
    initials?: string;
  }>;
  size?: AvatarProps['size'];
  max?: number;
  showMore?: boolean;
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  size = 'md',
  max = 5,
  showMore = true,
  spacing = 'normal',
  className = ''
}) => {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const spacingClasses = {
    tight: '-space-x-1',
    normal: '-space-x-2',
    loose: '-space-x-1'
  };

  return (
    <div className={`flex items-center ${spacingClasses[spacing]} ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          {...avatar}
          size={size}
          showBorder={true}
          borderColor="border-white"
          className="relative z-10"
          style={{ zIndex: displayAvatars.length - index }}
        />
      ))}
      
      {remainingCount > 0 && showMore && (
        <Avatar
          size={size}
          initials={`+${remainingCount}`}
          className="bg-gray-100 text-gray-600 border-2 border-white relative z-0"
        />
      )}
    </div>
  );
};

// Preset Avatar Components for common use cases
export const HelperAvatar: React.FC<Omit<AvatarProps, 'badge' | 'showBadge'>> = (props) => (
  <Avatar {...props} badge="helper" showBadge={true} />
);

export const ModeratorAvatar: React.FC<Omit<AvatarProps, 'badge' | 'showBadge'>> = (props) => (
  <Avatar {...props} badge="moderator" showBadge={true} />
);

export const TherapistAvatar: React.FC<Omit<AvatarProps, 'badge' | 'showBadge'>> = (props) => (
  <Avatar {...props} badge="therapist" showBadge={true} />
);

export const CrisisResponderAvatar: React.FC<Omit<AvatarProps, 'badge' | 'showBadge' | 'crisisMode'>> = (props) => (
  <Avatar {...props} badge="crisis_responder" showBadge={true} crisisMode={true} />
);

export const AnonymousAvatar: React.FC<Omit<AvatarProps, 'anonymousMode'>> = (props) => (
  <Avatar {...props} anonymousMode={true} />
);

// Hook for avatar upload handling
export const useAvatarUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Image size must be less than 5MB');
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', userId);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.avatarUrl);
          } else {
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        
        xhr.open('POST', '/api/users/avatar');
        xhr.send(formData);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadAvatar,
    uploading,
    progress,
    error
  };
};

export default Avatar;
