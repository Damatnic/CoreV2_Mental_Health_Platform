import React, { ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Types for dynamic icon loading
export interface DynamicIconProps {
  name: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  fallback?: ComponentType<any>;
  loading?: ComponentType<any>;
  'aria-label'?: string;
  'data-testid'?: string;
}

export interface IconConfig {
  name: string;
  category?: string;
  keywords?: string[];
  component: LucideIcon;
}

// Icon registry with categories - avoiding duplicates
export const ICON_REGISTRY: Record<string, IconConfig> = {
  // Navigation icons
  'home': { name: 'Home', category: 'navigation', keywords: ['house', 'start'], component: LucideIcons.Home },
  'menu': { name: 'Menu', category: 'navigation', keywords: ['hamburger', 'bars'], component: LucideIcons.Menu },
  'x': { name: 'X', category: 'navigation', keywords: ['close', 'cancel'], component: LucideIcons.X },
  'arrow-left': { name: 'ArrowLeft', category: 'navigation', keywords: ['back'], component: LucideIcons.ArrowLeft },
  'arrow-right': { name: 'ArrowRight', category: 'navigation', keywords: ['forward'], component: LucideIcons.ArrowRight },
  'external-link': { name: 'ExternalLink', category: 'navigation', keywords: ['open', 'link'], component: LucideIcons.ExternalLink },

  // Action icons
  'plus': { name: 'Plus', category: 'action', keywords: ['add', 'create'], component: LucideIcons.Plus },
  'edit': { name: 'Edit', category: 'action', keywords: ['pencil', 'modify'], component: LucideIcons.Edit },
  'trash': { name: 'Trash', category: 'action', keywords: ['delete', 'remove'], component: LucideIcons.Trash },
  'save': { name: 'Save', category: 'action', keywords: ['disk'], component: LucideIcons.Save },
  'download': { name: 'Download', category: 'action', keywords: ['save', 'export'], component: LucideIcons.Download },
  'upload': { name: 'Upload', category: 'action', keywords: ['import'], component: LucideIcons.Upload },
  'search': { name: 'Search', category: 'action', keywords: ['find'], component: LucideIcons.Search },
  'filter': { name: 'Filter', category: 'action', keywords: ['sort', 'refine'], component: LucideIcons.Filter },
  'refresh': { name: 'RefreshCw', category: 'action', keywords: ['reload', 'sync'], component: LucideIcons.RefreshCw },
  'share': { name: 'Share', category: 'action', keywords: ['send'], component: LucideIcons.Share },

  // Status icons
  'check': { name: 'Check', category: 'status', keywords: ['success', 'done'], component: LucideIcons.Check },
  'check-circle': { name: 'CheckCircle', category: 'status', keywords: ['success', 'complete'], component: LucideIcons.CheckCircle },
  'alert-triangle': { name: 'AlertTriangle', category: 'status', keywords: ['warning', 'caution'], component: LucideIcons.AlertTriangle },
  'alert-circle': { name: 'AlertCircle', category: 'status', keywords: ['warning', 'info'], component: LucideIcons.AlertCircle },
  'info': { name: 'Info', category: 'status', keywords: ['information'], component: LucideIcons.Info },

  // Media icons
  'play': { name: 'Play', category: 'media', keywords: ['start'], component: LucideIcons.Play },
  'pause': { name: 'Pause', category: 'media', keywords: ['stop'], component: LucideIcons.Pause },
  'stop': { name: 'Square', category: 'media', keywords: ['stop'], component: LucideIcons.Square },
  'camera': { name: 'Camera', category: 'media', keywords: ['photo'], component: LucideIcons.Camera },

  // Communication icons
  'message-circle': { name: 'MessageCircle', category: 'communication', keywords: ['chat', 'comment'], component: LucideIcons.MessageCircle },
  'message-square': { name: 'MessageSquare', category: 'communication', keywords: ['chat'], component: LucideIcons.MessageSquare },
  'phone': { name: 'Phone', category: 'communication', keywords: ['call'], component: LucideIcons.Phone },
  'bell': { name: 'Bell', category: 'communication', keywords: ['notification'], component: LucideIcons.Bell },

  // User icons
  'user': { name: 'User', category: 'user', keywords: ['person', 'profile'], component: LucideIcons.User },
  'users': { name: 'Users', category: 'user', keywords: ['people', 'group'], component: LucideIcons.Users },
  'user-check': { name: 'UserCheck', category: 'user', keywords: ['verified'], component: LucideIcons.UserCheck },

  // Mental health specific
  'brain': { name: 'Brain', category: 'mental-health', keywords: ['mind', 'thoughts'], component: LucideIcons.Brain },
  'activity': { name: 'Activity', category: 'mental-health', keywords: ['pulse', 'health'], component: LucideIcons.Activity },
  'sun': { name: 'Sun', category: 'mental-health', keywords: ['mood', 'positive'], component: LucideIcons.Sun },
  'moon': { name: 'Moon', category: 'mental-health', keywords: ['sleep', 'rest'], component: LucideIcons.Moon },
  'cloud': { name: 'Cloud', category: 'mental-health', keywords: ['mood', 'cloudy'], component: LucideIcons.Cloud },
  'shield': { name: 'Shield', category: 'mental-health', keywords: ['safety', 'protection'], component: LucideIcons.Shield },
  'lock': { name: 'Lock', category: 'mental-health', keywords: ['privacy', 'secure'], component: LucideIcons.Lock },

  // File and document icons
  'file': { name: 'File', category: 'document', keywords: ['document'], component: LucideIcons.File },
  'file-text': { name: 'FileText', category: 'document', keywords: ['document'], component: LucideIcons.FileText },
  'book': { name: 'Book', category: 'document', keywords: ['read', 'guide'], component: LucideIcons.Book },
  'archive': { name: 'Archive', category: 'document', keywords: ['store'], component: LucideIcons.Archive },

  // Time icons
  'clock': { name: 'Clock', category: 'time', keywords: ['time'], component: LucideIcons.Clock },
  'calendar': { name: 'Calendar', category: 'time', keywords: ['date'], component: LucideIcons.Calendar },

  // Location icons
  'map-pin': { name: 'MapPin', category: 'location', keywords: ['place'], component: LucideIcons.MapPin },
  'globe': { name: 'Globe', category: 'location', keywords: ['world'], component: LucideIcons.Globe },

  // Social icons
  'star': { name: 'Star', category: 'social', keywords: ['favorite'], component: LucideIcons.Star },
  'thumbs-up': { name: 'ThumbsUp', category: 'social', keywords: ['like'], component: LucideIcons.ThumbsUp },

  // Settings icons
  'settings': { name: 'Settings', category: 'settings', keywords: ['gear', 'preferences'], component: LucideIcons.Settings },

  // Special icons
  'award': { name: 'Award', category: 'special', keywords: ['trophy'], component: LucideIcons.Award },
  'gift': { name: 'Gift', category: 'special', keywords: ['present'], component: LucideIcons.Gift },
  'credit-card': { name: 'CreditCard', category: 'special', keywords: ['money'], component: LucideIcons.CreditCard },

  // Analytics icons
  'trending-up': { name: 'TrendingUp', category: 'analytics', keywords: ['growth'], component: LucideIcons.TrendingUp },
  'bar-chart-3': { name: 'BarChart3', category: 'analytics', keywords: ['graph'], component: LucideIcons.BarChart3 },
  'eye': { name: 'Eye', category: 'analytics', keywords: ['view'], component: LucideIcons.Eye },

  // Additional common icons
  'wind': { name: 'Wind', category: 'nature', keywords: ['air'], component: LucideIcons.Wind },
  'smile': { name: 'Smile', category: 'emotion', keywords: ['happy'], component: LucideIcons.Smile },
  'target': { name: 'Target', category: 'goals', keywords: ['aim'], component: LucideIcons.Target },
  'flag': { name: 'Flag', category: 'actions', keywords: ['report'], component: LucideIcons.Flag },
  'scale': { name: 'Scale', category: 'legal', keywords: ['justice'], component: LucideIcons.Scale },

  // Sorting and organization
  'arrow-up-down': { name: 'ArrowUpDown', category: 'sort', keywords: ['sort'], component: LucideIcons.ArrowUpDown },

  // Additional missing icons
  'heart': { name: 'Heart', category: 'emotion', keywords: ['love', 'like'], component: LucideIcons.Heart },
  'sparkles': { name: 'Sparkles', category: 'decoration', keywords: ['magic'], component: LucideIcons.Sparkles },
  'bookmark': { name: 'Bookmark', category: 'save', keywords: ['save'], component: LucideIcons.Bookmark },
  'volume-2': { name: 'Volume2', category: 'media', keywords: ['sound'], component: LucideIcons.Volume2 },
  'mic-off': { name: 'MicOff', category: 'media', keywords: ['mute'], component: LucideIcons.MicOff },
  'mic': { name: 'Mic', category: 'media', keywords: ['microphone'], component: LucideIcons.Mic },
  'video': { name: 'Video', category: 'media', keywords: ['camera'], component: LucideIcons.Video },
  'video-off': { name: 'VideoOff', category: 'media', keywords: ['no camera'], component: LucideIcons.VideoOff },
  'phone-off': { name: 'PhoneOff', category: 'communication', keywords: ['hang up'], component: LucideIcons.PhoneOff },
  'more-horizontal': { name: 'MoreHorizontal', category: 'action', keywords: ['menu', 'options'], component: LucideIcons.MoreHorizontal }
};

// Helper function to normalize icon names
const normalizeIconName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Get icon component by name
export const getIconComponent = (name: string): LucideIcon | null => {
  const normalizedName = normalizeIconName(name);
  
  // First try exact match
  const config = ICON_REGISTRY[normalizedName];
  if (config) {
    return config.component;
  }

  // Try to find by keyword
  for (const iconConfig of Object.values(ICON_REGISTRY)) {
    if (iconConfig.keywords?.some(keyword => keyword.includes(normalizedName) || normalizedName.includes(keyword))) {
      return iconConfig.component;
    }
  }

  return null;
};

// Main dynamic icon component
export const DynamicIcon = ({
  name,
  size = 24,
  color,
  strokeWidth = 2,
  className = '',
  'aria-label': ariaLabel,
  'data-testid': testId,
  ...props
}: DynamicIconProps): React.ReactElement => {
  const IconComponent = getIconComponent(name);

  if (!IconComponent) {
    return React.createElement('div', {
      className: `inline-flex items-center justify-center bg-gray-100 border border-gray-300 rounded text-gray-400 text-xs ${className}`,
      style: {
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size
      },
      'aria-label': ariaLabel || `Icon: ${name}`,
      'data-testid': testId
    }, '?');
  }

  return React.createElement(IconComponent, {
    size,
    color,
    strokeWidth,
    className,
    'aria-label': ariaLabel || `Icon: ${name}`,
    ...props
  });
};

// Named exports for backward compatibility
export const SendIcon = (props: Omit<DynamicIconProps, 'name'>) => <DynamicIcon name="share" {...props} />;
export const AICompanionIcon = (props: Omit<DynamicIconProps, 'name'>) => <DynamicIcon name="brain" {...props} />;
export const BackIcon = () => <DynamicIcon name="arrow-left" />;
export const FilterIcon = () => <DynamicIcon name="filter" />;
export const SearchIcon = () => <DynamicIcon name="search" />;
export const DownloadIcon = () => <DynamicIcon name="download" />;
export const UserIcon = () => <DynamicIcon name="user" />;
export const BlockIcon = () => <DynamicIcon name="shield" />;
export const UnblockIcon = () => <DynamicIcon name="shield" />;
export const InfoIcon = () => <DynamicIcon name="info" />;
export const SortIcon = () => <DynamicIcon name="arrow-up-down" />;
export const CrisisIcon = () => <DynamicIcon name="alert-triangle" />;
export const UsersIcon = () => <DynamicIcon name="users" />;
export const ShieldIcon = () => <DynamicIcon name="shield" />;
export const BookIcon = () => <DynamicIcon name="book" />;
export const MessageCircleIcon = () => <DynamicIcon name="message-circle" />;
export const SettingsIcon = () => <DynamicIcon name="settings" />;
export const CheckIcon = () => <DynamicIcon name="check" />;
export const PostsIcon = () => <DynamicIcon name="file-text" />;
export const ClockIcon = () => <DynamicIcon name="clock" />;
export const PhoneIcon = () => <DynamicIcon name="phone" />;
export const MapPinIcon = () => <DynamicIcon name="map-pin" />;
export const TrendingUpIcon = () => <DynamicIcon name="trending-up" />;
export const BellIcon = () => <DynamicIcon name="bell" />;
export const EyeIcon = () => <DynamicIcon name="eye" />;
export const UserCheckIcon = () => <DynamicIcon name="user-check" />;
export const AlertCircleIcon = () => <DynamicIcon name="alert-circle" />;
export const CameraIcon = () => <DynamicIcon name="camera" />;
export const StarIcon = () => <DynamicIcon name="star" />;
export const UploadIcon = () => <DynamicIcon name="upload" />;
export const GlobeIcon = () => <DynamicIcon name="globe" />;
export const CreditCardIcon = () => <DynamicIcon name="credit-card" />;
export const GiftIcon = () => <DynamicIcon name="gift" />;
export const ActivityIcon = () => <DynamicIcon name="activity" />;
export const SmileIcon = () => <DynamicIcon name="smile" />;
export const MoonIcon = () => <DynamicIcon name="moon" />;
export const SunIcon = () => <DynamicIcon name="sun" />;
export const CloudIcon = () => <DynamicIcon name="cloud" />;
export const BrainIcon = () => <DynamicIcon name="brain" />;
export const TargetIcon = () => <DynamicIcon name="target" />;
export const AwardIcon = () => <DynamicIcon name="award" />;
export const CalendarIcon = () => <DynamicIcon name="calendar" />;
export const PauseIcon = () => <DynamicIcon name="pause" />;
export const StopIcon = () => <DynamicIcon name="stop" />;
export const WindIcon = () => <DynamicIcon name="wind" />;
export const RefreshIcon = (props: Omit<DynamicIconProps, 'name'>) => <DynamicIcon name="refresh" {...props} />;
export const MessageIcon = () => <DynamicIcon name="message-circle" />;
export const UserGroupIcon = () => <DynamicIcon name="users" />;
export const KudosIcon = () => <DynamicIcon name="thumbs-up" />;
export const MyPostsIcon = () => <DynamicIcon name="file-text" />;
export const CertifiedIcon = () => <DynamicIcon name="award" />;
export const EditIcon = () => <DynamicIcon name="edit" />;
export const SaveIcon = () => <DynamicIcon name="save" />;
export const CancelIcon = () => <DynamicIcon name="x" />;
export const VerifiedIcon = () => <DynamicIcon name="check-circle" />;
export const CertificateIcon = () => <DynamicIcon name="award" />;
export const LockIcon = (props: Omit<DynamicIconProps, 'name'>) => <DynamicIcon name="lock" {...props} />;
export const XIcon = () => <DynamicIcon name="x" />;
export const FileIcon = () => <DynamicIcon name="file" />;
export const TrashIcon = () => <DynamicIcon name="trash" />;
export const ArchiveIcon = () => <DynamicIcon name="archive" />;
export const ScaleIcon = () => <DynamicIcon name="scale" />;
export const FileTextIcon = () => <DynamicIcon name="file-text" />;
export const AlertTriangleIcon = () => <DynamicIcon name="alert-triangle" />;
export const LocationIcon = () => <DynamicIcon name="map-pin" />;
export const AlertIcon = () => <DynamicIcon name="alert-triangle" />;
export const ExternalLinkIcon = () => <DynamicIcon name="external-link" />;
export const FlagIcon = () => <DynamicIcon name="flag" />;
export const MessageSquareIcon = () => <DynamicIcon name="message-square" />;
export const BarChart3Icon = () => <DynamicIcon name="bar-chart-3" />;
export const ThumbsUpIcon = () => <DynamicIcon name="thumbs-up" />;

// Missing icons that are causing errors (only add ones that don't exist)
export const HeartIcon = () => <DynamicIcon name="heart" />;
export const SparkleIcon = (props: Omit<DynamicIconProps, 'name'>) => <DynamicIcon name="sparkles" {...props} />;
export const BookmarkIcon = () => <DynamicIcon name="bookmark" />;
export const PlayIcon = () => <DynamicIcon name="play" />;
export const ShareIcon = () => <DynamicIcon name="share" />;
export const VolumeIcon = () => <DynamicIcon name="volume-2" />;
export const MicOffIcon = () => <DynamicIcon name="mic-off" />;
export const CommentIcon = () => <DynamicIcon name="message-circle" />;
export const MicOnIcon = () => <DynamicIcon name="mic" />;
export const VideoOnIcon = () => <DynamicIcon name="video" />;
export const VideoOffIcon = () => <DynamicIcon name="video-off" />;
export const HangUpIcon = () => <DynamicIcon name="phone-off" />;
export const WarningIcon = (props: Omit<DynamicIconProps, 'name'>) => <DynamicIcon name="alert-triangle" {...props} />;
export const MoreIcon = () => <DynamicIcon name="more-horizontal" />;

// Additional commonly used icons that were missing
export const CloseIcon = (props: Omit<DynamicIconProps, 'name'>) => <DynamicIcon name="x" {...props} />;
export const MenuIcon = () => <DynamicIcon name="menu" />;
export const PlusIcon = () => <DynamicIcon name="plus" />;

// Search icons as object
export const searchIcons = {
  search: SearchIcon,
  find: SearchIcon,
  query: SearchIcon
};

export default DynamicIcon;
