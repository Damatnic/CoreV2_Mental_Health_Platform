import React from 'react';
import '../styles/LoadingSkeletons.css';

export const CardSkeleton: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-header" />
    <div className="skeleton skeleton-text" />
    <div className="skeleton skeleton-text short" />
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-item">
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton-content">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-subtitle" />
        </div>
      </div>
    ))}
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="skeleton-profile">
    <div className="skeleton skeleton-avatar large" />
    <div className="skeleton skeleton-name" />
    <div className="skeleton skeleton-bio" />
  </div>
);

const LoadingSkeletons: React.FC<{ type?: string }> = ({ type = 'card' }) => {
  switch (type) {
    case 'list': return <ListSkeleton />;
    case 'profile': return <ProfileSkeleton />;
    default: return <CardSkeleton />;
  }
};

export default LoadingSkeletons;
