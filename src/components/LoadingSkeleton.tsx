import React from 'react';

interface LoadingSkeletonProps {
  variant?: 
    | 'text' 
    | 'title' 
    | 'paragraph' 
    | 'avatar' 
    | 'card' 
    | 'button' 
    | 'image' 
    | 'list' 
    | 'table' 
    | 'chart' 
    | 'custom';
  lines?: number;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  rounded?: boolean;
  animate?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface SkeletonLineProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  rounded?: boolean;
  animate?: boolean;
  className?: string;
}

// Individual skeleton line component
export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = '100%',
  height = '1rem',
  circle = false,
  rounded = true,
  animate = true,
  className = ''
}) => {
  const baseClasses = 'bg-gray-200';
  const animationClasses = animate ? 'animate-pulse' : '';
  const shapeClasses = circle ? 'rounded-full' : rounded ? 'rounded' : '';
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses} ${shapeClasses} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

// Main loading skeleton component
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  lines = 1,
  width = '100%',
  height,
  circle = false,
  rounded = true,
  animate = true,
  className = '',
  children
}) => {
  // Custom skeleton with children
  if (children) {
    return (
      <div className={`skeleton-custom ${className}`} role="status" aria-label="Loading content">
        {children}
      </div>
    );
  }

  // Render based on variant
  switch (variant) {
    case 'text':
      return (
        <div className={`skeleton-text ${className}`} role="status" aria-label="Loading text">
          {Array.from({ length: lines }).map((_, index) => {
            const lineWidth = index === lines - 1 && lines > 1 ? '60%' : width;
            return (
              <SkeletonLine
                key={index}
                width={lineWidth}
                height={height || '1rem'}
                circle={circle}
                rounded={rounded}
                animate={animate}
                className={index > 0 ? 'mt-2' : ''}
              />
            );
          })}
        </div>
      );

    case 'title':
      return (
        <div className={`skeleton-title ${className}`} role="status" aria-label="Loading title">
          <SkeletonLine
            width={width}
            height={height || '1.5rem'}
            rounded={rounded}
            animate={animate}
            className="mb-2"
          />
        </div>
      );

    case 'paragraph':
      return (
        <div className={`skeleton-paragraph ${className}`} role="status" aria-label="Loading paragraph">
          <SkeletonLine
            width="100%"
            height="1.5rem"
            rounded={rounded}
            animate={animate}
            className="mb-3"
          />
          {Array.from({ length: lines || 3 }).map((_, index) => (
            <SkeletonLine
              key={index}
              width={index === (lines || 3) - 1 ? '75%' : '100%'}
              height="1rem"
              rounded={rounded}
              animate={animate}
              className={index > 0 ? 'mt-2' : ''}
            />
          ))}
        </div>
      );

    case 'avatar':
      const avatarSize = typeof width === 'number' ? width : 40;
      return (
        <div className={`skeleton-avatar ${className}`} role="status" aria-label="Loading avatar">
          <SkeletonLine
            width={avatarSize}
            height={height || avatarSize}
            circle={true}
            animate={animate}
          />
        </div>
      );

    case 'card':
      return (
        <div className={`skeleton-card p-4 border border-gray-200 rounded-lg ${className}`} role="status" aria-label="Loading card">
          <div className="flex items-center space-x-4 mb-4">
            <SkeletonLine width={40} height={40} circle animate={animate} />
            <div className="flex-1">
              <SkeletonLine width="60%" height="1.25rem" rounded={rounded} animate={animate} />
              <SkeletonLine width="40%" height="1rem" rounded={rounded} animate={animate} className="mt-2" />
            </div>
          </div>
          <div className="space-y-2">
            <SkeletonLine width="100%" height="1rem" rounded={rounded} animate={animate} />
            <SkeletonLine width="100%" height="1rem" rounded={rounded} animate={animate} />
            <SkeletonLine width="70%" height="1rem" rounded={rounded} animate={animate} />
          </div>
          <div className="mt-4">
            <SkeletonLine width="25%" height="2rem" rounded={rounded} animate={animate} />
          </div>
        </div>
      );

    case 'button':
      return (
        <div className={`skeleton-button ${className}`} role="status" aria-label="Loading button">
          <SkeletonLine
            width={width}
            height={height || '2.5rem'}
            rounded={true}
            animate={animate}
          />
        </div>
      );

    case 'image':
      return (
        <div className={`skeleton-image ${className}`} role="status" aria-label="Loading image">
          <SkeletonLine
            width={width}
            height={height || '12rem'}
            rounded={rounded}
            animate={animate}
          />
        </div>
      );

    case 'list':
      return (
        <div className={`skeleton-list space-y-3 ${className}`} role="status" aria-label="Loading list">
          {Array.from({ length: lines || 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <SkeletonLine width={40} height={40} circle animate={animate} />
              <div className="flex-1 space-y-2">
                <SkeletonLine width="60%" height="1rem" rounded={rounded} animate={animate} />
                <SkeletonLine width="40%" height="0.875rem" rounded={rounded} animate={animate} />
              </div>
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className={`skeleton-table ${className}`} role="status" aria-label="Loading table">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
            <SkeletonLine width="80%" height="1rem" rounded={rounded} animate={animate} />
            <SkeletonLine width="60%" height="1rem" rounded={rounded} animate={animate} />
            <SkeletonLine width="70%" height="1rem" rounded={rounded} animate={animate} />
            <SkeletonLine width="50%" height="1rem" rounded={rounded} animate={animate} />
          </div>
          {/* Table Rows */}
          <div className="space-y-2">
            {Array.from({ length: lines || 5 }).map((_, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100">
                <SkeletonLine width="90%" height="1rem" rounded={rounded} animate={animate} />
                <SkeletonLine width="70%" height="1rem" rounded={rounded} animate={animate} />
                <SkeletonLine width="60%" height="1rem" rounded={rounded} animate={animate} />
                <SkeletonLine width="40%" height="1rem" rounded={rounded} animate={animate} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'chart':
      return (
        <div className={`skeleton-chart ${className}`} role="status" aria-label="Loading chart">
          {/* Chart Title */}
          <div className="mb-4">
            <SkeletonLine width="40%" height="1.5rem" rounded={rounded} animate={animate} />
            <SkeletonLine width="60%" height="1rem" rounded={rounded} animate={animate} className="mt-2" />
          </div>
          
          {/* Chart Area */}
          <div className="relative" style={{ height: height || '300px', width }}>
            <div className="absolute inset-0 bg-gray-100 rounded-lg">
              {/* Y-axis labels */}
              <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonLine key={index} width="20px" height="0.75rem" rounded={rounded} animate={animate} />
                ))}
              </div>
              
              {/* Chart bars/lines */}
              <div className="ml-8 mr-4 mt-4 mb-8 h-full flex items-end justify-between">
                {Array.from({ length: 7 }).map((_, index) => (
                  <SkeletonLine
                    key={index}
                    width="30px"
                    height={`${Math.random() * 60 + 20}%`}
                    rounded={rounded}
                    animate={animate}
                  />
                ))}
              </div>
              
              {/* X-axis labels */}
              <div className="absolute bottom-2 left-8 right-4 flex justify-between">
                {Array.from({ length: 7 }).map((_, index) => (
                  <SkeletonLine key={index} width="30px" height="0.75rem" rounded={rounded} animate={animate} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex justify-center space-x-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <SkeletonLine width="12px" height="12px" rounded={rounded} animate={animate} />
                <SkeletonLine width="60px" height="0.875rem" rounded={rounded} animate={animate} />
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <SkeletonLine
          width={width}
          height={height || '1rem'}
          circle={circle}
          rounded={rounded}
          animate={animate}
          className={className}
        />
      );
  }
};

// Specialized skeleton components
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 1, className = '' }) => (
  <LoadingSkeleton variant="text" lines={lines} className={className} />
);

export const SkeletonTitle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <LoadingSkeleton variant="title" height="1.5rem" className={className} />
);

export const SkeletonParagraph: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <LoadingSkeleton variant="paragraph" lines={lines} className={className} />
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => (
  <LoadingSkeleton variant="avatar" width={size} height={size} className={className} />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <LoadingSkeleton variant="card" className={className} />
);

export const SkeletonButton: React.FC<{ width?: string | number; className?: string }> = ({ width = '120px', className = '' }) => (
  <LoadingSkeleton variant="button" width={width} className={className} />
);

export const SkeletonImage: React.FC<{ width?: string | number; height?: string | number; className?: string }> = ({ 
  width = '100%', 
  height = '200px', 
  className = '' 
}) => (
  <LoadingSkeleton variant="image" width={width} height={height} className={className} />
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ items = 5, className = '' }) => (
  <LoadingSkeleton variant="list" lines={items} className={className} />
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ rows = 5, className = '' }) => (
  <LoadingSkeleton variant="table" lines={rows} className={className} />
);

export const SkeletonChart: React.FC<{ width?: string | number; height?: string | number; className?: string }> = ({ 
  width = '100%', 
  height = '300px', 
  className = '' 
}) => (
  <LoadingSkeleton variant="chart" width={width} height={height} className={className} />
);

// Composite skeleton layouts
export const SkeletonProfileCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-profile-card p-6 border border-gray-200 rounded-lg ${className}`} role="status" aria-label="Loading profile">
    <div className="flex items-center space-x-4 mb-4">
      <SkeletonAvatar size={64} />
      <div className="flex-1">
        <SkeletonLine width="60%" height="1.5rem" className="mb-2" />
        <SkeletonLine width="40%" height="1rem" className="mb-2" />
        <SkeletonLine width="80%" height="0.875rem" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="text-center">
        <SkeletonLine width="100%" height="2rem" className="mb-2" />
        <SkeletonLine width="60%" height="0.875rem" className="mx-auto" />
      </div>
      <div className="text-center">
        <SkeletonLine width="100%" height="2rem" className="mb-2" />
        <SkeletonLine width="60%" height="0.875rem" className="mx-auto" />
      </div>
      <div className="text-center">
        <SkeletonLine width="100%" height="2rem" className="mb-2" />
        <SkeletonLine width="60%" height="0.875rem" className="mx-auto" />
      </div>
    </div>
    <div className="flex space-x-3">
      <SkeletonButton width="48%" />
      <SkeletonButton width="48%" />
    </div>
  </div>
);

export const SkeletonPost: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-post p-4 border border-gray-200 rounded-lg ${className}`} role="status" aria-label="Loading post">
    <div className="flex items-center space-x-3 mb-3">
      <SkeletonAvatar size={32} />
      <div className="flex-1">
        <SkeletonLine width="40%" height="1rem" className="mb-1" />
        <SkeletonLine width="30%" height="0.875rem" />
      </div>
    </div>
    <SkeletonParagraph lines={2} className="mb-3" />
    <SkeletonImage height="200px" className="mb-3" />
    <div className="flex items-center space-x-4">
      <SkeletonLine width="60px" height="1.5rem" />
      <SkeletonLine width="80px" height="1.5rem" />
      <SkeletonLine width="70px" height="1.5rem" />
    </div>
  </div>
);

export const SkeletonDashboard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-dashboard ${className}`} role="status" aria-label="Loading dashboard">
    <div className="mb-6">
      <SkeletonTitle />
      <SkeletonText className="mt-2" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-lg">
          <SkeletonLine width="60%" height="1rem" className="mb-2" />
          <SkeletonLine width="40%" height="2rem" className="mb-2" />
          <SkeletonLine width="80%" height="0.875rem" />
        </div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonTable rows={6} />
    </div>
  </div>
);

export default LoadingSkeleton;
