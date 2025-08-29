import React from 'react';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  animate = true,
  variant = 'text',
  width,
  height,
  count = 1
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getDefaultDimensions = () => {
    switch (variant) {
      case 'circular':
        return { width: '2.5rem', height: '2.5rem' };
      case 'text':
        return { width: '100%', height: '1rem' };
      default:
        return { width: '100%', height: '2rem' };
    }
  };

  const defaults = getDefaultDimensions();
  const finalWidth = width || defaults.width;
  const finalHeight = height || defaults.height;

  const skeletonClasses = `
    bg-gray-200 
    ${animate ? 'animate-pulse' : ''}
    ${getVariantClasses()}
    ${className}
  `;

  const style = {
    width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
    height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
  };

  if (count === 1) {
    return <div className={skeletonClasses} style={style} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={skeletonClasses} style={style} />
      ))}
    </div>
  );
};

// Avatar Skeleton
export const AvatarSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: '2rem', height: '2rem' },
    md: { width: '2.5rem', height: '2.5rem' },
    lg: { width: '3rem', height: '3rem' },
    xl: { width: '4rem', height: '4rem' },
  };

  return (
    <Skeleton
      variant="circular"
      width={sizes[size].width}
      height={sizes[size].height}
      className={className}
    />
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{
  hasAvatar?: boolean;
  lines?: number;
  className?: string;
}> = ({ hasAvatar = false, lines = 3, className = '' }) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-start space-x-3">
        {hasAvatar && <AvatarSkeleton />}
        <div className="flex-1 space-y-2">
          <Skeleton height="1.25rem" width="60%" />
          <div className="space-y-1">
            {Array.from({ length: lines }, (_, index) => (
              <Skeleton
                key={index}
                height="0.875rem"
                width={index === lines - 1 ? '40%' : '100%'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Skeleton
export const MessageSkeleton: React.FC<{
  isUser?: boolean;
  className?: string;
}> = ({ isUser = false, className = '' }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`max-w-xs ${isUser ? 'order-2' : 'order-1'}`}>
        <div className="flex items-end space-x-2">
          {!isUser && <AvatarSkeleton size="small" />}
          <div className="flex-1">
            <Skeleton
              variant="rounded"
              height="3rem"
              className={`${
                isUser ? 'bg-blue-200' : 'bg-gray-200'
              }`}
            />
            <Skeleton height="0.75rem" width="40%" className="mt-1" />
          </div>
          {isUser && <AvatarSkeleton size="small" />}
        </div>
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}> = ({ rows = 5, columns = 4, hasHeader = true, className = '' }) => {
  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {hasHeader && (
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex space-x-4">
            {Array.from({ length: columns }, (_, index) => (
              <Skeleton key={index} height="1rem" width="6rem" />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }, (_, colIndex) => (
                <Skeleton key={colIndex} height="1rem" width="4rem" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// List Skeleton
export const ListSkeleton: React.FC<{
  items?: number;
  hasAvatar?: boolean;
  hasActions?: boolean;
  className?: string;
}> = ({ items = 3, hasAvatar = true, hasActions = false, className = '' }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            {hasAvatar && <AvatarSkeleton />}
            <div className="space-y-1">
              <Skeleton height="1rem" width="8rem" />
              <Skeleton height="0.875rem" width="12rem" />
            </div>
          </div>
          {hasActions && (
            <div className="flex space-x-2">
              <Skeleton variant="rounded" width="4rem" height="2rem" />
              <Skeleton variant="rounded" width="4rem" height="2rem" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC<{
  fields?: number;
  hasSubmitButton?: boolean;
  className?: string;
}> = ({ fields = 4, hasSubmitButton = true, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height="1rem" width="6rem" />
          <Skeleton variant="rounded" height="2.5rem" />
        </div>
      ))}
      {hasSubmitButton && (
        <div className="pt-4">
          <Skeleton variant="rounded" height="2.5rem" width="8rem" />
        </div>
      )}
    </div>
  );
};

// Profile Skeleton
export const ProfileSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="flex justify-center mb-4">
        <AvatarSkeleton size="xl" />
      </div>
      <Skeleton height="1.5rem" width="12rem" className="mb-2 mx-auto" />
      <Skeleton height="1rem" width="8rem" className="mb-4 mx-auto" />
      <div className="space-y-2">
        <Skeleton height="0.875rem" width="100%" />
        <Skeleton height="0.875rem" width="80%" className="mx-auto" />
        <Skeleton height="0.875rem" width="90%" className="mx-auto" />
      </div>
    </div>
  );
};

// Chat List Skeleton
export const ChatListSkeleton: React.FC<{
  chats?: number;
  className?: string;
}> = ({ chats = 5, className = '' }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {Array.from({ length: chats }, (_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50">
          <AvatarSkeleton />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <Skeleton height="1rem" width="6rem" />
              <Skeleton height="0.75rem" width="3rem" />
            </div>
            <Skeleton height="0.875rem" width="80%" />
          </div>
          <div className="flex-shrink-0">
            <Skeleton variant="circular" width="1rem" height="1rem" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Stats Skeleton
export const StatsSkeleton: React.FC<{
  stats?: number;
  className?: string;
}> = ({ stats = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: stats }, (_, index) => (
        <div key={index} className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Skeleton height="1rem" width="4rem" />
            <Skeleton variant="circular" width="2rem" height="2rem" />
          </div>
          <Skeleton height="1.5rem" width="3rem" className="mb-1" />
          <Skeleton height="0.75rem" width="5rem" />
        </div>
      ))}
    </div>
  );
};

// Navigation Skeleton
export const NavigationSkeleton: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 6, className = '' }) => {
  return (
    <nav className={`space-y-1 ${className}`}>
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="flex items-center space-x-3 p-2 rounded-lg">
          <Skeleton variant="circular" width="1.5rem" height="1.5rem" />
          <Skeleton height="1rem" width="6rem" />
        </div>
      ))}
    </nav>
  );
};

// Modal Skeleton
export const ModalSkeleton: React.FC<{
  hasHeader?: boolean;
  hasFooter?: boolean;
  contentLines?: number;
  className?: string;
}> = ({ hasHeader = true, hasFooter = true, contentLines = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-xl max-w-md w-full ${className}`}>
      {hasHeader && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <Skeleton height="1.25rem" width="8rem" />
          <Skeleton variant="circular" width="1.5rem" height="1.5rem" />
        </div>
      )}
      <div className="p-6 space-y-3">
        {Array.from({ length: contentLines }, (_, index) => (
          <Skeleton
            key={index}
            height="0.875rem"
            width={index === contentLines - 1 ? '60%' : '100%'}
          />
        ))}
      </div>
      {hasFooter && (
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <Skeleton variant="rounded" width="4rem" height="2rem" />
          <Skeleton variant="rounded" width="4rem" height="2rem" />
        </div>
      )}
    </div>
  );
};

// Page Skeleton
export const PageSkeleton: React.FC<{
  hasHeader?: boolean;
  hasSidebar?: boolean;
  className?: string;
}> = ({ hasHeader = true, hasSidebar = false, className = '' }) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {hasHeader && (
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Skeleton variant="circular" width="2rem" height="2rem" />
                <Skeleton height="1.5rem" width="8rem" />
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton variant="circular" width="2rem" height="2rem" />
                <Skeleton variant="circular" width="2rem" height="2rem" />
                <AvatarSkeleton />
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`flex ${hasSidebar ? 'space-x-8' : ''}`}>
          {hasSidebar && (
            <aside className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <NavigationSkeleton />
              </div>
            </aside>
          )}
          
          <main className="flex-1">
            <div className="mb-6">
              <Skeleton height="2rem" width="16rem" className="mb-2" />
              <Skeleton height="1rem" width="24rem" />
            </div>
            
            <div className="space-y-6">
              <CardSkeleton hasAvatar lines={2} />
              <CardSkeleton hasAvatar lines={3} />
              <CardSkeleton lines={2} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
