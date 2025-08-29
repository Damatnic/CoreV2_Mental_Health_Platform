import React from 'react';
import { cn } from '../utils/cn';

interface SkeletonPostCardProps {
  variant?: 'default' | 'compact' | 'detailed' | 'list';
  showAvatar?: boolean;
  showImage?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  count?: number;
  className?: string;
  animate?: boolean;
}

interface SkeletonLineProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = true
}) => {
  const widthClass = typeof width === 'number' ? `w-${width}` : '';
  const widthStyle = typeof width === 'string' ? { width } : {};
  const heightStyle = typeof height === 'string' ? { height } : {};

  return (
    <div
      className={cn(
        'bg-gray-200 animate-pulse',
        rounded && 'rounded',
        widthClass,
        className
      )}
      style={{ ...widthStyle, ...heightStyle }}
    />
  );
};

const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div
      className={cn(
        'bg-gray-200 rounded-full animate-pulse flex-shrink-0',
        sizeClasses[size],
        className
      )}
    />
  );
};

const SkeletonButton: React.FC<{
  width?: string;
  className?: string;
}> = ({ width = '4rem', className }) => (
  <div
    className={cn('bg-gray-200 animate-pulse rounded h-8', className)}
    style={{ width }}
  />
);

const SkeletonPostCardSingle: React.FC<Omit<SkeletonPostCardProps, 'count'>> = ({
  variant = 'default',
  showAvatar = true,
  showImage = true,
  showStats = true,
  showActions = true,
  className = '',
  animate = true
}) => {
  const baseClasses = cn(
    'bg-white rounded-lg border border-gray-200 overflow-hidden',
    !animate && '[&_*]:animate-none',
    className
  );

  const renderDefaultCard = () => (
    <div className={cn(baseClasses, 'p-4 space-y-4')}>
      {/* Header with avatar and user info */}
      {showAvatar && (
        <div className="flex items-start gap-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="40%" height="0.875rem" />
            <SkeletonLine width="25%" height="0.75rem" />
          </div>
          <div className="flex gap-1">
            <SkeletonLine width="1rem" height="1rem" rounded />
            <SkeletonLine width="1rem" height="1rem" rounded />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <SkeletonLine width="95%" height="0.875rem" />
        <SkeletonLine width="88%" height="0.875rem" />
        <SkeletonLine width="62%" height="0.875rem" />
      </div>

      {/* Image placeholder */}
      {showImage && (
        <div className="bg-gray-200 animate-pulse rounded h-48 w-full" />
      )}

      {/* Stats and actions */}
      {(showStats || showActions) && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {showStats && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <SkeletonLine width="1rem" height="1rem" rounded />
                <SkeletonLine width="1.5rem" height="0.75rem" />
              </div>
              <div className="flex items-center gap-1">
                <SkeletonLine width="1rem" height="1rem" rounded />
                <SkeletonLine width="1.5rem" height="0.75rem" />
              </div>
              <div className="flex items-center gap-1">
                <SkeletonLine width="1rem" height="1rem" rounded />
                <SkeletonLine width="1.5rem" height="0.75rem" />
              </div>
            </div>
          )}
          
          {showActions && (
            <div className="flex gap-2">
              <SkeletonButton width="3rem" />
              <SkeletonButton width="3.5rem" />
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCompactCard = () => (
    <div className={cn(baseClasses, 'p-3 space-y-3')}>
      <div className="flex items-start gap-3">
        {showAvatar && <SkeletonAvatar size="sm" />}
        <div className="flex-1 min-w-0">
          <div className="space-y-1 mb-2">
            <SkeletonLine width="35%" height="0.75rem" />
            <SkeletonLine width="20%" height="0.625rem" />
          </div>
          <div className="space-y-1.5">
            <SkeletonLine width="90%" height="0.8125rem" />
            <SkeletonLine width="75%" height="0.8125rem" />
          </div>
        </div>
      </div>
      
      {showStats && (
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <SkeletonLine width="0.875rem" height="0.875rem" rounded />
            <SkeletonLine width="1rem" height="0.625rem" />
          </div>
          <div className="flex items-center gap-1">
            <SkeletonLine width="0.875rem" height="0.875rem" rounded />
            <SkeletonLine width="1rem" height="0.625rem" />
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedCard = () => (
    <div className={cn(baseClasses, 'p-6 space-y-6')}>
      {/* Header */}
      {showAvatar && (
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <SkeletonAvatar size="lg" />
            <div className="space-y-2">
              <SkeletonLine width="8rem" height="1rem" />
              <SkeletonLine width="6rem" height="0.875rem" />
              <SkeletonLine width="4rem" height="0.75rem" />
            </div>
          </div>
          <div className="flex gap-2">
            <SkeletonButton width="2rem" />
            <SkeletonButton width="2rem" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        <SkeletonLine width="100%" height="1rem" />
        <SkeletonLine width="95%" height="1rem" />
        <SkeletonLine width="88%" height="1rem" />
        <SkeletonLine width="45%" height="1rem" />
      </div>

      {/* Large image */}
      {showImage && (
        <div className="bg-gray-200 animate-pulse rounded-lg h-64 w-full" />
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map(i => (
          <SkeletonLine
            key={i}
            width={`${Math.random() * 3 + 2}rem`}
            height="1.5rem"
            className="rounded-full"
          />
        ))}
      </div>

      {/* Stats and actions */}
      {(showStats || showActions) && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {showStats && (
            <div className="flex items-center gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <SkeletonLine width="1.25rem" height="1.25rem" rounded />
                  <SkeletonLine width="2rem" height="0.875rem" />
                </div>
              ))}
            </div>
          )}
          
          {showActions && (
            <div className="flex gap-3">
              <SkeletonButton width="4rem" />
              <SkeletonButton width="4rem" />
              <SkeletonButton width="3rem" />
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderListCard = () => (
    <div className={cn(baseClasses, 'p-4')}>
      <div className="flex items-start gap-4">
        {showAvatar && <SkeletonAvatar size="sm" />}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1">
              <SkeletonLine width="6rem" height="0.875rem" />
              <SkeletonLine width="4rem" height="0.75rem" />
            </div>
            <SkeletonLine width="3rem" height="0.75rem" />
          </div>
          
          <div className="space-y-2">
            <SkeletonLine width="100%" height="0.875rem" />
            <SkeletonLine width="80%" height="0.875rem" />
          </div>
          
          {showStats && (
            <div className="flex items-center gap-4 mt-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-1">
                  <SkeletonLine width="0.875rem" height="0.875rem" rounded />
                  <SkeletonLine width="1.5rem" height="0.75rem" />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {showImage && (
          <div className="bg-gray-200 animate-pulse rounded w-16 h-16 flex-shrink-0" />
        )}
      </div>
    </div>
  );

  switch (variant) {
    case 'compact':
      return renderCompactCard();
    case 'detailed':
      return renderDetailedCard();
    case 'list':
      return renderListCard();
    default:
      return renderDefaultCard();
  }
};

export const SkeletonPostCard: React.FC<SkeletonPostCardProps> = ({
  count = 1,
  className = '',
  ...props
}) => {
  if (count === 1) {
    return <SkeletonPostCardSingle {...props} className={className} />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonPostCardSingle
          key={index}
          {...props}
          className={index > 0 ? 'opacity-75' : ''}
        />
      ))}
    </div>
  );
};

// Specialized skeleton components for mental health platform

export const SkeletonMoodCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-lg p-4 border border-gray-200 space-y-3', className)}>
    <div className="flex items-center gap-3">
      <SkeletonLine width="2rem" height="2rem" className="rounded-full" />
      <div className="flex-1">
        <SkeletonLine width="40%" height="1rem" />
        <SkeletonLine width="25%" height="0.75rem" className="mt-1" />
      </div>
    </div>
    
    <div className="space-y-2">
      <SkeletonLine width="90%" height="0.875rem" />
      <SkeletonLine width="70%" height="0.875rem" />
    </div>
    
    <div className="flex gap-2 pt-2">
      {[1, 2, 3].map(i => (
        <SkeletonLine
          key={i}
          width="3rem"
          height="1.5rem"
          className="rounded-full"
        />
      ))}
    </div>
  </div>
);

export const SkeletonChatMessage: React.FC<{
  isOwn?: boolean;
  className?: string;
}> = ({ isOwn = false, className }) => (
  <div className={cn('flex gap-3 mb-4', isOwn && 'flex-row-reverse', className)}>
    <SkeletonAvatar size="sm" />
    <div className={cn('max-w-xs space-y-1', isOwn && 'items-end')}>
      <SkeletonLine width="4rem" height="0.75rem" />
      <div className={cn(
        'bg-gray-200 animate-pulse rounded-2xl p-3',
        isOwn ? 'rounded-br-md' : 'rounded-bl-md'
      )}>
        <div className="space-y-1.5">
          <SkeletonLine width="100%" height="0.875rem" />
          <SkeletonLine width="80%" height="0.875rem" />
        </div>
      </div>
      <SkeletonLine width="3rem" height="0.625rem" />
    </div>
  </div>
);

export const SkeletonTherapistCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-lg p-6 border border-gray-200 space-y-4', className)}>
    <div className="flex items-start gap-4">
      <SkeletonAvatar size="lg" />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="60%" height="1.25rem" />
        <SkeletonLine width="40%" height="1rem" />
        <SkeletonLine width="50%" height="0.875rem" />
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <SkeletonLine key={i} width="1rem" height="1rem" className="rounded" />
        ))}
      </div>
    </div>
    
    <div className="space-y-2">
      <SkeletonLine width="100%" height="0.875rem" />
      <SkeletonLine width="95%" height="0.875rem" />
      <SkeletonLine width="75%" height="0.875rem" />
    </div>
    
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4].map(i => (
        <SkeletonLine
          key={i}
          width={`${Math.random() * 2 + 3}rem`}
          height="1.5rem"
          className="rounded-full"
        />
      ))}
    </div>
    
    <div className="flex justify-between items-center pt-2">
      <div className="flex items-center gap-4">
        <SkeletonLine width="3rem" height="0.875rem" />
        <SkeletonLine width="4rem" height="0.875rem" />
      </div>
      <div className="flex gap-2">
        <SkeletonButton width="4rem" />
        <SkeletonButton width="5rem" />
      </div>
    </div>
  </div>
);

export const SkeletonResourceCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
    <div className="bg-gray-200 animate-pulse h-32 w-full" />
    
    <div className="p-4 space-y-3">
      <SkeletonLine width="80%" height="1.25rem" />
      <div className="space-y-2">
        <SkeletonLine width="100%" height="0.875rem" />
        <SkeletonLine width="90%" height="0.875rem" />
        <SkeletonLine width="60%" height="0.875rem" />
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <SkeletonLine width="2rem" height="1.25rem" className="rounded-full" />
          <SkeletonLine width="3rem" height="1.25rem" className="rounded-full" />
        </div>
        <SkeletonButton width="4rem" />
      </div>
    </div>
  </div>
);

// Loading grid component
export const SkeletonGrid: React.FC<{
  items: number;
  columns?: 1 | 2 | 3 | 4;
  variant?: SkeletonPostCardProps['variant'];
  className?: string;
}> = ({ items, columns = 3, variant = 'default', className }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {Array.from({ length: items }, (_, i) => (
        <SkeletonPostCard
          key={i}
          variant={variant}
          className="opacity-75"
          animate={i < 3} // Only animate first 3 for performance
        />
      ))}
    </div>
  );
};

export default SkeletonPostCard;

