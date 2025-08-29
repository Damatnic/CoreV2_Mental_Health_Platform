/**
 * PostCard Loading Skeleton Component
 *
 * Provides loading placeholders for PostCard components with proper
 * accessibility support and smooth animations.
 */

import React from 'react';
import './PostCardSkeleton.css';

interface PostCardSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
  /** Show additional skeleton elements for helper view */
  isHelperView?: boolean;
  /** Animate the skeleton */
  animate?: boolean;
}

export const PostCardSkeleton: React.FC<PostCardSkeletonProps> = ({
  count = 1,
  isHelperView = false,
  animate = true
}) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`post-card-skeleton ${animate ? "animate" : ""}`}
          aria-label="Loading post content"
        >
          <div className="skeleton-card">
            {/* Header section */}
            <div className="skeleton-header">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-meta">
                <div className="skeleton-line skeleton-category"></div>
                <div className="skeleton-line skeleton-timestamp"></div>
              </div>
              {isHelperView && (
                <div className="skeleton-status-badge"></div>
              )}
            </div>

            {/* Content section */}
            <div className="skeleton-content">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-text"></div>
              <div className="skeleton-line skeleton-text-short"></div>
            </div>

            {/* AI Match Reason (helper view) */}
            {isHelperView && (
              <div className="skeleton-ai-match">
                <div className="skeleton-line skeleton-ai-text"></div>
              </div>
            )}

            {/* Footer section */}
            <div className="skeleton-footer">
              <div className="skeleton-stats">
                <div className="skeleton-stat">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-count"></div>
                </div>
                <div className="skeleton-stat">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-count"></div>
                </div>
              </div>

              <div className="skeleton-actions">
                <div className="skeleton-button"></div>
                <div className="skeleton-button"></div>
                {isHelperView && (
                  <div className="skeleton-button"></div>
                )}
              </div>
            </div>
          </div>

          {/* Screen reader content */}
          <span className="sr-only">
            Loading post {index + 1} of {count}
          </span>
        </div>
      ))}
    </>
  );
};

/**
 * Inline skeleton for when PostCard is loading within existing layout
 */
export const InlinePostCardSkeleton: React.FC = () => (
  <div className="post-card-skeleton inline animate" aria-label="Loading...">
    <div className="skeleton-card">
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-pulse"></div>
        <div className="skeleton-line skeleton-pulse"></div>
      </div>
    </div>
    <span className="sr-only">Loading post content</span>
  </div>
);

/**
 * Skeleton for empty state when no posts are available
 */
export const EmptyPostsSkeleton: React.FC = () => (
  <div className="empty-posts-skeleton" aria-label="No posts available">
    <div className="empty-skeleton-icon"></div>
    <div className="skeleton-line skeleton-empty-title"></div>
    <div className="skeleton-line skeleton-empty-text"></div>
    <span className="sr-only">No posts to display</span>
  </div>
);

export default PostCardSkeleton;